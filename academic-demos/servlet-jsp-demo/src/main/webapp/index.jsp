<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="java.time.LocalDateTime" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TaskOrbit — Unit III Java Servlets & JSP Academic Demonstration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #18181b; padding: 40px 20px; margin: 0; }
        .container { max-width: 860px; margin: 0 auto; }
        .header { margin-bottom: 28px; }
        h1 { font-size: 24px; font-weight: 700; color: #09090b; margin-bottom: 6px; }
        p.subtitle { font-size: 14px; color: #71717a; margin-top: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 20px; }
        .card { background: white; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between; }
        .card h2 { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #09090b; }
        .card p { font-size: 13px; color: #52525b; line-height: 1.5; margin: 0 0 14px 0; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
        .badge-blue { background: #eff6ff; color: #2563eb; }
        .badge-indigo { background: #eef2ff; color: #4f46e5; }
        .badge-emerald { background: #ecfdf5; color: #059669; }
        .badge-amber { background: #fffbeb; color: #d97706; }
        .btn { display: inline-block; padding: 8px 14px; background: #18181b; color: white; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; text-align: center; }
        .btn:hover { background: #27272a; }
        .notes-panel { background: white; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-top: 28px; }
        .notes-panel h3 { font-size: 14px; font-weight: 600; margin-top: 0; color: #09090b; }
        ul { margin: 8px 0; padding-left: 20px; font-size: 13px; color: #52525b; line-height: 1.6; }
        code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: #f4f4f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <span class="badge badge-blue">Unit III Syllabus Integration</span>
        <h1>TaskOrbit — Java Servlets &amp; JSP Portal</h1>
        <p class="subtitle">Academic demonstration of server-side Java Web Technology concepts for TaskOrbit's worker assignment and task-status inspection.</p>
    </div>

    <div class="grid">
        <!-- 1. Hello World Servlet -->
        <div class="card">
            <div>
                <span class="badge badge-blue">Servlet Architecture</span>
                <h2>Hello World Servlet</h2>
                <p>Demonstrates baseline servlet lifecycle, HTTP GET request handling, and dynamic HTML output stream writing via <code>PrintWriter</code>.</p>
            </div>
            <a href="hello" class="btn">Launch HelloWorldServlet &rarr;</a>
        </div>

        <!-- 2. Dynamic Content & Concurrency -->
        <div class="card">
            <div>
                <span class="badge badge-amber">Dynamic Content &amp; Concurrency</span>
                <h2>Task Status Servlet</h2>
                <p>Generates dynamic task status tables based on <code>workerId</code> parameter, illustrating thread safety and stack-allocated state.</p>
            </div>
            <a href="task-status?workerId=assignee-001" class="btn">Launch TaskStatusServlet &rarr;</a>
        </div>

        <!-- 3. MVC & JSP Views -->
        <div class="card">
            <div>
                <span class="badge badge-indigo">MVC + JavaBeans + JSP</span>
                <h2>Task Controller &amp; View</h2>
                <p>Demonstrates Model-View-Controller architecture: Servlet Controller queries DAO, sets <code>TaskBean</code> attributes, and forwards to a JSP View with Expression Language.</p>
            </div>
            <a href="tasks?workerId=assignee-001" class="btn">Launch MVC Controller &rarr;</a>
        </div>

        <!-- 4. Sessions, Cookies, URL Rewriting -->
        <div class="card">
            <div>
                <span class="badge badge-emerald">Sessions &amp; Cookies</span>
                <h2>Session &amp; Cookie Manager</h2>
                <p>Demonstrates <code>HttpSession</code> tracking, setting safe <code>HttpOnly</code> cookies for worker preference, and URL rewriting with <code>encodeURL()</code>.</p>
            </div>
            <a href="session-pref" class="btn">Launch Session Manager &rarr;</a>
        </div>
    </div>

    <div class="notes-panel">
        <h3>Architecture &amp; Syllabus Coverage Summary</h3>
        <ul>
            <li><strong>Servlet Architecture &amp; Lifecycle:</strong> <code>init()</code>, <code>service()</code> / <code>doGet()</code>, <code>destroy()</code> logged in <code>TaskStatusServlet.java</code>.</li>
            <li><strong>Request Parameters:</strong> Extracted in <code>TaskStatusServlet</code> and <code>TaskControllerServlet</code> via <code>request.getParameter()</code>.</li>
            <li><strong>Sessions, Cookies &amp; URL Rewriting:</strong> Demonstrated in <code>SessionPreferenceServlet.java</code> and rendered in <code>session-info.jsp</code>.</li>
            <li><strong>JavaBeans &amp; MVC:</strong> <code>TaskBean.java</code> and <code>WorkerBean.java</code> (Model), <code>TaskControllerServlet.java</code> (Controller), <code>task-view.jsp</code> (View).</li>
            <li><strong>Servlet Concurrency:</strong> Documented in <code>TaskStatusServlet.java</code>: thread safety achieved through local variable allocation and <code>AtomicInteger</code> counters.</li>
            <li><strong>MySQL with Java Servlets:</strong> <code>AcademicTaskDao.java</code> implements JDBC prepared statements with fallback to resilient in-memory stores.</li>
        </ul>
        <p style="font-size: 12px; color: #a1a1aa; margin-top: 14px;">Rendered by JSP Engine at: <%= LocalDateTime.now() %></p>
    </div>
</div>
</body>
</html>
