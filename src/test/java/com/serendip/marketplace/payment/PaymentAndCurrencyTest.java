package com.serendip.marketplace.payment;

import com.serendip.marketplace.enums.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Payment & Currency Conversion Tests")
class PaymentAndCurrencyTest {

    @Nested
    @DisplayName("PaymentResult Tests")
    class PaymentResultTests {

        @Test
        @DisplayName("Factory methods create success and failure results with accurate attributes")
        void factoryMethods() {
            PaymentResult success = PaymentResult.success("TXN-12345", new BigDecimal("50.00"), "Success");
            assertThat(success.isSuccessful()).isTrue();
            assertThat(success.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
            assertThat(success.getTransactionReference()).isEqualTo("TXN-12345");
            assertThat(success.getAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
            assertThat(success.getMessage()).isEqualTo("Success");

            PaymentResult failure = PaymentResult.failure("Card declined", new BigDecimal("50.00"));
            assertThat(failure.isSuccessful()).isFalse();
            assertThat(failure.getStatus()).isEqualTo(PaymentStatus.FAILED);
            assertThat(failure.getTransactionReference()).isEmpty();
            assertThat(failure.getMessage()).isEqualTo("Card declined");
        }

        @Test
        @DisplayName("Value object equality and toString behave correctly")
        void equalityAndToString() {
            PaymentResult result1 = PaymentResult.success("TXN-1", new BigDecimal("10.00"), "Paid");
            PaymentResult result2 = PaymentResult.success("TXN-1", new BigDecimal("10.00"), "Paid");
            PaymentResult result3 = PaymentResult.failure("Failed", new BigDecimal("10.00"));

            assertThat(result1).isEqualTo(result2);
            assertThat(result1.hashCode()).isEqualTo(result2.hashCode());
            assertThat(result1).isNotEqualTo(result3);
            assertThat(result1.toString()).contains("TXN-1", "COMPLETED");
        }
    }

    @Nested
    @DisplayName("MockPaymentMethod Tests")
    class MockPaymentMethodTests {

        @Test
        @DisplayName("MockPaymentMethod processes positive amounts and generates mock references")
        void positiveAmountSuccess() {
            MockPaymentMethod paymentMethod = new MockPaymentMethod(true, "Custom approval");
            PaymentResult result = paymentMethod.pay(new BigDecimal("99.99"), "USD", "ORD-1001");

            assertThat(result.isSuccessful()).isTrue();
            assertThat(result.getTransactionReference()).startsWith("MOCK-TXN-");
            assertThat(result.getMessage()).isEqualTo("Custom approval");
            assertThat(paymentMethod.getMethodName()).isEqualTo("MOCK_TEST_GATEWAY");
        }

        @Test
        @DisplayName("MockPaymentMethod rejects non-positive amounts, missing references, or invalid currencies")
        void invalidInputsReturnFailure() {
            MockPaymentMethod paymentMethod = new MockPaymentMethod(true);

            // Null or non-positive amount
            PaymentResult nullAmount = paymentMethod.pay(null, "USD", "ORD-1001");
            assertThat(nullAmount.isSuccessful()).isFalse();
            assertThat(nullAmount.getMessage()).contains("must be positive");

            PaymentResult zeroAmount = paymentMethod.pay(BigDecimal.ZERO, "USD", "ORD-1001");
            assertThat(zeroAmount.isSuccessful()).isFalse();

            // Blank order reference
            PaymentResult blankRef = paymentMethod.pay(new BigDecimal("10.00"), "USD", "   ");
            assertThat(blankRef.isSuccessful()).isFalse();
            assertThat(blankRef.getMessage()).contains("Order reference is required");

            // Invalid ISO currency code
            PaymentResult badCurrency = paymentMethod.pay(new BigDecimal("10.00"), "INVALID_CURRENCY", "ORD-1001");
            assertThat(badCurrency.isSuccessful()).isFalse();
            assertThat(badCurrency.getMessage()).contains("Invalid ISO currency code");
        }

        @Test
        @DisplayName("Simulated failure returns failure outcome with custom message")
        void simulatedFailure() {
            MockPaymentMethod failingMethod = new MockPaymentMethod(false, "Insufficient funds");
            PaymentResult result = failingMethod.pay(new BigDecimal("25.00"), "USD", "ORD-2002");

            assertThat(result.isSuccessful()).isFalse();
            assertThat(result.getMessage()).isEqualTo("Insufficient funds");
        }
    }

    @Nested
    @DisplayName("CurrencyConverter Tests")
    class CurrencyConverterTests {

        @Test
        @DisplayName("FixedRateCurrencyConverter converts accurately between LKR and USD")
        void conversionRates() {
            FixedRateCurrencyConverter converter = new FixedRateCurrencyConverter(new BigDecimal("300.00"));

            // 3,000 LKR = 10.00 USD
            assertThat(converter.convertLkrToUsd(new BigDecimal("3000.00"))).isEqualByComparingTo(new BigDecimal("10.00"));

            // 10.00 USD = 3,000.00 LKR
            assertThat(converter.convertUsdToLkr(new BigDecimal("10.00"))).isEqualByComparingTo(new BigDecimal("3000.00"));

            // Null or non-positive inputs return zero safely
            assertThat(converter.convertLkrToUsd(null)).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(converter.convertUsdToLkr(null)).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(converter.convertLkrToUsd(new BigDecimal("-100.00"))).isEqualByComparingTo(BigDecimal.ZERO);

            assertThat(converter.getExchangeRate()).isEqualByComparingTo(new BigDecimal("300.00"));
        }

        @Test
        @DisplayName("Reject invalid (zero or negative) exchange rates on initialization")
        void invalidExchangeRateThrows() {
            assertThatThrownBy(() -> new FixedRateCurrencyConverter(BigDecimal.ZERO))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Exchange rate must be strictly positive");

            assertThatThrownBy(() -> new FixedRateCurrencyConverter(new BigDecimal("-300.00")))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
