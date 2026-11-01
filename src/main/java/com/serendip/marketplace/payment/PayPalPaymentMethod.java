package com.serendip.marketplace.payment;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.UUID;

/**
 * Payment method implementation for PayPal digital wallet transactions.
 */
public class PayPalPaymentMethod implements PaymentMethod {

    private final boolean simulateSuccess;
    private final String paypalEmail;
    private final String customMessage;

    public PayPalPaymentMethod() {
        this(true, null, null);
    }

    public PayPalPaymentMethod(boolean simulateSuccess) {
        this(simulateSuccess, null, null);
    }

    public PayPalPaymentMethod(boolean simulateSuccess, String paypalEmail, String customMessage) {
        this.simulateSuccess = simulateSuccess;
        this.paypalEmail = paypalEmail;
        this.customMessage = customMessage;
    }

    @Override
    public PaymentResult pay(BigDecimal amount, String currency, String orderReference) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentResult.failure("Invalid payment amount: must be positive", amount != null ? amount : BigDecimal.ZERO);
        }
        if (orderReference == null || orderReference.isBlank()) {
            return PaymentResult.failure("Order reference is required", amount);
        }
        try {
            if (currency != null) {
                Currency.getInstance(currency);
            }
        } catch (Exception e) {
            return PaymentResult.failure("Invalid ISO currency code: " + currency, amount);
        }

        if (simulateSuccess) {
            String emailNote = (paypalEmail != null && !paypalEmail.isBlank())
                    ? " for account " + paypalEmail
                    : "";
            String message = customMessage != null ? customMessage : ("PayPal checkout authorized successfully" + emailNote);
            String txnId = "PAYPAL-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            return PaymentResult.success(txnId, amount, message);
        } else {
            String message = customMessage != null ? customMessage : "PayPal transaction cancelled or authorization failed";
            return PaymentResult.failure(message, amount);
        }
    }

    @Override
    public String getMethodName() {
        return "PAYPAL";
    }
}
