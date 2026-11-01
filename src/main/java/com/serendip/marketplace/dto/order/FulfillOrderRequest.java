package com.serendip.marketplace.dto.order;

import jakarta.validation.constraints.NotBlank;

public record FulfillOrderRequest(
        @NotBlank(message = "Carrier name is required")
        String carrier,

        @NotBlank(message = "Tracking number is required")
        String trackingNumber
) {}
