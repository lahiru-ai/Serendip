package com.serendip.marketplace.controller;

import com.serendip.marketplace.dto.review.ReviewCreateRequest;
import com.serendip.marketplace.dto.review.ReviewResponse;
import com.serendip.marketplace.entity.Review;
import com.serendip.marketplace.security.SecurityUtils;
import com.serendip.marketplace.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for customer review and rating endpoints.
 */
@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** Submits a review and star rating for a purchased item or product. */
    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(@Valid @RequestBody ReviewCreateRequest request) {
        if (request.orderItemId() == null && request.productId() == null) {
            throw new IllegalArgumentException("Either product ID or order item ID must be provided.");
        }
        Long effectiveBuyerId = request.buyerId() != null ? request.buyerId() : SecurityUtils.getCurrentUserId();
        if (effectiveBuyerId == null) {
            throw new IllegalArgumentException("Buyer ID is required. Please ensure you are logged in.");
        }

        Review review = (request.productId() != null && request.orderItemId() == null)
                ? reviewService.addReviewForProduct(effectiveBuyerId, request.productId(), request.rating(), request.comment())
                : reviewService.addReview(effectiveBuyerId, request.orderItemId(), request.rating(), request.comment());
        return ResponseEntity.status(HttpStatus.CREATED).body(ReviewResponse.fromEntity(review));
    }

    /** Retrieves all customer reviews for a given product. */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForProduct(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsForProduct(productId);
        List<ReviewResponse> responses = reviews.stream()
                .map(ReviewResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /** Retrieves all reviews submitted by a specific buyer. */
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForBuyer(@PathVariable Long buyerId) {
        List<Review> reviews = reviewService.getReviewsForBuyer(buyerId);
        List<ReviewResponse> responses = reviews.stream()
                .map(ReviewResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }
}
