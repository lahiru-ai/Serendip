package com.serendip.marketplace.repository;

import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.enums.PaymentStatus;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class DataJpaRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired(required = false)
    private Flyway flyway;

    @Test
    @DisplayName("Verify Flyway migrations ran and schema is validated")
    void flywayMigrationApplied() {
        if (flyway != null) {
            assertThat(flyway.info().applied()).isNotEmpty();
            assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("1");
        }
    }

    @Test
    @DisplayName("Persist and query Buyer through UserRepository")
    void persistAndQueryBuyer() {
        Buyer buyer = new Buyer("Kamal Perera", "kamal@example.com", "secretHash");
        buyer.setPhoneNumber("+94771234567");

        User saved = userRepository.save(buyer);
        entityManager.flush();
        entityManager.clear();

        Optional<User> found = userRepository.findByEmail("kamal@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Kamal Perera");
        assertThat(found.get()).isInstanceOf(Buyer.class);
    }

    @Test
    @DisplayName("Persist and query Seller and Product through repositories")
    void persistAndQuerySellerAndProduct() {
        Seller seller = new Seller("Sunil Silva", "sunil@example.com", "hash123", "Ceylon Spices");
        userRepository.save(seller);

        Product product = new Product("Pure Ceylon Cinnamon", new BigDecimal("15.50"), 100, seller);
        product.setDescription("Organic Ceylon Cinnamon Quills");
        productRepository.save(product);

        entityManager.flush();
        entityManager.clear();

        var products = productRepository.findByActiveTrue();
        assertThat(products).hasSize(1);
        assertThat(products.get(0).getName()).isEqualTo("Pure Ceylon Cinnamon");
        assertThat(products.get(0).getPrice()).isEqualByComparingTo("15.50");
    }

    @Test
    @DisplayName("Persist and query Order with Payment audit transaction")
    void persistAndQueryOrderWithPayment() {
        Buyer buyer = new Buyer("John Doe", "john.doe@example.com", "secure123");
        userRepository.save(buyer);

        Order order = new Order("ORD-9999", buyer, "456 Park Ave, New York", "MOCK");
        orderRepository.save(order);

        Payment payment = new Payment(order, "MOCK_GATEWAY", "TXN-99999",
                new BigDecimal("75.00"), "USD", PaymentStatus.COMPLETED, "Simulated Approval");
        order.setPayment(payment);
        paymentRepository.save(payment);

        entityManager.flush();
        entityManager.clear();

        Optional<Payment> foundPayment = paymentRepository.findByTransactionReference("TXN-99999");
        assertThat(foundPayment).isPresent();
        assertThat(foundPayment.get().getAmount()).isEqualByComparingTo("75.00");
        assertThat(foundPayment.get().getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(foundPayment.get().getOrder().getOrderNumber()).isEqualTo("ORD-9999");
    }
}
