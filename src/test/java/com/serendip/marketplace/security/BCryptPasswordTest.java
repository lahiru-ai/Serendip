package com.serendip.marketplace.security;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.repository.BuyerRepository;
import com.serendip.marketplace.repository.SellerRepository;
import com.serendip.marketplace.repository.UserRepository;
import com.serendip.marketplace.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("BCrypt Password Hashing & Security Principal Tests")
class BCryptPasswordTest {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Test
    @DisplayName("BCryptPasswordEncoder produces valid hash and verifies plaintext match")
    void testBCryptEncoderDirectly() {
        String rawPassword = "StrongPassword#2026";
        String encoded = passwordEncoder.encode(rawPassword);

        assertThat(encoded).startsWith("$2a$12$");
        assertThat(passwordEncoder.matches(rawPassword, encoded)).isTrue();
        assertThat(passwordEncoder.matches("WrongPassword", encoded)).isFalse();
    }

    @Test
    @DisplayName("UserService hashes raw password with BCrypt on registration")
    void testUserServiceHashesPassword() {
        UserRepository userRepository = mock(UserRepository.class);
        BuyerRepository buyerRepository = mock(BuyerRepository.class);
        SellerRepository sellerRepository = mock(SellerRepository.class);

        when(userRepository.existsByEmail("secure@test.com")).thenReturn(false);
        when(buyerRepository.save(any(Buyer.class))).thenAnswer(inv -> inv.getArgument(0));

        UserService userService = new UserService(userRepository, buyerRepository, sellerRepository, passwordEncoder);

        Buyer buyer = userService.registerBuyer("Secure Buyer", "secure@test.com", "PlainSecretPassword", "+94", "Colombo");

        assertThat(buyer.getPasswordHash()).startsWith("$2a$12$");
        assertThat(passwordEncoder.matches("PlainSecretPassword", buyer.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("CustomUserPrincipal correctly adapts User entity to Spring Security UserDetails")
    void testCustomUserPrincipal() {
        Seller seller = new Seller("Seller A", "seller@shop.com", "$2a$12$sampleHash", "+94", "Shop A", "Galle", new BigDecimal("10.00"));
        seller.setId(42L);

        CustomUserPrincipal principal = new CustomUserPrincipal(seller);

        assertThat(principal.getUsername()).isEqualTo("seller@shop.com");
        assertThat(principal.getPassword()).isEqualTo("$2a$12$sampleHash");
        assertThat(principal.getRoleName()).isEqualTo("SELLER");
        assertThat(principal.getAuthorities()).extracting("authority").containsExactly("ROLE_SELLER");
        assertThat(principal.isEnabled()).isTrue();
        assertThat(principal.isAccountNonLocked()).isTrue();
    }
}
