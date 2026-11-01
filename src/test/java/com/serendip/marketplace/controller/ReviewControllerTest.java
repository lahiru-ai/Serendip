package com.serendip.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.review.ReviewCreateRequest;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.OrderItem;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Review;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.service.ReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("Customer Review REST Controller Endpoints")
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReviewService reviewService;

    @Test
    @DisplayName("POST /api/v1/reviews - successfully submits customer review")
    void addReviewSuccess() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Seller seller = new Seller("Seller", "s@mail.com", "p", "Shop");
        Product product = new Product("Tea", new BigDecimal("10.00"), 50, seller);
        product.setId(20L);

        Review review = new Review(buyer, product, 5, "Outstanding quality!");
        review.setId(100L);

        when(reviewService.addReview(eq(1L), eq(55L), eq(5), anyString())).thenReturn(review);

        ReviewCreateRequest request = new ReviewCreateRequest(1L, 55L, 5, "Outstanding quality!");

        mockMvc.perform(post("/api/v1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Outstanding quality!"));
    }

    @Test
    @DisplayName("POST /api/v1/reviews - validation error when rating exceeds 5")
    void addReviewValidationFailure() throws Exception {
        ReviewCreateRequest request = new ReviewCreateRequest(1L, 55L, 6, "Exceeds max");

        mockMvc.perform(post("/api/v1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("GET /api/v1/reviews/product/{productId} - returns reviews for product")
    void getReviewsForProduct() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Seller seller = new Seller("Seller", "s@mail.com", "p", "Shop");
        Product product = new Product("Tea", new BigDecimal("10.00"), 50, seller);
        product.setId(20L);

        Review review = new Review(buyer, product, 4, "Good tea.");
        review.setId(101L);

        when(reviewService.getReviewsForProduct(20L)).thenReturn(List.of(review));

        mockMvc.perform(get("/api/v1/reviews/product/20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].rating").value(4));
    }

    @Test
    @DisplayName("GET /api/v1/reviews/buyer/{buyerId} - returns reviews written by buyer")
    void getReviewsForBuyer() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Seller seller = new Seller("Seller", "s@mail.com", "p", "Shop");
        Product product = new Product("Tea", new BigDecimal("10.00"), 50, seller);
        product.setId(20L);

        Review review = new Review(buyer, product, 4, "Good tea.");
        review.setId(101L);

        when(reviewService.getReviewsForBuyer(1L)).thenReturn(List.of(review));

        mockMvc.perform(get("/api/v1/reviews/buyer/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101));
    }
}
