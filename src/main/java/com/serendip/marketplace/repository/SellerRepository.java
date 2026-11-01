package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByEmail(String email);
    Optional<Seller> findByShopName(String shopName);
    boolean existsByEmail(String email);
    boolean existsByShopName(String shopName);
}
