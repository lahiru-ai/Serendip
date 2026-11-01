package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.enums.UserRole;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.payment.PaymentMethod;
import com.serendip.marketplace.payment.PaymentResult;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * Represents a buyer customer who can manage cart items, place orders, and write reviews.
 */
// Language: Jakarta Persistence (JPA) / Subclass Table Mapping
// Purpose: Maps the 'Buyer' subclass to 'buyers' table joined on 'user_id' with discriminator value 'BUYER'.
@Entity
@Table(name = "buyers")
@DiscriminatorValue("BUYER")
@PrimaryKeyJoinColumn(name = "user_id")
public class Buyer extends User {

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Stores default shipping destination address.
    @Column(name = "delivery_address", length = 255)
    private String deliveryAddress = "123 Maple Street, London, UK";

    // Language: Jakarta Persistence (JPA) / One-to-One Relationship
    // Purpose: Maps bidirectional 1:1 relationship to active ShoppingCart; cascades all lifecycle operations.
    @OneToOne(mappedBy = "buyer", cascade = CascadeType.ALL, orphanRemoval = true)
    private ShoppingCart cart;

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Associates customer with placed orders; cascades order updates.
    @OneToMany(mappedBy = "buyer", cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Associates customer with submitted product reviews.
    @OneToMany(mappedBy = "buyer", cascade = CascadeType.ALL)
    private List<Review> reviews = new ArrayList<>();

    protected Buyer() {
        super();
    }

    public Buyer(String fullName, String email, String passwordHash) {
        this(fullName, email, passwordHash, null, "123 Maple Street, London, UK");
    }

    public Buyer(String fullName, String email, String passwordHash, String phoneNumber, String deliveryAddress) {
        super(fullName, email, passwordHash, phoneNumber);
        this.deliveryAddress = deliveryAddress != null ? deliveryAddress.trim() : "123 Maple Street, London, UK";
        this.cart = new ShoppingCart(this);
    }

    @Override
    public UserRole getRole() {
        return UserRole.BUYER;
    }

    public void addToCart(Product product, int quantity) {
        ensureCart();
        this.cart.addItem(product, quantity);
    }

    public void removeFromCart(Product product) {
        if (this.cart != null) {
            this.cart.removeItem(product);
        }
    }

    public ShoppingCart viewCart() {
        ensureCart();
        return this.cart;
    }

    public ShoppingCart getShoppingCart() {
        return viewCart();
    }

    public ShoppingCart getCart() {
        return viewCart();
    }

    public void clearCart() {
        if (this.cart != null) {
            this.cart.clear();
        }
    }

    public void ensureCart() {
        if (this.cart == null) {
            this.cart = new ShoppingCart(this);
        }
    }

    /**
     * Completes checkout by grouping items by seller, deducting stock, and processing payment.
     */
    public Order checkOut(PaymentMethod paymentMethod) {
        if (this.cart == null || this.cart.isEmpty()) {
            throw new BusinessRuleException("Cannot checkout an empty shopping cart.");
        }
        if (paymentMethod == null) {
            throw new IllegalArgumentException("Payment method cannot be null.");
        }

        // Group cart items by seller
        Map<Seller, List<CartItem>> itemsBySeller = new LinkedHashMap<>();
        for (CartItem item : this.cart.getItems()) {
            Seller seller = item.getProduct().getSeller();
            itemsBySeller.computeIfAbsent(seller, k -> new ArrayList<>()).add(item);
        }

        // Create the parent order
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order parentOrder = new Order(orderNumber, this, this.deliveryAddress, paymentMethod.getMethodName());

        // Deduct inventory with rollback safety
        Map<Product, Integer> deductedStock = new HashMap<>();
        try {
            for (Map.Entry<Seller, List<CartItem>> entry : itemsBySeller.entrySet()) {
                Seller seller = entry.getKey();
                SellerOrder subOrder = new SellerOrder(parentOrder, seller, new BigDecimal("15.00"));
                subOrder.setSubOrderNumber(orderNumber + "-" + seller.getShopName().replaceAll("\\s+", ""));

                for (CartItem item : entry.getValue()) {
                    Product product = item.getProduct();
                    product.decreaseStock(item.getQuantity());
                    deductedStock.put(product, deductedStock.getOrDefault(product, 0) + item.getQuantity());
                    subOrder.addItem(product, item.getQuantity());
                }
                parentOrder.addSellerOrder(subOrder);
            }
        } catch (RuntimeException ex) {
            // Restore deducted stock if any product fails
            deductedStock.forEach(Product::replenishStock);
            throw ex;
        }

        // Charge the buyer using the chosen payment method
        PaymentResult paymentResult = paymentMethod.pay(
                parentOrder.getTotalAmount(), parentOrder.getCurrency(), parentOrder.getOrderNumber()
        );

        if (paymentResult.isSuccessful()) {
            parentOrder.markPaid();
            Payment paymentRecord = new Payment(
                    parentOrder,
                    paymentMethod.getMethodName(),
                    paymentResult.getTransactionReference(),
                    parentOrder.getTotalAmount(),
                    parentOrder.getCurrency(),
                    paymentResult.getStatus(),
                    paymentResult.getMessage()
            );
            if (paymentResult.getDepositSlipUrl() != null) {
                paymentRecord.setDepositSlipUrl(paymentResult.getDepositSlipUrl());
            }
            parentOrder.setPayment(paymentRecord);
            this.orders.add(parentOrder);
            this.cart.clear();
            return parentOrder;
        } else {
            // Cancel order and restore stock if payment fails
            parentOrder.cancel();
            throw new BusinessRuleException("Payment authorization failed: " + paymentResult.getMessage());
        }
    }

    /** Cancels an order placed by this buyer. */
    public void cancelOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null.");
        }
        if (!this.orders.contains(order)) {
            throw new IllegalArgumentException("Order does not belong to this buyer.");
        }
        order.cancel();
    }

    /** Submits a review and rating for an item purchased by this buyer. */
    public Review submitReview(OrderItem orderItem, int rating, String comment) {
        if (orderItem == null) {
            throw new IllegalArgumentException("OrderItem cannot be null.");
        }
        Order parentOrder = orderItem.getSellerOrder() != null ? orderItem.getSellerOrder().getOrder() : null;
        if (parentOrder == null) {
            throw new BusinessRuleException("Cannot review an item not linked to a completed order.");
        }
        if (parentOrder.getBuyer() != this && (this.getId() == null || !Objects.equals(parentOrder.getBuyer().getId(), this.getId()))) {
            throw new BusinessRuleException("Cannot review a purchase made by another customer.");
        }
        if (parentOrder.getStatus() == OrderStatus.PENDING_PAYMENT || parentOrder.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessRuleException(
                String.format("Cannot review an unconfirmed or cancelled purchase (order status: %s).", parentOrder.getStatus())
            );
        }

        // Prevent duplicate reviews for the same order item
        boolean alreadyReviewed = reviews.stream()
                .anyMatch(r -> r.getOrderItem() == orderItem ||
                        (orderItem.getId() != null && Objects.equals(r.getOrderItem().getId(), orderItem.getId())));
        if (alreadyReviewed) {
            throw new BusinessRuleException("You have already reviewed this purchase.");
        }

        Review review = new Review(this, orderItem.getProduct(), orderItem, rating, comment);
        this.reviews.add(review);
        return review;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        if (deliveryAddress == null || deliveryAddress.isBlank()) {
            throw new IllegalArgumentException("Delivery address cannot be blank.");
        }
        this.deliveryAddress = deliveryAddress.trim();
    }

    public List<Order> getOrders() {
        return Collections.unmodifiableList(orders);
    }

    public List<Review> getReviews() {
        return Collections.unmodifiableList(reviews);
    }

    public List<Review> viewReviews() {
        return getReviews();
    }
}
