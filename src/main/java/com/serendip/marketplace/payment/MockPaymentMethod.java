package com.serendip.marketplace.payment;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.UUID;

/**
 * Mock implementation of PaymentMethod for testing and local checkout simulation.
 */
public class MockPaymentMethod implements PaymentMethod {

    private final boolean simulateSuccess;
    private final String customMessage;

    public MockPaymentMethod() {
        this(true, "Simulated successful test payment");
    }

    public MockPaymentMethod(boolean simulateSuccess) {
        this(simulateSuccess, simulateSuccess ? "Simulated successful test payment" : "Simulated card declined");
    }

    public MockPaymentMethod(boolean simulateSuccess, String customMessage) {
        this.simulateSuccess = simulateSuccess;
        this.customMessage = customMessage != null ? customMessage : (simulateSuccess ? "Simulated successful test payment" : "Simulated card declined");
    }

    /** Simulates payment authorization based on the configured success flag. */
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
            String mockTxnId = "MOCK-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            return PaymentResult.success(mockTxnId, amount, customMessage);
        } else {
            return PaymentResult.failure(customMessage, amount);
        }
    }

    @Override
    public String getMethodName() {
        return "MOCK_TEST_GATEWAY";
    }
}
