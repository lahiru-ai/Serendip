package com.serendip.marketplace.dto.order;

import com.serendip.marketplace.entity.Payment;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        String paymentMethod,
        String transactionReference,
        BigDecimal amount,
        String currency,
        String status,
        String message,
        Instant createdAt,
        String depositSlipUrl
) {
    public PaymentResponse(Long id, String paymentMethod, String transactionReference,
                           BigDecimal amount, String currency, String status, String message, Instant createdAt) {
        this(id, paymentMethod, transactionReference, amount, currency, status, message, createdAt, null);
    }

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) return null;
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentMethod(),
                payment.getTransactionReference(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus() != null ? payment.getStatus().name() : null,
                payment.getMessage(),
                payment.getCreatedAt(),
                payment.getDepositSlipUrl()
        );
    }
}
