package com.serendip.marketplace.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductPriceUpdateRequest(
        @NotNull(message = "New price in USD is required")
        @DecimalMin(value = "0.01", message = "Price must be strictly positive")
        BigDecimal newPriceUsd
) {}
