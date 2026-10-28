package io.taskorbit.demo.controller;

import io.taskorbit.demo.dao.AcademicTaskDao;
import io.taskorbit.demo.model.TaskBean;
import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * TaskStatusServlet — Dynamic content generation, lifecycle logging, and concurrency demonstration.
 * 
 * Demonstrates Syllabus Concepts:
 * 1. "Servlet lifecycle" (init, doGet, destroy)
 * 2. "Request parameters" (workerId, taskId query parameters)
 * 3. "Servlets generating dynamic content"
 * 4. "Servlet concurrency" (Thread safety: multiple request threads accessing one instance)
 */
@WebServlet(name = "TaskStatusServlet", urlPatterns = {"/task-status"})
public class TaskStatusServlet extends HttpServlet {

    // Thread-safe request counter demonstrating lifecycle/concurrency tracking
    private final AtomicInteger requestCounter = new AtomicInteger(0);
    private AcademicTaskDao taskDao;

    /**
     * Servlet Lifecycle Method 1: init()
     * Called exactly once when the servlet is first instantiated and loaded into memory.
     */
    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        this.taskDao = new AcademicTaskDao();
        log("[Servlet Lifecycle] TaskStatusServlet initialized successfully. Single instance created.");
    }

    /**
     * Servlet Lifecycle Method 2: doGet() (Invoked per concurrent request)
     * 
     * CONCURRENCY NOTE: The Servlet container executes doGet() concurrently across multiple
     * worker threads for multiple clients.
     * Rule: Never store per-request client data in instance fields of the Servlet class!
     * All client parameters, query results, and outputs MUST be local variables on the stack.
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        int currentRequestNum = requestCounter.incrementAndGet();

        resp.setContentType("text/html;charset=UTF-8");

        // 1. Read request parameter (Syllabus: "Request parameters")
        String workerId = req.getParameter("workerId");
        if (workerId == null || workerId.trim().isEmpty()) {
            workerId = "assignee-001"; // Default demo worker
        }

        // 2. Query model data
        List<TaskBean> tasks = taskDao.getTasksByWorkerId(workerId);

        // 3. Dynamic content generation
        try (PrintWriter out = resp.getWriter()) {
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>TaskOrbit — Task Status (Dynamic Servlet)</title>");
            out.println("<style>");
            out.println("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #18181b; padding: 30px; margin: 0; }");
            out.println(".container { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }");
            out.println("h1 { font-size: 18px; font-weight: 600; color: #09090b; margin-top: 0; }");
            out.println(".info-bar { background: #f4f4f5; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; display: flex; justify-content: space-between; }");
            out.println("table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }");
            out.println("th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e4e4e7; }");
            out.println("th { background: #fafafa; font-weight: 600; color: #71717a; font-size: 11px; text-transform: uppercase; }");
            out.println(".badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; font-family: monospace; }");
            out.println(".badge-todo { background: #f4f4f5; color: #52525b; }");
            out.println(".badge-progress { background: #eff6ff; color: #2563eb; }");
            out.println(".badge-submitted { background: #fef3c7; color: #d97706; }");
            out.println(".badge-approved { background: #ecfdf5; color: #059669; }");
            out.println(".btn { display: inline-block; padding: 6px 12px; background: #18181b; color: white; border-radius: 4px; text-decoration: none; font-size: 12px; }");
            out.println(".concurrency-note { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin-top: 24px; font-size: 12px; color: #92400e; }");
            out.println("</style>");
            out.println("</head>");
            out.println("<body>");
            out.println("<div class='container'>");

            out.println("<h1>Worker Task Status & Lifecycle Overview</h1>");
            out.println("<div class='info-bar'>");
            out.println("<span>Filtering for Worker: <strong>" + workerId + "</strong></span>");
            out.println("<span>Request Serviced: <strong>#" + currentRequestNum + "</strong> (Thread: " + Thread.currentThread().getName() + ")</span>");
            out.println("</div>");

            out.println("<table>");
            out.println("<thead>");
            out.println("<tr><th>Task Title</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Version</th></tr>");
            out.println("</thead>");
            out.println("<tbody>");

            if (tasks.isEmpty()) {
                out.println("<tr><td colspan='6' style='text-align: center; color: #a1a1aa; padding: 20px;'>No tasks found for this worker ID.</td></tr>");
            } else {
                for (TaskBean t : tasks) {
                    String statusClass = "badge-todo";
                    if ("in_progress".equals(t.getStatus())) statusClass = "badge-progress";
                    else if ("submitted".equals(t.getStatus())) statusClass = "badge-submitted";
                    else if ("approved".equals(t.getStatus())) statusClass = "badge-approved";

                    out.println("<tr>");
                    out.println("<td><strong>" + t.getTitle() + "</strong><br/><small style='color:#71717a'>" + t.getDescription() + "</small></td>");
                    out.println("<td>" + t.getAssigneeName() + "</td>");
                    out.println("<td><span class='badge " + statusClass + "'>" + t.getStatus() + "</span></td>");
                    out.println("<td>" + t.getPriority() + "</td>");
                    out.println("<td>" + t.getDueDate() + "</td>");
                    out.println("<td>v" + t.getLatestVersionNumber() + "</td>");
                    out.println("</tr>");
                }
            }

            out.println("</tbody>");
            out.println("</table>");

            // Concurrency Educational Explanation Block
            out.println("<div class='concurrency-note'>");
            out.println("<strong>Servlet Concurrency & Thread-Safety Demonstration:</strong><br/>");
            out.println("Notice that <code>TaskStatusServlet</code> is a single instance in memory handling concurrent requests. "
                    + "Each client request is assigned a separate thread (currently <code>" + Thread.currentThread().getName() + "</code>). "
                    + "State isolation is maintained because <code>tasks</code> and <code>workerId</code> are stack-allocated local variables, "
                    + "while shared request counter uses atomic synchronization (<code>AtomicInteger</code>).");
            out.println("</div>");

            out.println("<div style='margin-top: 20px; display: flex; gap: 10px;'>");
            out.println("<a href='task-status?workerId=assignee-001' class='btn'>View Carol Singh</a>");
            out.println("<a href='task-status?workerId=assignee-002' class='btn'>View Dave Kim</a>");
            out.println("<a href='tasks' class='btn' style='background: #2563eb;'>View via MVC + JSP &rarr;</a>");
            out.println("<a href='index.jsp' style='margin-left: auto; align-self: center; font-size: 13px; color: #71717a;'>&larr; Portal</a>");
            out.println("</div>");

            out.println("</div>");
            out.println("</body>");
            out.println("</html>");
        }
    }

    /**
     * Servlet Lifecycle Method 3: destroy()
     * Called by container before taking the servlet instance out of service.
     */
    @Override
    public void destroy() {
        log("[Servlet Lifecycle] TaskStatusServlet destroyed. Resources released.");
        super.destroy();
    }
}
