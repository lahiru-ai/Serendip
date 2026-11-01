package com.serendip.marketplace.domain;

import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.enums.AccountStatus;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.enums.UserRole;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InsufficientStockException;
import com.serendip.marketplace.exception.InvalidOrderStateException;
import com.serendip.marketplace.exception.InvalidRatingException;
import com.serendip.marketplace.payment.CurrencyConverter;
import com.serendip.marketplace.payment.FixedRateCurrencyConverter;
import com.serendip.marketplace.payment.MockPaymentMethod;
import com.serendip.marketplace.payment.PaymentMethod;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Authoritative JUnit 5 and AssertJ test suite for SERENDIP's Java OOP Domain Model.
 * Verifies Encapsulation, Inheritance, Polymorphism, Abstraction, and Composition.
 */
class SerendipDomainModelTest {

    private Seller teaSeller;
    private Seller spiceSeller;
    private Buyer buyer;
    private Admin admin;
    private Product ceylonTea;
    private Product ceylonCinnamon;

    @BeforeEach
    void setUp() {
        // Sample sellers from Sri Lanka
        teaSeller = new Seller("Kamal Perera", "kamal@ceylontea.lk", "hash_kamal_123",
                "+94771234567", "Nuwara Eliya Tea Gardens", "Nuwara Eliya", new BigDecimal("10.00"));

        spiceSeller = new Seller("Sunil Silva", "sunil@ceylonspices.lk", "hash_sunil_456",
                "+94777654321", "Ceylon Spice Garden", "Galle", new BigDecimal("12.00"));

        // Buyer and Admin
        buyer = new Buyer("Alice Smith", "alice@example.com", "hash_alice_789",
                "+12025550199", "123 Maple Street, London, UK");

        admin = new Admin("System Admin", "admin@serendip.com", "hash_admin_000",
                "+94112345678", "Marketplace Operations");

        // Catalog Products
        ceylonTea = new Product("Single Estate Ceylon Black Tea", "Tea", "Pure Ceylon BOPF",
                new BigDecimal("25.00"), "USD", 50, teaSeller, 250);
        teaSeller.addProduct(ceylonTea);

        ceylonCinnamon = new Product("Pure Ceylon Alba Cinnamon", "Spices", "True Ceylon Cinnamon",
                new BigDecimal("30.00"), "USD", 40, spiceSeller, 150);
        spiceSeller.addProduct(ceylonCinnamon);
    }

    // =========================================================================
    // 1. User Management & Inheritance Tests
    // =========================================================================
    @Nested
    @DisplayName("1. User Management & Inheritance Tests")
    class UserManagementTests {

