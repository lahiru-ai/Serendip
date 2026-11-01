package com.serendip.marketplace.controller;

import com.serendip.marketplace.dto.user.BuyerRegistrationRequest;
import com.serendip.marketplace.dto.user.SellerRegistrationRequest;
import com.serendip.marketplace.dto.user.UpdateCommissionRequest;
import com.serendip.marketplace.dto.user.UserResponse;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.User;
import com.serendip.marketplace.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for user registration, profile retrieval, and account status updates.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Registers a new buyer account. */
    @PostMapping("/buyers")
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
    @PostMapping("/sellers")
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

    /** Retrieves user profile information by ID. */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    /** Activates a user account. */
    @PutMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activateUser(@PathVariable Long id) {
        User user = userService.activateUser(id);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    /** Suspends a user account. */
    @PutMapping("/{id}/suspend")
    public ResponseEntity<UserResponse> suspendUser(@PathVariable Long id) {
        User user = userService.suspendUser(id);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    /** Updates a seller's platform commission rate (admin only). */
    @PutMapping("/sellers/{id}/commission")
    public ResponseEntity<UserResponse> updateSellerCommissionRate(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommissionRequest request) {
        Seller seller = userService.updateSellerCommissionRate(id, request.commissionRate());
        return ResponseEntity.ok(UserResponse.fromEntity(seller));
    }
}
