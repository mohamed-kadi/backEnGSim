package com.backendlab.engine;

import java.util.List;

public record ScenarioDefinition(
        String id,
        String title,
        String category,
        String difficulty,
        String trigger,
        String failureMode,
        String learningGoal,
        String seniorDiagnosis,
        String remediation,
        List<String> affectedComponents,
        List<String> concepts,
        List<String> investigationSteps
) {
}
