package com.serendip.marketplace.entity;

import com.serendip.marketplace.exception.InvalidRatingException;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

/**
 * Represents a customer review and 1-5 star rating for a purchased product.
 */
// Language: Jakarta Persistence (JPA) / Entity Table Mapping
// Purpose: Maps customer product ratings and reviews to 'reviews' table.
@Entity
@Table(name = "reviews")
public class Review {

    // Language: Jakarta Persistence (JPA) / Primary Key
    // Purpose: Auto-incremented primary key for the review record.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: References reviewing customer via 'buyer_id'.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    // Language: Jakarta Persistence (JPA) / Many-to-One Foreign Key
    // Purpose: References reviewed product via 'product_id'.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @Column(nullable = false)
    private int rating;

    @Column(length = 2000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Review() {
    }

    public Review(Buyer buyer, Product product, int rating, String comment) {
        this(buyer, product, null, rating, comment);
    }

    public Review(Buyer buyer, Product product, OrderItem orderItem, int rating, String comment) {
        this.buyer = Objects.requireNonNull(buyer, "Reviewer buyer cannot be null.");
        this.product = Objects.requireNonNull(product, "Product cannot be null.");
        this.orderItem = orderItem;
        validateRating(rating);
        this.rating = rating;
        this.comment = comment != null ? comment.trim() : "";
        this.createdAt = Instant.now();
    }

    /** Validates that rating is within the allowed 1 to 5 star range. */
    public void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new InvalidRatingException(
                String.format("Review rating %d is invalid; must be between 1 and 5 stars.", rating));
        }
    }

    public void updateRating(int newRating) {
        validateRating(newRating);
        this.rating = newRating;
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

    public Product getProduct() {
        return product;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
