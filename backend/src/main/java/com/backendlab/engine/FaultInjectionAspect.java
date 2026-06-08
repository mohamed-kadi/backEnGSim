package com.backendlab.engine;

import com.backendlab.app.User;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.http.ResponseEntity;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;

@Aspect
@Component
public class FaultInjectionAspect {

    private final ScenarioEngine scenarioEngine;
    private final MeterRegistry meterRegistry;
    private final IncidentLogger logger;

    public FaultInjectionAspect(ScenarioEngine scenarioEngine, MeterRegistry meterRegistry, IncidentLogger logger) {
        this.scenarioEngine = scenarioEngine;
        this.meterRegistry = meterRegistry;
        this.logger = logger;
    }

    private void logAndRecordFault(String scenarioId, String message) {
        logger.log("[FAULT INJECTED] Intercepted call for " + scenarioId + ": " + message);
        meterRegistry.counter("fault.injected.total", "scenario", scenarioId).increment();
    }

    /**
     * Intercepts getUserById to simulate a DTO regression where the email field is suddenly null.
     */
    @Around("execution(* com.backendlab.app.UserController.getUserById(..))")
    public Object injectDtoRegression(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();
        
        if (scenarioEngine.isScenarioActive("01-dto-regression")) {
            logAndRecordFault("01-dto-regression", "Setting email to null to break contract");
            if (result instanceof ResponseEntity) {
                ResponseEntity<?> response = (ResponseEntity<?>) result;
                if (response.getBody() instanceof User) {
                    User user = (User) response.getBody();
                    // Deliberately break the contract by removing the email
                    User brokenUser = new User(user.getUsername(), null);
                    brokenUser.setId(user.getId());
                    return ResponseEntity.ok(brokenUser);
                }
            }
        }
        
        return result;
    }

    /**
     * Intercepts getUserById to simulate OpenAPI drift where the runtime payload no longer matches
     * the documented/generated client contract.
     */
    @Around("execution(* com.backendlab.app.UserController.getUserById(..))")
    public Object injectOpenApiContractDrift(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();

        if (scenarioEngine.isScenarioActive("10-openapi-contract-drift")) {
            logAndRecordFault("10-openapi-contract-drift", "Renaming email to contactEmail to simulate OpenAPI contract drift");
            if (result instanceof ResponseEntity) {
                ResponseEntity<?> response = (ResponseEntity<?>) result;
                if (response.getBody() instanceof User) {
                    User user = (User) response.getBody();
                    Map<String, Object> driftedPayload = new LinkedHashMap<>();
                    driftedPayload.put("id", user.getId());
                    driftedPayload.put("username", user.getUsername());
                    driftedPayload.put("contactEmail", user.getEmail());
                    return ResponseEntity.status(response.getStatusCode()).body(driftedPayload);
                }
            }
        }

        return result;
    }

    /**
     * Intercepts all UserController methods to simulate an API degradation/latency issue.
     */
    @Around("execution(* com.backendlab.app.UserController.*(..))")
    public Object injectApiLatency(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("02-api-latency")) {
            logAndRecordFault("02-api-latency", "Adding 3000ms delay to " + joinPoint.getSignature().getName());
            // Add 3 seconds of artificial latency
            Thread.sleep(3000);
        }
        
        return joinPoint.proceed();
    }

    /**
     * Intercepts all UserRepository methods to simulate a database connection failure.
     */
    @Around("execution(* com.backendlab.app.UserRepository.*(..))")
    public Object injectDatabaseFailure(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("03-db-connection")) {
            logAndRecordFault("03-db-connection", "Simulating database connection failure in " + joinPoint.getSignature().getName());
            throw new DataAccessResourceFailureException("Simulated connection pool timeout or database unavailable");
        }
        
        return joinPoint.proceed();
    }

    /**
     * Intercepts UserController methods to simulate a cache stampede or Redis connection failure.
     * This introduces high latency followed by a failure, mimicking a system under heavy DB load when cache is missed.
     */
    @Around("execution(* com.backendlab.app.UserController.*(..))")
    public Object injectCacheStampede(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("04-cache-stampede")) {
            logAndRecordFault("04-cache-stampede", "Simulating cache stampede / Redis timeout");
            Thread.sleep(5000); // 5 seconds latency to simulate DB overload
            throw new RuntimeException("Simulated Redis connection timeout resulting in cache stampede");
        }
        
        return joinPoint.proceed();
    }

    /**
     * Intercepts createUser to simulate a write failure (e.g., DB constraint violation or deadlock).
     */
    @Around("execution(* com.backendlab.app.UserController.createUser(..))")
    public Object injectWriteFailure(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("05-write-failure")) {
            logAndRecordFault("05-write-failure", "Simulating DataIntegrityViolationException");
            throw new DataIntegrityViolationException("Simulated unique constraint violation or write lock timeout");
        }
        
        return joinPoint.proceed();
    }

    /**
     * Intercepts all UserController methods to simulate a JVM memory leak.
     */
    @Around("execution(* com.backendlab.app.UserController.*(..))")
    public Object injectMemoryLeak(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("06-memory-leak")) {
            logAndRecordFault("06-memory-leak", "Simulating memory leak");
            scenarioEngine.consumeMemory();
        }
        
        return joinPoint.proceed();
    }

    /**
     * Intercepts cross-service HTTP calls to simulate a network partition or remote service crash.
     */
    @Around("execution(* com.backendlab.app.OrderClient.createWelcomeOrder(..))")
    public Object injectSagaFailure(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("08-saga-failure")) {
            logAndRecordFault("08-saga-failure", "Simulating Order Service timeout/failure for Saga pattern");
            throw new RuntimeException("504 Gateway Timeout: Order Service is unreachable");
        }
        return joinPoint.proceed();
    }

    /**
     * Intercepts API requests to simulate a Rate Limiting / DDoS protection mechanism.
     */
    @Around("execution(* com.backendlab.app.UserController.*(..))")
    public Object injectRateLimiting(ProceedingJoinPoint joinPoint) throws Throwable {
        if (scenarioEngine.isScenarioActive("09-rate-limiting")) {
            logAndRecordFault("09-rate-limiting", "Simulating API Rate Limit Exceeded (HTTP 429)");
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded. Please try again later.");
        }
        return joinPoint.proceed();
    }
}
