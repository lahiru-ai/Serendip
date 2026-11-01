package com.serendip.marketplace.dto.order;

import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
        @NotNull(message = "Buyer ID is required")
        Long buyerId,

        String paymentMethodName,

        boolean simulateSuccess,

        String cardNumber,
        String cardExpiry,
        String cardCvc,
        String cardHolder,
        String paypalEmail,
        String bankReference,
        String depositSlipUrl,
        String depositSlipName
) {
    public CheckoutRequest {
        if (paymentMethodName == null || paymentMethodName.isBlank()) {
            paymentMethodName = "CARD_PAYMENT";
        }
    }

    public CheckoutRequest(Long buyerId, String paymentMethodName, boolean simulateSuccess) {
        this(buyerId, paymentMethodName, simulateSuccess, null, null, null, null, null, null, null, null);
    }

    public CheckoutRequest(Long buyerId, String paymentMethodName, boolean simulateSuccess,
                           String cardNumber, String cardExpiry, String cardCvc, String cardHolder,
                           String paypalEmail, String bankReference) {
        this(buyerId, paymentMethodName, simulateSuccess, cardNumber, cardExpiry, cardCvc, cardHolder, paypalEmail, bankReference, null, null);
    }
}
