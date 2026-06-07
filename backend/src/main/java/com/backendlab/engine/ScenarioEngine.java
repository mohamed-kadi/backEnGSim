package com.backendlab.engine;

import org.springframework.stereotype.Service;
import java.util.concurrent.atomic.AtomicReference;
import java.util.List;
import java.util.Collections;
import java.util.ArrayList;

@Service
public class ScenarioEngine {

    private final AtomicReference<String> activeScenarioId = new AtomicReference<>(null);
    private final List<byte[]> memoryLeakList = Collections.synchronizedList(new ArrayList<>());

    private final IncidentLogger logger;

    public ScenarioEngine(IncidentLogger logger) {
        this.logger = logger;
        this.logger.log("[SCENARIO ENGINE] Initialized and standing by.");
    }

    /**
     * Activates a specific scenario by its ID.
     * @param scenarioId The ID of the scenario to activate (e.g., "01-dto-regression").
     */
    public void activateScenario(String scenarioId) {
        activeScenarioId.set(scenarioId);
        logger.log("[SCENARIO ENGINE] Activated incident scenario: " + scenarioId);
    }

    /**
     * Resets the system to a clean, deterministic state.
     */
    public void resetScenario() {
        activeScenarioId.set(null);
        memoryLeakList.clear();
        System.gc(); // Suggest garbage collection to clean up the simulation
        logger.log("[SCENARIO ENGINE] Reset system state to default behavior.");
    }

    /**
     * Checks if a specific scenario is currently active.
     */
    public boolean isScenarioActive(String scenarioId) {
        return scenarioId.equals(activeScenarioId.get());
    }

    /**
     * Gets the currently active scenario ID, or null if none.
     */
    public String getActiveScenario() {
        return activeScenarioId.get();
    }

    /**
     * Simulates a memory leak by retaining a large block of memory.
     */
    public void consumeMemory() {
        // Allocate 10MB of memory per call
        memoryLeakList.add(new byte[10 * 1024 * 1024]);
        logger.log("[SCENARIO ENGINE] Memory leak increased. Retained allocations: " + memoryLeakList.size());
    }
}
