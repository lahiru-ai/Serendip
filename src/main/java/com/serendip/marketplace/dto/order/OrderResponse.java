package com.serendip.marketplace.dto.order;

import com.serendip.marketplace.entity.Order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        Long buyerId,
        String buyerName,
        String buyerEmail,
        String buyerPhone,
        String shippingAddress,
        String currency,
        BigDecimal subtotalAmount,
        BigDecimal shippingAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String status,
        String paymentMethodName,
        PaymentResponse payment,
        List<SellerOrderResponse> sellerOrders,
        List<OrderStatusHistoryResponse> statusHistory,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrderResponse fromEntity(Order order) {
        Long buyerId = order.getBuyer() != null ? order.getBuyer().getId() : null;
        String buyerName = order.getBuyer() != null ? order.getBuyer().getFullName() : null;
        String buyerEmail = order.getBuyer() != null ? order.getBuyer().getEmail() : null;
        String buyerPhone = order.getBuyer() != null ? order.getBuyer().getPhoneNumber() : null;

        List<SellerOrderResponse> subOrders = order.getSellerOrders().stream()
                .map(SellerOrderResponse::fromEntity)
                .toList();

        List<OrderStatusHistoryResponse> history = order.getStatusHistory() != null
                ? order.getStatusHistory().stream().map(OrderStatusHistoryResponse::fromEntity).toList()
                : List.of();

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                buyerId,
                buyerName,
                buyerEmail,
                buyerPhone,
                order.getShippingAddress(),
                order.getCurrency(),
                order.getSubtotalAmount(),
                order.getShippingAmount(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getStatus() != null ? order.getStatus().name() : null,
                order.getPaymentMethodName(),
                PaymentResponse.fromEntity(order.getPayment()),
                subOrders,
                history,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
