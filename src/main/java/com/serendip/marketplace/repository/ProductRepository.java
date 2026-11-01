package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Language: JPQL (Java Persistence Query Language)
    // Purpose: Retrieves all products owned by a specific seller, eagerly fetching the seller entity to prevent N+1 queries.
    @Query("SELECT p FROM Product p JOIN FETCH p.seller WHERE p.seller = :seller")
    List<Product> findBySeller(@Param("seller") Seller seller);

    // Language: JPQL (Java Persistence Query Language)
    // Purpose: Retrieves all products under a specific category, eagerly fetching the associated seller details.
    @Query("SELECT p FROM Product p JOIN FETCH p.seller WHERE p.category = :category")
    List<Product> findByCategory(@Param("category") String category);

    // Language: JPQL (Java Persistence Query Language)
    // Purpose: Retrieves all active products in the marketplace for public catalog browsing, eagerly loading seller details.
    @Query("SELECT p FROM Product p JOIN FETCH p.seller WHERE p.active = true")
    List<Product> findByActiveTrue();

    // Language: JPQL (Java Persistence Query Language)
    // Purpose: Finds a single product by its ID and eagerly joins its seller, returning an Optional product with full seller information.
    @Query("SELECT p FROM Product p JOIN FETCH p.seller WHERE p.id = :id")
    Optional<Product> findByIdWithSeller(@Param("id") Long id);
}
