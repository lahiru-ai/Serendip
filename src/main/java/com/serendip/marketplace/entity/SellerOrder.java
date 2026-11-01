package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.exception.InvalidOrderStateException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Represents a seller sub-order within a multi-vendor customer checkout.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps vendor-specific sub-orders to 'seller_orders' table for order fulfillment and payouts.
@Entity
@Table(name = "seller_orders")
public class SellerOrder {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the seller sub-order.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Links sub-order to the master customer order via 'order_id'.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: References vendor seller via 'seller_id' foreign key, eagerly loaded.
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    @Column(name = "sub_order_number", length = 64)
    private String subOrderNumber;

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Line items contained in this seller sub-order; cascades all operations and removes orphaned records.
    @OneToMany(mappedBy = "sellerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "shipping_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingAmount = new BigDecimal("15.00");

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate = new BigDecimal("10.00");

    @Column(name = "commission_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    @Column(name = "net_payout_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netPayoutAmount = BigDecimal.ZERO;

    @Column(length = 64)
    private String carrier;

    @Column(name = "tracking_number", length = 128)
    private String trackingNumber;

    @OneToMany(mappedBy = "sellerOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    protected SellerOrder() {
    }

    public SellerOrder(Seller seller) {
        this(null, seller, new BigDecimal("15.00"));
    }

    public SellerOrder(Order order, Seller seller, BigDecimal shippingAmount) {
        this.order = order;
        this.seller = Objects.requireNonNull(seller, "Seller cannot be null.");
        this.shippingAmount = shippingAmount != null ? shippingAmount : new BigDecimal("15.00");
        this.commissionRate = seller.getCommissionRate() != null ? seller.getCommissionRate() : new BigDecimal("10.00");
        this.status = OrderStatus.PENDING_PAYMENT;
    }

    public void attachTo(Order order) {
        this.order = Objects.requireNonNull(order, "Order cannot be null.");
    }

    public void addItem(Product product, int quantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null.");
        }
        if (product.getSeller() != null && !Objects.equals(product.getSeller(), seller)) {
            throw new IllegalArgumentException("Product does not belong to this seller's shop.");
        }
        OrderItem item = new OrderItem(this, product, quantity);
        this.items.add(item);
        calculateFinancials();
    }

    /** Calculates subtotal, platform commission, and seller net payout. */
    public void calculateFinancials() {
        this.subtotalAmount = items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Commission = subtotal * (rate / 100)
        this.commissionAmount = subtotalAmount.multiply(commissionRate)
                .divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);

        // Net payout = subtotal + shipping - commission
        this.netPayoutAmount = subtotalAmount.add(shippingAmount).subtract(commissionAmount);
    }

    /** Marks sub-order as paid when parent order payment is confirmed. */
    public void markPaid() {
        transitionTo(OrderStatus.PAYMENT_CONFIRMED);
    }

    /** Updates sub-order status to processing when packaging begins. */
    public void markProcessing() {
        if (this.status != OrderStatus.PAYMENT_CONFIRMED && this.status != OrderStatus.PAID) {
            throw new InvalidOrderStateException("Sub-order must be paid before processing.");
        }
        transitionTo(OrderStatus.PROCESSING);
    }

    /** Updates sub-order status to shipped with courier and tracking details. */
    public void markShipped(String carrier, String trackingNumber) {
        if (this.status != OrderStatus.PROCESSING) {
            throw new InvalidOrderStateException("Sub-order must be in PROCESSING status to be shipped.");
        }
        this.carrier = carrier;
        this.trackingNumber = trackingNumber;
        transitionTo(OrderStatus.SHIPPED);
    }

    /** Updates sub-order status to out for delivery. */
    public void markOutForDelivery() {
        if (this.status != OrderStatus.SHIPPED) {
            throw new InvalidOrderStateException("Sub-order must be in SHIPPED status to be marked out for delivery.");
        }
        transitionTo(OrderStatus.OUT_FOR_DELIVERY);
    }

    /** Marks sub-order as delivered to the buyer. */
    public void markDelivered() {
        if (this.status != OrderStatus.SHIPPED && this.status != OrderStatus.OUT_FOR_DELIVERY) {
            throw new InvalidOrderStateException("Sub-order must be in SHIPPED or OUT_FOR_DELIVERY status to be marked delivered.");
        }
        transitionTo(OrderStatus.DELIVERED);
    }

    /** Cancels sub-order and returns item quantities back to product stock. */
    public void cancel() {
        if (this.status == OrderStatus.SHIPPED || this.status == OrderStatus.DELIVERED || this.status == OrderStatus.COMPLETED) {
            throw new InvalidOrderStateException(
                String.format("Cannot cancel sub-order in status '%s'", this.status));
        }
        this.status = OrderStatus.CANCELLED;
        // Restock inventory for items in this sub-order
        for (OrderItem item : items) {
            item.getProduct().replenishStock(item.getQuantity());
        }
    }

    private void transitionTo(OrderStatus next) {
        if (!this.status.canTransitionTo(next)) {
            throw new InvalidOrderStateException(
                String.format("Illegal status transition from '%s' to '%s'", this.status, next));
        }
        this.status = next;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Seller getSeller() {
        return seller;
    }

    public String getSubOrderNumber() {
        return subOrderNumber;
    }

    public void setSubOrderNumber(String subOrderNumber) {
        this.subOrderNumber = subOrderNumber;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public BigDecimal getShippingAmount() {
        return shippingAmount;
    }

    public BigDecimal getCommissionRate() {
        return commissionRate;
    }

    public BigDecimal getCommissionAmount() {
        return commissionAmount;
    }

    public BigDecimal getNetPayoutAmount() {
        return netPayoutAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getCarrier() {
        return carrier;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public List<OrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<OrderStatusHistory> getStatusHistory() {
        return Collections.unmodifiableList(statusHistory);
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public void addStatusHistory(OrderStatus previousStatus, OrderStatus newStatus,
                                 Long userId, String userName, String userRole, String comments) {
        OrderStatusHistory history = new OrderStatusHistory(
                this.order, this, previousStatus, newStatus, userId, userName, userRole, comments
        );
        this.statusHistory.add(history);
        this.updatedAt = Instant.now();
    }
}
