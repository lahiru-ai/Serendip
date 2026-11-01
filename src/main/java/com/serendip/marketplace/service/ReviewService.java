package com.serendip.marketplace.service;

import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.repository.BuyerRepository;
import com.serendip.marketplace.repository.OrderItemRepository;
import com.serendip.marketplace.repository.ProductRepository;
import com.serendip.marketplace.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

/**
 * Service managing product reviews and ratings submitted by verified buyers.
 */
@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BuyerRepository buyerRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         BuyerRepository buyerRepository,
                         ProductRepository productRepository,
                         OrderItemRepository orderItemRepository) {
        this.reviewRepository = Objects.requireNonNull(reviewRepository);
        this.buyerRepository = Objects.requireNonNull(buyerRepository);
        this.productRepository = Objects.requireNonNull(productRepository);
        this.orderItemRepository = Objects.requireNonNull(orderItemRepository);
    }

    /** Submits a review and rating for an item purchased by a buyer. */
    public Review addReview(Long buyerId, Long orderItemId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new com.serendip.marketplace.exception.InvalidRatingException(
                String.format("Review rating %d is invalid; must be between 1 and 5 stars.", rating));
        }

        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", buyerId)));

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Purchased item with id %d not found.", orderItemId)));

        if (reviewRepository.existsByBuyerAndOrderItem(buyer, orderItem)) {
            throw new BusinessRuleException("You have already reviewed this purchase.");
        }

        // Domain method validates rating, verified purchase, and buyer ownership
        Review review = buyer.submitReview(orderItem, rating, comment);

        return reviewRepository.save(review);
    }

    /** Submits a review and rating for a product directly by a buyer. */
    public Review addReviewForProduct(Long buyerId, Long productId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new com.serendip.marketplace.exception.InvalidRatingException(
                String.format("Review rating %d is invalid; must be between 1 and 5 stars.", rating));
        }

        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", buyerId)));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product with id %d not found.", productId)));

        if (reviewRepository.existsByBuyerAndProduct(buyer, product)) {
            throw new BusinessRuleException("You have already reviewed this product.");
        }

        // Check if buyer has a matching purchased item from a completed order
        OrderItem matchingItem = null;
        if (buyer.getOrders() != null) {
            for (Order order : buyer.getOrders()) {
                if (order.getStatus() != OrderStatus.PENDING_PAYMENT && order.getStatus() != OrderStatus.CANCELLED) {
                    for (SellerOrder sellerOrder : order.getSellerOrders()) {
                        for (OrderItem item : sellerOrder.getItems()) {
                            if (item.getProduct() != null && Objects.equals(item.getProduct().getId(), product.getId())) {
                                matchingItem = item;
                                break;
                            }
                        }
                        if (matchingItem != null) break;
                    }
                }
                if (matchingItem != null) break;
            }
        }

        Review review;
        if (matchingItem != null) {
            review = buyer.submitReview(matchingItem, rating, comment);
        } else {
            review = new Review(buyer, product, rating, comment);
            buyer.getReviews().add(review);
        }

        return reviewRepository.save(review);
    }

    /** Retrieves all reviews submitted for a specific product. */
    @Transactional(readOnly = true)
    public List<Review> getReviewsForProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product with id %d not found.", productId)));
        return reviewRepository.findByProduct(product);
    }

    /** Retrieves all reviews submitted by a specific buyer. */
    @Transactional(readOnly = true)
    public List<Review> getReviewsForBuyer(Long buyerId) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", buyerId)));
        return reviewRepository.findByBuyer(buyer);
    }
}
