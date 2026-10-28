package io.taskorbit.reporting.repository;

import io.taskorbit.reporting.entity.TaskSummaryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * TaskSummaryRepository — Spring Data JPA Repository for task metrics and conflict queries.
 */
@Repository
public interface TaskSummaryRepository extends JpaRepository<TaskSummaryEntity, String> {

    List<TaskSummaryEntity> findByAssigneeId(String assigneeId);

    List<TaskSummaryEntity> findByProjectId(String projectId);

    List<TaskSummaryEntity> findByHasConflictOverrideTrue();

    long countByStatus(String status);
}
