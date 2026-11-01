package com.serendip.marketplace.entity;

import com.serendip.marketplace.exception.InsufficientStockException;
import com.serendip.marketplace.payment.FixedRateCurrencyConverter;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

/**
 * Represents a product offered by a seller in both LKR and USD currencies.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps marketplace product catalog listings to 'products' table.
@Entity
@Table(name = "products")
public class Product {

    public static final BigDecimal DEFAULT_LKR_PER_USD = FixedRateCurrencyConverter.DEFAULT_LKR_PER_USD;

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the product.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Maps product title to required VARCHAR(180) column.
    @Column(nullable = false, length = 180)
    private String name;

    @Column(length = 100)
    private String category = "General";

    @Column(length = 2000)
    private String description = "";

    @Column(name = "price_lkr", precision = 14, scale = 2)
    private BigDecimal priceInLkr;

    @Column(name = "price_usd", nullable = false, precision = 12, scale = 2)
    private BigDecimal price; // Buyer-facing price in USD

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "USD";

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "weight_grams")
    private int weightGrams = 100;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: Links product to its vendor seller via 'seller_id' foreign key, fetched eagerly for catalog display.
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    protected Product() {
    }

    public Product(String name, BigDecimal price, int stockQuantity, Seller seller) {
        this(name, "General", "", price, "USD", stockQuantity, seller, 100);
    }

    public Product(String name, String category, BigDecimal price, int stockQuantity, Seller seller, int weightGrams) {
        this(name, category, "", price, "USD", stockQuantity, seller, weightGrams);
    }

    public Product(String name, String category, String description, BigDecimal inputPrice,
                   String currencyCode, int stockQuantity, Seller seller, int weightGrams) {
        setName(name);
        this.category = category != null && !category.isBlank() ? category.trim() : "General";
        this.description = description != null ? description.trim() : "";
        setCurrencyCode(currencyCode != null ? currencyCode : "USD");

        if ("LKR".equalsIgnoreCase(this.currencyCode)) {
            setPriceInLkr(inputPrice);
        } else {
            setPrice(inputPrice);
        }

        setStockQuantity(stockQuantity);
        this.seller = Objects.requireNonNull(seller, "Product must belong to a verified seller.");
        this.weightGrams = weightGrams > 0 ? weightGrams : 100;
        this.active = stockQuantity > 0;
    }

    /** Creates a product with price specified in LKR, calculating USD price automatically. */
    public static Product createInLkr(String name, String category, String description,
                                      BigDecimal priceInLkr, int stockQuantity, Seller seller, int weightGrams) {
        return new Product(name, category, description, priceInLkr, "LKR", stockQuantity, seller, weightGrams);
    }

    public void setPriceInLkr(BigDecimal priceInLkr) {
        if (priceInLkr == null || priceInLkr.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Product price in LKR must be strictly positive.");
        }
        this.priceInLkr = priceInLkr.setScale(2, RoundingMode.HALF_UP);
        // Convert LKR price to USD using default exchange rate
        this.price = this.priceInLkr.divide(DEFAULT_LKR_PER_USD, 2, RoundingMode.HALF_UP);
    }

    public BigDecimal getPriceInLkr() {
        return priceInLkr != null ? priceInLkr : price.multiply(DEFAULT_LKR_PER_USD).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal getPriceInUsd() {
        return price;
    }

    public BigDecimal getPriceInUsd(BigDecimal customExchangeRate) {
        if (customExchangeRate == null || customExchangeRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Custom exchange rate must be positive.");
        }
        BigDecimal lkr = getPriceInLkr();
        return lkr.divide(customExchangeRate, 2, RoundingMode.HALF_UP);
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Product price must be strictly positive.");
        }
        this.price = price.setScale(2, RoundingMode.HALF_UP);
        this.priceInLkr = this.price.multiply(DEFAULT_LKR_PER_USD).setScale(2, RoundingMode.HALF_UP);
    }

    public void updatePrice(BigDecimal newPrice) {
        setPrice(newPrice);
    }

    /** Decreases stock when items are purchased. */
    public void decreaseStock(int quantity) {
        reduceStock(quantity);
    }

    /** Reduces available stock quantity and deactivates product if empty. */
    public void reduceStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Deduction quantity must be positive.");
        }
        if (this.stockQuantity < quantity) {
            throw new InsufficientStockException(
                String.format("Product '%s' has insufficient stock: only %d units remaining, requested %d",
                    this.name, this.stockQuantity, quantity));
        }
        this.stockQuantity -= quantity;
        if (this.stockQuantity == 0) {
            this.active = false;
        }
    }

    /** Replenishes stock when items are restocked or an order is cancelled. */
    public void replenishStock(int quantity) {
        addStock(quantity);
    }

    /** Adds stock quantity and marks the product active. */
    public void addStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Replenishment quantity must be positive.");
        }
        this.stockQuantity += quantity;
        if (this.stockQuantity > 0) {
            this.active = true;
        }
    }

    /** Checks if the product is active and has enough stock available. */
    public boolean isAvailable(int requestedQuantity) {
        return this.active && this.stockQuantity >= requestedQuantity;
    }

    public boolean isAvailable() {
        return isAvailable(1);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Product name cannot be empty.");
        }
        this.name = name.trim();
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description != null ? description.trim() : "";
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String code) {
        if (code == null) {
            this.currencyCode = "USD";
            return;
        }
        try {
            Currency.getInstance(code);
            this.currencyCode = code.toUpperCase();
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid ISO 4217 currency code: " + code);
        }
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public int getStock() {
        return stockQuantity;
    }

    public void setStockQuantity(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException("Initial stock cannot be negative.");
        }
        this.stockQuantity = quantity;
        this.active = quantity > 0;
    }

    public int getWeightGrams() {
        return weightGrams;
    }

    public void setWeightGrams(int weightGrams) {
        if (weightGrams <= 0) {
            throw new IllegalArgumentException("Weight must be greater than zero.");
        }
        this.weightGrams = weightGrams;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void activate() {
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public Seller getSeller() {
        return seller;
    }

    public void setSeller(Seller seller) {
        this.seller = Objects.requireNonNull(seller, "Seller is required.");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Product product)) return false;
        if (id != null && product.id != null) {
            return Objects.equals(id, product.id);
        }
        return Objects.equals(name, product.name) && Objects.equals(seller, product.seller);
    }

    @Override
    public int hashCode() {
        if (id != null) return id.hashCode();
        return Objects.hash(name, seller);
    }
}
