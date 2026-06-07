package com.backendlab.order;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @PostMapping
    public ResponseEntity<Map<String, String>> createOrder(@RequestBody Map<String, Object> orderRequest) {
        return ResponseEntity.ok(Map.of("orderId", UUID.randomUUID().toString(), "status", "CREATED"));
    }
}
