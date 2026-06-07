package com.backendlab.app;

import com.backendlab.engine.IncidentLogger;
import com.backendlab.engine.ScenarioEngine;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class UserEventConsumer {

    private final IncidentLogger logger;
    private final ScenarioEngine scenarioEngine;

    public UserEventConsumer(IncidentLogger logger, ScenarioEngine scenarioEngine) {
        this.logger = logger;
        this.scenarioEngine = scenarioEngine;
    }

    @KafkaListener(topics = "user-events", groupId = "backendlab-group")
    public void consumeUserEvent(String message) throws InterruptedException {
        logger.log("[KAFKA CONSUMER] Picked up event: " + message);
        if (scenarioEngine.isScenarioActive("07-kafka-consumer-lag")) {
            logger.log("[FAULT INJECTED] Intercepted KAFKA CONSUMER for 07-kafka-consumer-lag: Simulating extreme consumer lag (5000ms delay)");
            Thread.sleep(5000); // Simulate severe downstream degradation
        } else {
            Thread.sleep(200); // Normal background processing
        }
        logger.log("[KAFKA CONSUMER] Finished processing event: " + message);
    }
}