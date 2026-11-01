package com.serendip.marketplace.controller;

import com.serendip.marketplace.dto.auth.AuthResponse;
import com.serendip.marketplace.dto.auth.LoginRequest;
import com.serendip.marketplace.dto.user.BuyerRegistrationRequest;
import com.serendip.marketplace.dto.user.SellerRegistrationRequest;
import com.serendip.marketplace.dto.user.UserResponse;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.User;
import com.serendip.marketplace.security.CustomUserPrincipal;
import com.serendip.marketplace.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user login and account registration endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
    }

    /** Authenticates a user and returns their profile details and role. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        User user = userService.getUserById(principal.getId());

        AuthResponse response = new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                "Authentication successful"
        );
        return ResponseEntity.ok(response);
    }

    /** Registers a new buyer account. */
    @PostMapping("/register/buyer")
    public ResponseEntity<UserResponse> registerBuyer(@Valid @RequestBody BuyerRegistrationRequest request) {
        Buyer buyer = userService.registerBuyer(
                request.fullName(),
                request.email(),
                request.password(),
                request.phoneNumber(),
                request.deliveryAddress()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromEntity(buyer));
    }

    /** Registers a new seller account. */
    @PostMapping("/register/seller")
    public ResponseEntity<UserResponse> registerSeller(@Valid @RequestBody SellerRegistrationRequest request) {
        Seller seller = userService.registerSeller(
                request.fullName(),
                request.email(),
                request.password(),
                request.phoneNumber(),
                request.shopName(),
                request.originCity(),
                request.commissionRate()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromEntity(seller));
    }
}
