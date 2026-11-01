package com.serendip.marketplace.config;

import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.repository.ProductRepository;
import com.serendip.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Initializes default demo accounts and catalog products on application startup.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ProductRepository productRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        Seller seller = seedSeller();
        seedBuyer();
        seedSampleProducts(seller);
    }

    /** Seeds the platform administrator account if it does not already exist. */
    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@serendip.com")) {
            Admin admin = new Admin(
                    "System Administrator",
                    "admin@serendip.com",
                    passwordEncoder.encode("AdminPass123!"),
                    "+94112345678",
                    "Platform Governance"
            );
            userRepository.save(admin);
            log.info("Initialized default administrator account: admin@serendip.com");
        }
    }

    /** Seeds the demo seller merchant account if it does not already exist. */
    private Seller seedSeller() {
        return userRepository.findByEmail("seller@serendip.com")
                .filter(u -> u instanceof Seller)
                .map(u -> (Seller) u)
                .orElseGet(() -> {
                    if (!userRepository.existsByEmail("seller@serendip.com")) {
                        Seller seller = new Seller(
                                "Ceylon Heritage Crafts",
                                "seller@serendip.com",
                                passwordEncoder.encode("SellerPass123!"),
                                "+94771234567",
                                "Ceylon Heritage Shop",
                                "Kandy",
                                new BigDecimal("10.00")
                        );
                        seller.setShopDescription("Authentic Sri Lankan artisan crafts, Ceylon tea, spices, and gems.");
                        Seller saved = userRepository.save(seller);
                        log.info("Initialized default seller account: seller@serendip.com");
                        return saved;
                    }
                    return null;
                });
    }

    /** Seeds the demo buyer customer account if it does not already exist. */
    private void seedBuyer() {
        if (!userRepository.existsByEmail("buyer@serendip.com")) {
            Buyer buyer = new Buyer(
                    "John Smith",
                    "buyer@serendip.com",
                    passwordEncoder.encode("BuyerPass123!"),
                    "+447911123456",
                    "45 Kensington High Street, London, UK"
            );
            userRepository.save(buyer);
            log.info("Initialized default buyer account: buyer@serendip.com");
        }
    }

    /** Seeds sample products if catalog is currently empty. */
    private void seedSampleProducts(Seller seller) {
        if (seller == null || productRepository.count() > 0) {
            return;
        }

        Product[] sampleProducts = new Product[] {
                Product.createInLkr(
                        "Ceylon Silver Tips White Tea",
                        "Tea",
                        "Handpicked virgin white tea buds from high-elevation Nuwara Eliya estates, offering delicate floral notes.",
                        new BigDecimal("7500.00"),
                        45,
                        seller,
                        100
                ),
                Product.createInLkr(
                        "Ratnapura Royal Blue Sapphire (2.1ct)",
                        "Gems",
                        "Certified unheated natural Ceylon blue sapphire with vivid cornflower hue and precision cushion cut.",
                        new BigDecimal("285000.00"),
                        3,
                        seller,
                        15
                ),
                Product.createInLkr(
                        "Organic Ceylon True Cinnamon Quills (Alba Grade)",
                        "Spices",
                        "Pure Cinnamomum verum quills harvested from southern Sri Lankan coastal plantations, rich in cinnamaldehyde.",
                        new BigDecimal("3600.00"),
                        80,
                        seller,
                        250
                ),
                Product.createInLkr(
                        "Hand-Carved Traditional Peacock Mask (Mayura Raksha)",
                        "Crafts",
                        "Intricately hand-carved Kaduru wood mask painted with natural pigments to bring peace and harmony.",
                        new BigDecimal("12500.00"),
                        12,
                        seller,
                        600
                ),
                Product.createInLkr(
                        "Handloom Pure Cotton Batik Sarong",
                        "Apparel",
                        "Traditional hand-dyed wax batik sarong made from 100% breathable Ceylon cotton in deep indigo motifs.",
                        new BigDecimal("6200.00"),
                        30,
                        seller,
                        350
                ),
                Product.createInLkr(
                        "Single-Estate Ruhuna BOPF Black Tea",
                        "Tea",
                        "Robust, full-bodied low-grown Ceylon black tea with rich caramel sweetness, perfect for morning milk brew.",
                        new BigDecimal("2400.00"),
                        100,
                        seller,
                        500
                )
        };

        for (Product product : sampleProducts) {
            productRepository.save(product);
        }
        log.info("Initialized {} sample catalog products for merchant {}", sampleProducts.length, seller.getShopName());
    }
}
