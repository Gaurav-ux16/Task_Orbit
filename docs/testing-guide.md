# TaskOrbit — Comprehensive Verification & Testing Guide

This guide provides end-to-end verification and testing procedures for the **TaskOrbit** collaborative project management system, covering both the core application workflow (aligned with the research paper) and the isolated academic demonstrations for **Units I, II, III, and IV** of the Web Technology syllabus.

---

## 1. Prerequisites Installation

Ensure the following runtimes and tools are installed:

| Tool | Recommended Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | v18.x or v20.x LTS | `node -v` | Powers the authoritative Express backend and Vite frontend |
| **npm** | v9.x or v10.x | `npm -v` | Package manager for Node.js modules |
| **Java JDK** | JDK 17 or JDK 21 LTS | `java -version`, `javac -version` | Powers Unit III Servlets and Unit IV Spring Boot |
| **Maven** | 3.8+ (or Maven Wrapper) | `mvn -v` | Build tool for Unit III and Unit IV academic modules |
| **PHP** | PHP 8.1+ | `php -v` | Optional: for running the Unit I standalone demo server |
| **Postman** | Latest Desktop App | - | For API contract and workflow test execution |

---

## 2. Environment Configuration (`.env`)

### Express Backend Configuration
Location: `node-backend/.env`
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Reused Supabase Project (Old TaskOrbit instance)
SUPABASE_URL=https://ziuwnkdvoabzlmjiwpsi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...[REDACTED_SERVER_SECRET]
SUPABASE_ANON_KEY=sb_publishable_...[REDACTED_ANON_KEY]
SUPABASE_STORAGE_BUCKET=taskorbit-files

# Dev resiliency: set to true to force embedded seed store if cloud project is paused
USE_MOCK_FALLBACK=false
```

### React Frontend Configuration
Location: `frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=TaskOrbit

# Safe public configuration for browser (publishable / anon key ONLY; never service_role)
VITE_SUPABASE_URL=https://ziuwnkdvoabzlmjiwpsi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...[REDACTED_ANON_KEY]
```

### Spring Boot Academic Microservice Configuration
Location: `academic-demos/spring-boot-demo/src/main/resources/application.properties`
```properties
server.port=8081
spring.application.name=taskorbit-reporting-demo
management.endpoints.web.exposure.include=health,info
# H2 in-memory test database enabled by default
spring.datasource.url=jdbc:h2:mem:taskorbit_reporting;DB_CLOSE_DELAY=-1
```

---

## 3. Starting the Services

### A. Start the Authoritative Express Backend (Port 3001)
```powershell
cd d:\wt_cp_task_orbit\node-backend
npm install
npm run dev
# Expected output: "TaskOrbit Backend API running on port 3001"
# Health Check: http://localhost:3001/health
```

### B. Start the React Frontend (Port 5173)
```powershell
cd d:\wt_cp_task_orbit\frontend
npm install
npm run dev
# Expected output: "VITE v... ready in ... ms"
# Web UI: http://localhost:5173
```

### C. Run the Unit I PHP Demonstration (Port 8000)
```powershell
cd d:\wt_cp_task_orbit\php-demo
php -S localhost:8000 -t public
# Web UI: http://localhost:8000/submission.php
```

### D. Run the Unit III Servlet & JSP Demonstration (Port 8080)
```powershell
cd d:\wt_cp_task_orbit\academic-demos\servlet-jsp-demo
# Compile classes with Java 21:
javac -cp "lib/*" -d target/classes src/main/java/com/taskorbit/academic/**/*.java
# Package into WAR or deploy target directory to Tomcat 10+ / Jetty 12:
# URL: http://localhost:8080/taskorbit-servlet-demo/
```

### E. Run the Unit IV Spring Boot Microservice (Port 8081)
```powershell
cd d:\wt_cp_task_orbit\academic-demos\spring-boot-demo
mvn spring-boot:run
# Health Check: http://localhost:8081/actuator/health
# Public Report: http://localhost:8081/api/reports/public
# Secured Report (Basic Auth manager:manager123): http://localhost:8081/api/reports/projects
```

---

## 4. Automated Test Suites Execution

Execute automated verification suites from the terminal:

### A. Backend Unit & Integration Tests (Jest & Supertest)
```powershell
cd d:\wt_cp_task_orbit\node-backend
npm test
```
**Expected Outcome**: 56 passed tests across 4 test suites:
- `tests/conflictService.test.js` (13 tests): Mathematical inclusive overlap interval rules, edge cases, start-after-deadline validation.
- `tests/taskWorkflow.test.js` (25 tests): 6 permitted transitions, illegal transition rejections (409), unauthorized roles (403), terminal approval.
- `tests/apiRoutes.test.js` (14 tests): Worker directory endpoint, pre-commit conflict rejection (409), confirmed override (201) with two-way linking, cross-assignee modification rejection (403), deliverable upload MIME filter (400), version incrementing (v1, v2), stale-review rejection (409).
- `tests/supabaseConfig.test.js` (4 tests): Configuration detection, live non-destructive connectivity probe, status endpoint validation, and strict protection against secret key leakage.

### B. Supabase Diagnostic Probing (Live Verification)
Test the Express Supabase endpoints:
```powershell
# 1. Inspect configuration status (safe, no secrets exposed)
Invoke-RestMethod -Uri "http://localhost:3001/api/supabase/status" -Method GET | ConvertTo-Json

