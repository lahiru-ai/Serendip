package com.serendip.marketplace.enums;

import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InsufficientStockException;
import com.serendip.marketplace.exception.InvalidOrderStateException;
import com.serendip.marketplace.exception.InvalidRatingException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EnumsAndExceptionsTest {

    @Test
    @DisplayName("UserRole enum contains BUYER, SELLER, and ADMIN")
    void userRoleEnumValues() {
        assertThat(UserRole.values()).containsExactlyInAnyOrder(
                UserRole.BUYER, UserRole.SELLER, UserRole.ADMIN
        );
    }

    @Test
    @DisplayName("AccountStatus enum contains expected lifecycle states")
    void accountStatusEnumValues() {
        assertThat(AccountStatus.values()).contains(
                AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.LOCKED
        );
    }

    @Test
    @DisplayName("OrderStatus validates permitted state transitions")
    void orderStatusTransitions() {
        assertThat(OrderStatus.PENDING_PAYMENT.canTransitionTo(OrderStatus.PAYMENT_CONFIRMED)).isTrue();
        assertThat(OrderStatus.PENDING_PAYMENT.canTransitionTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.PENDING_PAYMENT.canTransitionTo(OrderStatus.DELIVERED)).isFalse();

        assertThat(OrderStatus.PAYMENT_CONFIRMED.canTransitionTo(OrderStatus.PROCESSING)).isTrue();
        assertThat(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.SHIPPED)).isTrue();
        assertThat(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED)).isTrue();
        assertThat(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.COMPLETED)).isTrue();

        assertThat(OrderStatus.COMPLETED.canTransitionTo(OrderStatus.CANCELLED)).isFalse();
        assertThat(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.PROCESSING)).isFalse();
    }

    @Test
    @DisplayName("Exceptions inherit from BusinessRuleException and preserve messages")
    void exceptionHierarchy() {
        InvalidRatingException ratingException = new InvalidRatingException("Rating 6 is invalid");
        assertThat(ratingException).isInstanceOf(BusinessRuleException.class);
        assertThat(ratingException.getMessage()).isEqualTo("Rating 6 is invalid");

        InsufficientStockException stockException = new InsufficientStockException("Out of stock");
        assertThat(stockException).isInstanceOf(BusinessRuleException.class);

        InvalidOrderStateException stateException = new InvalidOrderStateException("Cannot ship");
        assertThat(stateException).isInstanceOf(BusinessRuleException.class);
    }
}
