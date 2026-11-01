package com.serendip.marketplace.service;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.ShoppingCart;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.repository.BuyerRepository;
import com.serendip.marketplace.repository.ProductRepository;
import com.serendip.marketplace.repository.ShoppingCartRepository;
import com.serendip.marketplace.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Service managing buyer shopping cart operations.
 */
@Service
@Transactional
public class CartService {

    private final BuyerRepository buyerRepository;
    private final ProductRepository productRepository;
    private final ShoppingCartRepository shoppingCartRepository;

    public CartService(BuyerRepository buyerRepository,
                       ProductRepository productRepository,
                       ShoppingCartRepository shoppingCartRepository) {
        this.buyerRepository = Objects.requireNonNull(buyerRepository);
        this.productRepository = Objects.requireNonNull(productRepository);
        this.shoppingCartRepository = Objects.requireNonNull(shoppingCartRepository);
    }

    /** Retrieves the active shopping cart for a buyer. */
    @Transactional(readOnly = true)
    public ShoppingCart getCartForBuyer(Long buyerId) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "shopping cart belonging to another buyer");
        Buyer buyer = getBuyer(buyerId);
        return shoppingCartRepository.findByBuyer(buyer)
                .orElseGet(buyer::getCart);
    }

    /** Adds a product and quantity to the buyer's cart. */
    public ShoppingCart addToCart(Long buyerId, Long productId, int quantity) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "shopping cart belonging to another buyer");
        Buyer buyer = getBuyer(buyerId);
        Product product = getProduct(productId);

        buyer.addToCart(product, quantity);
        return shoppingCartRepository.save(buyer.getCart());
    }

    /** Updates the quantity of a specific item in the buyer's cart. */
    public ShoppingCart updateItemQuantity(Long buyerId, Long productId, int newQuantity) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "shopping cart belonging to another buyer");
        Buyer buyer = getBuyer(buyerId);
        Product product = getProduct(productId);

        buyer.getCart().updateQuantity(product, newQuantity);
        return shoppingCartRepository.save(buyer.getCart());
    }

    /** Removes a specific product from the buyer's cart. */
    public ShoppingCart removeItem(Long buyerId, Long productId) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "shopping cart belonging to another buyer");
        Buyer buyer = getBuyer(buyerId);
        Product product = getProduct(productId);

        buyer.removeFromCart(product);
        return shoppingCartRepository.save(buyer.getCart());
    }

    /** Clears all items from the buyer's cart. */
    public void clearCart(Long buyerId) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "shopping cart belonging to another buyer");
        Buyer buyer = getBuyer(buyerId);
        buyer.clearCart();
        shoppingCartRepository.save(buyer.getCart());
    }

    private Buyer getBuyer(Long buyerId) {
        return buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", buyerId)));
    }

    private Product getProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product with id %d not found.", productId)));
    }
}
