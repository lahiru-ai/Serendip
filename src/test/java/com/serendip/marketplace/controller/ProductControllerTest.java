package com.serendip.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.product.ProductCreateRequest;
import com.serendip.marketplace.dto.product.ProductLkrCreateRequest;
import com.serendip.marketplace.dto.product.ProductPriceUpdateRequest;
import com.serendip.marketplace.dto.product.ProductStockReplenishRequest;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("Product REST Controller Endpoints")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/v1/products - browses active products")
    void browseActiveProducts() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        seller.setId(1L);
        Product p = new Product("Ceylon Tea", new BigDecimal("12.50"), 100, seller);
        p.setId(101L);

        when(productService.getActiveProducts()).thenReturn(List.of(p));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].name").value("Ceylon Tea"))
                .andExpect(jsonPath("$[0].priceUsd").value(12.50));
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} - returns product details")
    void getProductById() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        seller.setId(1L);
        Product p = new Product("Ceylon Tea", new BigDecimal("12.50"), 100, seller);
        p.setId(101L);

        when(productService.getProductById(101L)).thenReturn(p);

        mockMvc.perform(get("/api/v1/products/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.name").value("Ceylon Tea"));
    }

    @Test
    @DisplayName("POST /api/v1/products - seller creates product in USD")
    void createProductUsd() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        seller.setId(1L);
        Product p = new Product("Blue Sapphire", new BigDecimal("250.00"), 5, seller);
        p.setId(201L);

        when(productService.addProduct(anyLong(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(p);

        ProductCreateRequest request = new ProductCreateRequest(
                1L, "Blue Sapphire", "Gems", "Certified Natural Sapphire",
                new BigDecimal("250.00"), 5, 20
        );

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(201))
                .andExpect(jsonPath("$.priceUsd").value(250.00));
    }

    @Test
    @DisplayName("POST /api/v1/products/lkr - seller creates product in LKR")
    void createProductLkr() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        seller.setId(1L);
        Product p = Product.createInLkr("Batik Sarong", "Clothing", "Handmade", new BigDecimal("4500.00"), 15, seller, 300);
        p.setId(202L);

        when(productService.addProductInLkr(anyLong(), anyString(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(p);

        ProductLkrCreateRequest request = new ProductLkrCreateRequest(
                1L, "Batik Sarong", "Clothing", "Handmade",
                new BigDecimal("4500.00"), 15, 300
        );

        mockMvc.perform(post("/api/v1/products/lkr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(202))
                .andExpect(jsonPath("$.priceLkr").value(4500.00))
                .andExpect(jsonPath("$.priceUsd").value(15.00));
    }

    @Test
    @DisplayName("PUT /api/v1/products/{id}/price - updates product price")
    void updatePrice() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        Product p = new Product("Ceylon Tea", new BigDecimal("14.00"), 100, seller);
        p.setId(101L);

        when(productService.updatePrice(eq(101L), any(BigDecimal.class))).thenReturn(p);

        ProductPriceUpdateRequest request = new ProductPriceUpdateRequest(new BigDecimal("14.00"));

        mockMvc.perform(put("/api/v1/products/101/price")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priceUsd").value(14.00));
    }

    @Test
    @DisplayName("PUT /api/v1/products/{id}/replenish - replenishes product stock")
    void replenishStock() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        Product p = new Product("Ceylon Tea", new BigDecimal("12.50"), 150, seller);
        p.setId(101L);

        when(productService.replenishStock(eq(101L), eq(50))).thenReturn(p);

        ProductStockReplenishRequest request = new ProductStockReplenishRequest(50);

        mockMvc.perform(put("/api/v1/products/101/replenish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(150));
    }

    @Test
    @DisplayName("PUT /api/v1/products/{id}/deactivate - deactivates product")
    void deactivateProduct() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        Product p = new Product("Ceylon Tea", new BigDecimal("12.50"), 100, seller);
        p.setId(101L);
        p.deactivate();

        when(productService.deactivateProduct(101L)).thenReturn(p);

        mockMvc.perform(put("/api/v1/products/101/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @DisplayName("PUT /api/v1/products/{id}/activate - activates product")
    void activateProduct() throws Exception {
        Seller seller = new Seller("Seller A", "s@mail.com", "p", "Tea Co");
        Product p = new Product("Ceylon Tea", new BigDecimal("12.50"), 100, seller);
        p.setId(101L);
        p.activate();

        when(productService.activateProduct(101L)).thenReturn(p);

        mockMvc.perform(put("/api/v1/products/101/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));
    }
}
