package com.backendlab.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LearningNoteRepository extends JpaRepository<LearningNote, Long> {
    Optional<LearningNote> findByScenarioId(String scenarioId);
}