        @Test
        @DisplayName("Users are created with valid attributes and correct role polymorphism")
        void userCreationAndRoles() {
            assertThat(buyer.getRole()).isEqualTo(UserRole.BUYER);
            assertThat(teaSeller.getRole()).isEqualTo(UserRole.SELLER);
            assertThat(admin.getRole()).isEqualTo(UserRole.ADMIN);

            assertThat(buyer.getFullName()).isEqualTo("Alice Smith");
            assertThat(buyer.getEmail()).isEqualTo("alice@example.com");
            assertThat(buyer.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
            assertThat(buyer.isLoggedIn()).isFalse();
        }

        @Test
        @DisplayName("Invalid email formats are rejected on user construction")
        void invalidEmailThrowsException() {
            assertThatThrownBy(() -> new Buyer("Bob", "not-an-email", "hash"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("valid email");

            assertThatThrownBy(() -> new Buyer("Bob", "missingatsign.com", "hash"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Blank user names and blank password hashes are rejected")
        void blankNameAndPasswordRejected() {
            assertThatThrownBy(() -> new Buyer("", "bob@example.com", "hash"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Full name is required");

            assertThatThrownBy(() -> new Buyer("Bob", "bob@example.com", "   "))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Password hash is required");
        }

        @Test
        @DisplayName("Passwords are checked securely against hash without exposing plaintext")
        void passwordVerification() {
            assertThat(buyer.checkPassword("hash_alice_789")).isTrue();
            assertThat(buyer.checkPassword("wrong_password")).isFalse();
        }

        @Test
        @DisplayName("Admin can suspend and reactivate user accounts")
        void adminModeration() {
            admin.suspendUser(teaSeller);
            assertThat(teaSeller.getAccountStatus()).isEqualTo(AccountStatus.SUSPENDED);
            assertThat(teaSeller.isLoggedIn()).isFalse();

            // Attempting login on suspended user throws BusinessRuleException
            assertThatThrownBy(teaSeller::login)
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("SUSPENDED");

            admin.activateUser(teaSeller);
            assertThat(teaSeller.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        }

        @Test
        @DisplayName("Admin can configure and update seller commission rates")
        void adminConfiguresSellerCommissionRate() {
            // Admin updates tea seller commission from 10% to 15%
            admin.setSellerCommissionRate(teaSeller, new BigDecimal("15.00"));
            assertThat(teaSeller.getCommissionRate()).isEqualByComparingTo(new BigDecimal("15.00"));

            // Rejects invalid commission rates (> 100% or negative)
            assertThatThrownBy(() -> admin.setSellerCommissionRate(teaSeller, new BigDecimal("-5.00")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("between 0% and 100%");

            assertThatThrownBy(() -> admin.setSellerCommissionRate(teaSeller, new BigDecimal("105.00")))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // =========================================================================
    // 2. Product Management, Pricing in LKR & Currency Conversion
    // =========================================================================
    @Nested
    @DisplayName("2. Product Management, Pricing in LKR & Currency Conversion")
    class ProductManagementTests {

        @Test
        @DisplayName("Sri Lankan Seller adds product price in LKR and international buyer sees it in USD")
        void sellerAddsPriceInLkrAndBuyerSeesInUsd() {
            // Seller sets price in Sri Lankan Rupees (Rs. 7,500.00 LKR)
            Product artisanTea = Product.createInLkr(
                    "Artisan Silver Tips", "Tea", "Hand-plucked Ceylon White Tea",
                    new BigDecimal("7500.00"), 30, teaSeller, 100
            );

            // Seller sees price in LKR
            assertThat(artisanTea.getPriceInLkr()).isEqualByComparingTo(new BigDecimal("7500.00"));

            // International buyer sees price in USD: Rs. 7,500 / 300.00 = $25.00 USD
            assertThat(artisanTea.getPriceInUsd()).isEqualByComparingTo(new BigDecimal("25.00"));
            assertThat(artisanTea.getPrice()).isEqualByComparingTo(new BigDecimal("25.00"));

            // Seller updates price in LKR to Rs. 9,000.00 -> Buyer immediately sees $30.00 USD
            artisanTea.setPriceInLkr(new BigDecimal("9000.00"));
            assertThat(artisanTea.getPriceInLkr()).isEqualByComparingTo(new BigDecimal("9000.00"));
            assertThat(artisanTea.getPriceInUsd()).isEqualByComparingTo(new BigDecimal("30.00"));
        }

        @Test
        @DisplayName("CurrencyConverter strategy converts between LKR and USD with precision")
        void currencyConverterStrategy() {
            CurrencyConverter converter = new FixedRateCurrencyConverter(new BigDecimal("300.00"));

            // Rs. 15,000 LKR -> $50.00 USD
            BigDecimal usd = converter.convertLkrToUsd(new BigDecimal("15000.00"));
            assertThat(usd).isEqualByComparingTo(new BigDecimal("50.00"));

            // $50.00 USD -> Rs. 15,000.00 LKR
            BigDecimal lkr = converter.convertUsdToLkr(new BigDecimal("50.00"));
            assertThat(lkr).isEqualByComparingTo(new BigDecimal("15000.00"));
        }

        @Test
        @DisplayName("Product validates positive price and non-negative initial stock")
        void productPriceAndStockValidation() {
            assertThatThrownBy(() -> new Product("Bad Price", BigDecimal.ZERO, 10, teaSeller))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("positive");

            assertThatThrownBy(() -> new Product("Negative Price", new BigDecimal("-5.00"), 10, teaSeller))
                    .isInstanceOf(IllegalArgumentException.class);

            assertThatThrownBy(() -> new Product("Negative Stock", new BigDecimal("10.00"), -1, teaSeller))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("negative");
        }

        @Test
        @DisplayName("Decreasing stock protects inventory invariant and marks inactive when stock reaches 0")
        void stockDeductionAndDepletion() {
            ceylonTea.decreaseStock(49);
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(1);
            assertThat(ceylonTea.isActive()).isTrue();

            ceylonTea.decreaseStock(1);
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(0);
            assertThat(ceylonTea.isActive()).isFalse();
        }

        @Test
        @DisplayName("Deducting more stock than available throws InsufficientStockException")
        void insufficientStockThrowsException() {
            assertThatThrownBy(() -> ceylonTea.decreaseStock(51))
                    .isInstanceOf(InsufficientStockException.class)
                    .hasMessageContaining("insufficient stock");
        }

        @Test
        @DisplayName("Replenishing stock restores quantity and reactivates product")
        void replenishStockRestoresAvailability() {
            ceylonTea.decreaseStock(50);
            assertThat(ceylonTea.isActive()).isFalse();

            ceylonTea.replenishStock(20);
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(20);
            assertThat(ceylonTea.isActive()).isTrue();
        }

        @Test
        @DisplayName("Updating price to invalid values is rejected")
        void invalidPriceUpdateRejected() {
            assertThatThrownBy(() -> ceylonTea.updatePrice(new BigDecimal("-1.00")))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> ceylonTea.updatePrice(BigDecimal.ZERO))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // =========================================================================
    // 3. Shopping Cart Composition Tests
    // =========================================================================
    @Nested
    @DisplayName("3. Shopping Cart Composition Tests")
    class ShoppingCartTests {

        @Test
        @DisplayName("Adding products calculates subtotals and aggregates identical products without duplication")
        void cartCalculationsAndAggregation() {
            ShoppingCart cart = buyer.viewCart();

            // Add 2 units of tea ($25 x 2 = $50)
            cart.addItem(ceylonTea, 2);
            assertThat(cart.getItems()).hasSize(1);
            assertThat(cart.getTotal()).isEqualByComparingTo(new BigDecimal("50.00"));

            // Add 1 more unit of the same tea -> increases quantity to 3 ($75), does not duplicate line
            cart.addItem(ceylonTea, 1);
            assertThat(cart.getItems()).hasSize(1);
            assertThat(cart.getItems().get(0).getQuantity()).isEqualTo(3);
            assertThat(cart.getTotal()).isEqualByComparingTo(new BigDecimal("75.00"));

            // Add 1 unit of cinnamon ($30)
            cart.addItem(ceylonCinnamon, 1);
            assertThat(cart.getItems()).hasSize(2);
            assertThat(cart.getTotal()).isEqualByComparingTo(new BigDecimal("105.00"));
        }

        @Test
        @DisplayName("Adding zero or negative quantities to cart throws IllegalArgumentException")
        void invalidQuantityThrowsException() {
            ShoppingCart cart = buyer.viewCart();
            assertThatThrownBy(() -> cart.addItem(ceylonTea, 0))
                    .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> cart.addItem(ceylonTea, -2))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Updating quantity and removing items recalculates cart totals accurately")
        void cartItemUpdateAndRemoval() {
            ShoppingCart cart = buyer.viewCart();
            cart.addItem(ceylonTea, 2);      // $50
            cart.addItem(ceylonCinnamon, 2); // $60
            assertThat(cart.getTotal()).isEqualByComparingTo(new BigDecimal("110.00"));

            // Update tea quantity to 1 ($25)
            cart.updateQuantity(ceylonTea, 1);
            assertThat(cart.getTotal()).isEqualByComparingTo(new BigDecimal("85.00"));

            // Remove cinnamon
            cart.removeItem(ceylonCinnamon);
            assertThat(cart.getItems()).hasSize(1);
            assertThat(cart.getTotal()).isEqualByComparingTo(new BigDecimal("25.00"));
        }
    }

    // =========================================================================
    // 4. Order Management & Admin Commission from Sales Tests
    // =========================================================================
    @Nested
    @DisplayName("4. Order Management & Admin Commission Tests")
    class OrderManagementTests {

        @Test
        @DisplayName("Multi-vendor checkout charges Admin commission from each sale and computes seller net payout")
        void multiVendorOrderTotalsAndAdminCommission() {
            buyer.addToCart(ceylonTea, 2);      // Tea Seller: $25 x 2 = $50.00 (Commission: 10% = $5.00)
            buyer.addToCart(ceylonCinnamon, 1); // Spice Seller: $30 x 1 = $30.00 (Commission: 12% = $3.60)

            // Admin configures 12% commission for spice seller
            admin.setSellerCommissionRate(spiceSeller, new BigDecimal("12.00"));

            PaymentMethod payment = new MockPaymentMethod(true);
            Order order = buyer.checkOut(payment);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_CONFIRMED);
            assertThat(order.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("80.00"));
            // Total shipping: 2 sellers * $15 = $30
            assertThat(order.getShippingAmount()).isEqualByComparingTo(new BigDecimal("30.00"));
            assertThat(order.getTotalAmount()).isEqualByComparingTo(new BigDecimal("110.00"));

            // Sub-orders verification
            assertThat(order.getSellerOrders()).hasSize(2);

            SellerOrder teaSubOrder = order.getSellerOrders().stream()
                    .filter(so -> so.getSeller().equals(teaSeller))
                    .findFirst().orElseThrow();

            assertThat(teaSubOrder.getSubtotalAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
            // 10% commission charged by admin on $50.00 = $5.00
            assertThat(teaSubOrder.getCommissionAmount()).isEqualByComparingTo(new BigDecimal("5.00"));
            assertThat(admin.calculateCommission(teaSubOrder)).isEqualByComparingTo(new BigDecimal("5.00"));
            // Net payout to tea seller = $50 (subtotal) + $15 (shipping) - $5 (commission) = $60.00
            assertThat(teaSubOrder.getNetPayoutAmount()).isEqualByComparingTo(new BigDecimal("60.00"));

            SellerOrder spiceSubOrder = order.getSellerOrders().stream()
                    .filter(so -> so.getSeller().equals(spiceSeller))
                    .findFirst().orElseThrow();

            // 12% commission charged by admin on $30.00 = $3.60
            assertThat(spiceSubOrder.getCommissionAmount()).isEqualByComparingTo(new BigDecimal("3.60"));
            assertThat(admin.calculateCommission(spiceSubOrder)).isEqualByComparingTo(new BigDecimal("3.60"));
            // Net payout to spice seller = $30 + $15 - $3.60 = $41.40
            assertThat(spiceSubOrder.getNetPayoutAmount()).isEqualByComparingTo(new BigDecimal("41.40"));

            // Total Admin commission revenue from this order: $5.00 + $3.60 = $8.60
            assertThat(order.getTotalCommissionAmount()).isEqualByComparingTo(new BigDecimal("8.60"));
            assertThat(admin.calculateTotalCommission(order)).isEqualByComparingTo(new BigDecimal("8.60"));
            assertThat(admin.calculateTotalCommission(List.of(order))).isEqualByComparingTo(new BigDecimal("8.60"));
        }

        @Test
        @DisplayName("Order lifecycle transitions enforce state machine invariants")
        void orderStatusTransitions() {
            buyer.addToCart(ceylonTea, 1);
            Order order = buyer.checkOut(new MockPaymentMethod(true));
            SellerOrder subOrder = order.getSellerOrders().get(0);

            subOrder.markProcessing();
            assertThat(subOrder.getStatus()).isEqualTo(OrderStatus.PROCESSING);

            subOrder.markShipped("Sri Lanka Post", "SLP123456789LK");
            assertThat(subOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
            assertThat(subOrder.getTrackingNumber()).isEqualTo("SLP123456789LK");

            // Attempting to cancel already shipped order is illegal
            assertThatThrownBy(subOrder::cancel)
                    .isInstanceOf(InvalidOrderStateException.class)
                    .hasMessageContaining("Cannot cancel sub-order in status 'SHIPPED'");
        }

        @Test
        @DisplayName("Buyer order cancellation restocks inventory")
        void orderCancellationRestocksInventory() {
            buyer.addToCart(ceylonTea, 3);
            Order order = buyer.checkOut(new MockPaymentMethod(true));
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(47); // 50 - 3

            buyer.cancelOrder(order);
            assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(50); // Restored
        }
    }

    // =========================================================================
    // 5. Payment Abstraction & Polymorphism Tests
    // =========================================================================
    @Nested
    @DisplayName("5. Payment Abstraction & Polymorphism Tests")
    class PaymentAbstractionTests {

        @Test
        @DisplayName("Successful mock payment confirms order and clears shopping cart")
        void successfulPaymentClearsCart() {
            buyer.addToCart(ceylonTea, 2);
            PaymentMethod successPayment = new MockPaymentMethod(true);

            Order order = buyer.checkOut(successPayment);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_CONFIRMED);
            assertThat(buyer.viewCart().isEmpty()).isTrue();
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(48);
        }

        @Test
        @DisplayName("Failed mock payment rolls back inventory and rejects checkout")
        void failedPaymentRollsBackInventory() {
            buyer.addToCart(ceylonTea, 5);
            PaymentMethod failingPayment = new MockPaymentMethod(false, "Card declined: insufficient funds");

            assertThatThrownBy(() -> buyer.checkOut(failingPayment))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Payment authorization failed");

            // Inventory is safely rolled back to 50
            assertThat(ceylonTea.getStockQuantity()).isEqualTo(50);
            // Cart remains intact so buyer can retry
            assertThat(buyer.viewCart().getItems()).hasSize(1);
        }
    }

    // =========================================================================
    // 6. Customer Review Verification Tests
    // =========================================================================
    @Nested
    @DisplayName("6. Customer Review Verification Tests")
    class CustomerReviewTests {

        @Test
        @DisplayName("Valid rating (1-5) on a verified purchased item creates a review")
        void validReviewCreation() {
            buyer.addToCart(ceylonTea, 1);
            Order order = buyer.checkOut(new MockPaymentMethod(true));
            OrderItem purchasedItem = order.getSellerOrders().get(0).getItems().get(0);

            Review review = buyer.submitReview(purchasedItem, 5, "Exquisite Ceylon single-origin tea! Highly recommended.");

            assertThat(review.getRating()).isEqualTo(5);
            assertThat(review.getComment()).contains("Exquisite");
            assertThat(review.getProduct()).isEqualTo(ceylonTea);
            assertThat(review.getOrderItem()).isEqualTo(purchasedItem);
            assertThat(buyer.getReviews()).contains(review);
        }

        @Test
        @DisplayName("Rating below 1 or above 5 throws InvalidRatingException")
        void invalidRatingsThrowException() {
            buyer.addToCart(ceylonTea, 1);
            Order order = buyer.checkOut(new MockPaymentMethod(true));
            OrderItem purchasedItem = order.getSellerOrders().get(0).getItems().get(0);

            assertThatThrownBy(() -> buyer.submitReview(purchasedItem, 0, "Too low"))
                    .isInstanceOf(InvalidRatingException.class)
                    .hasMessageContaining("must be between 1 and 5");

            assertThatThrownBy(() -> buyer.submitReview(purchasedItem, 6, "Too high"))
                    .isInstanceOf(InvalidRatingException.class)
                    .hasMessageContaining("must be between 1 and 5");
        }

        @Test
        @DisplayName("Duplicate review for the same purchased item is rejected")
        void duplicateReviewRejected() {
            buyer.addToCart(ceylonTea, 1);
            Order order = buyer.checkOut(new MockPaymentMethod(true));
            OrderItem purchasedItem = order.getSellerOrders().get(0).getItems().get(0);

            buyer.submitReview(purchasedItem, 4, "First review");

            assertThatThrownBy(() -> buyer.submitReview(purchasedItem, 5, "Second review"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("already reviewed");
        }

        @Test
        @DisplayName("Review verification prevents review on unconfirmed orders or orders of other customers")
        void reviewVerificationGuards() {
            buyer.addToCart(ceylonTea, 1);
            Order order = buyer.checkOut(new MockPaymentMethod(true));
            OrderItem purchasedItem = order.getSellerOrders().get(0).getItems().get(0);

            // Another buyer attempts to review Alice's purchased item
            Buyer otherBuyer = new Buyer("Charlie", "charlie@example.com", "hash_charlie");
            assertThatThrownBy(() -> otherBuyer.submitReview(purchasedItem, 5, "Not my order"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Cannot review a purchase made by another customer");
        }
    }
}
