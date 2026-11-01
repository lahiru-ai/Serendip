package com.serendip.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.auth.LoginRequest;
import com.serendip.marketplace.dto.user.BuyerRegistrationRequest;
import com.serendip.marketplace.dto.user.SellerRegistrationRequest;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.security.CustomUserPrincipal;
import com.serendip.marketplace.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("Authentication REST Controller Endpoints")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("POST /api/v1/auth/login - successful login returns AuthResponse")
    void testSuccessfulLogin() throws Exception {
        Buyer buyer = new Buyer("Kamal Perera", "kamal@test.com", "hashPass");
        buyer.setId(10L);
        CustomUserPrincipal principal = new CustomUserPrincipal(buyer);

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userService.getUserById(10L)).thenReturn(buyer);

        LoginRequest request = new LoginRequest("kamal@test.com", "password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.email").value("kamal@test.com"))
                .andExpect(jsonPath("$.role").value("BUYER"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - invalid credentials returns 401 UNAUTHORIZED")
    void testInvalidLoginCredentials() throws Exception {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest("wrong@test.com", "badPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register/buyer - registers buyer via auth endpoint")
    void testRegisterBuyerViaAuth() throws Exception {
        Buyer buyer = new Buyer("Nimal", "nimal@test.com", "hashed", "+9477", "Kandy");
        buyer.setId(20L);

        when(userService.registerBuyer(anyString(), anyString(), anyString(), any(), anyString()))
                .thenReturn(buyer);

        BuyerRegistrationRequest request = new BuyerRegistrationRequest(
                "Nimal", "nimal@test.com", "secret123", "+9477", "Kandy"
        );

        mockMvc.perform(post("/api/v1/auth/register/buyer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.role").value("BUYER"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register/seller - registers seller via auth endpoint")
    void testRegisterSellerViaAuth() throws Exception {
        Seller seller = new Seller("Saman", "saman@test.com", "hashed", "+9477", "Saman Teas", "Colombo", new BigDecimal("10.00"));
        seller.setId(30L);

        when(userService.registerSeller(anyString(), anyString(), anyString(), any(), anyString(), any(), any()))
                .thenReturn(seller);

        SellerRegistrationRequest request = new SellerRegistrationRequest(
                "Saman", "saman@test.com", "secret123", "+9477", "Saman Teas", "Colombo", new BigDecimal("10.00")
        );

        mockMvc.perform(post("/api/v1/auth/register/seller")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(30))
                .andExpect(jsonPath("$.role").value("SELLER"));
    }
}
