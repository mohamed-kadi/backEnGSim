package com.backendlab.app;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class OrderClient {
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final String orderServiceUrl;

    public OrderClient(@Value("${app.order-service.url:http://localhost:8081/api/orders}") String orderServiceUrl) {
        this.orderServiceUrl = orderServiceUrl;
    }

    public void createWelcomeOrder(String username) {
        // Make an HTTP POST request across the network to the Order Service microservice
        restTemplate.postForEntity(orderServiceUrl, Map.of("username", username), String.class);
    }
}
