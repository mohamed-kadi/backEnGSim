package com.backendlab.learning;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "learning_notes", uniqueConstraints = @UniqueConstraint(columnNames = "scenario_id"))
public class LearningNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scenario_id", nullable = false)
    private String scenarioId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private boolean completed;

    private Instant updatedAt;

    public LearningNote() {
    }

    public LearningNote(String scenarioId, String notes, boolean completed, Instant updatedAt) {
        this.scenarioId = scenarioId;
        this.notes = notes;
        this.completed = completed;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getScenarioId() {
        return scenarioId;
    }

    public void setScenarioId(String scenarioId) {
        this.scenarioId = scenarioId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
