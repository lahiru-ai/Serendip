package com.serendip.marketplace.payment;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.UUID;

/**
 * Payment method implementation for Direct Bank Wire / Deposit transactions.
 */
public class BankTransferPaymentMethod implements PaymentMethod {

    private final boolean simulateSuccess;
    private final String bankReference;
    private final String depositSlipUrl;
    private final String customMessage;

    public BankTransferPaymentMethod() {
        this(true, null, null, null);
    }

    public BankTransferPaymentMethod(boolean simulateSuccess) {
        this(simulateSuccess, null, null, null);
    }

    public BankTransferPaymentMethod(boolean simulateSuccess, String bankReference, String customMessage) {
        this(simulateSuccess, bankReference, null, customMessage);
    }

    public BankTransferPaymentMethod(boolean simulateSuccess, String bankReference, String depositSlipUrl, String customMessage) {
        this.simulateSuccess = simulateSuccess;
        this.bankReference = bankReference;
        this.depositSlipUrl = depositSlipUrl;
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
            String ref = (bankReference != null && !bankReference.isBlank())
                    ? bankReference.trim().toUpperCase()
                    : "BANK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String slipNote = (depositSlipUrl != null && !depositSlipUrl.isBlank())
                    ? " with deposit slip submitted"
                    : "";
            String message = customMessage != null ? customMessage : ("Bank wire transfer verified" + slipNote + " (Ref: " + ref + ")");
            return PaymentResult.success(ref, amount, message, depositSlipUrl);
        } else {
            String message = customMessage != null ? customMessage : "Bank transfer verification failed or reference invalid";
            return PaymentResult.failure(message, amount);
        }
    }

    @Override
    public String getMethodName() {
        return "BANK_TRANSFER";
    }

    public String getDepositSlipUrl() {
        return depositSlipUrl;
    }
}
