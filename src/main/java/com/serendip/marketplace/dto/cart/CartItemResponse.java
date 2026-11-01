package com.serendip.marketplace.dto.cart;

import com.serendip.marketplace.entity.CartItem;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
    public static CartItemResponse fromEntity(CartItem item) {
        Long productId = item.getProduct() != null ? item.getProduct().getId() : null;
        String productName = item.getProduct() != null ? item.getProduct().getName() : null;

        return new CartItemResponse(
                item.getId(),
                productId,
                productName,
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }
}
