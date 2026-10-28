package io.taskorbit.reporting.event;

import org.springframework.context.ApplicationEvent;

import java.time.Instant;

/**
 * ReportRequestedEvent — Demonstrates Spring Event-driven messaging pattern.
 * 
 * Demonstrates Syllabus Concept:
 * - "Messaging" (Event-driven decoupling with Spring Application Events)
 */
public class ReportRequestedEvent extends ApplicationEvent {

    private final String reportType;
    private final String requestedBy;
    private final Instant timestamp;

    public ReportRequestedEvent(Object source, String reportType, String requestedBy) {
        super(source);
        this.reportType = reportType;
        this.requestedBy = requestedBy;
        this.timestamp = Instant.now();
    }

    public String getReportType() {
        return reportType;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public Instant getTimestamp() {
        return timestamp;
    }
}
