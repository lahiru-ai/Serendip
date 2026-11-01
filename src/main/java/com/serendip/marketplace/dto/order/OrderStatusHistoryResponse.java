package com.serendip.marketplace.dto.order;

import com.serendip.marketplace.entity.OrderStatusHistory;

import java.time.Instant;

/**
 * Audit record representing a historical status update for an order.
 */
public record OrderStatusHistoryResponse(
        Long id,
        Long orderId,
        Long sellerOrderId,
        String previousStatus,
        String newStatus,
        Long changedByUserId,
        String changedByName,
        String changedByRole,
        String comments,
        Instant createdAt
) {
    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistory history) {
        if (history == null) return null;
        Long sellerOrderId = history.getSellerOrder() != null ? history.getSellerOrder().getId() : null;
        String prevStatus = history.getPreviousStatus() != null ? history.getPreviousStatus().name() : null;
        String nextStatus = history.getNewStatus() != null ? history.getNewStatus().name() : null;

        return new OrderStatusHistoryResponse(
                history.getId(),
                history.getOrder().getId(),
                sellerOrderId,
                prevStatus,
                nextStatus,
                history.getChangedByUserId(),
                history.getChangedByName(),
                history.getChangedByRole(),
                history.getComments(),
                history.getCreatedAt()
        );
    }
}
