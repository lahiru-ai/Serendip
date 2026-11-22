package com.serendip.marketplace.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * DTO for updating an existing product's catalog details.
 */
public record ProductUpdateRequest(
        @NotBlank(message = "Product name is required")
        String name,

        String category,

        String description,

        @DecimalMin(value = "0.01", message = "Price in USD must be strictly positive")
        BigDecimal priceUsd,

        @DecimalMin(value = "0.01", message = "Price in LKR must be strictly positive")
        BigDecimal priceLkr,

        @Min(value = 0, message = "Stock quantity cannot be negative")
        Integer stockQuantity,

        Integer weightGrams,

        String imageUrl,

        Boolean active
) {
    public int effectiveWeightGrams() {
        return (weightGrams != null && weightGrams > 0) ? weightGrams : 100;
    }
}