# 2. Live connectivity probe (safe non-destructive read)
Invoke-RestMethod -Uri "http://localhost:3001/api/supabase/connectivity" -Method GET | ConvertTo-Json
```

### C. Frontend Production Bundle Build
```powershell
cd d:\wt_cp_task_orbit\frontend
npm run build
```
**Expected Outcome**: Build finishes with code 0 and zero linting or JSX errors.

---

## 5. End-to-End Feature Verification: The 14-Step Main Workflow Test

Follow these exact steps to verify the entire research-paper collaborative workflow:

1. **Client Submits Project Requirements**:
   - Navigate to `http://localhost:5173/client/requests` (or switch role to Client).
   - Click "New Project Request". Enter Title: *"E-Commerce Payment Gateway"*, Description: *"Integrate Stripe with webhooks"*, Priority: *"high"*, Requested Deadline: *"2026-12-15"*.
   - Submit form. Verify request appears in the client's request table.

2. **Project Manager Creates a Project**:
   - Switch role to Project Manager (`http://localhost:5173/manager/projects`).
   - Click "New Project". Enter Title: *"E-Commerce Core"*, Client: *"Client Organization"*, Manager: *"Project Manager"*, Dates: `2026-11-01` to `2027-01-31`.
   - Submit. Verify project card displays in the Project Manager view.

3. **Project Manager Creates a Task & Assigns Worker**:
   - Open Worker Directory (`http://localhost:5173/manager/workers`).
   - Browse workers (e.g., Alice Smith). Inspect skills (`React`, `Node.js`), availability (`available`), and current workload.
   - Click "Assign Task". Enter Title: *"Webhook Ingestion Engine"*, Start Date: `2026-11-05`, Deadline: `2026-11-12`, Priority: *"high"*.

4. **Conflict Detection Runs Before Committing Assignment**:
   - While still in the modal, enter overlapping dates for an active task of the same worker.
   - Notice the system immediately displays: `Conflict Warning: Overlaps with Task ...`.
   - The task is **not persisted** yet.
   - To proceed, explicitly check the override confirmation box (`"Override scheduling conflict"`).
   - Submit the task.

5. **Worker Opens the Assigned Task**:
   - Switch role to Assignee (`http://localhost:5173/assignee/tasks`).
   - Verify the newly created task appears in the **To Do** lane with title *"Webhook Ingestion Engine"*.
   - Click on the task card to open the task detail view.

6. **Worker Starts the Task**:
   - Click the **"Start Task"** button.
   - The task transitions from `todo` to `in_progress`.
   - Verify status badge updates to `in_progress`.

