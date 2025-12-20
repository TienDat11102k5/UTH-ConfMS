package edu.uth.backend.repository;

import edu.uth.backend.entity.AIFeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIFeatureFlagRepository extends JpaRepository<AIFeatureFlag, Long> {
    Optional<AIFeatureFlag> findByConferenceIdAndFeatureName(Long conferenceId, String featureName);
}
