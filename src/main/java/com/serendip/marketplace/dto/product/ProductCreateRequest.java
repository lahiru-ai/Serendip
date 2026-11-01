package com.serendip.marketplace.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductCreateRequest(
        @NotNull(message = "Seller ID is required")
        Long sellerId,

        @NotBlank(message = "Product name is required")
        String name,

        String category,

        String description,

        @NotNull(message = "Price in USD is required")
        @DecimalMin(value = "0.01", message = "Price in USD must be strictly positive")
        BigDecimal priceUsd,

        @Min(value = 0, message = "Stock quantity cannot be negative")
        int stockQuantity,

        Integer weightGrams
) {
    public int effectiveWeightGrams() {
        return (weightGrams != null && weightGrams > 0) ? weightGrams : 100;
    }

    public ProductCreateRequest(Long sellerId, String name, String category, String description, BigDecimal priceUsd, int stockQuantity) {
        this(sellerId, name, category, description, priceUsd, stockQuantity, 100);
    }
}
