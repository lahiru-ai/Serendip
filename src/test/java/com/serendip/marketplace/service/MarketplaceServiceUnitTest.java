package com.serendip.marketplace.service;

import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.enums.PaymentStatus;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InvalidRatingException;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.payment.MockPaymentMethod;
import com.serendip.marketplace.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("Service Layer Mock Unit Tests")
class MarketplaceServiceUnitTest {

    private UserRepository userRepository;
    private BuyerRepository buyerRepository;
    private SellerRepository sellerRepository;
    private ProductRepository productRepository;
    private ShoppingCartRepository shoppingCartRepository;
    private OrderRepository orderRepository;
    private SellerOrderRepository sellerOrderRepository;
    private OrderItemRepository orderItemRepository;
    private PaymentRepository paymentRepository;
    private ReviewRepository reviewRepository;

    private UserService userService;
    private ProductService productService;
    private CartService cartService;
    private OrderService orderService;
    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        buyerRepository = mock(BuyerRepository.class);
        sellerRepository = mock(SellerRepository.class);
        productRepository = mock(ProductRepository.class);
        shoppingCartRepository = mock(ShoppingCartRepository.class);
        orderRepository = mock(OrderRepository.class);
        sellerOrderRepository = mock(SellerOrderRepository.class);
        orderItemRepository = mock(OrderItemRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        reviewRepository = mock(ReviewRepository.class);

        userService = new UserService(userRepository, buyerRepository, sellerRepository);
        productService = new ProductService(productRepository, sellerRepository);
        cartService = new CartService(buyerRepository, productRepository, shoppingCartRepository);
        orderService = new OrderService(orderRepository, buyerRepository, productRepository, shoppingCartRepository, sellerOrderRepository, paymentRepository);
        reviewService = new ReviewService(reviewRepository, buyerRepository, productRepository, orderItemRepository);
    }

    @Test
    @DisplayName("UserService: rejects non-existent user with ResourceNotFoundException")
    void testUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User with id 999 not found");
    }

    @Test
    @DisplayName("ProductService: adds product and saves via repository")
    void testAddProduct() {
        Seller seller = new Seller("Seller One", "s1@mail.com", "pass", "Colombo Craft");
        when(sellerRepository.findById(1L)).thenReturn(Optional.of(seller));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product product = productService.addProduct(1L, "Handmade Rug", "Crafts", "Handwoven",
                new BigDecimal("60.00"), 15, 1000);

        assertThat(product.getName()).isEqualTo("Handmade Rug");
        assertThat(product.getSeller()).isEqualTo(seller);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("CartService: clear cart calls shoppingCartRepository.save")
    void testClearCart() {
        Buyer buyer = new Buyer("Test Buyer", "tb@mail.com", "pass");
        when(buyerRepository.findById(10L)).thenReturn(Optional.of(buyer));
        when(shoppingCartRepository.save(any(ShoppingCart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        cartService.clearCart(10L);

        verify(shoppingCartRepository).save(buyer.getCart());
    }

    @Test
    @DisplayName("ReviewService: rejects ratings outside 1-5 upfront")
    void testReviewInvalidRating() {
        assertThatThrownBy(() -> reviewService.addReview(1L, 2L, 0, "Bad"))
                .isInstanceOf(InvalidRatingException.class);

        assertThatThrownBy(() -> reviewService.addReview(1L, 2L, 6, "Exceeds max"))
                .isInstanceOf(InvalidRatingException.class);

        verifyNoInteractions(reviewRepository);
    }
}
