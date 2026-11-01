package com.serendip.marketplace.service;

import com.serendip.marketplace.dto.order.AdminSellerOrderStatsResponse;
import com.serendip.marketplace.dto.order.SellerOrderResponse;
import com.serendip.marketplace.entity.*;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.exception.BusinessRuleException;
import com.serendip.marketplace.exception.InvalidOrderStateException;
import com.serendip.marketplace.exception.ResourceNotFoundException;
import com.serendip.marketplace.payment.PaymentMethod;
import com.serendip.marketplace.repository.*;
import com.serendip.marketplace.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Service managing orders, checkout processing, status transitions, and seller order fulfillment.
 */
@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final BuyerRepository buyerRepository;
    private final ProductRepository productRepository;
    private final ShoppingCartRepository shoppingCartRepository;
    private final SellerOrderRepository sellerOrderRepository;
    private final PaymentRepository paymentRepository;
    private final SellerRepository sellerRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;

    public OrderService(OrderRepository orderRepository,
                        BuyerRepository buyerRepository,
                        ProductRepository productRepository,
                        ShoppingCartRepository shoppingCartRepository,
                        SellerOrderRepository sellerOrderRepository,
                        PaymentRepository paymentRepository) {
        this(orderRepository, buyerRepository, productRepository, shoppingCartRepository,
                sellerOrderRepository, paymentRepository, null, null);
    }

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        BuyerRepository buyerRepository,
                        ProductRepository productRepository,
                        ShoppingCartRepository shoppingCartRepository,
                        SellerOrderRepository sellerOrderRepository,
                        PaymentRepository paymentRepository,
                        @Autowired(required = false) SellerRepository sellerRepository,
                        @Autowired(required = false) OrderStatusHistoryRepository statusHistoryRepository) {
        this.orderRepository = Objects.requireNonNull(orderRepository);
        this.buyerRepository = Objects.requireNonNull(buyerRepository);
        this.productRepository = Objects.requireNonNull(productRepository);
        this.shoppingCartRepository = Objects.requireNonNull(shoppingCartRepository);
        this.sellerOrderRepository = Objects.requireNonNull(sellerOrderRepository);
        this.paymentRepository = Objects.requireNonNull(paymentRepository);
        this.sellerRepository = sellerRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    /** Processes multi-vendor checkout for a buyer using the selected payment method. */
    public Order checkout(Long buyerId, PaymentMethod paymentMethod) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "checkout for another user");
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", buyerId)));

        // Domain method groups items by seller, reserves stock, and charges payment
        Order order = buyer.checkOut(paymentMethod);

        // Record initial status history for audit timeline
        order.addStatusHistory(null, OrderStatus.PENDING_PAYMENT, buyer.getId(), buyer.getFullName(), "BUYER", "Order placed by customer");
        order.addStatusHistory(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_CONFIRMED, null, "Payment Gateway", "SYSTEM", "Payment confirmed via " + paymentMethod.getMethodName());

        for (SellerOrder subOrder : order.getSellerOrders()) {
            String shopName = subOrder.getSeller() != null ? subOrder.getSeller().getShopName() : "Vendor";
            subOrder.addStatusHistory(null, OrderStatus.PENDING_PAYMENT, buyer.getId(), buyer.getFullName(), "BUYER", "Sub-order created for " + shopName);
            subOrder.addStatusHistory(OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_CONFIRMED, null, "Payment Gateway", "SYSTEM", "Payment confirmed");
        }

        // Persist order with cascading to sub-orders and payment
        Order savedOrder = orderRepository.save(order);

        // Sync updated product stock quantities
        for (SellerOrder subOrder : savedOrder.getSellerOrders()) {
            for (OrderItem item : subOrder.getItems()) {
                productRepository.save(item.getProduct());
            }
        }

        // Persist emptied cart state
        shoppingCartRepository.save(buyer.getCart());

        return savedOrder;
    }

    /** Retrieves an order by its database ID. */
    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Order with id %d not found.", orderId)));
        checkOrderAccess(order);
        return order;
    }

    /** Retrieves an order by its unique public order number. */
    @Transactional(readOnly = true)
    public Order getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Order with number '%s' not found.", orderNumber)));
        checkOrderAccess(order);
        return order;
    }

    /** Retrieves all orders placed by a specific buyer. */
    @Transactional(readOnly = true)
    public List<Order> getOrdersForBuyer(Long buyerId) {
        SecurityUtils.requireOwnershipOrAdmin(buyerId, "order history for another customer");
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Buyer with id %d not found.", buyerId)));
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer);
    }

    /** Cancels an order, releases reserved product stock, and updates status. */
    public Order cancelOrder(Long orderId) {
        return cancelOrder(orderId, "Order cancelled by user");
    }

    /** Cancels an order with an optional reason, releasing reserved product stock. */
    public Order cancelOrder(Long orderId, String reason) {
        Order order = getOrderById(orderId);
        checkOrderAccess(order);

        if (!order.getStatus().isCancellable()) {
            throw new InvalidOrderStateException(
                    String.format("Order %s in status '%s' cannot be cancelled.", order.getOrderNumber(), order.getStatus()));
        }

        OrderStatus prevStatus = order.getStatus();
        order.cancel();

        Long currentUserId = SecurityUtils.getCurrentUserId();
        String currentUserName = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getUsername() : "User";
        String currentUserRole = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getRoleName() : "USER";

        order.addStatusHistory(prevStatus, OrderStatus.CANCELLED, currentUserId, currentUserName, currentUserRole,
                reason != null && !reason.isBlank() ? reason : "Order cancelled");

        // Save restocked products and add history to sub-orders
        for (SellerOrder subOrder : order.getSellerOrders()) {
            OrderStatus subPrev = subOrder.getStatus();
            subOrder.addStatusHistory(subPrev, OrderStatus.CANCELLED, currentUserId, currentUserName, currentUserRole,
                    "Cancelled as part of order cancellation");
            for (OrderItem item : subOrder.getItems()) {
                productRepository.save(item.getProduct());
            }
        }

        return orderRepository.save(order);
    }

    /** Marks a seller sub-order as shipped with carrier tracking details. */
    public SellerOrder fulfillSellerOrder(Long sellerOrderId, String carrier, String trackingNumber) {
        SellerOrder sellerOrder = getSellerOrderById(sellerOrderId);
        if (sellerOrder.getStatus() == OrderStatus.PAYMENT_CONFIRMED || sellerOrder.getStatus() == OrderStatus.PAID) {
            sellerOrder.markProcessing();
        }
        return updateSellerOrderStatus(sellerOrderId, OrderStatus.SHIPPED, carrier, trackingNumber, "Order fulfilled and shipped");
    }

    /** Retrieves all sub-orders fulfilled by a specific seller. */
    @Transactional(readOnly = true)
    public List<SellerOrder> getOrdersForSeller(Long sellerId) {
        SecurityUtils.requireOwnershipOrAdmin(sellerId, "order history for another seller");
        if (sellerRepository == null) {
            return Collections.emptyList();
        }
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));
        return sellerOrderRepository.findBySellerOrderByCreatedAtDesc(seller);
    }

    /** Retrieves details for a specific seller sub-order. */
    @Transactional(readOnly = true)
    public SellerOrder getSellerOrderById(Long sellerOrderId) {
        SellerOrder sellerOrder = sellerOrderRepository.findById(sellerOrderId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller sub-order with id %d not found.", sellerOrderId)));

        if (sellerOrder.getSeller() != null) {
            SecurityUtils.requireOwnershipOrAdmin(sellerOrder.getSeller().getId(), "order belonging to another seller");
        }
        return sellerOrder;
    }

    /** Updates a seller sub-order status according to permitted workflow transitions. */
    public SellerOrder updateSellerOrderStatus(Long sellerOrderId, OrderStatus targetStatus,
                                               String carrier, String trackingNumber, String reason) {
        SellerOrder sellerOrder = getSellerOrderById(sellerOrderId);
        OrderStatus currentStatus = sellerOrder.getStatus();

        if (currentStatus == targetStatus) {
            return sellerOrder;
        }

        boolean isAdmin = SecurityUtils.isAdmin();
        if (targetStatus == OrderStatus.SHIPPED && (currentStatus == OrderStatus.PAYMENT_CONFIRMED || currentStatus == OrderStatus.PAID)) {
            sellerOrder.markProcessing();
            currentStatus = OrderStatus.PROCESSING;
        }

        if (currentStatus != targetStatus && !currentStatus.canTransitionTo(targetStatus) && !isAdmin) {
            throw new InvalidOrderStateException(
                    String.format("Cannot transition sub-order from '%s' to '%s'. Permitted transitions must follow sequence.",
                            currentStatus, targetStatus));
        }

        Long currentUserId = SecurityUtils.getCurrentUserId();
        String currentUserName = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getUsername() : "Seller";
        String currentUserRole = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getRoleName() : "SELLER";

        if (targetStatus == OrderStatus.PROCESSING) {
            sellerOrder.markProcessing();
        } else if (targetStatus == OrderStatus.SHIPPED) {
            if (sellerOrder.getStatus() == OrderStatus.PAYMENT_CONFIRMED || sellerOrder.getStatus() == OrderStatus.PAID) {
                sellerOrder.markProcessing();
            }
            String shipCarrier = carrier != null && !carrier.isBlank() ? carrier : "Sri Lanka Post Express";
            String shipTracking = trackingNumber != null && !trackingNumber.isBlank() ? trackingNumber : "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            sellerOrder.markShipped(shipCarrier, shipTracking);
        } else if (targetStatus == OrderStatus.OUT_FOR_DELIVERY) {
            if (sellerOrder.getStatus() == OrderStatus.PROCESSING) {
                String shipCarrier = carrier != null && !carrier.isBlank() ? carrier : "Sri Lanka Post Express";
                String shipTracking = trackingNumber != null && !trackingNumber.isBlank() ? trackingNumber : "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                sellerOrder.markShipped(shipCarrier, shipTracking);
            }
            sellerOrder.markOutForDelivery();
        } else if (targetStatus == OrderStatus.DELIVERED) {
            if (sellerOrder.getStatus() == OrderStatus.PROCESSING) {
                String shipCarrier = carrier != null && !carrier.isBlank() ? carrier : "Sri Lanka Post Express";
                String shipTracking = trackingNumber != null && !trackingNumber.isBlank() ? trackingNumber : "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                sellerOrder.markShipped(shipCarrier, shipTracking);
            }
            sellerOrder.markDelivered();
        } else if (targetStatus == OrderStatus.CANCELLED) {
            sellerOrder.cancel();
            for (OrderItem item : sellerOrder.getItems()) {
                productRepository.save(item.getProduct());
            }
        } else {
            sellerOrder.setStatus(targetStatus);
        }

        sellerOrder.addStatusHistory(currentStatus, targetStatus, currentUserId, currentUserName, currentUserRole,
                reason != null && !reason.isBlank() ? reason : "Status changed to " + targetStatus.getDisplayName());

        // Update aggregate parent order status
        updateParentOrderAggregateStatus(sellerOrder.getOrder());

        return sellerOrderRepository.save(sellerOrder);
    }

    /** Synchronizes aggregate order status based on all child seller sub-orders. */
    private void updateParentOrderAggregateStatus(Order order) {
        if (order == null || order.getSellerOrders().isEmpty()) {
            return;
        }

        List<SellerOrder> subOrders = order.getSellerOrders();
        boolean allDelivered = subOrders.stream().allMatch(so -> so.getStatus() == OrderStatus.DELIVERED || so.getStatus() == OrderStatus.COMPLETED);
        boolean anyOutForDelivery = subOrders.stream().anyMatch(so -> so.getStatus() == OrderStatus.OUT_FOR_DELIVERY);
        boolean anyShipped = subOrders.stream().anyMatch(so -> so.getStatus() == OrderStatus.SHIPPED);
        boolean anyProcessing = subOrders.stream().anyMatch(so -> so.getStatus() == OrderStatus.PROCESSING);
        boolean allCancelled = subOrders.stream().allMatch(so -> so.getStatus() == OrderStatus.CANCELLED);

        OrderStatus target = order.getStatus();
        if (allDelivered) {
            target = OrderStatus.DELIVERED;
        } else if (anyOutForDelivery) {
            target = OrderStatus.OUT_FOR_DELIVERY;
        } else if (anyShipped) {
            target = OrderStatus.SHIPPED;
        } else if (anyProcessing && order.getStatus() == OrderStatus.PAYMENT_CONFIRMED) {
            target = OrderStatus.PROCESSING;
        } else if (allCancelled) {
            target = OrderStatus.CANCELLED;
        }

        if (target != order.getStatus()) {
            OrderStatus prev = order.getStatus();
            order.setStatus(target);
            order.addStatusHistory(prev, target, null, "Workflow Engine", "SYSTEM",
                    "Aggregate order status updated to " + target.getDisplayName());
            orderRepository.save(order);
        }
    }

    /** Administrator: Retrieves all marketplace orders with optional filtering and search. */
    @Transactional(readOnly = true)
    public List<Order> getAllOrdersAdmin(String search, String status, Long sellerId, Long buyerId) {
        if (!SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Administrative privileges required to access platform orders.");
        }

        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream()
                .filter(o -> {
                    if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
                        if (!o.getStatus().name().equalsIgnoreCase(status)) {
                            return false;
                        }
                    }
                    if (buyerId != null) {
                        if (o.getBuyer() == null || !Objects.equals(o.getBuyer().getId(), buyerId)) {
                            return false;
                        }
                    }
                    if (sellerId != null) {
                        boolean matchSeller = o.getSellerOrders().stream()
                                .anyMatch(so -> so.getSeller() != null && Objects.equals(so.getSeller().getId(), sellerId));
                        if (!matchSeller) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase().trim();
                        boolean matchNumber = o.getOrderNumber().toLowerCase().contains(s);
                        boolean matchBuyer = o.getBuyer() != null && (
                                o.getBuyer().getFullName().toLowerCase().contains(s) ||
                                        o.getBuyer().getEmail().toLowerCase().contains(s)
                        );
                        boolean matchSeller = o.getSellerOrders().stream().anyMatch(so ->
                                so.getSeller() != null && (
                                        so.getSeller().getShopName().toLowerCase().contains(s) ||
                                                so.getSeller().getFullName().toLowerCase().contains(s)
                                )
                        );
                        boolean matchProduct = o.getSellerOrders().stream().flatMap(so -> so.getItems().stream())
                                .anyMatch(i -> i.getProductNameAtPurchase().toLowerCase().contains(s));
                        return matchNumber || matchBuyer || matchSeller || matchProduct;
                    }
                    return true;
                })
                .toList();
    }

    /** Administrator: Overrides order status and records mandatory audit reason. */
    public Order adminUpdateOrderStatus(Long orderId, OrderStatus newStatus, String reason) {
        if (!SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Only administrators can execute administrative order overrides.");
        }

        Order order = getOrderById(orderId);
        OrderStatus prevStatus = order.getStatus();

        if (prevStatus == newStatus) {
            return order;
        }

        Long adminId = SecurityUtils.getCurrentUserId();
        String adminName = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getUsername() : "Admin";

        order.setStatus(newStatus);
        order.addStatusHistory(prevStatus, newStatus, adminId, adminName, "ADMIN",
                reason != null && !reason.isBlank() ? reason : "Administrative status update");

        // Update child sub-orders
        for (SellerOrder subOrder : order.getSellerOrders()) {
            OrderStatus subPrev = subOrder.getStatus();
            subOrder.setStatus(newStatus);
            subOrder.addStatusHistory(subPrev, newStatus, adminId, adminName, "ADMIN",
                    "Administrative status update: " + (reason != null ? reason : ""));

            if (newStatus == OrderStatus.CANCELLED) {
                for (OrderItem item : subOrder.getItems()) {
                    productRepository.save(item.getProduct());
                }
            }
        }

        return orderRepository.save(order);
    }

    /** Administrator: Calculates seller-specific order metrics, revenue, and commissions. */
    @Transactional(readOnly = true)
    public AdminSellerOrderStatsResponse getSellerOrderAnalytics(Long sellerId) {
        if (!SecurityUtils.isAdmin()) {
            SecurityUtils.requireOwnershipOrAdmin(sellerId, "seller metrics");
        }
        if (sellerRepository == null) {
            throw new BusinessRuleException("Seller repository not initialized.");
        }

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException(String.format("Seller with id %d not found.", sellerId)));

        List<SellerOrder> sellerOrders = sellerOrderRepository.findBySellerOrderByCreatedAtDesc(seller);

        long totalOrders = sellerOrders.size();
        long totalQuantitySold = sellerOrders.stream()
                .flatMap(so -> so.getItems().stream())
                .mapToLong(OrderItem::getQuantity)
                .sum();
        long totalProductsSold = sellerOrders.stream()
                .flatMap(so -> so.getItems().stream())
                .map(OrderItem::getProduct)
                .distinct()
                .count();

        BigDecimal totalRevenue = sellerOrders.stream()
                .map(SellerOrder::getSubtotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCommission = sellerOrders.stream()
                .map(SellerOrder::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEarnings = totalRevenue.subtract(totalCommission);

        long pendingCount = sellerOrders.stream().filter(so -> so.getStatus() == OrderStatus.PENDING_PAYMENT || so.getStatus() == OrderStatus.PAID || so.getStatus() == OrderStatus.PAYMENT_CONFIRMED).count();
        long processingCount = sellerOrders.stream().filter(so -> so.getStatus() == OrderStatus.PROCESSING).count();
        long shippedCount = sellerOrders.stream().filter(so -> so.getStatus() == OrderStatus.SHIPPED || so.getStatus() == OrderStatus.OUT_FOR_DELIVERY).count();
        long deliveredCount = sellerOrders.stream().filter(so -> so.getStatus() == OrderStatus.DELIVERED || so.getStatus() == OrderStatus.COMPLETED).count();
        long cancelledCount = sellerOrders.stream().filter(so -> so.getStatus() == OrderStatus.CANCELLED).count();

        List<SellerOrderResponse> responses = sellerOrders.stream()
                .map(SellerOrderResponse::fromEntity)
                .toList();

        return new AdminSellerOrderStatsResponse(
                seller.getId(),
                seller.getShopName(),
                seller.getFullName(),
                seller.getEmail(),
                seller.getPhoneNumber(),
                seller.getOriginCity(),
                seller.getCommissionRate(),
                totalOrders,
                totalProductsSold,
                totalQuantitySold,
                totalRevenue,
                totalCommission,
                totalEarnings,
                pendingCount,
                processingCount,
                shippedCount,
                deliveredCount,
                cancelledCount,
                responses
        );
    }

    /** Administrator: Exports all order items and commission reports to CSV format. */
    @Transactional(readOnly = true)
    public byte[] exportOrdersCsv() {
        if (!SecurityUtils.isAdmin()) {
            throw new AccessDeniedException("Administrative privileges required to export order reports.");
        }

        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        StringBuilder sb = new StringBuilder();

        // CSV Header as requested
        sb.append("Order Number,Order Date,Buyer Name,Buyer Email,Seller Name,Seller Email,Product Name,Product Quantity,Product Price,Order Total,Commission Rate (%),Commission Amount ($),Seller Earnings ($),Payment Method,Payment Status,Order Status\n");

        for (Order order : orders) {
            String orderNum = csvEscape(order.getOrderNumber());
            String orderDate = csvEscape(order.getCreatedAt().toString());
            String buyerName = order.getBuyer() != null ? csvEscape(order.getBuyer().getFullName()) : "N/A";
            String buyerEmail = order.getBuyer() != null ? csvEscape(order.getBuyer().getEmail()) : "N/A";
            String payMethod = csvEscape(order.getPaymentMethodName() != null ? order.getPaymentMethodName() : "Card");
            String payStatus = order.getPayment() != null ? csvEscape(order.getPayment().getStatus().name()) : "PENDING";
            String orderStatus = csvEscape(order.getStatus().name());
            BigDecimal orderTotal = order.getTotalAmount();

            for (SellerOrder subOrder : order.getSellerOrders()) {
                String sellerName = subOrder.getSeller() != null ? csvEscape(subOrder.getSeller().getShopName()) : "N/A";
                String sellerEmail = subOrder.getSeller() != null ? csvEscape(subOrder.getSeller().getEmail()) : "N/A";
                BigDecimal commRate = subOrder.getCommissionRate() != null ? subOrder.getCommissionRate() : BigDecimal.ZERO;
                BigDecimal commAmt = subOrder.getCommissionAmount() != null ? subOrder.getCommissionAmount() : BigDecimal.ZERO;
                BigDecimal sellerEarnings = subOrder.getSubtotalAmount().subtract(commAmt);

                for (OrderItem item : subOrder.getItems()) {
                    sb.append(orderNum).append(",")
                            .append(orderDate).append(",")
                            .append(buyerName).append(",")
                            .append(buyerEmail).append(",")
                            .append(sellerName).append(",")
                            .append(sellerEmail).append(",")
                            .append(csvEscape(item.getProductNameAtPurchase())).append(",")
                            .append(item.getQuantity()).append(",")
                            .append(item.getUnitPriceAtPurchase()).append(",")
                            .append(orderTotal).append(",")
                            .append(commRate).append(",")
                            .append(commAmt).append(",")
                            .append(sellerEarnings).append(",")
                            .append(payMethod).append(",")
                            .append(payStatus).append(",")
                            .append(orderStatus).append("\n");
                }
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csvEscape(String field) {
        if (field == null) return "";
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }

    /** Administrator: Deletes all platform orders. */
    @Transactional
    public int deleteAllOrders() {
        SecurityUtils.requireAdmin("clear all orders");
        List<Order> orders = orderRepository.findAll();
        int count = orders.size();
        for (Order order : orders) {
            orderRepository.delete(order);
        }
        return count;
    }

    /** Checks that the current user owns this order or has admin access. */
    private void checkOrderAccess(Order order) {
        if (SecurityUtils.isAdmin() || SecurityUtils.getCurrentUserId() == null) {
            return;
        }
        Long currentUserId = SecurityUtils.getCurrentUserId();
        boolean isBuyer = order.getBuyer() != null && Objects.equals(order.getBuyer().getId(), currentUserId);
        boolean isSeller = order.getSellerOrders().stream()
                .anyMatch(so -> so.getSeller() != null && Objects.equals(so.getSeller().getId(), currentUserId));

        if (!isBuyer && !isSeller) {
            throw new AccessDeniedException("You do not have permission to view or manage this order.");
        }
    }
}
