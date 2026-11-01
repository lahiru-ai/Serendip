package com.serendip.marketplace.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ReviewCreateRequest(
        Long buyerId,

        Long productId,

        Long orderItemId,

        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        int rating,

        @Size(max = 2000, message = "Comment must not exceed 2000 characters")
        String comment
) {
    public ReviewCreateRequest(Long buyerId, Long orderItemId, int rating, String comment) {
        this(buyerId, null, orderItemId, rating, comment);
    }
}
