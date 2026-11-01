package com.serendip.marketplace.payment;

import com.serendip.marketplace.dto.order.CheckoutRequest;

/**
 * Factory for creating PaymentMethod instances based on checkout requests.
 */
public final class PaymentMethodFactory {

    private PaymentMethodFactory() {
    }

    public static PaymentMethod create(CheckoutRequest request) {
        if (request == null) {
            return new CardPaymentMethod();
        }

        String method = request.paymentMethodName();
        if (method == null || method.isBlank()) {
            method = "CARD_PAYMENT";
        }

        String normalized = method.trim().toUpperCase().replace(" ", "_").replace("-", "_");

        return switch (normalized) {
            case "CARD", "CARD_PAYMENT", "CREDIT_CARD", "DEBIT_CARD" ->
                    new CardPaymentMethod(request.simulateSuccess(), request.cardNumber(), request.cardHolder(), null);
            case "PAYPAL" ->
                    new PayPalPaymentMethod(request.simulateSuccess(), request.paypalEmail(), null);
            case "BANK", "BANK_TRANSFER", "WIRE", "WIRE_TRANSFER", "BANK_DEPOSIT" ->
                    new BankTransferPaymentMethod(request.simulateSuccess(), request.bankReference(), request.depositSlipUrl(), null);
            default ->
                    new MockPaymentMethod(request.simulateSuccess());
        };
    }
}
