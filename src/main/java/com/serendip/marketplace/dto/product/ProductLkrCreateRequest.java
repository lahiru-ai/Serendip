package com.serendip.marketplace.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductLkrCreateRequest(
        @NotNull(message = "Seller ID is required")
        Long sellerId,

        @NotBlank(message = "Product name is required")
        String name,

        String category,

        String description,

        @NotNull(message = "Price in LKR is required")
        @DecimalMin(value = "0.01", message = "Price in LKR must be strictly positive")
        BigDecimal priceLkr,

        @Min(value = 0, message = "Stock quantity cannot be negative")
        int stockQuantity,

        Integer weightGrams,

        String imageUrl
) {
    public Integer effectiveWeightGrams() {
        return (weightGrams != null && weightGrams > 0) ? weightGrams : null;
    }

    public ProductLkrCreateRequest(Long sellerId, String name, String category, String description, BigDecimal priceLkr, int stockQuantity) {
        this(sellerId, name, category, description, priceLkr, stockQuantity, null, null);
    }

    public ProductLkrCreateRequest(Long sellerId, String name, String category, String description, BigDecimal priceLkr, int stockQuantity, Integer weightGrams) {
        this(sellerId, name, category, description, priceLkr, stockQuantity, weightGrams, null);
    }
}
