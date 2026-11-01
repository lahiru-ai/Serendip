package com.serendip.marketplace.dto.order;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for transitioning an order or seller sub-order status.
 */
public record UpdateOrderStatusRequest(
        @NotBlank(message = "New order status is required")
        String newStatus,
        String carrier,
        String trackingNumber,
        String reason
) {}
