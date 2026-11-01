package com.serendip.marketplace.dto.cart;

import jakarta.validation.constraints.Min;

public record CartItemUpdateRequest(
        @Min(value = 0, message = "Quantity cannot be negative")
        int quantity
) {}
