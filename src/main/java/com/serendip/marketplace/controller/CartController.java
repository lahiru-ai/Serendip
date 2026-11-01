package com.serendip.marketplace.controller;

import com.serendip.marketplace.dto.cart.CartItemAddRequest;
import com.serendip.marketplace.dto.cart.CartItemUpdateRequest;
import com.serendip.marketplace.dto.cart.CartResponse;
import com.serendip.marketplace.entity.ShoppingCart;
import com.serendip.marketplace.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for shopping cart operations.
 */
@RestController
@RequestMapping("/api/v1/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /** Retrieves the active shopping cart for a buyer. */
    @GetMapping("/{buyerId}")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long buyerId) {
        ShoppingCart cart = cartService.getCartForBuyer(buyerId);
        return ResponseEntity.ok(CartResponse.fromEntity(cart));
    }

    /** Adds an item with quantity to the buyer's cart. */
    @PostMapping("/{buyerId}/items")
    public ResponseEntity<CartResponse> addItemToCart(
            @PathVariable Long buyerId,
            @Valid @RequestBody CartItemAddRequest request) {
        ShoppingCart cart = cartService.addToCart(buyerId, request.productId(), request.quantity());
        return ResponseEntity.ok(CartResponse.fromEntity(cart));
    }

    /** Updates the quantity of an item in the buyer's cart. */
    @PutMapping("/{buyerId}/items/{productId}")
    public ResponseEntity<CartResponse> updateItemQuantity(
            @PathVariable Long buyerId,
            @PathVariable Long productId,
            @Valid @RequestBody CartItemUpdateRequest request) {
        ShoppingCart cart = cartService.updateItemQuantity(buyerId, productId, request.quantity());
        return ResponseEntity.ok(CartResponse.fromEntity(cart));
    }

    /** Removes a product from the buyer's cart. */
    @DeleteMapping("/{buyerId}/items/{productId}")
    public ResponseEntity<CartResponse> removeItem(
            @PathVariable Long buyerId,
            @PathVariable Long productId) {
        ShoppingCart cart = cartService.removeItem(buyerId, productId);
        return ResponseEntity.ok(CartResponse.fromEntity(cart));
    }

    /** Clears all items from the buyer's cart. */
    @DeleteMapping("/{buyerId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long buyerId) {
        cartService.clearCart(buyerId);
        return ResponseEntity.noContent().build();
    }
}
