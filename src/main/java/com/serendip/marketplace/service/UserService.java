package com.serendip.marketplace.service;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.User;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.repository.BuyerRepository;
import com.serendip.marketplace.repository.SellerRepository;
import com.serendip.marketplace.repository.UserRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Service managing user registration, authentication lookups, and account status updates.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final BuyerRepository buyerRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository,
                       BuyerRepository buyerRepository,
                       SellerRepository sellerRepository,
                       ObjectProvider<PasswordEncoder> passwordEncoderProvider) {
        this.userRepository = Objects.requireNonNull(userRepository);
        this.buyerRepository = Objects.requireNonNull(buyerRepository);
        this.sellerRepository = Objects.requireNonNull(sellerRepository);
        this.passwordEncoder = passwordEncoderProvider != null
                ? passwordEncoderProvider.getIfAvailable(() -> new BCryptPasswordEncoder(12))
                : new BCryptPasswordEncoder(12);
    }

    public UserService(UserRepository userRepository,
                       BuyerRepository buyerRepository,
                       SellerRepository sellerRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = Objects.requireNonNull(userRepository);
        this.buyerRepository = Objects.requireNonNull(buyerRepository);
        this.sellerRepository = Objects.requireNonNull(sellerRepository);
        this.passwordEncoder = passwordEncoder != null ? passwordEncoder : new BCryptPasswordEncoder(12);
    }

    public UserService(UserRepository userRepository,
                       BuyerRepository buyerRepository,
                       SellerRepository sellerRepository) {
        this(userRepository, buyerRepository, sellerRepository, (PasswordEncoder) null);
    }

    /** Registers a new buyer account with encrypted password. */
    public Buyer registerBuyer(String fullName, String email, String password,
                               String phoneNumber, String deliveryAddress) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException(String.format("User with email '%s' already exists.", email));
        }
        String passwordHash = encodePassword(password);
        Buyer buyer = new Buyer(fullName, email, passwordHash, phoneNumber, deliveryAddress);
        return buyerRepository.save(buyer);
    }

    /** Registers a new seller account with shop details and commission rate. */
    public Seller registerSeller(String fullName, String email, String password,
                                 String phoneNumber, String shopName, String originCity,
                                 BigDecimal commissionRate) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException(String.format("User with email '%s' already exists.", email));
        }
        if (sellerRepository.existsByShopName(shopName)) {
            throw new BusinessRuleException(String.format("Shop name '%s' is already registered.", shopName));
        }
        String passwordHash = encodePassword(password);
        Seller seller = new Seller(fullName, email, passwordHash, phoneNumber, shopName, originCity, commissionRate);
        return sellerRepository.save(seller);
    }

    /** Encodes raw password text using BCrypt hashing. */
    private String encodePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password cannot be blank.");
        }
        if (passwordEncoder == null || password.startsWith("$2a$") || password.startsWith("$2b$")) {
            return password;
        }
        return passwordEncoder.encode(password);
    }

    /** Retrieves a user by their database ID. */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("User with id %d not found.", id)));
    }

    /** Retrieves a user by their email address. */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("User with email '%s' not found.", email)));
    }

    /** Retrieves a buyer by their user ID. */
    @Transactional(readOnly = true)
    public Buyer getBuyerById(Long id) {
        return buyerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", id)));
    }

    /** Retrieves a seller by their user ID. */
    @Transactional(readOnly = true)
    public Seller getSellerById(Long id) {
        return sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", id)));
    }

    /** Activates a user account. */
    public User activateUser(Long id) {
        User user = getUserById(id);
        user.activate();
        return userRepository.save(user);
    }

    /** Suspends a user account. */
    public User suspendUser(Long id) {
        User user = getUserById(id);
        user.suspend();
        return userRepository.save(user);
    }

    /** Updates a seller's platform commission rate (admin only). */
    public Seller updateSellerCommissionRate(Long sellerId, BigDecimal commissionRate) {
        Seller seller = getSellerById(sellerId);
        if (commissionRate == null || commissionRate.compareTo(BigDecimal.ZERO) < 0 || commissionRate.compareTo(new BigDecimal("100.00")) > 0) {
            throw new IllegalArgumentException("Commission rate must be between 0% and 100%.");
        }
        seller.setCommissionRate(commissionRate);
        return sellerRepository.save(seller);
    }
}
