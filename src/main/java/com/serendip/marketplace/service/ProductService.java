package com.serendip.marketplace.service;

import com.serendip.marketplace.dto.product.ProductUpdateRequest;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.repository.ProductRepository;
import com.serendip.marketplace.repository.SellerRepository;
import com.serendip.marketplace.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

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
                              BigDecimal priceUsd, int stockQuantity, Integer weightGrams) {
        return addProduct(sellerId, name, category, description, priceUsd, stockQuantity, weightGrams, null);
    }

    /** Adds a new product to a seller's catalog with price in USD and product image. */
    public Product addProduct(Long sellerId, String name, String category, String description,
                              BigDecimal priceUsd, int stockQuantity, Integer weightGrams, String imageUrl) {
        SecurityUtils.requireOwnershipOrAdmin(sellerId, "seller catalog");
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));

        Product product = new Product(name, priceUsd, stockQuantity, seller);
        product.setCategory(category != null ? category : "General");
        product.setDescription(description != null ? description : "");
        product.setWeightGrams(weightGrams);
        product.setImageUrl(imageUrl);
        seller.addProduct(product);
        return productRepository.save(product);
    }

    /** Adds a new product to a seller's catalog with price specified in LKR. */
    public Product addProductInLkr(Long sellerId, String name, String category, String description,
                                 BigDecimal priceLkr, int stockQuantity, Integer weightGrams) {
        return addProductInLkr(sellerId, name, category, description, priceLkr, stockQuantity, weightGrams, null);
    }

    /** Adds a new product to a seller's catalog with price specified in LKR and product image. */
    public Product addProductInLkr(Long sellerId, String name, String category, String description,
                                 BigDecimal priceLkr, int stockQuantity, Integer weightGrams, String imageUrl) {
        SecurityUtils.requireOwnershipOrAdmin(sellerId, "seller catalog");
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));

        Product product = Product.createInLkr(name, category, description, priceLkr, stockQuantity, seller, weightGrams);
        product.setImageUrl(imageUrl);
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

    /** Retrieves all available product categories in the marketplace catalog. */
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        List<String> dbCategories = productRepository.findDistinctCategories();
        Set<String> categories = new LinkedHashSet<>(
                List.of("Tea", "Gems", "Spices", "Crafts", "Apparel")
        );
        if (dbCategories != null) {
            for (String cat : dbCategories) {
                if (cat != null && !cat.isBlank()) {
                    categories.add(cat.trim());
                }
            }
        }
        return new ArrayList<>(categories);
    }

    /** Updates details of an existing product. */
    public Product updateProduct(Long productId, ProductUpdateRequest request) {
        Product product = getProductById(productId);
        checkProductOwnership(product);

        if (request.name() != null && !request.name().isBlank()) {
            product.setName(request.name());
        }
        if (request.category() != null && !request.category().isBlank()) {
            product.setCategory(request.category().trim());
        }
        if (request.description() != null) {
            product.setDescription(request.description().trim());
        }
        if (request.priceLkr() != null) {
            product.setPriceInLkr(request.priceLkr());
        } else if (request.priceUsd() != null) {
            product.setPrice(request.priceUsd());
        }
        if (request.stockQuantity() != null) {
            product.setStockQuantity(request.stockQuantity());
        }
        if (request.weightGrams() != null) {
            product.setWeightGrams(request.weightGrams() > 0 ? request.weightGrams() : null);
        }
        if (request.imageUrl() != null) {
            product.setImageUrl(request.imageUrl().isBlank() ? null : request.imageUrl().trim());
        }
        if (request.active() != null) {
            product.setActive(request.active());
        }

        return productRepository.save(product);
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

    /** Updates the image of an existing product in the database. */
    public Product updateProductImage(Long productId, String imageUrl) {
        Product product = getProductById(productId);
        checkProductOwnership(product);
        product.setImageUrl(imageUrl);
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
