package com.serendip.marketplace.security;

import com.serendip.marketplace.entity.User;
import com.serendip.marketplace.enums.AccountStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Custom UserDetails implementation holding authenticated user information.
 */
public class CustomUserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final String roleName;
    private final AccountStatus accountStatus;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.roleName = user.getRole() != null ? user.getRole().name() : "BUYER";
        this.accountStatus = user.getAccountStatus() != null ? user.getAccountStatus() : AccountStatus.ACTIVE;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + this.roleName));
    }

    public Long getId() {
        return id;
    }

    public String getRoleName() {
        return roleName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountStatus != AccountStatus.CLOSED;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountStatus != AccountStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return accountStatus == AccountStatus.ACTIVE;
    }
}
