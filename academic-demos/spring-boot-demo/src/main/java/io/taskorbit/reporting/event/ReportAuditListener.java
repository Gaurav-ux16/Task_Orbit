package io.taskorbit.reporting.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * ReportAuditListener — Event listener demonstrating Spring Event publication and listening.
 * 
 * Demonstrates Syllabus Concept:
 * - "Messaging" (In-process asynchronous event messaging)
 */
@Component
public class ReportAuditListener {

    private static final Logger log = LoggerFactory.getLogger(ReportAuditListener.class);

    @EventListener
    public void onReportRequested(ReportRequestedEvent event) {
        log.info("[Spring Messaging Audit] Event received: Report '{}' requested by '{}' at {}",
                event.getReportType(), event.getRequestedBy(), event.getTimestamp());
    }
}
