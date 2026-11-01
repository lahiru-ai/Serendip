package com.serendip.marketplace.dto.auth;

public record AuthResponse(
        Long userId,
        String email,
        String fullName,
        String role,
        String message
) {}
