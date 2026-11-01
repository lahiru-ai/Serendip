package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.UserRole;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Represents a seller who lists products and manages sub-orders on the marketplace.
 */
// Language: Jakarta Persistence (JPA) / Subclass Table Mapping
// Purpose: Maps the 'Seller' subclass to 'sellers' table joined on 'user_id' with discriminator value 'SELLER'.
@Entity
@Table(name = "sellers")
@DiscriminatorValue("SELLER")
@PrimaryKeyJoinColumn(name = "user_id")
public class Seller extends User {

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Maps merchant storefront business name to required VARCHAR(150) column.
    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    @Column(name = "shop_description", length = 1000)
    private String shopDescription;

    @Column(name = "origin_city", length = 100)
    private String originCity;

    @Column(name = "commission_rate", precision = 5, scale = 2)
    private BigDecimal commissionRate = new BigDecimal("10.00");

    // Language: Jakarta Persistence (JPA) / One-to-Many Relationship
    // Purpose: Maps collection of products listed by this seller; cascades changes.
    @OneToMany(mappedBy = "seller", cascade = CascadeType.ALL)
    private List<Product> products = new ArrayList<>();

    protected Seller() {
        super();
    }

    public Seller(String fullName, String email, String passwordHash, String shopName) {
        this(fullName, email, passwordHash, null, shopName, "Colombo", new BigDecimal("10.00"));
    }

    public Seller(String fullName, String email, String passwordHash, String phoneNumber,
                  String shopName, String originCity, BigDecimal commissionRate) {
        super(fullName, email, passwordHash, phoneNumber);
        setShopName(shopName);
        this.originCity = originCity != null ? originCity : "Colombo";
        this.commissionRate = commissionRate != null ? commissionRate : new BigDecimal("10.00");
    }

    @Override
    public UserRole getRole() {
        return UserRole.SELLER;
    }

    /** Adds a product to this seller's catalog. */
    public void addProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null.");
        }
        if (!products.contains(product)) {
            products.add(product);
        }
    }

    /** Removes a product from this seller's catalog. */
    public void removeProduct(Product product) {
        products.remove(product);
    }

    public String getShopName() {
        return shopName;
    }

    public void setShopName(String shopName) {
        if (shopName == null || shopName.isBlank()) {
            throw new IllegalArgumentException("Shop name is required and cannot be blank.");
        }
        this.shopName = shopName.trim();
    }

    public String getShopDescription() {
        return shopDescription;
    }

    public void setShopDescription(String shopDescription) {
        this.shopDescription = shopDescription;
    }

    public String getOriginCity() {
        return originCity;
    }

    public void setOriginCity(String originCity) {
        this.originCity = originCity;
    }

    public BigDecimal getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(BigDecimal commissionRate) {
        if (commissionRate == null || commissionRate.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Commission rate cannot be negative.");
        }
        this.commissionRate = commissionRate;
    }

    public List<Product> getProducts() {
        return Collections.unmodifiableList(products);
    }
}