7. **Worker Submits a Deliverable (Versioned Submission)**:
   - In the task detail modal, locate the submission section.
   - Attach a deliverable file (`webhook_engine_v1.zip`) and add notes: *"Initial implementation completed with tests."*
   - Click **"Submit Deliverable"**.
   - Backend uploads deliverable, allocates version `v1`, updates `latest_submission_id`, and transitions task status to `submitted`.

8. **Reviewer Begins Review with Exact Submission ID**:
   - Switch role to Reviewer (`http://localhost:5173/reviewer/queue`).
   - Verify the task is listed in the review queue with status `submitted`.
   - Click "Review Task".
   - Click **"Begin Review"** button.
   - Task transitions from `submitted` to `in_review`. Review decision controls unlock.

9. **Reviewer Requests Revision**:
   - Select decision: **"Request Revision"**.
   - Enter mandatory explanation: *"Please add rate-limiting to webhook endpoint."*
   - Submit review.
   - Task transitions from `in_review` to `revision`.

10. **Worker Resumes Work & Submits a New Version**:
    - Switch back to Assignee (`http://localhost:5173/assignee/tasks`).
    - Notice the task is in the **Revision** section with reviewer comments displayed.
    - Click **"Resume Work"**.
    - Task transitions from `revision` to `in_progress`.
    - Upload revised deliverable (`webhook_engine_v2.zip`) with notes: *"Added Redis rate-limiter."*
    - Submit. Task status updates to `submitted` with version `v2`.

11. **Stale Review Attempt Rejected with HTTP 409**:
    - Simulate an out-of-order or stale review attempt by reviewing version `v1` (via Postman request *"Stale Review Rejection"* targeting submission `v1`).
    - The backend rejects the request with **HTTP 409 Conflict**:
      ```json
      {
        "error": "Conflict: Cannot review an outdated submission version. Latest submission ID is ..."
      }
      ```

12. **Reviewer Reviews Latest Version & Approves**:
    - Open Reviewer queue for `v2`.
    - Click **"Begin Review"** (`submitted -> in_review`).
    - Select decision: **"Approve"** with notes: *"Verified rate-limiting. Approved!"*
    - Submit review.
    - Task transitions from `in_review` to `approved`.

13. **Approved Task Cannot Be Transitioned Again (Terminal State)**:
    - Attempt to start or resubmit the approved task.
    - Action is disallowed in the UI, and any direct API call returns **HTTP 409 Conflict** (`"Cannot transition from terminal state 'approved'"`).

14. **Activity Log & Database Audit**:
    - Open Activity Log (`http://localhost:5173/manager/activity` or `GET /api/activity`).
    - Verify complete chronological audit trail:
      - `task_created`
      - `conflict_override_confirmed` (with mutual conflict IDs)
      - `task_status_changed` (`todo -> in_progress`)
      - `submission_created` (v1)
      - `task_status_changed` (`submitted -> in_review`)
      - `review_submitted` (`revision`)
      - `task_status_changed` (`revision -> in_progress`)
      - `submission_created` (v2)
      - `task_status_changed` (`submitted -> in_review`)
      - `review_submitted` (`approved`)

---

## 6. Conflict Boundary Test Matrix

Verify all 11 boundary scenarios using `tests/conflictService.test.js` or via the Postman collection:

