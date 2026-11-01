package com.serendip.marketplace.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Represents a customer shopping cart containing selected products and quantities.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps active buyer shopping carts to 'shopping_carts' table.
@Entity
@Table(name = "shopping_carts")
public class ShoppingCart {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the shopping cart.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / One-to-One Foreign Key
    // Purpose: Unique 1:1 foreign key link to the owning buyer customer via 'buyer_id'.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false, unique = true)
    private Buyer buyer;

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Items currently in the cart; automatically cascades persistence and cleans up removed items.
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    public ShoppingCart() {
    }

    public ShoppingCart(Buyer buyer) {
        this.buyer = buyer;
    }

    public void addItem(Product product) {
        addItem(product, 1);
    }

    /** Adds a product and quantity to the cart, combining with existing item if present. */
    public void addItem(Product product, int quantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null.");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be strictly positive.");
        }
        if (!product.isAvailable(quantity)) {
            throw new IllegalArgumentException(
                String.format("Product '%s' does not have %d units available in stock.", product.getName(), quantity));
        }

        for (CartItem item : items) {
            if (Objects.equals(item.getProduct(), product)) {
                item.increaseQuantity(quantity);
                return;
            }
        }
        items.add(new CartItem(this, product, quantity));
    }

    /** Updates the quantity of a product in the cart, removing if zero or negative. */
    public void updateQuantity(Product product, int newQuantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null.");
        }
        if (newQuantity <= 0) {
            removeItem(product);
            return;
        }
        for (CartItem item : items) {
            if (Objects.equals(item.getProduct(), product)) {
                item.setQuantity(newQuantity);
                return;
            }
        }
        addItem(product, newQuantity);
    }

    /** Removes a product from the shopping cart. */
    public void removeItem(Product product) {
        if (product == null) {
            return;
        }
        items.removeIf(item -> Objects.equals(item.getProduct(), product));
    }

    /** Removes a product by ID from the shopping cart. */
    public void removeItem(Long productId) {
        if (productId == null) {
            return;
        }
        items.removeIf(item -> Objects.equals(item.getProduct().getId(), productId));
    }

    /** Clears all items from the shopping cart. */
    public void clear() {
        items.clear();
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    /** Calculates the subtotal price of all items in the shopping cart. */
    public BigDecimal getTotal() {
        return items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateSubtotal() {
        return getTotal();
    }

    public int getTotalItemCount() {
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Buyer getBuyer() {
        return buyer;
    }

    public void setBuyer(Buyer buyer) {
        this.buyer = buyer;
    }

    public List<CartItem> getItems() {
        return Collections.unmodifiableList(items);
    }
}
