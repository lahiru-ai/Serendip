package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByBuyer(Buyer buyer);

    List<Order> findByBuyerOrderByCreatedAtDesc(Buyer buyer);

    List<Order> findAllByOrderByCreatedAtDesc();

    // Language: JPQL (Java Persistence Query Language)
    // Purpose: Fetches all orders sorted by creation date descending, eagerly joining the buyer and payment entities (JOIN FETCH) to eliminate N+1 select queries when rendering order lists with customer and payment details.
    @Query("SELECT o FROM Order o JOIN FETCH o.buyer LEFT JOIN FETCH o.payment ORDER BY o.createdAt DESC")
    List<Order> findAllWithDetails();
}
