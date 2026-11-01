package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for order status transition audit logs.
 */
@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    List<OrderStatusHistory> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<OrderStatusHistory> findBySellerOrderIdOrderByCreatedAtDesc(Long sellerOrderId);
}
