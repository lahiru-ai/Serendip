package com.serendip.marketplace.entity;

import com.serendip.marketplace.enums.AccountStatus;
import com.serendip.marketplace.enums.UserRole;
import com.serendip.marketplace.exception.BusinessRuleException;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;

/**
 * Base user class for all accounts in the marketplace.
 */
// Language: Jakarta Persistence (JPA) / Object-Relational Mapping (ORM)
// Purpose: Configures joined-table inheritance where common user attributes are stored in 'users' and role-specific fields in child tables ('buyers', 'sellers', 'admins') differentiated by the 'role' discriminator column.
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "role", discriminatorType = DiscriminatorType.STRING)
public abstract class User {

    // Language: Jakarta Persistence (JPA) / Primary Key Generation
    // Purpose: Designates 'id' as the unique primary key and delegates auto-incrementing to the database identity sequence.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Maps user's display name to a mandatory (NOT NULL) VARCHAR(150) database column.
    @Column(nullable = false, length = 150)
    private String fullName;

    // Language: Jakarta Persistence (JPA) / Column Constraint Mapping
    // Purpose: Maps the email address with mandatory (NOT NULL) and uniqueness (UNIQUE) constraints for authentication.
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Maps to database column 'password_hash' with VARCHAR(255) to safely store salted BCrypt password hashes.
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    // Language: Jakarta Persistence (JPA) / Column Mapping
    // Purpose: Maps to optional (nullable) database column 'phone_number' with VARCHAR(30).
    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    // Language: Jakarta Persistence (JPA) / Enum Mapping
    // Purpose: Persists the Java enum value as a readable text string (e.g. 'ACTIVE') rather than an ordinal number to prevent data corruption if enum order changes.
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 30)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    // Language: Jakarta Persistence (JPA) / Transient Attribute
    // Purpose: Marks this field as non-persistent; Hibernate will ignore it and create no column in the database. Used only in-memory at runtime.
    @Transient
    private boolean loggedIn = false;

    // Language: Jakarta Persistence (JPA) / Audit Timestamp Mapping
    // Purpose: Records creation time in UTC; 'updatable = false' ensures Hibernate never overwrites this timestamp on SQL UPDATE queries.
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected User() {
    }

    protected User(String fullName, String email, String passwordHash) {
        this(fullName, email, passwordHash, null);
    }

    protected User(String fullName, String email, String passwordHash, String phoneNumber) {
        setFullName(fullName);
        setEmail(email);
        setPasswordHash(passwordHash);
        this.phoneNumber = phoneNumber;
        this.accountStatus = AccountStatus.ACTIVE;
        this.loggedIn = false;
        this.createdAt = Instant.now();
    }

    /** Returns the marketplace role of the user. */
    public abstract UserRole getRole();

    /** Checks if the provided password hash matches the stored password. */
    public boolean checkPassword(String candidateHash) {
        if (candidateHash == null) {
            return false;
        }
        return Objects.equals(this.passwordHash, candidateHash);
    }

    /** Updates the user password hash. */
    public void updatePassword(String newPasswordHash) {
        setPasswordHash(newPasswordHash);
    }

    /** Activates the user account. */
    public void activate() {
        this.accountStatus = AccountStatus.ACTIVE;
    }

    /** Suspends the user account and ends their active session. */
    public void suspend() {
        this.accountStatus = AccountStatus.SUSPENDED;
        this.loggedIn = false;
    }

    /** Locks the user account and ends their active session. */
    public void lock() {
        this.accountStatus = AccountStatus.LOCKED;
        this.loggedIn = false;
    }

    /** Marks the user as logged in if the account is active. */
    public void login() {
        if (this.accountStatus != AccountStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot log in: account is " + this.accountStatus);
        }
        this.loggedIn = true;
    }

    /** Logs the user out by resetting the session flag. */
    public void logout() {
        this.loggedIn = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Full name is required and cannot be blank.");
        }
        this.fullName = fullName.trim();
    }

    public void setName(String name) {
        setFullName(name);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        if (email == null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("A valid email address is required.");
        }
        this.email = email.trim().toLowerCase();
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("Password hash is required.");
        }
        this.passwordHash = passwordHash;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = Objects.requireNonNull(accountStatus, "Account status cannot be null.");
    }

    public boolean isLoggedIn() {
        return loggedIn;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User user)) return false;
        return email != null && email.equalsIgnoreCase(user.email);
    }

    @Override
    public int hashCode() {
        return email != null ? email.toLowerCase().hashCode() : 0;
    }

    @Override
    public String toString() {
        return String.format("%s[name='%s', email='%s', role=%s, status=%s]",
                getClass().getSimpleName(), fullName, email, getRole(), accountStatus);
    }
}
