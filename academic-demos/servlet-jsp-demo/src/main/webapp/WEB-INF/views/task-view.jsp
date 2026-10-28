<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.util.List" %>
<%@ page import="io.taskorbit.demo.model.TaskBean" %>
<%@ page import="io.taskorbit.demo.model.WorkerBean" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TaskOrbit — MVC JSP View (Tasks)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #18181b; padding: 30px; margin: 0; }
        .container { max-width: 860px; margin: 0 auto; background: white; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        h1 { font-size: 20px; font-weight: 600; color: #09090b; margin-top: 0; }
        .selector { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: #f4f4f5; padding: 12px 16px; border-radius: 6px; }
        select { padding: 6px 10px; border-radius: 4px; border: 1px solid #d4d4d8; font-size: 13px; background: white; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e4e4e7; }
        th { background: #fafafa; font-weight: 600; color: #71717a; font-size: 11px; text-transform: uppercase; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; }
        .badge-todo { background: #f4f4f5; color: #52525b; }
        .badge-in_progress { background: #eff6ff; color: #2563eb; }
        .badge-submitted { background: #fef3c7; color: #d97706; }
        .badge-approved { background: #ecfdf5; color: #059669; }
        .mvc-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 14px; margin-top: 24px; font-size: 12px; color: #1e40af; line-height: 1.5; }
        .btn { padding: 6px 12px; background: #18181b; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; text-decoration: none; }
    </style>
</head>
<body>
<div class="container">
    <h1>Assigned Tasks — MVC JSP Presentation View</h1>

    <%
        WorkerBean worker = (WorkerBean) request.getAttribute("selectedWorker");
        List<WorkerBean> allWorkers = (List<WorkerBean>) request.getAttribute("allWorkers");
        List<TaskBean> tasks = (List<TaskBean>) request.getAttribute("taskList");
        String activeWorkerId = (String) request.getAttribute("activeWorkerId");
    %>

    <!-- Worker Selector Form demonstrating GET request parameter handling -->
    <form action="tasks" method="GET" class="selector">
        <label for="workerId" style="font-size: 13px; font-weight: 500;">Select Assignee:</label>
        <select name="workerId" id="workerId" onchange="this.form.submit()">
            <% if (allWorkers != null) {
                for (WorkerBean w : allWorkers) { %>
                    <option value="<%= w.getId() %>" <%= w.getId().equals(activeWorkerId) ? "selected" : "" %>>
                        <%= w.getDisplayName() %> (<%= w.getAvailability() %>)
                    </option>
            <%   }
               } %>
        </select>
        <span style="font-size: 12px; color: #71717a; margin-left: auto;">Email: <%= worker != null ? worker.getEmail() : "—" %></span>
    </form>

    <!-- Task Listing Table rendering JavaBean properties -->
    <table>
        <thead>
            <tr>
                <th>Task ID</th>
                <th>Title &amp; Specification</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Version</th>
            </tr>
        </thead>
        <tbody>
            <% if (tasks == null || tasks.isEmpty()) { %>
                <tr>
                    <td colspan="7" style="text-align: center; color: #a1a1aa; padding: 24px;">No tasks assigned to this worker.</td>
                </tr>
            <% } else {
                for (TaskBean t : tasks) { %>
                <tr>
                    <td style="font-family: monospace; font-size: 11px;"><%= t.getId() %></td>
                    <td>
                        <strong><%= t.getTitle() %></strong><br/>
                        <small style="color: #71717a;"><%= t.getDescription() %></small>
                    </td>
                    <td><%= t.getAssigneeName() %></td>
                    <td><span class="badge badge-<%= t.getStatus() %>"><%= t.getStatus() %></span></td>
                    <td><%= t.getPriority() %></td>
                    <td><%= t.getDueDate() %></td>
                    <td style="font-family: monospace;">v<%= t.getLatestVersionNumber() %></td>
                </tr>
            <%   }
               } %>
        </tbody>
    </table>

    <div class="mvc-card">
        <strong>Model-View-Controller (MVC) Architectural Flow:</strong><br/>
        1. <strong>Controller:</strong> <code>TaskControllerServlet</code> received the HTTP request and extracted <code>workerId</code>.<br/>
        2. <strong>Model:</strong> <code>AcademicTaskDao</code> queried tasks and populated <code>TaskBean</code> and <code>WorkerBean</code> objects.<br/>
        3. <strong>View:</strong> The controller forwarded the request to <code>task-view.jsp</code>, which rendered the JavaBean properties using JSP and Expression data.
    </div>

    <div style="margin-top: 20px;">
        <a href="index.jsp" class="btn">&larr; Return to Academic Portal</a>
    </div>
</div>
</body>
</html>
