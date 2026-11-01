package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.OrderItem;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product product);
    List<Review> findByBuyer(Buyer buyer);
    boolean existsByBuyerAndOrderItem(Buyer buyer, OrderItem orderItem);
    Optional<Review> findByBuyerAndOrderItem(Buyer buyer, OrderItem orderItem);
    boolean existsByBuyerAndProduct(Buyer buyer, Product product);
    Optional<Review> findByBuyerAndProduct(Buyer buyer, Product product);
}
