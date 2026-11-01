package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Order;
import com.serendip.marketplace.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionReference(String transactionReference);
    Optional<Payment> findByOrder(Order order);
}
