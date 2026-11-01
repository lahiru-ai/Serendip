package com.serendip.marketplace.payment;

import com.serendip.marketplace.enums.PaymentStatus;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Value object capturing the outcome of a payment attempt.
 */
public class PaymentResult {

    private final boolean successful;
    private final PaymentStatus status;
    private final String transactionReference;
    private final String message;
    private final BigDecimal amount;
    private final String depositSlipUrl;

    public PaymentResult(PaymentStatus status, String transactionReference, String message) {
        this(status == PaymentStatus.COMPLETED || status == PaymentStatus.SUCCEEDED,
             status, transactionReference, message, BigDecimal.ZERO, null);
    }

    public PaymentResult(boolean successful, PaymentStatus status, String transactionReference,
                         String message, BigDecimal amount) {
        this(successful, status, transactionReference, message, amount, null);
    }

    public PaymentResult(boolean successful, PaymentStatus status, String transactionReference,
                         String message, BigDecimal amount, String depositSlipUrl) {
        this.successful = successful;
        this.status = status != null ? status : (successful ? PaymentStatus.COMPLETED : PaymentStatus.FAILED);
        this.transactionReference = transactionReference != null ? transactionReference : "";
        this.message = message != null ? message : "";
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.depositSlipUrl = depositSlipUrl;
    }

    /** Creates a successful payment result. */
    public static PaymentResult success(String transactionReference, BigDecimal amount, String message) {
        return new PaymentResult(true, PaymentStatus.COMPLETED, transactionReference, message, amount, null);
    }

    /** Creates a successful payment result with a deposit slip reference. */
    public static PaymentResult success(String transactionReference, BigDecimal amount, String message, String depositSlipUrl) {
        return new PaymentResult(true, PaymentStatus.COMPLETED, transactionReference, message, amount, depositSlipUrl);
    }

    /** Creates a failed payment result with an error message. */
    public static PaymentResult failure(String message, BigDecimal amount) {
        return new PaymentResult(false, PaymentStatus.FAILED, "", message, amount, null);
    }

    public boolean isSuccessful() {
        return successful;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public PaymentStatus status() {
        return status;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public String transactionReference() {
        return transactionReference;
    }

    public String getMessage() {
        return message;
    }

    public String message() {
        return message;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getDepositSlipUrl() {
        return depositSlipUrl;
    }

    public String depositSlipUrl() {
        return depositSlipUrl;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PaymentResult that)) return false;
        return successful == that.successful &&
                status == that.status &&
                Objects.equals(transactionReference, that.transactionReference);
    }

    @Override
    public int hashCode() {
        return Objects.hash(successful, status, transactionReference);
    }

    @Override
    public String toString() {
        return String.format("PaymentResult[successful=%s, status=%s, ref='%s', amount=%s, message='%s']",
                successful, status, transactionReference, amount, message);
    }
}
