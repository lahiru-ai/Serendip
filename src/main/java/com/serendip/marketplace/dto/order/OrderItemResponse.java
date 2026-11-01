package com.serendip.marketplace.dto.order;

import com.serendip.marketplace.entity.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productNameAtPurchase,
        BigDecimal unitPriceAtPurchase,
        int quantity,
        BigDecimal lineTotal
) {
    public static OrderItemResponse fromEntity(OrderItem item) {
        Long productId = item.getProduct() != null ? item.getProduct().getId() : null;

        return new OrderItemResponse(
                item.getId(),
                productId,
                item.getProductNameAtPurchase(),
                item.getUnitPriceAtPurchase(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }
}
