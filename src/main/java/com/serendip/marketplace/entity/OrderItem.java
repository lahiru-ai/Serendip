package com.serendip.marketplace.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Represents a purchased item in a seller order, preserving its price at checkout.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps purchased line items to 'order_items' table, snapshotting product name and price at checkout time.
@Entity
@Table(name = "order_items")
public class OrderItem {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the order item.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Links line item to owning seller sub-order via 'seller_order_id'.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_order_id", nullable = false)
    private SellerOrder sellerOrder;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: References original catalog product via 'product_id'.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "product_name_at_purchase", nullable = false, length = 180)
    private String productNameAtPurchase;

    @Column(name = "unit_price_at_purchase", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPriceAtPurchase;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItem() {
    }

    public OrderItem(SellerOrder sellerOrder, Product product, int quantity) {
        this.sellerOrder = Objects.requireNonNull(sellerOrder, "Seller order cannot be null.");
        this.product = Objects.requireNonNull(product, "Product cannot be null.");
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be strictly positive.");
        }
        this.quantity = quantity;
        this.productNameAtPurchase = product.getName();
        this.unitPriceAtPurchase = product.getPrice();
        this.lineTotal = this.unitPriceAtPurchase.multiply(BigDecimal.valueOf(quantity));
    }

    /** Returns the total price for this line item. */
    public BigDecimal getSubtotal() {
        return this.lineTotal;
    }

    public BigDecimal getLineTotal() {
        return this.lineTotal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SellerOrder getSellerOrder() {
        return sellerOrder;
    }

    public void setSellerOrder(SellerOrder sellerOrder) {
        this.sellerOrder = sellerOrder;
    }

    public Product getProduct() {
        return product;
    }

    public String getProductNameAtPurchase() {
        return productNameAtPurchase;
    }

    public String getProductName() {
        return productNameAtPurchase;
    }

    public BigDecimal getUnitPriceAtPurchase() {
        return unitPriceAtPurchase;
    }

    public BigDecimal getPriceAtPurchase() {
        return unitPriceAtPurchase;
    }

    public int getQuantity() {
        return quantity;
    }
}
