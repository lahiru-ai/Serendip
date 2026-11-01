package com.serendip.marketplace.dto.review;

import com.serendip.marketplace.entity.Review;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long buyerId,
        String buyerName,
        Long productId,
        String productName,
        Long orderItemId,
        int rating,
        String comment,
        Instant createdAt
) {
    public static ReviewResponse fromEntity(Review review) {
        Long buyerId = review.getBuyer() != null ? review.getBuyer().getId() : null;
        String buyerName = review.getBuyer() != null ? review.getBuyer().getFullName() : null;
        Long productId = review.getProduct() != null ? review.getProduct().getId() : null;
        String productName = review.getProduct() != null ? review.getProduct().getName() : null;
        Long orderItemId = review.getOrderItem() != null ? review.getOrderItem().getId() : null;

        return new ReviewResponse(
                review.getId(),
                buyerId,
                buyerName,
                productId,
                productName,
                orderItemId,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
