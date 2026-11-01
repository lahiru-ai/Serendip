package com.serendip.marketplace.controller;

import com.serendip.marketplace.dto.order.*;
import com.serendip.marketplace.entity.Order;
import com.serendip.marketplace.entity.SellerOrder;
import com.serendip.marketplace.enums.OrderStatus;
import com.serendip.marketplace.payment.MockPaymentMethod;
import com.serendip.marketplace.payment.PaymentMethod;
import com.serendip.marketplace.payment.PaymentMethodFactory;
import com.serendip.marketplace.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for customer order checkout, order retrieval, seller fulfillment, and admin management.
 */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** Executes checkout for a buyer's cart and initiates payment. */
    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        PaymentMethod paymentMethod = PaymentMethodFactory.create(request);
        Order order = orderService.checkout(request.buyerId(), paymentMethod);
        return ResponseEntity.status(HttpStatus.CREATED).body(OrderResponse.fromEntity(order));
    }

    /** Retrieves an order by its database ID. */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    /** Retrieves an order by its unique order number. */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderResponse> getOrderByOrderNumber(@PathVariable String orderNumber) {
        Order order = orderService.getOrderByOrderNumber(orderNumber);
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    /** Retrieves all orders placed by a specific buyer. */
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<OrderResponse>> getOrdersForBuyer(@PathVariable Long buyerId) {
        List<Order> orders = orderService.getOrdersForBuyer(buyerId);
        List<OrderResponse> responses = orders.stream()
                .map(OrderResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /** Cancels an order and releases reserved stock. */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        Order order = (reason != null && !reason.isBlank())
                ? orderService.cancelOrder(id, reason)
                : orderService.cancelOrder(id);
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    /** Retrieves all sub-orders for a specific seller. */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<SellerOrderResponse>> getOrdersForSeller(@PathVariable Long sellerId) {
        List<SellerOrder> orders = orderService.getOrdersForSeller(sellerId);
        List<SellerOrderResponse> responses = orders.stream()
                .map(SellerOrderResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /** Retrieves a single seller sub-order by its database ID. */
    @GetMapping("/seller-orders/{sellerOrderId}")
    public ResponseEntity<SellerOrderResponse> getSellerOrderById(@PathVariable Long sellerOrderId) {
        SellerOrder subOrder = orderService.getSellerOrderById(sellerOrderId);
        return ResponseEntity.ok(SellerOrderResponse.fromEntity(subOrder));
    }

    /** Updates a seller sub-order status according to permitted workflow transitions. */
    @PutMapping("/seller-orders/{sellerOrderId}/status")
    public ResponseEntity<SellerOrderResponse> updateSellerOrderStatus(
            @PathVariable Long sellerOrderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderStatus targetStatus = OrderStatus.valueOf(request.newStatus().trim().toUpperCase());
        SellerOrder subOrder = orderService.updateSellerOrderStatus(
                sellerOrderId, targetStatus, request.carrier(), request.trackingNumber(), request.reason());
        return ResponseEntity.ok(SellerOrderResponse.fromEntity(subOrder));
    }

    /** Updates a seller sub-order with shipping carrier and tracking number (legacy endpoint). */
    @PutMapping("/seller-orders/{sellerOrderId}/fulfill")
    public ResponseEntity<SellerOrderResponse> fulfillSellerOrder(
            @PathVariable Long sellerOrderId,
            @Valid @RequestBody FulfillOrderRequest request) {
        SellerOrder subOrder = orderService.fulfillSellerOrder(sellerOrderId, request.carrier(), request.trackingNumber());
        return ResponseEntity.ok(SellerOrderResponse.fromEntity(subOrder));
    }

    /** Administrator: Retrieves all platform orders with optional filtering and search. */
    @GetMapping("/admin")
    public ResponseEntity<List<OrderResponse>> getAllOrdersAdmin(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) Long buyerId) {
        List<Order> orders = orderService.getAllOrdersAdmin(search, status, sellerId, buyerId);
        List<OrderResponse> responses = orders.stream()
                .map(OrderResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /** Administrator: Administrative order status override with audit logging. */
    @PutMapping("/{id}/admin-status")
    public ResponseEntity<OrderResponse> adminUpdateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderStatus targetStatus = OrderStatus.valueOf(request.newStatus().trim().toUpperCase());
        Order order = orderService.adminUpdateOrderStatus(id, targetStatus, request.reason());
        return ResponseEntity.ok(OrderResponse.fromEntity(order));
    }

    /** Administrator: Retrieves detailed seller sales analytics and order history. */
    @GetMapping("/admin/sellers/{sellerId}")
    public ResponseEntity<AdminSellerOrderStatsResponse> getSellerOrderAnalytics(@PathVariable Long sellerId) {
        AdminSellerOrderStatsResponse response = orderService.getSellerOrderAnalytics(sellerId);
        return ResponseEntity.ok(response);
    }

    /** Administrator: Exports all order items and commissions to CSV. */
    @GetMapping(value = "/admin/export-csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportOrdersCsv() {
        byte[] csvData = orderService.exportOrdersCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=marketplace-orders.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    /** Administrator: Deletes all platform orders. */
    @DeleteMapping("/admin/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllOrders() {
        int count = orderService.deleteAllOrders();
        return ResponseEntity.ok(Map.of("message", "All orders removed successfully", "deletedCount", count));
    }
}
