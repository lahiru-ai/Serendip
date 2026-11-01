package com.serendip.marketplace.payment;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.UUID;

/**
 * Payment method implementation for Credit/Debit card transactions.
 */
public class CardPaymentMethod implements PaymentMethod {

    private final boolean simulateSuccess;
    private final String cardNumber;
    private final String cardHolder;
    private final String customMessage;

    public CardPaymentMethod() {
        this(true, null, null, null);
    }

    public CardPaymentMethod(boolean simulateSuccess) {
        this(simulateSuccess, null, null, null);
    }

    public CardPaymentMethod(boolean simulateSuccess, String cardNumber, String cardHolder, String customMessage) {
        this.simulateSuccess = simulateSuccess;
        this.cardNumber = cardNumber;
        this.cardHolder = cardHolder;
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
            String masked = (cardNumber != null && cardNumber.replaceAll("\\s+", "").length() >= 4)
                    ? " ending in " + cardNumber.replaceAll("\\s+", "").substring(cardNumber.replaceAll("\\s+", "").length() - 4)
                    : "";
            String message = customMessage != null ? customMessage : ("Card payment authorized successfully" + masked);
            String txnId = "CARD-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            return PaymentResult.success(txnId, amount, message);
        } else {
            String message = customMessage != null ? customMessage : "Card payment declined by issuing bank";
            return PaymentResult.failure(message, amount);
        }
    }

    @Override
    public String getMethodName() {
        return "CARD_PAYMENT";
    }
}
