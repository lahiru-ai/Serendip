package com.serendip.marketplace.enums;

/**
 * Represents the lifecycle stages of an order or seller sub-order.
 */
public enum OrderStatus {
    PENDING_PAYMENT("Order Placed"),
    PAID("Order Confirmed"),
    PAYMENT_CONFIRMED("Order Confirmed"),
    PROCESSING("Processing"),
    SHIPPED("Shipped"),
    OUT_FOR_DELIVERY("Out for Delivery"),
    DELIVERED("Delivered"),
    COMPLETED("Completed"),
    CANCELLED("Cancelled");

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /** Checks whether transitioning to the target order status is allowed. */
    public boolean canTransitionTo(OrderStatus next) {
        if (next == null) {
            return false;
        }
        return switch (this) {
            case PENDING_PAYMENT -> next == PAID || next == PAYMENT_CONFIRMED || next == CANCELLED;
            case PAID, PAYMENT_CONFIRMED -> next == PROCESSING || next == CANCELLED;
            case PROCESSING -> next == SHIPPED || next == CANCELLED;
            case SHIPPED -> next == OUT_FOR_DELIVERY || next == DELIVERED;
            case OUT_FOR_DELIVERY -> next == DELIVERED;
            case DELIVERED -> next == COMPLETED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }

    /** Returns whether a buyer or seller can cancel an order in this state. */
    public boolean isCancellable() {
        return this == PENDING_PAYMENT || this == PAID || this == PAYMENT_CONFIRMED || this == PROCESSING;
    }
}
