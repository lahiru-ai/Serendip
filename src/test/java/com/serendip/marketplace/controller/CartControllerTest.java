package com.serendip.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.cart.CartItemAddRequest;
import com.serendip.marketplace.dto.cart.CartItemUpdateRequest;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.ShoppingCart;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.service.CartService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CartController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("Shopping Cart REST Controller Endpoints")
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CartService cartService;

    @Test
    @DisplayName("GET /api/v1/carts/{buyerId} - retrieves shopping cart")
    void getCart() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        ShoppingCart cart = buyer.getCart();
        cart.setId(10L);

        when(cartService.getCartForBuyer(1L)).thenReturn(cart);

        mockMvc.perform(get("/api/v1/carts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.buyerId").value(1))
                .andExpect(jsonPath("$.totalItemCount").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/carts/{buyerId}/items - adds item to cart")
    void addItemToCart() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Seller seller = new Seller("Seller S", "s@mail.com", "p", "Crafts");
        Product product = new Product("Mask", new BigDecimal("50.00"), 10, seller);
        product.setId(25L);

        buyer.addToCart(product, 2);
        ShoppingCart cart = buyer.getCart();
        cart.setId(10L);

        when(cartService.addToCart(eq(1L), eq(25L), eq(2))).thenReturn(cart);

        CartItemAddRequest request = new CartItemAddRequest(25L, 2);

        mockMvc.perform(post("/api/v1/carts/1/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItemCount").value(2))
                .andExpect(jsonPath("$.totalAmount").value(100.00));
    }

    @Test
    @DisplayName("PUT /api/v1/carts/{buyerId}/items/{productId} - updates item quantity")
    void updateItemQuantity() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Seller seller = new Seller("Seller S", "s@mail.com", "p", "Crafts");
        Product product = new Product("Mask", new BigDecimal("50.00"), 10, seller);
        product.setId(25L);

        buyer.addToCart(product, 3);
        ShoppingCart cart = buyer.getCart();

        when(cartService.updateItemQuantity(eq(1L), eq(25L), eq(3))).thenReturn(cart);

        CartItemUpdateRequest request = new CartItemUpdateRequest(3);

        mockMvc.perform(put("/api/v1/carts/1/items/25")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItemCount").value(3));
    }

    @Test
    @DisplayName("DELETE /api/v1/carts/{buyerId}/items/{productId} - removes item from cart")
    void removeItem() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        ShoppingCart cart = buyer.getCart();

        when(cartService.removeItem(eq(1L), eq(25L))).thenReturn(cart);

        mockMvc.perform(delete("/api/v1/carts/1/items/25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItemCount").value(0));
    }

    @Test
    @DisplayName("DELETE /api/v1/carts/{buyerId} - clears entire shopping cart")
    void clearCart() throws Exception {
        doNothing().when(cartService).clearCart(1L);

        mockMvc.perform(delete("/api/v1/carts/1"))
                .andExpect(status().isNoContent());
    }
}
