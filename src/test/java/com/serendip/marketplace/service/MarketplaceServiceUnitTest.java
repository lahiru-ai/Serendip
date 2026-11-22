package com.serendip.marketplace.service;

import com.serendip.marketplace.dto.product.ProductUpdateRequest;
import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.exception.InvalidRatingException;
import com.serendip.marketplace.exception.ResourceNotFoundException;
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
    @DisplayName("ProductService: updates existing product details and category")
    void testUpdateProduct() {
        Seller seller = new Seller("Seller One", "s1@mail.com", "pass", "Colombo Craft");
        seller.setId(1L);
        Product product = new Product("Original Name", "Tea", new BigDecimal("10.00"), 5, seller, 100);
        product.setId(200L);

        when(productRepository.findByIdWithSeller(200L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductUpdateRequest updateRequest = new ProductUpdateRequest(
                "Updated Name", "Custom Category", "Detailed description",
                new BigDecimal("20.00"), null, 10, 250, "https://example.com/item.png", true
        );

        Product updated = productService.updateProduct(200L, updateRequest);

        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getCategory()).isEqualTo("Custom Category");
        assertThat(updated.getDescription()).isEqualTo("Detailed description");
        assertThat(updated.getPrice()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(updated.getStockQuantity()).isEqualTo(10);
        assertThat(updated.getWeightGrams()).isEqualTo(250);
        assertThat(updated.getImageUrl()).isEqualTo("https://example.com/item.png");
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("ProductService: getAllCategories returns merged distinct categories")
    void testGetAllCategories() {
        when(productRepository.findDistinctCategories()).thenReturn(java.util.List.of("Ayurveda", "Tea", "Batik"));

        java.util.List<String> categories = productService.getAllCategories();

        assertThat(categories).contains("Tea", "Gems", "Spices", "Crafts", "Apparel", "Ayurveda", "Batik");
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
