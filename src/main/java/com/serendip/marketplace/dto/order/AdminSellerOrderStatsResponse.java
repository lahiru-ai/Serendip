package com.serendip.marketplace.dto.order;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated order metrics, sales revenue, and commission analytics for a seller in the admin dashboard.
 */
public record AdminSellerOrderStatsResponse(
        Long sellerId,
        String shopName,
        String sellerName,
        String sellerEmail,
        String sellerPhone,
        String originCity,
        BigDecimal commissionRate,
        long totalOrders,
        long totalProductsSold,
        long totalQuantitySold,
        BigDecimal totalRevenue,
        BigDecimal totalCommissionEarned,
        BigDecimal totalSellerEarnings,
        long pendingCount,
        long processingCount,
        long shippedCount,
        long deliveredCount,
        long cancelledCount,
        List<SellerOrderResponse> orders
) {}
