package com.backendlab.app;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class OrderClient {
    
    private final RestTemplate restTemplate = new RestTemplate();

    public void createWelcomeOrder(String username) {
        // Make an HTTP POST request across the network to the Order Service microservice
        String orderServiceUrl = "http://localhost:8081/api/orders";
        restTemplate.postForEntity(orderServiceUrl, Map.of("username", username), String.class);
    }
}