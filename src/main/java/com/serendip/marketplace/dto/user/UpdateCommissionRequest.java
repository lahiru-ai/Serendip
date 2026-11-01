package com.serendip.marketplace.dto.user;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Request payload for updating a seller's commission percentage.
 */
public record UpdateCommissionRequest(
        @NotNull(message = "Commission rate is required")
        @DecimalMin(value = "0.00", message = "Commission rate cannot be negative")
        @DecimalMax(value = "100.00", message = "Commission rate cannot exceed 100%")
        BigDecimal commissionRate
) {}
