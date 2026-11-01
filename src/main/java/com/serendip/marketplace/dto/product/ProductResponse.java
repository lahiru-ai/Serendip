package com.serendip.marketplace.dto.product;

import com.serendip.marketplace.entity.Product;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        Long sellerId,
        String sellerShopName,
        String name,
        String category,
        String description,
        BigDecimal priceUsd,
        BigDecimal priceLkr,
        String currencyCode,
        int stockQuantity,
        int weightGrams,
        boolean active
) {
    public static ProductResponse fromEntity(Product product) {
        Long sellerId = product.getSeller() != null ? product.getSeller().getId() : null;
        String sellerShopName = product.getSeller() != null ? product.getSeller().getShopName() : null;

        return new ProductResponse(
                product.getId(),
                sellerId,
                sellerShopName,
                product.getName(),
                product.getCategory(),
                product.getDescription(),
                product.getPrice(),
                product.getPriceInLkr(),
                product.getCurrencyCode(),
                product.getStockQuantity(),
                product.getWeightGrams(),
                product.isActive()
        );
    }
}
