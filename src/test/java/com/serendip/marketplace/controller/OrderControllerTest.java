package com.serendip.marketplace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.serendip.marketplace.dto.order.CheckoutRequest;
import com.serendip.marketplace.dto.order.FulfillOrderRequest;
import com.serendip.marketplace.entity.Buyer;
import com.serendip.marketplace.entity.Order;
import com.serendip.marketplace.entity.Seller;
import com.serendip.marketplace.entity.SellerOrder;
import com.serendip.marketplace.exception.GlobalExceptionHandler;
import com.serendip.marketplace.payment.PaymentMethod;
import com.serendip.marketplace.service.OrderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("Order REST Controller Endpoints")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/v1/orders/checkout - successfully checks out order")
    void checkoutOrder() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Order order = new Order("ORD-1001", buyer, "Colombo", "MOCK");
        order.setId(10L);
        order.markPaid();

        when(orderService.checkout(eq(1L), any(PaymentMethod.class))).thenReturn(order);

        CheckoutRequest request = new CheckoutRequest(1L, "MOCK", true);

        mockMvc.perform(post("/api/v1/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.orderNumber").value("ORD-1001"))
                .andExpect(jsonPath("$.status").value("PAYMENT_CONFIRMED"));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} - returns order details")
    void getOrderById() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Order order = new Order("ORD-1001", buyer, "Colombo", "MOCK");
        order.setId(10L);

        when(orderService.getOrderById(10L)).thenReturn(order);

        mockMvc.perform(get("/api/v1/orders/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.orderNumber").value("ORD-1001"));
    }

    @Test
    @DisplayName("GET /api/v1/orders/number/{orderNumber} - returns order by order number")
    void getOrderByNumber() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Order order = new Order("ORD-1001", buyer, "Colombo", "MOCK");
        order.setId(10L);

        when(orderService.getOrderByOrderNumber("ORD-1001")).thenReturn(order);

        mockMvc.perform(get("/api/v1/orders/number/ORD-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("ORD-1001"));
    }

    @Test
    @DisplayName("GET /api/v1/orders/buyer/{buyerId} - returns list of orders for buyer")
    void getOrdersForBuyer() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Order order = new Order("ORD-1001", buyer, "Colombo", "MOCK");
        order.setId(10L);

        when(orderService.getOrdersForBuyer(1L)).thenReturn(List.of(order));

        mockMvc.perform(get("/api/v1/orders/buyer/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10));
    }

    @Test
    @DisplayName("PUT /api/v1/orders/{id}/cancel - cancels order")
    void cancelOrder() throws Exception {
        Buyer buyer = new Buyer("Kamal", "k@mail.com", "p");
        buyer.setId(1L);
        Order order = new Order("ORD-1001", buyer, "Colombo", "MOCK");
        order.setId(10L);
        order.cancel();

        when(orderService.cancelOrder(10L)).thenReturn(order);

        mockMvc.perform(put("/api/v1/orders/10/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("PUT /api/v1/orders/seller-orders/{sellerOrderId}/fulfill - fulfills seller sub-order")
    void fulfillSellerOrder() throws Exception {
        Seller seller = new Seller("Seller S", "s@mail.com", "p", "Crafts");
        seller.setId(2L);
        SellerOrder subOrder = new SellerOrder(seller);
        subOrder.setId(50L);
        subOrder.markPaid();
        subOrder.markProcessing();
        subOrder.markShipped("DHL Express", "DHL-987654");

        when(orderService.fulfillSellerOrder(eq(50L), eq("DHL Express"), eq("DHL-987654")))
                .thenReturn(subOrder);

        FulfillOrderRequest request = new FulfillOrderRequest("DHL Express", "DHL-987654");

        mockMvc.perform(put("/api/v1/orders/seller-orders/50/fulfill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.carrier").value("DHL Express"))
                .andExpect(jsonPath("$.trackingNumber").value("DHL-987654"))
                .andExpect(jsonPath("$.status").value("SHIPPED"));
    }
}
