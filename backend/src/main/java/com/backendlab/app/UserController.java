package com.backendlab.app;

import com.backendlab.engine.IncidentLogger;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User API", description = "Standard business operations for Users")
public class UserController {

    private final UserRepository userRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final OrderClient orderClient;
    private final IncidentLogger logger;

    public UserController(UserRepository userRepository, KafkaTemplate<String, String> kafkaTemplate, OrderClient orderClient, IncidentLogger logger) {
        this.userRepository = userRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.orderClient = orderClient;
        this.logger = logger;
    }

    /**
     * Standard endpoint to fetch a user.
     * This is intercepted by FaultInjectionAspect during the '01-dto-regression' scenario.
     */
    @Operation(summary = "Get User by ID", description = "Fetches a user by their unique ID. During the '01-dto-regression' scenario, this endpoint deliberately drops the email field to simulate a contract-breaking bug.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved user")
    @ApiResponse(responseCode = "404", description = "User not found")
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint to create a new user.
     * Intercepted by FaultInjectionAspect during '05-write-failure' scenario.
     */
    @Operation(summary = "Create a new User", description = "Creates a new user in the system. During the '05-write-failure' scenario, this simulates a database race condition or constraint violation.")
    @ApiResponse(responseCode = "200", description = "Successfully created user")
    @ApiResponse(responseCode = "500", description = "Internal Server Error during write")
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User savedUser = userRepository.save(user);
        try {
            kafkaTemplate.send("user-events", "UserCreated: " + savedUser.getUsername());
        } catch (RuntimeException ex) {
            logger.log("[KAFKA PRODUCER] User event publication failed: " + ex.getMessage());
        }
        
        // Make distributed network call to the secondary microservice
        try {
            orderClient.createWelcomeOrder(savedUser.getUsername());
        } catch (RuntimeException ex) {
            logger.log("[ORDER CLIENT] Welcome order creation failed: " + ex.getMessage());
        }
        
        return ResponseEntity.ok(savedUser);
    }
}
