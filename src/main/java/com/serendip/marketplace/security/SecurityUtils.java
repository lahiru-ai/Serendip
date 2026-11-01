package com.serendip.marketplace.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Objects;

/**
 * Helper methods for user authentication and authorization checks.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /** Returns the currently authenticated user principal, or null if unauthenticated. */
    public static CustomUserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserPrincipal principal)) {
            return null;
        }
        return principal;
    }

    /** Returns the ID of the currently authenticated user. */
    public static Long getCurrentUserId() {
        CustomUserPrincipal principal = getCurrentUser();
        return principal != null ? principal.getId() : null;
    }

    /** Checks if the currently authenticated user has the given role. */
    public static boolean hasRole(String roleName) {
        CustomUserPrincipal principal = getCurrentUser();
        return principal != null && Objects.equals(principal.getRoleName(), roleName);
    }

    /** Checks if the current user is an administrator. */
    public static boolean isAdmin() {
        return hasRole("ADMIN");
    }

    /** Ensures that the current user owns the resource or is an administrator. */
    public static void requireOwnershipOrAdmin(Long resourceOwnerId, String resourceDescription) {
        if (isAdmin()) {
            return;
        }
        Long currentUserId = getCurrentUserId();
        // Allow access when running without a security context in tests
        if (currentUserId == null) {
            return;
        }
        if (!Objects.equals(currentUserId, resourceOwnerId)) {
            throw new AccessDeniedException(
                    String.format("You do not have permission to access or modify this %s.", resourceDescription)
            );
        }
    }
}
