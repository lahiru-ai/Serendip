package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.AccountStatus;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.enums.UserRole;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InvalidOrderStateException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Entity Unit Tests")
class EntityUnitTests {

    private Seller seller;
    private Buyer buyer;
    private Product product;

    @BeforeEach
    void setUp() {
        seller = new Seller("Kamal Silva", "kamal@seller.lk", "hash_kamal", "+94771234567",
                "Ceylon Spices", "Kandy", new BigDecimal("10.00"));
        buyer = new Buyer("John Doe", "john@buyer.com", "hash_john", "+12025550100",
                "456 Elm St, NY, USA");
        product = new Product("Cardamom", "Spices", "Whole green cardamom",
                new BigDecimal("6000.00"), "LKR", 20, seller, 100);
        seller.addProduct(product);
    }

    @Nested
    @DisplayName("User Entity Tests")
    class UserEntityTests {

        @Test
        @DisplayName("User lifecycle supports active, suspended, and locked states")
        void userLifecycle() {
            assertThat(buyer.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);

            buyer.lock();
            assertThat(buyer.getAccountStatus()).isEqualTo(AccountStatus.LOCKED);
            assertThat(buyer.isLoggedIn()).isFalse();

            assertThatThrownBy(buyer::login)
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("LOCKED");

            buyer.activate();
            buyer.login();
            assertThat(buyer.isLoggedIn()).isTrue();

            buyer.logout();
            assertThat(buyer.isLoggedIn()).isFalse();
        }

        @Test
        @DisplayName("Password update and field setters validate invariants")
        void userFieldValidation() {
            buyer.updatePassword("new_hash_123");
            assertThat(buyer.checkPassword("new_hash_123")).isTrue();

            buyer.setName("Johnathan Doe");
            assertThat(buyer.getFullName()).isEqualTo("Johnathan Doe");

            buyer.setPhoneNumber("+12025559999");
            assertThat(buyer.getPhoneNumber()).isEqualTo("+12025559999");

            assertThatThrownBy(() -> buyer.updatePassword("   "))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Product Entity Tests")
    class ProductEntityTests {

        @Test
        @DisplayName("Category, description, and weight validation behave correctly")
        void productAttributes() {
            product.setCategory("Organic Spices");
            assertThat(product.getCategory()).isEqualTo("Organic Spices");

            product.setDescription("Premium export grade");
            assertThat(product.getDescription()).isEqualTo("Premium export grade");

            product.setWeightGrams(250);
            assertThat(product.getWeightGrams()).isEqualTo(250);

            assertThatThrownBy(() -> product.setWeightGrams(0))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Product stock zero automatically deactivates product")
        void autoDeactivationOnZeroStock() {
            product.decreaseStock(20);
            assertThat(product.getStockQuantity()).isEqualTo(0);
            assertThat(product.isActive()).isFalse();
            assertThat(product.isAvailable(1)).isFalse();
        }
    }

    @Nested
    @DisplayName("CartItem & ShoppingCart Tests")
    class CartTests {

        @Test
        @DisplayName("CartItem quantity modification enforces minimum boundary of 1")
        void cartItemQuantityModifications() {
            ShoppingCart cart = buyer.viewCart();
            CartItem item = new CartItem(cart, product, 3);

            item.increaseQuantity(2);
            assertThat(item.getQuantity()).isEqualTo(5);

            item.decreaseQuantity(2);
            assertThat(item.getQuantity()).isEqualTo(3);

            // Decreasing to 0 or below throws exception
            assertThatThrownBy(() -> item.decreaseQuantity(3))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("cannot be decreased below 1");
        }

        @Test
        @DisplayName("ShoppingCart item count and clearing operate properly")
        void cartItemCountAndClear() {
            ShoppingCart cart = buyer.viewCart();
            cart.addItem(product, 2);
            assertThat(cart.getTotalItemCount()).isEqualTo(2);
            assertThat(cart.isEmpty()).isFalse();

            cart.clear();
            assertThat(cart.isEmpty()).isTrue();
            assertThat(cart.getTotalItemCount()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("SellerOrder & OrderItem Tests")
    class OrderEntityTests {

        @Test
        @DisplayName("SellerOrder delivery transition succeeds only from SHIPPED state")
        void orderDeliveryTransition() {
            Order parentOrder = new Order("ORD-999", buyer, "Address", "MOCK");
            SellerOrder subOrder = new SellerOrder(parentOrder, seller, new BigDecimal("15.00"));
            subOrder.addItem(product, 1);
            parentOrder.addSellerOrder(subOrder);

            subOrder.markPaid();
            subOrder.markProcessing();
            subOrder.markShipped("DHL Express", "DHL123456");

            assertThat(subOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
            assertThat(subOrder.getCarrier()).isEqualTo("DHL Express");
            assertThat(subOrder.getTrackingNumber()).isEqualTo("DHL123456");

            subOrder.markDelivered();
            assertThat(subOrder.getStatus()).isEqualTo(OrderStatus.DELIVERED);

            // Subsequent cancellation of delivered order is illegal
            assertThatThrownBy(subOrder::cancel)
                    .isInstanceOf(InvalidOrderStateException.class);
        }

        @Test
        @DisplayName("OrderItem line total and product snapshot immutability")
        void orderItemSnapshot() {
            Order parentOrder = new Order("ORD-999", buyer, "Address", "MOCK");
            SellerOrder subOrder = new SellerOrder(parentOrder, seller, new BigDecimal("15.00"));
            OrderItem item = new OrderItem(subOrder, product, 2);

            assertThat(item.getQuantity()).isEqualTo(2);
            assertThat(item.getProductName()).isEqualTo("Cardamom");
            // Price at purchase was 6,000 LKR / 300 = $20.00 USD
            assertThat(item.getPriceAtPurchase()).isEqualByComparingTo(new BigDecimal("20.00"));
            assertThat(item.getLineTotal()).isEqualByComparingTo(new BigDecimal("40.00"));
        }
    }
}
