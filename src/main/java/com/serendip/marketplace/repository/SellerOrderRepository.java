package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.SellerOrder;
import com.serendip.marketplace.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerOrderRepository extends JpaRepository<SellerOrder, Long> {

    List<SellerOrder> findBySeller(Seller seller);

    List<SellerOrder> findBySellerOrderByCreatedAtDesc(Seller seller);

    // Language: JPQL (Java Persistence Query Language)
    // Purpose: Fetches sub-orders for a particular seller, eagerly loading the seller, the parent order, and the buyer in a single query ordered by newest first.
    @Query("SELECT so FROM SellerOrder so JOIN FETCH so.seller JOIN FETCH so.order o JOIN FETCH o.buyer WHERE so.seller = :seller ORDER BY so.createdAt DESC")
    List<SellerOrder> findBySellerWithDetails(@Param("seller") Seller seller);

    long countBySellerAndStatus(Seller seller, OrderStatus status);
}