| Test Case | Candidate Interval | Existing Task Interval | Same Assignee? | Existing Status | Expected Result | Reason |
|---|---|---|---|---|---|---|
| **1. Non-overlapping (Before)** | 2026-10-01 to 2026-10-05 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **No Conflict** | $d_c < s_i$ (Strictly earlier) |
| **2. Non-overlapping (After)** | 2026-10-20 to 2026-10-25 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **No Conflict** | $s_c > d_i$ (Strictly later) |
| **3. Partial Overlap (Tail)** | 2026-10-12 to 2026-10-18 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **Conflict (Overlap)** | $s_c \le d_i \land s_i \le d_c$ |
| **4. Partial Overlap (Head)** | 2026-10-08 to 2026-10-12 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **Conflict (Overlap)** | $s_c \le d_i \land s_i \le d_c$ |
| **5. Full Containment (Enclosed)** | 2026-10-11 to 2026-10-14 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **Conflict (Contained)** | Candidate entirely within existing |
| **6. Full Containment (Enclosing)**| 2026-10-05 to 2026-10-20 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **Conflict (Encloses)** | Existing entirely within candidate |
| **7. Same-Day Overlap (Inclusive)**| 2026-10-15 to 2026-10-18 | 2026-10-10 to 2026-10-15 | Yes | in_progress | **Conflict (Boundary)** | Inclusive dates: $s_c = d_i$ |
| **8. Different Assignees** | 2026-10-10 to 2026-10-15 | 2026-10-10 to 2026-10-15 | **No** | in_progress | **No Conflict** | Assigned to different workers |
| **9. Approved Task Exclusion** | 2026-10-10 to 2026-10-15 | 2026-10-10 to 2026-10-15 | Yes | **approved** | **No Conflict** | Approved tasks are inactive |
| **10. Self-Exclusion on Edit** | 2026-10-10 to 2026-10-15 | 2026-10-10 to 2026-10-15 (Self) | Yes | in_progress | **No Conflict** | Candidate task ignores its own ID |
| **11. Start After Deadline Error** | 2026-10-20 to 2026-10-10 | Any | Any | Any | **HTTP 400 Error** | Invalid interval ($s_c > d_c$) |

---

## 7. Academic Syllabus Concepts Demonstrations

### Unit I (PHP Server-Side Technologies)
- **Form Submission**: Open `http://localhost:8000/submission.php`. Fill in Task ID, notes, and attach a `.zip` or `.pdf` file. Click Submit.
- **Form Validation & String Escaping**: Leave Task ID blank and enter an invalid email format (`not-an-email`). Verify server returns clean validation error alerts (`sanitize_string()`, `filter_var()`).
- **Session & Cookie Receipt**: On valid submission, page redirects to `receipt.php`, reading flash data from `$_SESSION['receipt_data']` and inspecting the `taskorbit_demo_user` cookie.

### Unit II (React Integration)
- **Component Hierarchy & Props**: Inspect `AssigneeDashboard.jsx` rendering `TaskCard.jsx` instances with props (`task`, `onOpen`, `onStart`).
- **State & Refs**: In `SubmissionForm.jsx`, verify `useState` manages controlled inputs and `useRef` automatically focuses the textarea on modal mount.
- **Redux & Router**: Dispatch `startTask` thunk in Redux store; observe state update in Redux DevTools and route navigation to `/assignee/tasks/:id`.

### Unit III (Java Servlets & JSP)
- **Hello World Servlet**: Send `GET http://localhost:8080/taskorbit-servlet-demo/hello` to verify basic servlet dispatch.
- **Dynamic Content & Lifecycle**: Send `GET http://localhost:8080/taskorbit-servlet-demo/task-status?workerId=worker-001` to view dynamic HTML table generated by `TaskStatusServlet`.
- **MVC Architecture & JSP**: Send `GET http://localhost:8080/taskorbit-servlet-demo/task-mvc?taskId=task-001` to verify `TaskControllerServlet` querying `TaskBean` via `AcademicTaskDao` and forwarding to `task-view.jsp`.

### Unit IV (Spring Boot & Postman API Testing)
- **Actuator Health**: Send `GET http://localhost:8081/actuator/health` -> returns `{"status": "UP"}`.
- **Spring Security (RBAC)**:
  - Send `GET http://localhost:8081/api/reports/projects` without credentials -> returns **HTTP 401 Unauthorized**.
  - Send same request with Basic Auth (`manager` / `manager123`) -> returns HTTP 200 with JSON project report array.
- **Postman Collection Verification**:
  - Open Postman -> Click Import -> Select `taskorbit.postman_collection.json`.
  - Run the entire collection against local servers. Verify all 16 requests pass with expected HTTP status codes.
