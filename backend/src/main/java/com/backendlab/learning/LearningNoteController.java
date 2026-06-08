package com.backendlab.learning;

import com.backendlab.engine.ScenarioCatalog;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/_learning/notes")
public class LearningNoteController {

    private final LearningNoteRepository learningNoteRepository;
    private final ScenarioCatalog scenarioCatalog;

    public LearningNoteController(LearningNoteRepository learningNoteRepository, ScenarioCatalog scenarioCatalog) {
        this.learningNoteRepository = learningNoteRepository;
        this.scenarioCatalog = scenarioCatalog;
    }

    @GetMapping
    public ResponseEntity<List<LearningNote>> findAll() {
        return ResponseEntity.ok(learningNoteRepository.findAll());
    }

    @GetMapping("/{scenarioId}")
    public ResponseEntity<LearningNote> findByScenarioId(@PathVariable String scenarioId) {
        if (!scenarioCatalog.exists(scenarioId)) {
            return ResponseEntity.notFound().build();
        }

        return learningNoteRepository.findByScenarioId(scenarioId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new LearningNote(scenarioId, "", false, null)));
    }

    @PutMapping("/{scenarioId}")
    public ResponseEntity<LearningNote> save(
            @PathVariable String scenarioId,
            @Valid @RequestBody LearningNoteRequest request
    ) {
        if (!scenarioCatalog.exists(scenarioId)) {
            return ResponseEntity.notFound().build();
        }

        LearningNote note = learningNoteRepository.findByScenarioId(scenarioId)
                .orElseGet(() -> new LearningNote(scenarioId, "", false, Instant.now()));
        note.setNotes(normalizeNotes(request.notes()));
        note.setCompleted(request.completed());
        note.setUpdatedAt(Instant.now());

        return ResponseEntity.ok(learningNoteRepository.save(note));
    }

    private String normalizeNotes(String notes) {
        return notes != null ? notes.strip() : "";
    }
}
