package com.serendip.marketplace.service;

import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.enums.PaymentStatus;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InvalidRatingException;
import com.serendip.marketplace.payment.MockPaymentMethod;
import com.serendip.marketplace.payment.PaymentMethod;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({UserService.class, ProductService.class, CartService.class, OrderService.class, ReviewService.class})
@DisplayName("SERENDIP Service Layer Integration Tests")
class MarketplaceServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ReviewService reviewService;

    @Test
    @DisplayName("User service registers buyer and seller, and prevents duplicate emails")
    void testUserManagementService() {
        Buyer buyer = userService.registerBuyer(
                "Nimal Perera", "nimal@example.com", "hashPass", "+94771112233", "Kandy, Sri Lanka"
        );
        assertThat(buyer.getId()).isNotNull();
        assertThat(buyer.getEmail()).isEqualTo("nimal@example.com");

        Seller seller = userService.registerSeller(
                "Anura Silva", "anura@example.com", "hashPass", "+94774445566",
                "Ceylon Gems", "Ratnapura", new BigDecimal("12.00")
        );
        assertThat(seller.getId()).isNotNull();
        assertThat(seller.getShopName()).isEqualTo("Ceylon Gems");

        // Duplicate email rejection
        assertThatThrownBy(() -> userService.registerBuyer(
                "Another User", "nimal@example.com", "pass", null, null))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already exists");

        // Duplicate shop name rejection
        assertThatThrownBy(() -> userService.registerSeller(
                "Second Seller", "other@example.com", "pass", null,
                "Ceylon Gems", "Colombo", new BigDecimal("10.00")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    @DisplayName("Product service manages seller catalog, dual currencies, and stock updates")
    void testProductManagementService() {
        Seller seller = userService.registerSeller(
                "Tea Master", "tea@example.com", "pass", null,
                "Pure Ceylon Tea", "Nuwara Eliya", new BigDecimal("10.00")
        );

        // Add product in USD
        Product tea = productService.addProduct(
                seller.getId(), "Single Origin BOPF", "Tea", "High-grown Ceylon tea",
                new BigDecimal("18.00"), 50, 250
        );
        assertThat(tea.getId()).isNotNull();
        assertThat(tea.getPrice()).isEqualByComparingTo("18.00");
        assertThat(tea.getStockQuantity()).isEqualTo(50);

        // Add product in LKR (auto-converts to USD)
        Product spices = productService.addProductInLkr(
                seller.getId(), "Black Pepper", "Spices", "Export grade peppercorns",
                new BigDecimal("3000.00"), 30, 100
        );
        assertThat(spices.getPriceInLkr()).isEqualByComparingTo("3000.00");
        assertThat(spices.getPrice()).isEqualByComparingTo("10.00"); // 3000 / 300

        // Stock replenishment
        productService.replenishStock(tea.getId(), 20);
        assertThat(productService.getProductById(tea.getId()).getStockQuantity()).isEqualTo(70);

        // Price update
        productService.updatePrice(tea.getId(), new BigDecimal("19.50"));
        assertThat(productService.getProductById(tea.getId()).getPrice()).isEqualByComparingTo("19.50");
    }

    @Test
    @DisplayName("Shopping cart service adds items, updates quantities, and removes items")
    void testCartService() {
        Buyer buyer = userService.registerBuyer("Cart Buyer", "cartbuyer@example.com", "p", null, "Galle");
        Seller seller = userService.registerSeller("Handicrafts", "craft@example.com", "p", null, "Lanka Crafts", "Kandy", new BigDecimal("10.00"));
        Product mask = productService.addProduct(seller.getId(), "Traditional Mask", "Crafts", "Hand-carved", new BigDecimal("45.00"), 10, 500);

        ShoppingCart cart = cartService.addToCart(buyer.getId(), mask.getId(), 2);
        assertThat(cart.getTotalItemCount()).isEqualTo(2);
        assertThat(cart.getTotal()).isEqualByComparingTo("90.00");

        cartService.updateItemQuantity(buyer.getId(), mask.getId(), 5);
        assertThat(cartService.getCartForBuyer(buyer.getId()).getTotalItemCount()).isEqualTo(5);

        cartService.removeItem(buyer.getId(), mask.getId());
        assertThat(cartService.getCartForBuyer(buyer.getId()).isEmpty()).isTrue();
    }

    @Test
    @DisplayName("Order and checkout service orchestrates multi-vendor checkout, payment, stock decrement, and cancellation")
    void testOrderAndCheckoutService() {
        Buyer buyer = userService.registerBuyer("Checkout Buyer", "checkoutbuyer@example.com", "p", null, "Colombo");

        Seller seller1 = userService.registerSeller("Seller 1", "s1@example.com", "p", null, "Spice House", "Matale", new BigDecimal("10.00"));
        Seller seller2 = userService.registerSeller("Seller 2", "s2@example.com", "p", null, "Batik Studio", "Galle", new BigDecimal("15.00"));

        Product cinnamon = productService.addProduct(seller1.getId(), "Cinnamon Sticks", "Spices", "", new BigDecimal("20.00"), 50, 100);
        Product shirt = productService.addProduct(seller2.getId(), "Batik Shirt", "Clothing", "", new BigDecimal("30.00"), 20, 200);

        cartService.addToCart(buyer.getId(), cinnamon.getId(), 2); // 40.00
        cartService.addToCart(buyer.getId(), shirt.getId(), 1);    // 30.00

        PaymentMethod paymentMethod = new MockPaymentMethod(true);
        Order completedOrder = orderService.checkout(buyer.getId(), paymentMethod);

        assertThat(completedOrder.getId()).isNotNull();
        assertThat(completedOrder.getStatus()).isEqualTo(OrderStatus.PAYMENT_CONFIRMED);
        assertThat(completedOrder.getSellerOrders()).hasSize(2); // 2 distinct sellers

        // Verify stock deducted in DB
        assertThat(productService.getProductById(cinnamon.getId()).getStockQuantity()).isEqualTo(48);
        assertThat(productService.getProductById(shirt.getId()).getStockQuantity()).isEqualTo(19);

        // Verify cart cleared
        assertThat(cartService.getCartForBuyer(buyer.getId()).isEmpty()).isTrue();

        // Verify payment record persisted
        assertThat(completedOrder.getPayment()).isNotNull();
        assertThat(completedOrder.getPayment().getStatus()).isEqualTo(PaymentStatus.COMPLETED);

        // Fulfill one sub-order
        SellerOrder subOrder1 = completedOrder.getSellerOrders().get(0);
        SellerOrder fulfilled = orderService.fulfillSellerOrder(subOrder1.getId(), "DHL Express", "DHL-987654");
        assertThat(fulfilled.getStatus()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(fulfilled.getTrackingNumber()).isEqualTo("DHL-987654");
    }

    @Test
    @DisplayName("Failed checkout rolls back inventory and rejects order")
    void testFailedCheckoutRollsBackInventory() {
        Buyer buyer = userService.registerBuyer("Fail Buyer", "failbuyer@example.com", "p", null, "Jaffna");
        Seller seller = userService.registerSeller("Seller F", "sf@example.com", "p", null, "Cashew Farm", "Batticaloa", new BigDecimal("10.00"));
        Product cashew = productService.addProduct(seller.getId(), "Roasted Cashew", "Food", "", new BigDecimal("15.00"), 25, 200);

        cartService.addToCart(buyer.getId(), cashew.getId(), 5);

        PaymentMethod failingPayment = new MockPaymentMethod(false, "Insufficient balance");

        assertThatThrownBy(() -> orderService.checkout(buyer.getId(), failingPayment))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Payment authorization failed");

        // Verify inventory was restored
        assertThat(productService.getProductById(cashew.getId()).getStockQuantity()).isEqualTo(25);
    }

    @Test
    @DisplayName("Review service enforces verified purchase, valid rating range, and duplicate prevention")
    void testReviewService() {
        Buyer buyer = userService.registerBuyer("Reviewer", "reviewer@example.com", "p", null, "Negombo");
        Seller seller = userService.registerSeller("Pottery Seller", "potter@example.com", "p", null, "Kelaniya Clay", "Kelaniya", new BigDecimal("10.00"));
        Product vase = productService.addProduct(seller.getId(), "Clay Vase", "Home", "", new BigDecimal("25.00"), 10, 800);

        cartService.addToCart(buyer.getId(), vase.getId(), 1);
        Order order = orderService.checkout(buyer.getId(), new MockPaymentMethod(true));

        OrderItem purchasedItem = order.getSellerOrders().get(0).getItems().get(0);

        // Valid 5-star review
        Review review = reviewService.addReview(buyer.getId(), purchasedItem.getId(), 5, "Exquisite craftsmanship!");
        assertThat(review.getId()).isNotNull();
        assertThat(review.getRating()).isEqualTo(5);
        assertThat(review.getComment()).isEqualTo("Exquisite craftsmanship!");

        // Duplicate review rejection
        assertThatThrownBy(() -> reviewService.addReview(buyer.getId(), purchasedItem.getId(), 4, "Duplicate review"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already reviewed");

        // Invalid rating rejection
        assertThatThrownBy(() -> reviewService.addReview(buyer.getId(), purchasedItem.getId(), 6, "Too high"))
                .isInstanceOf(InvalidRatingException.class);

        // Retrieve reviews
        List<Review> productReviews = reviewService.getReviewsForProduct(vase.getId());
        assertThat(productReviews).hasSize(1);
        assertThat(productReviews.get(0).getComment()).isEqualTo("Exquisite craftsmanship!");
    }
}
