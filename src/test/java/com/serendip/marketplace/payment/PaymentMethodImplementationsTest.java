package com.serendip.marketplace.payment;

import com.serendip.marketplace.dto.order.CheckoutRequest;
import com.serendip.marketplace.enums.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Card, PayPal, and Bank Transfer Payment Method Tests")
class PaymentMethodImplementationsTest {

    @Test
    @DisplayName("CardPaymentMethod processes card payment successfully")
    void cardPaymentSuccess() {
        CardPaymentMethod cardMethod = new CardPaymentMethod(true, "4111 1111 1111 4321", "John Doe", null);
        PaymentResult result = cardMethod.pay(new BigDecimal("120.00"), "USD", "ORD-1234");

        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(result.getTransactionReference()).startsWith("CARD-TXN-");
        assertThat(result.getMessage()).contains("ending in 4321");
        assertThat(cardMethod.getMethodName()).isEqualTo("CARD_PAYMENT");
    }

    @Test
    @DisplayName("CardPaymentMethod handles declined payment")
    void cardPaymentDeclined() {
        CardPaymentMethod cardMethod = new CardPaymentMethod(false, "4111 1111 1111 4321", "John Doe", null);
        PaymentResult result = cardMethod.pay(new BigDecimal("120.00"), "USD", "ORD-1234");

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(result.getMessage()).contains("declined");
    }

    @Test
    @DisplayName("PayPalPaymentMethod processes PayPal payment successfully")
    void payPalSuccess() {
        PayPalPaymentMethod paypalMethod = new PayPalPaymentMethod(true, "buyer@example.com", null);
        PaymentResult result = paypalMethod.pay(new BigDecimal("85.50"), "USD", "ORD-5678");

        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(result.getTransactionReference()).startsWith("PAYPAL-TXN-");
        assertThat(result.getMessage()).contains("buyer@example.com");
        assertThat(paypalMethod.getMethodName()).isEqualTo("PAYPAL");
    }

    @Test
    @DisplayName("BankTransferPaymentMethod processes wire transfer with reference and deposit slip")
    void bankTransferSuccess() {
        BankTransferPaymentMethod bankMethod = new BankTransferPaymentMethod(true, "WIRE-REF-9988", "https://example.com/slip.jpg", null);
        PaymentResult result = bankMethod.pay(new BigDecimal("500.00"), "USD", "ORD-9900");

        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(result.getTransactionReference()).isEqualTo("WIRE-REF-9988");
        assertThat(result.getDepositSlipUrl()).isEqualTo("https://example.com/slip.jpg");
        assertThat(result.getMessage()).contains("deposit slip submitted");
        assertThat(bankMethod.getMethodName()).isEqualTo("BANK_TRANSFER");
    }

    @Test
    @DisplayName("PaymentMethodFactory resolves proper PaymentMethod instances")
    void paymentMethodFactoryResolution() {
        CheckoutRequest cardReq = new CheckoutRequest(1L, "CARD_PAYMENT", true, "1234567812345678", "12/28", "123", "Alice", null, null);
        PaymentMethod cardMethod = PaymentMethodFactory.create(cardReq);
        assertThat(cardMethod).isInstanceOf(CardPaymentMethod.class);
        assertThat(cardMethod.getMethodName()).isEqualTo("CARD_PAYMENT");

        CheckoutRequest paypalReq = new CheckoutRequest(1L, "PAYPAL", true, null, null, null, null, "paypal@buyer.com", null);
        PaymentMethod paypalMethod = PaymentMethodFactory.create(paypalReq);
        assertThat(paypalMethod).isInstanceOf(PayPalPaymentMethod.class);
        assertThat(paypalMethod.getMethodName()).isEqualTo("PAYPAL");

        CheckoutRequest bankReq = new CheckoutRequest(1L, "BANK_TRANSFER", true, null, null, null, null, null, "WIRE-5544", "slip_123.pdf", "slip_123.pdf");
        PaymentMethod bankMethod = PaymentMethodFactory.create(bankReq);
        assertThat(bankMethod).isInstanceOf(BankTransferPaymentMethod.class);
        assertThat(bankMethod.getMethodName()).isEqualTo("BANK_TRANSFER");
        assertThat(((BankTransferPaymentMethod) bankMethod).getDepositSlipUrl()).isEqualTo("slip_123.pdf");

        CheckoutRequest mockReq = new CheckoutRequest(1L, "MOCK", true);
        PaymentMethod mockMethod = PaymentMethodFactory.create(mockReq);
        assertThat(mockMethod).isInstanceOf(MockPaymentMethod.class);
    }
}
