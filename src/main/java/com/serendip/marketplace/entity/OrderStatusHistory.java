package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.OrderStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

/**
 * Audit log recording status transitions and timestamps for orders and sub-orders.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps status transition audit entries to 'order_status_history' table.
@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the audit record.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Mandatory link to the associated parent customer order.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Optional link to a specific seller sub-order if state change is sub-order specific.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_order_id")
    private SellerOrder sellerOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 32)
    private OrderStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 32)
    private OrderStatus newStatus;

    @Column(name = "changed_by_user_id")
    private Long changedByUserId;

    @Column(name = "changed_by_name", length = 150)
    private String changedByName;

    @Column(name = "changed_by_role", length = 32)
    private String changedByRole;

    @Column(length = 500)
    private String comments;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected OrderStatusHistory() {
    }

    public OrderStatusHistory(Order order, SellerOrder sellerOrder,
                              OrderStatus previousStatus, OrderStatus newStatus,
                              Long changedByUserId, String changedByName, String changedByRole,
                              String comments) {
        this.order = Objects.requireNonNull(order, "Order cannot be null.");
        this.sellerOrder = sellerOrder;
        this.previousStatus = previousStatus;
        this.newStatus = Objects.requireNonNull(newStatus, "New status cannot be null.");
        this.changedByUserId = changedByUserId;
        this.changedByName = changedByName != null ? changedByName : "System";
        this.changedByRole = changedByRole != null ? changedByRole : "SYSTEM";
        this.comments = comments;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public SellerOrder getSellerOrder() {
        return sellerOrder;
    }

    public OrderStatus getPreviousStatus() {
        return previousStatus;
    }

    public OrderStatus getNewStatus() {
        return newStatus;
    }

    public Long getChangedByUserId() {
        return changedByUserId;
    }

    public String getChangedByName() {
        return changedByName;
    }

    public String getChangedByRole() {
        return changedByRole;
    }

    public String getComments() {
        return comments;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
