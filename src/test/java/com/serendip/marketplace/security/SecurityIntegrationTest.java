package com.serendip.marketplace.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.product.ProductPriceUpdateRequest;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Product;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class, GlobalExceptionHandler.class})
@DisplayName("Spring Security Filter Chain & RBAC Integration Tests")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private ProductService productService;

    @MockBean
    private CartService cartService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private ReviewService reviewService;

    @Test
    @DisplayName("Public endpoint: GET /api/v1/products accessible without authentication")
    void testPublicBrowsingAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Protected endpoint: GET /api/v1/carts/1 returns 401 UNAUTHORIZED when unauthenticated")
    void testUnauthenticatedCartAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/carts/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(username = "buyer@test.com", roles = {"BUYER"})
    @DisplayName("RBAC: BUYER role accessing SELLER-only endpoint (POST /api/v1/products) returns 403 FORBIDDEN")
    void testBuyerCannotAccessSellerEndpoints() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "seller@test.com", roles = {"SELLER"})
    @DisplayName("RBAC: SELLER role accessing BUYER-only endpoint (GET /api/v1/carts/1) returns 403 FORBIDDEN")
    void testSellerCannotAccessBuyerCartEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/carts/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "buyer@test.com", roles = {"BUYER"})
    @DisplayName("RBAC: BUYER role attempting ADMIN action (PUT /api/v1/users/5/activate) returns 403 FORBIDDEN")
    void testBuyerCannotActivateUser() throws Exception {
        mockMvc.perform(put("/api/v1/users/5/activate"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    @DisplayName("RBAC: ADMIN role permitted to activate user")
    void testAdminCanActivateUser() throws Exception {
        Buyer buyer = new Buyer("User", "u@mail.com", "p");
        buyer.setId(5L);
        buyer.activate();
        when(userService.activateUser(5L)).thenReturn(buyer);

        mockMvc.perform(put("/api/v1/users/5/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("ACTIVE"));
    }

    @Test
    @WithMockUser(username = "seller1@test.com", roles = {"SELLER"})
    @DisplayName("Cross-tenant: Seller modifying another seller's product triggers AccessDeniedException -> 403 FORBIDDEN")
    void testSellerCannotModifyOtherSellerProduct() throws Exception {
        when(productService.updatePrice(eq(99L), any(BigDecimal.class)))
                .thenThrow(new AccessDeniedException("You do not have permission to modify this product belonging to another seller."));

        ProductPriceUpdateRequest request = new ProductPriceUpdateRequest(new BigDecimal("50.00"));

        mockMvc.perform(put("/api/v1/products/99/price")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("You do not have permission to modify this product belonging to another seller."));
    }

    @Test
    @WithMockUser(username = "buyer1@test.com", roles = {"BUYER"})
    @DisplayName("Cross-tenant: Buyer accessing another user's cart triggers AccessDeniedException -> 403 FORBIDDEN")
    void testBuyerCannotAccessOtherBuyerCart() throws Exception {
        when(cartService.getCartForBuyer(2L))
                .thenThrow(new AccessDeniedException("You do not have permission to access or modify this shopping cart belonging to another buyer."));

        mockMvc.perform(get("/api/v1/carts/2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("You do not have permission to access or modify this shopping cart belonging to another buyer."));
    }
}
