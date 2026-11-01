package com.serendip.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.user.BuyerRegistrationRequest;
import com.serendip.marketplace.dto.user.SellerRegistrationRequest;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.service.UserService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("User REST Controller Endpoints")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("POST /api/v1/users/buyers - successfully registers buyer")
    void registerBuyerSuccess() throws Exception {
        Buyer buyer = new Buyer("Kamal Perera", "kamal@test.com", "secretHash", "+94771234567", "Colombo");
        buyer.setId(1L);

        when(userService.registerBuyer(anyString(), anyString(), anyString(), any(), anyString()))
                .thenReturn(buyer);

        BuyerRegistrationRequest request = new BuyerRegistrationRequest(
                "Kamal Perera", "kamal@test.com", "password123", "+94771234567", "Colombo"
        );

        mockMvc.perform(post("/api/v1/users/buyers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.fullName").value("Kamal Perera"))
                .andExpect(jsonPath("$.role").value("BUYER"));
    }

    @Test
    @DisplayName("POST /api/v1/users/buyers - validation error on missing email")
    void registerBuyerValidationFailure() throws Exception {
        BuyerRegistrationRequest request = new BuyerRegistrationRequest(
                "Kamal", "", "12345", "+9477", "Colombo"
        );

        mockMvc.perform(post("/api/v1/users/buyers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("POST /api/v1/users/sellers - successfully registers seller")
    void registerSellerSuccess() throws Exception {
        Seller seller = new Seller("Sunil Silva", "sunil@shop.com", "hash", "+94778889900",
                "Spices of Ceylon", "Kandy", new BigDecimal("10.00"));
        seller.setId(2L);

        when(userService.registerSeller(anyString(), anyString(), anyString(), any(), anyString(), any(), any()))
                .thenReturn(seller);

        SellerRegistrationRequest request = new SellerRegistrationRequest(
                "Sunil Silva", "sunil@shop.com", "secure123", "+94778889900",
                "Spices of Ceylon", "Kandy", new BigDecimal("10.00")
        );

        mockMvc.perform(post("/api/v1/users/sellers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.shopName").value("Spices of Ceylon"))
                .andExpect(jsonPath("$.role").value("SELLER"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} - returns 200 OK")
    void getUserByIdSuccess() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(10L);

        when(userService.getUserById(10L)).thenReturn(buyer);

        mockMvc.perform(get("/api/v1/users/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.email").value("k@mail.com"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} - returns 404 when user not found")
    void getUserByIdNotFound() throws Exception {
        when(userService.getUserById(99L)).thenThrow(new ResourceNotFoundException("User with id 99 not found."));

        mockMvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/{id}/activate - activates user")
    void activateUserSuccess() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(5L);
        buyer.activate();

        when(userService.activateUser(5L)).thenReturn(buyer);

        mockMvc.perform(put("/api/v1/users/5/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/{id}/suspend - suspends user")
    void suspendUserSuccess() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(5L);
        buyer.suspend();

        when(userService.suspendUser(5L)).thenReturn(buyer);

        mockMvc.perform(put("/api/v1/users/5/suspend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("SUSPENDED"));
    }
}
