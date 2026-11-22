package com.serendip.marketplace.dto.cart;

import com.serendip.marketplace.entity.ShoppingCart;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        Long id,
        Long buyerId,
        int totalItemCount,
        BigDecimal totalAmount,
        BigDecimal total,
        List<CartItemResponse> items
) {
    public CartResponse(Long id, Long buyerId, int totalItemCount, BigDecimal totalAmount, List<CartItemResponse> items) {
        this(id, buyerId, totalItemCount, totalAmount, totalAmount, items);
    }

    public static CartResponse fromEntity(ShoppingCart cart) {
        Long buyerId = cart.getBuyer() != null ? cart.getBuyer().getId() : null;
        List<CartItemResponse> items = cart.getItems().stream()
                .map(CartItemResponse::fromEntity)
                .toList();

        return new CartResponse(
                cart.getId(),
                buyerId,
                cart.getTotalItemCount(),
                cart.getTotal(),
                cart.getTotal(),
                items
        );
    }
}
