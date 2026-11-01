package com.serendip.marketplace.dto.order;

import com.serendip.marketplace.entity.SellerOrder;
import com.serendip.marketplace.security.SecurityUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SellerOrderResponse(
        Long id,
        Long orderId,
        String orderNumber,
        Long sellerId,
        String sellerShopName,
        String sellerEmail,
        String subOrderNumber,
        String status,
        String buyerName,
        String buyerEmail,
        String buyerPhone,
        String shippingAddress,
        String paymentMethodName,
        String paymentStatus,
        BigDecimal subtotalAmount,
        BigDecimal shippingAmount,
        BigDecimal commissionRate,
        BigDecimal commissionAmount,
        BigDecimal netPayoutAmount,
        String carrier,
        String trackingNumber,
        Instant createdAt,
        Instant updatedAt,
        List<OrderItemResponse> items,
        List<OrderStatusHistoryResponse> statusHistory
) {
    public static SellerOrderResponse fromEntity(SellerOrder subOrder) {
        Long sellerId = subOrder.getSeller() != null ? subOrder.getSeller().getId() : null;
        String sellerShopName = subOrder.getSeller() != null ? subOrder.getSeller().getShopName() : null;
        String sellerEmail = subOrder.getSeller() != null ? subOrder.getSeller().getEmail() : null;

        Long orderId = subOrder.getOrder() != null ? subOrder.getOrder().getId() : null;
        String orderNumber = subOrder.getOrder() != null ? subOrder.getOrder().getOrderNumber() : null;
        String buyerName = subOrder.getOrder() != null && subOrder.getOrder().getBuyer() != null
                ? subOrder.getOrder().getBuyer().getFullName() : null;
        String buyerEmail = subOrder.getOrder() != null && subOrder.getOrder().getBuyer() != null
                ? subOrder.getOrder().getBuyer().getEmail() : null;
        String buyerPhone = subOrder.getOrder() != null && subOrder.getOrder().getBuyer() != null
                ? subOrder.getOrder().getBuyer().getPhoneNumber() : null;
        String shippingAddress = subOrder.getOrder() != null ? subOrder.getOrder().getShippingAddress() : null;
        String paymentMethodName = subOrder.getOrder() != null ? subOrder.getOrder().getPaymentMethodName() : null;
        String paymentStatus = subOrder.getOrder() != null && subOrder.getOrder().getPayment() != null && subOrder.getOrder().getPayment().getStatus() != null
                ? subOrder.getOrder().getPayment().getStatus().name() : "PENDING";

        List<OrderItemResponse> items = subOrder.getItems().stream()
                .map(OrderItemResponse::fromEntity)
                .toList();

        List<OrderStatusHistoryResponse> history = subOrder.getStatusHistory() != null
                ? subOrder.getStatusHistory().stream().map(OrderStatusHistoryResponse::fromEntity).toList()
                : List.of();

        // Commission details are confidential and only visible to administrators
        boolean isAdmin = SecurityUtils.isAdmin();
        BigDecimal commissionRate = isAdmin ? subOrder.getCommissionRate() : null;
        BigDecimal commissionAmount = isAdmin ? subOrder.getCommissionAmount() : null;
        BigDecimal netPayout = isAdmin ? subOrder.getNetPayoutAmount() : null;

        return new SellerOrderResponse(
                subOrder.getId(),
                orderId,
                orderNumber,
                sellerId,
                sellerShopName,
                sellerEmail,
                subOrder.getSubOrderNumber(),
                subOrder.getStatus() != null ? subOrder.getStatus().name() : null,
                buyerName,
                buyerEmail,
                buyerPhone,
                shippingAddress,
                paymentMethodName,
                paymentStatus,
                subOrder.getSubtotalAmount(),
                subOrder.getShippingAmount(),
                commissionRate,
                commissionAmount,
                netPayout,
                subOrder.getCarrier(),
                subOrder.getTrackingNumber(),
                subOrder.getCreatedAt(),
                subOrder.getUpdatedAt(),
                items,
                history
        );
    }
}
