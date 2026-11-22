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
        Integer weightGrams,
        boolean active,
        String imageUrl,
        Double averageRating,
        Integer reviewCount
) {
    public ProductResponse(Long id, Long sellerId, String sellerShopName, String name, String category,
                           String description, BigDecimal priceUsd, BigDecimal priceLkr, String currencyCode,
                           int stockQuantity, Integer weightGrams, boolean active, String imageUrl) {
        this(id, sellerId, sellerShopName, name, category, description, priceUsd, priceLkr, currencyCode, stockQuantity, weightGrams, active, imageUrl, null, 0);
    }

    public ProductResponse(Long id, Long sellerId, String sellerShopName, String name, String category,
                           String description, BigDecimal priceUsd, BigDecimal priceLkr, String currencyCode,
                           int stockQuantity, Integer weightGrams, boolean active) {
        this(id, sellerId, sellerShopName, name, category, description, priceUsd, priceLkr, currencyCode, stockQuantity, weightGrams, active, null, null, 0);
    }

    public static ProductResponse fromEntity(Product product) {
        return fromEntity(product, null, 0);
    }

    public static ProductResponse fromEntity(Product product, Double averageRating, Integer reviewCount) {
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
                product.isActive(),
                product.getImageUrl(),
                averageRating,
                reviewCount != null ? reviewCount : 0
        );
    }
}
