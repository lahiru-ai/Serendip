package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.ShoppingCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    Optional<ShoppingCart> findByBuyer(Buyer buyer);
    Optional<ShoppingCart> findByBuyerId(Long buyerId);
}
