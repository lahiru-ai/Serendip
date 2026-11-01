package com.serendip.marketplace.payment;

import java.math.BigDecimal;

/**
 * Interface defining payment processing operations for orders.
 */
public interface PaymentMethod {

    /** Executes payment authorization for an order amount. */
    PaymentResult pay(BigDecimal amount, String currency, String orderReference);

    /** Overloaded payment method supporting alternate argument order. */
    default PaymentResult pay(String orderReference, BigDecimal amount, String currencyCode) {
        return pay(amount, currencyCode, orderReference);
    }

    /** Returns the display name of this payment method. */
    String getMethodName();
}
