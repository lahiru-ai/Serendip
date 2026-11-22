package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.OrderItem;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.product LEFT JOIN FETCH r.orderItem WHERE r.product = :product ORDER BY r.createdAt DESC")
    List<Review> findByProduct(@Param("product") Product product);

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.buyer LEFT JOIN FETCH r.product LEFT JOIN FETCH r.orderItem WHERE r.buyer = :buyer ORDER BY r.createdAt DESC")
    List<Review> findByBuyer(@Param("buyer") Buyer buyer);

    boolean existsByBuyerAndOrderItem(Buyer buyer, OrderItem orderItem);
    Optional<Review> findByBuyerAndOrderItem(Buyer buyer, OrderItem orderItem);
    boolean existsByBuyerAndProduct(Buyer buyer, Product product);
    Optional<Review> findByBuyerAndProduct(Buyer buyer, Product product);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    long countByProductId(@Param("productId") Long productId);

    @Query("SELECT r.product.id, AVG(r.rating), COUNT(r) FROM Review r GROUP BY r.product.id")
    List<Object[]> findReviewStatsGroupedByProductId();
}
