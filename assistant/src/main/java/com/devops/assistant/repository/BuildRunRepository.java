package com.devops.assistant.repository;

import com.devops.assistant.model.BuildRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface BuildRunRepository extends JpaRepository<BuildRun, Long> {

    List<BuildRun> findByJobNameOrderByTriggeredAtDesc(String jobName);

    List<BuildRun> findByStatusOrderByTriggeredAtDesc(String status);

    long countBySeverity(String severity);

    @Query("SELECT b FROM BuildRun b ORDER BY b.triggeredAt DESC")
    List<BuildRun> findTop100ByOrderByTriggeredAtDesc(Pageable pageable);
}