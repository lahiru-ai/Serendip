package com.serendip.marketplace.service;

import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.repository.ProductRepository;
import com.serendip.marketplace.repository.SellerRepository;
import com.serendip.marketplace.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Service managing product catalog, seller listings, and stock updates.
 */
@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final SellerRepository sellerRepository;

    public ProductService(ProductRepository productRepository, SellerRepository sellerRepository) {
        this.productRepository = Objects.requireNonNull(productRepository);
        this.sellerRepository = Objects.requireNonNull(sellerRepository);
    }

    /** Adds a new product to a seller's catalog with price in USD. */
    public Product addProduct(Long sellerId, String name, String category, String description,
                              BigDecimal priceUsd, int stockQuantity, int weightGrams) {
        SecurityUtils.requireOwnershipOrAdmin(sellerId, "seller catalog");
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));

        Product product = new Product(name, priceUsd, stockQuantity, seller);
        product.setCategory(category != null ? category : "General");
        product.setDescription(description != null ? description : "");
        product.setWeightGrams(weightGrams);
        seller.addProduct(product);
        return productRepository.save(product);
    }

    /** Adds a new product to a seller's catalog with price specified in LKR. */
    public Product addProductInLkr(Long sellerId, String name, String category, String description,
                                 BigDecimal priceLkr, int stockQuantity, int weightGrams) {
        SecurityUtils.requireOwnershipOrAdmin(sellerId, "seller catalog");
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));

        Product product = Product.createInLkr(name, category, description, priceLkr, stockQuantity, seller, weightGrams);
        seller.addProduct(product);
        return productRepository.save(product);
    }

    /** Retrieves a product by its ID. */
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findByIdWithSeller(id)
                .or(() -> productRepository.findById(id))
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Product with id %d not found.", id)));
    }

    /** Retrieves all active products in the marketplace. */
    @Transactional(readOnly = true)
    public List<Product> getActiveProducts() {
        return productRepository.findByActiveTrue();
    }

    /** Retrieves all products listed by a specific seller. */
    @Transactional(readOnly = true)
    public List<Product> getProductsBySeller(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));
        return productRepository.findBySeller(seller);
    }

    /** Retrieves all products belonging to a given category. */
    @Transactional(readOnly = true)
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    /** Updates the price of an existing product. */
    public Product updatePrice(Long productId, BigDecimal newPriceUsd) {
        Product product = getProductById(productId);
        checkProductOwnership(product);
        product.setPrice(newPriceUsd);
        return productRepository.save(product);
    }

    /** Replenishes the stock quantity for a product. */
    public Product replenishStock(Long productId, int quantity) {
        Product product = getProductById(productId);
        checkProductOwnership(product);
        product.replenishStock(quantity);
        return productRepository.save(product);
    }

    /** Deactivates a product so it no longer appears in public catalog searches. */
    public Product deactivateProduct(Long productId) {
        Product product = getProductById(productId);
        checkProductOwnership(product);
        product.deactivate();
        return productRepository.save(product);
    }

    /** Activates a product to make it available for purchase. */
    public Product activateProduct(Long productId) {
        Product product = getProductById(productId);
        checkProductOwnership(product);
        product.activate();
        return productRepository.save(product);
    }

    private void checkProductOwnership(Product product) {
        if (product != null && product.getSeller() != null) {
            SecurityUtils.requireOwnershipOrAdmin(product.getSeller().getId(), "product belonging to another seller");
        }
    }
}
