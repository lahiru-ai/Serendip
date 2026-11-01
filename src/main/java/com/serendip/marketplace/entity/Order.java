package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InvalidOrderStateException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Represents a customer order, composed of seller-specific sub-orders.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps root customer purchase order records to the 'orders' table.
@Entity
@Table(name = "orders")
public class Order {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Unique auto-incremented primary key for the order.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Stores human-readable, unique public tracking reference code (e.g., 'ORD-12345').
    @Column(name = "order_number", nullable = false, unique = true, length = 64)
    private String orderNumber;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Links order to purchasing customer via 'buyer_id' foreign key.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @Column(name = "shipping_address", nullable = false, length = 500)
    private String shippingAddress;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "shipping_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(name = "payment_method", length = 64)
    private String paymentMethodName;

    // Language: Jakarta Persistence (JPA) / One-to-One Relationship
    // Purpose: Links order to its payment transaction record; cascades all payment changes.
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Multi-vendor breakdown into individual seller sub-orders; removes orphaned sub-orders automatically.
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SellerOrder> sellerOrders = new ArrayList<>();

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Audit trail of order lifecycle state transitions, ordered chronologically.
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    protected Order() {
    }

    public Order(Buyer buyer) {
        this("ORD-" + System.currentTimeMillis(), buyer, "Default Delivery Address", "MOCK");
    }

    public Order(String orderNumber, Buyer buyer, String shippingAddress, String paymentMethodName) {
        this.orderNumber = orderNumber != null && !orderNumber.isBlank() ? orderNumber : "ORD-" + System.currentTimeMillis();
        this.buyer = Objects.requireNonNull(buyer, "Buyer cannot be null.");
        this.shippingAddress = shippingAddress != null ? shippingAddress : "Default Delivery Address";
        this.paymentMethodName = paymentMethodName;
        this.status = OrderStatus.PENDING_PAYMENT;
        this.createdAt = Instant.now();
    }

    /** Adds a seller sub-order and recalculates the order total. */
    public void addSellerOrder(SellerOrder subOrder) {
        if (subOrder == null) {
            throw new IllegalArgumentException("Sub-order cannot be null.");
        }
        if (this.status != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessRuleException("Cannot add seller orders after checkout.");
        }
        this.sellerOrders.add(subOrder);
        subOrder.setOrder(this);
        calculateTotal();
    }

    /** Calculates subtotal, shipping, and total amounts across all seller sub-orders. */
    public BigDecimal calculateTotal() {
        this.subtotalAmount = sellerOrders.stream()
                .map(SellerOrder::getSubtotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.shippingAmount = sellerOrders.stream()
                .map(SellerOrder::getShippingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.totalAmount = this.subtotalAmount.add(this.shippingAmount).add(this.taxAmount);
        return this.totalAmount;
    }

    /** Calculates total platform commission across all seller sub-orders. */
    public BigDecimal getTotalCommissionAmount() {
        return sellerOrders.stream()
                .map(SellerOrder::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Marks the order and all its sub-orders as paid. */
    public void markPaid() {
        if (!this.status.canTransitionTo(OrderStatus.PAYMENT_CONFIRMED)) {
            throw new InvalidOrderStateException(
                String.format("Cannot transition order %s from %s to PAYMENT_CONFIRMED", orderNumber, this.status));
        }
        this.status = OrderStatus.PAYMENT_CONFIRMED;
        for (SellerOrder subOrder : sellerOrders) {
            subOrder.markPaid();
        }
    }

    /** Cancels the order and all its sub-orders, releasing reserved stock. */
    public void cancel() {
        if (this.status == OrderStatus.SHIPPED || this.status == OrderStatus.DELIVERED || this.status == OrderStatus.COMPLETED) {
            throw new InvalidOrderStateException(
                String.format("Order %s in status %s cannot be cancelled", orderNumber, this.status));
        }
        this.status = OrderStatus.CANCELLED;
        for (SellerOrder subOrder : sellerOrders) {
            if (subOrder.getStatus() != OrderStatus.CANCELLED) {
                subOrder.cancel();
            }
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public Buyer getBuyer() {
        return buyer;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public BigDecimal getShippingAmount() {
        return shippingAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        calculateTotal();
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getPaymentMethodName() {
        return paymentMethodName;
    }

    public void setPaymentMethodName(String paymentMethodName) {
        this.paymentMethodName = paymentMethodName;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
        if (payment != null && payment.getOrder() != this) {
            payment.setOrder(this);
        }
    }

    public List<SellerOrder> getSellerOrders() {
        return Collections.unmodifiableList(sellerOrders);
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
                this, null, previousStatus, newStatus, userId, userName, userRole, comments
        );
        this.statusHistory.add(history);
        this.updatedAt = Instant.now();
    }
}
