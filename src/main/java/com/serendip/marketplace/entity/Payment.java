package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.PaymentStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Represents a payment transaction linked to an order.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps transaction payment records to 'payments' table.
@Entity
@Table(name = "payments")
public class Payment {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the payment record.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / One-to-One Foreign Key
    // Purpose: Links unique payment record to its corresponding order via 'order_id'.
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(name = "payment_method", nullable = false, length = 64)
    private String paymentMethod;

    @Column(name = "transaction_reference", nullable = false, length = 128)
    private String transactionReference;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 255)
    private String message;

    @Column(name = "deposit_slip_url", length = 500)
    private String depositSlipUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Payment() {
    }

    public Payment(Order order, String paymentMethod, String transactionReference,
                   BigDecimal amount, String currency, PaymentStatus status, String message) {
        this.order = Objects.requireNonNull(order, "Order cannot be null.");
        this.paymentMethod = paymentMethod != null && !paymentMethod.isBlank() ? paymentMethod : "MOCK";
        this.transactionReference = transactionReference != null ? transactionReference : "";
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.currency = currency != null && !currency.isBlank() ? currency : "USD";
        this.status = status != null ? status : PaymentStatus.PENDING;
        this.message = message != null ? message : "";
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDepositSlipUrl() {
        return depositSlipUrl;
    }

    public void setDepositSlipUrl(String depositSlipUrl) {
        this.depositSlipUrl = depositSlipUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
