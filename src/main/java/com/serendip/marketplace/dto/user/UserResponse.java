package com.serendip.marketplace.dto.user;

import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.User;
import com.serendip.marketplace.security.SecurityUtils;

import java.math.BigDecimal;
import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        String accountStatus,
        String deliveryAddress,
        String shopName,
        String originCity,
        BigDecimal commissionRate,
        Instant createdAt
) {
    public static UserResponse fromEntity(User user) {
        String deliveryAddress = null;
        String shopName = null;
        String originCity = null;
        BigDecimal commissionRate = null;

        if (user instanceof Buyer buyer) {
            deliveryAddress = buyer.getDeliveryAddress();
        } else if (user instanceof Seller seller) {
            shopName = seller.getShopName();
            originCity = seller.getOriginCity();
            // Commission rate is confidential and only visible to administrators
            if (SecurityUtils.isAdmin()) {
                commissionRate = seller.getCommissionRate();
            }
        }

        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole() != null ? user.getRole().name() : null,
                user.getAccountStatus() != null ? user.getAccountStatus().name() : null,
                deliveryAddress,
                shopName,
                originCity,
                commissionRate,
                user.getCreatedAt()
        );
    }
}
