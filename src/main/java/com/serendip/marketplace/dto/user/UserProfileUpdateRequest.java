package com.serendip.marketplace.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Data transfer object for updating user personal and profile information.
 */
public record UserProfileUpdateRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 150, message = "Full name cannot exceed 150 characters.")
        String fullName,

        @NotBlank(message = "Email address is required.")
        @Email(message = "A valid email address is required.")
        @Size(max = 150, message = "Email cannot exceed 150 characters.")
        String email,

        @Size(max = 30, message = "Phone number cannot exceed 30 characters.")
        String phoneNumber,

        @Size(max = 255, message = "Delivery address cannot exceed 255 characters.")
        String deliveryAddress,

        @Size(max = 150, message = "Shop name cannot exceed 150 characters.")
        String shopName,

        @Size(max = 1000, message = "Shop description cannot exceed 1000 characters.")
        String shopDescription,

        @Size(max = 100, message = "Origin city cannot exceed 100 characters.")
        String originCity,

        @Size(max = 100, message = "Department cannot exceed 100 characters.")
        String department,

        @Size(max = 100, message = "Password cannot exceed 100 characters.")
        String newPassword
) {
}
