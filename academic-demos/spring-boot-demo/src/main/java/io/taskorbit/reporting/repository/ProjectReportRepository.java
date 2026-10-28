package io.taskorbit.reporting.repository;

import io.taskorbit.reporting.entity.ProjectReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ProjectReportRepository — Spring Data JPA Repository.
 * 
 * Demonstrates Syllabus Concept:
 * - "JPA database connectivity" (Repository interfaces, Spring Data query methods)
 */
@Repository
public interface ProjectReportRepository extends JpaRepository<ProjectReportEntity, String> {

    List<ProjectReportEntity> findByStatus(String status);
}
