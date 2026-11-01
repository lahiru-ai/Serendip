package com.serendip.marketplace.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Represents a single product and quantity within a shopping cart.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps cart line items to the 'cart_items' relational database table.
@Entity
@Table(name = "cart_items")
public class CartItem {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented unique identifier for the cart item.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Links item to parent shopping cart via mandatory 'cart_id' foreign key.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private ShoppingCart cart;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: References selected product via mandatory 'product_id' foreign key.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    protected CartItem() {
    }

    public CartItem(ShoppingCart cart, Product product, int quantity) {
        this.cart = Objects.requireNonNull(cart, "Cart cannot be null.");
        this.product = Objects.requireNonNull(product, "Product cannot be null.");
        setQuantity(quantity);
        this.unitPrice = product.getPrice();
    }

    /** Calculates the total price for this cart item based on quantity. */
    public BigDecimal getSubtotal() {
        return this.unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public void increaseQuantity(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Increase amount must be positive.");
        }
        this.quantity += amount;
    }

    public void decreaseQuantity(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Decrease amount must be positive.");
        }
        if (this.quantity - amount <= 0) {
            throw new IllegalArgumentException("Quantity cannot be decreased below 1; use remove instead.");
        }
        this.quantity -= amount;
    }

    public void changeQuantity(int quantity) {
        setQuantity(quantity);
    }

    public void setQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be strictly positive.");
        }
        this.quantity = quantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ShoppingCart getCart() {
        return cart;
    }

    public Product getProduct() {
        return product;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
}
