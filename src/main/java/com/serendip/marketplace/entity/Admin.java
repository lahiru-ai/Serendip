package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.UserRole;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * Represents an administrator who manages users, commission rates, and revenue.
 */
// Language: Jakarta Persistence (JPA) / Subclass Table Mapping
// Purpose: Maps the 'Admin' subclass to 'admins' table joined on 'user_id' with discriminator value 'ADMIN'.
@Entity
@Table(name = "admins")
@DiscriminatorValue("ADMIN")
@PrimaryKeyJoinColumn(name = "user_id")
public class Admin extends User {

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Maps administrator organizational department to 'department' column.
    @Column(name = "department", length = 100)
    private String department = "Operations";

    protected Admin() {
        super();
    }

    public Admin(String fullName, String email, String passwordHash) {
        this(fullName, email, passwordHash, null, "Operations");
    }

    public Admin(String fullName, String email, String passwordHash, String department) {
        this(fullName, email, passwordHash, null, department);
    }

    public Admin(String fullName, String email, String passwordHash, String phoneNumber, String department) {
        super(fullName, email, passwordHash, phoneNumber);
        this.department = department != null && !department.isBlank() ? department.trim() : "Operations";
    }

    @Override
    public UserRole getRole() {
        return UserRole.ADMIN;
    }

    /** Suspends a user account. */
    public void suspendUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        user.suspend();
    }

    /** Activates a suspended user account. */
    public void activateUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null.");
        }
        user.activate();
    }

    /** Returns an unmodifiable view of registered users. */
    public List<User> listAllUsers(List<User> registry) {
        if (registry == null) {
            return Collections.emptyList();
        }
        return Collections.unmodifiableList(registry);
    }

    /** Sets the platform commission percentage for a specific seller. */
    public void setSellerCommissionRate(Seller seller, BigDecimal commissionRate) {
        if (seller == null) {
            throw new IllegalArgumentException("Seller cannot be null.");
        }
        if (commissionRate == null || commissionRate.compareTo(BigDecimal.ZERO) < 0 || commissionRate.compareTo(new BigDecimal("100.00")) > 0) {
            throw new IllegalArgumentException("Commission rate must be between 0% and 100%.");
        }
        seller.setCommissionRate(commissionRate);
    }

    /** Calculates the platform commission for a seller sub-order. */
    public BigDecimal calculateCommission(SellerOrder subOrder) {
        if (subOrder == null) {
            return BigDecimal.ZERO;
        }
        return subOrder.getCommissionAmount();
    }

    /** Calculates the total commission earned from all sub-orders in an order. */
    public BigDecimal calculateTotalCommission(Order order) {
        if (order == null) {
            return BigDecimal.ZERO;
        }
        return order.getTotalCommissionAmount();
    }

    /** Calculates the total commission earned across multiple orders. */
    public BigDecimal calculateTotalCommission(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return orders.stream()
                .map(Order::getTotalCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        if (department == null || department.isBlank()) {
            throw new IllegalArgumentException("Department cannot be blank.");
        }
        this.department = department.trim();
    }
}
