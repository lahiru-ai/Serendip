package com.serendip.marketplace.dto.user;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SellerRegistrationRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 150, message = "Full name must not exceed 150 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 150, message = "Email must not exceed 150 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must have at least 6 characters")
        String password,

        String phoneNumber,

        @NotBlank(message = "Shop name is required")
        @Size(max = 150, message = "Shop name must not exceed 150 characters")
        String shopName,

        String originCity,

        @DecimalMin(value = "0.00", message = "Commission rate cannot be negative")
        BigDecimal commissionRate
) {}
