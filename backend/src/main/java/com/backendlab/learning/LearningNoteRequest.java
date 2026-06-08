package com.backendlab.learning;

import jakarta.validation.constraints.Size;

public record LearningNoteRequest(
        @Size(max = 5000, message = "notes must be 5000 characters or fewer")
        String notes,
        boolean completed
) {
}
