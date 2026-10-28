<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TaskOrbit — Session &amp; Cookie Management</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; color: #18181b; padding: 30px; margin: 0; }
        .container { max-width: 700px; margin: 0 auto; background: white; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        h1 { font-size: 20px; font-weight: 600; color: #09090b; margin-top: 0; }
        .section { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
        .section h2 { font-size: 14px; font-weight: 600; margin: 0 0 10px 0; color: #09090b; }
        .data-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
        .data-row:last-child { border-bottom: none; }
        .label { color: #71717a; }
        .val { font-weight: 500; font-family: monospace; color: #09090b; }
        .form-group { margin-top: 10px; display: flex; gap: 8px; }
        select { padding: 6px 10px; border-radius: 4px; border: 1px solid #d4d4d8; font-size: 13px; }
        .btn { padding: 6px 14px; background: #18181b; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; text-decoration: none; }
        .explanation { background: #ecfdf5; border-left: 3px solid #10b981; padding: 12px 14px; font-size: 12px; color: #065f46; line-height: 1.5; margin-top: 20px; }
    </style>
</head>
<body>
<div class="container">
    <h1>HttpSession &amp; Cookie Management</h1>

    <!-- 1. HttpSession Information -->
    <div class="section">
        <h2>1. Server-Side HttpSession Data</h2>
        <div class="data-row">
            <span class="label">Session Identifier (JSESSIONID):</span>
            <span class="val">${sessionId}</span>
        </div>
        <div class="data-row">
            <span class="label">Authenticated Demo User:</span>
            <span class="val">${sessionUser}</span>
        </div>
        <div class="data-row">
            <span class="label">Session Access Counter:</span>
            <span class="val">Request #${accessCount}</span>
        </div>
    </div>

    <!-- 2. HTTP Cookie Information -->
    <div class="section">
        <h2>2. Client-Side HTTP Cookie Preference</h2>
        <div class="data-row">
            <span class="label">Cookie Name:</span>
            <span class="val">taskorbit_worker_pref</span>
        </div>
        <div class="data-row">
            <span class="label">Stored Value:</span>
            <span class="val">${cookiePreference}</span>
        </div>
        <div class="data-row">
            <span class="label">Security Flags:</span>
            <span class="val">HttpOnly=true, Path=/</span>
        </div>

        <form action="session-pref" method="GET" class="form-group" style="margin-top: 14px;">
            <select name="workerId">
                <option value="assignee-001">Carol Singh (assignee-001)</option>
                <option value="assignee-002">Dave Kim (assignee-002)</option>
            </select>
            <button type="submit" class="btn">Update Cookie Preference</button>
        </form>
    </div>

    <!-- 3. URL Rewriting Demonstration -->
    <div class="section">
        <h2>3. URL Rewriting Demonstration</h2>
        <p style="font-size: 12px; color: #71717a; margin: 0 0 8px 0;">
            When browser cookies are disabled, the container uses <code>response.encodeURL()</code> to embed the session ID into links:
        </p>
        <div style="background: white; border: 1px solid #d4d4d8; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;">
            ${rewrittenUrl}
        </div>
    </div>

    <div class="explanation">
        <strong>Syllabus Concept: Sessions, Cookies &amp; URL Rewriting:</strong><br/>
        This demonstration proves that HTTP sessions are maintained on the server and identified by a session ID.
        Cookies are written with <code>HttpOnly</code> flags to mitigate XSS attacks.
        URL rewriting provides fallback session continuity when client cookies are disabled by browser policy.
    </div>

    <div style="margin-top: 20px;">
        <a href="index.jsp" class="btn">&larr; Return to Academic Portal</a>
    </div>
</div>
</body>
</html>
