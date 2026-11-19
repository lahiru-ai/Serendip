package com.serendip.marketplace.dto.product;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for updating or uploading a product's image (Base64 data URI or image URL).
 */
public record ProductImageUpdateRequest(
        @NotBlank(message = "Image URL or data URI is required")
        String imageUrl
) {}
