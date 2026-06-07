package com.backendlab.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/_system/scenario")
public class ScenarioController {

    private final ScenarioEngine scenarioEngine;
    private final ScenarioCatalog scenarioCatalog;

    public ScenarioController(ScenarioEngine scenarioEngine, ScenarioCatalog scenarioCatalog) {
        this.scenarioEngine = scenarioEngine;
        this.scenarioCatalog = scenarioCatalog;
    }

    @PostMapping("/activate/{id}")
    public ResponseEntity<Map<String, String>> activateScenario(@PathVariable String id) {
        if (!scenarioCatalog.exists(id)) {
            return ResponseEntity.badRequest().body(Map.of("status", "unknown", "scenario", id));
        }
        scenarioEngine.activateScenario(id);
        return ResponseEntity.ok(Map.of("status", "activated", "scenario", id));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetScenario() {
        scenarioEngine.resetScenario();
        return ResponseEntity.ok(Map.of("status", "reset"));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> getStatus() {
        String activeId = scenarioEngine.getActiveScenario();
        return ResponseEntity.ok(Map.of("activeScenario", activeId != null ? activeId : "none"));
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<ScenarioDefinition>> getCatalog() {
        return ResponseEntity.ok(scenarioCatalog.findAll());
    }

    @GetMapping("/catalog/{id}")
    public ResponseEntity<ScenarioDefinition> getScenario(@PathVariable String id) {
        return scenarioCatalog.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
