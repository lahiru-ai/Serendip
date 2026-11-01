package com.serendip.marketplace.dto.product;

import jakarta.validation.constraints.Min;

public record ProductStockReplenishRequest(
        @Min(value = 1, message = "Replenish quantity must be greater than zero")
        int quantity
) {}
