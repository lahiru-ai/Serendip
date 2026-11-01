package com.serendip.marketplace.controller;

import com.serendip.marketplace.dto.product.*;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for product catalog browsing, creation, and inventory updates.
 */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /** Browses active products or filters by seller or category. */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> browseProducts(
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) String category) {

        List<Product> products;
        if (sellerId != null) {
            products = productService.getProductsBySeller(sellerId);
        } else if (category != null && !category.isBlank()) {
            products = productService.getProductsByCategory(category);
        } else {
            products = productService.getActiveProducts();
        }

        List<ProductResponse> responses = products.stream()
                .map(ProductResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /** Retrieves details for a specific product by ID. */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    /** Creates a new product with price in USD. */
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        Product product = productService.addProduct(
                request.sellerId(),
                request.name(),
                request.category(),
                request.description(),
                request.priceUsd(),
                request.stockQuantity(),
                request.effectiveWeightGrams()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ProductResponse.fromEntity(product));
    }

    /** Creates a new product with price specified in LKR. */
    @PostMapping("/lkr")
    public ResponseEntity<ProductResponse> createProductInLkr(@Valid @RequestBody ProductLkrCreateRequest request) {
        Product product = productService.addProductInLkr(
                request.sellerId(),
                request.name(),
                request.category(),
                request.description(),
                request.priceLkr(),
                request.stockQuantity(),
                request.effectiveWeightGrams()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ProductResponse.fromEntity(product));
    }

    /** Updates the price of an existing product. */
    @PutMapping("/{id}/price")
    public ResponseEntity<ProductResponse> updatePrice(
            @PathVariable Long id,
            @Valid @RequestBody ProductPriceUpdateRequest request) {
        Product product = productService.updatePrice(id, request.newPriceUsd());
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    /** Replenishes stock quantity for an existing product. */
    @PutMapping("/{id}/replenish")
    public ResponseEntity<ProductResponse> replenishStock(
            @PathVariable Long id,
            @Valid @RequestBody ProductStockReplenishRequest request) {
        Product product = productService.replenishStock(id, request.quantity());
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    /** Deactivates a product so it is hidden from the public catalog. */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ProductResponse> deactivateProduct(@PathVariable Long id) {
        Product product = productService.deactivateProduct(id);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    /** Activates a product to make it available for purchase. */
    @PutMapping("/{id}/activate")
    public ResponseEntity<ProductResponse> activateProduct(@PathVariable Long id) {
        Product product = productService.activateProduct(id);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }
}
