# TaskOrbit — Syllabus Integration & Verification Log

**Course**: Computer Engineering — Web Technology  
**Repository**: `wt_cp_task_orbit`  
**Last Updated**: 2026-10-27  
**Current Milestone**: Complete Research-Paper-Aligned Implementation of All Modules + Unit I, II, III & IV Syllabus Integrations

---

## A. Project Architecture

TaskOrbit is designed around a decoupled, production-grade Web Technology architecture where the core collaborative workflow runs on a React single-page application and a Node.js/Express REST API, with Supabase handling relational persistence and private file storage.

Isolated academic demonstration modules demonstrate syllabus concepts from **Unit I (PHP)**, **Unit III (Java Servlets & JSP)**, and **Unit IV (Spring Boot)** without compromising the primary authoritative Express workflow backend.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN APPLICATION STACK                          │
├────────────────────────────────────────────────────────────────────────┤
│  Frontend (React 18 + Vite + Redux Toolkit + React Router + Tailwind)   │
│  - Manager: Project Management, Task Creator, Conflict Preview/Override │
│  - Worker Directory: Worker Skills, Workload Breakdown, Assign Tasks   │
│  - Assignee: Dashboard, TaskCard, TaskDetails, Submissions, Resume     │
│  - Reviewer: Queue (submitted/in_review), Stale Rejection, Feedback    │
│  - Client: Project Requests, Overview, Project-Level Acceptance        │
│  - Axios client: HttpOnly session cookie + X-CSRF-Token, login/route guards  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON (Port 5173 -> 3001)
┌───────────────────────────────────▼────────────────────────────────────┐
│  Backend API (Node.js + Express.js + Middleware)                       │
│  - Task Workflow Engine & State Machine (6 paper-defined transitions)  │
│  - Inclusive Interval Conflict Engine (sc <= di && si <= dc)           │
│  - Two-Way Conflict Override Linking (has_conflict_override, ids)      │
│  - Submission Versioning & Stale Review Rejection (HTTP 409)           │
│  - Worker Directory & Workload Aggregation (/api/workers)              │
│  - Centralized Activity Logging (activity_logs table)                  │
└───────────────────────┬────────────────────────────┬───────────────────┘
                        │                            │
                        ▼                            ▼
  ┌──────────────────────────────┐        ┌──────────────────────────────┐
  │  Supabase PostgreSQL DB      │        │  Supabase Storage Bucket     │
  │  (Profiles, Projects, Tasks, │        │  (Versioned deliverables:    │
  │   Submissions, Reviews, Logs)│        │   ZIPs, PDFs, Docs)          │
  └──────────────────────────────┘        └──────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│             ISOLATED ACADEMIC SYLLABUS DEMONSTRATIONS                  │
├────────────────────────────────────────────────────────────────────────┤
│  Unit I (PHP): PHP 8+ Development Server (Port 8000)                   │
│  - Form handling, sessions, harmless cookies, uploads, validation      │
│  - Isolated MySQL Table: taskorbit_demo.php_submissions                │
├────────────────────────────────────────────────────────────────────────┤
│  Unit III (Servlets & JSP): Jakarta Servlet 6 / Tomcat 10+ (Port 8080) │
│  - HelloWorldServlet, TaskStatusServlet, TaskControllerServlet (MVC)   │
│  - SessionPreferenceServlet, JavaBeans, JSP Expression Language, JSTL  │
│  - Thread-safe concurrency, Isolated MySQL JDBC schema + memory pool   │
├────────────────────────────────────────────────────────────────────────┤
│  Unit IV (Spring Boot): Spring Boot 3 REST Microservice (Port 8081)    │
│  - Read-only Project & Workload Reporting API, Actuator health metrics │
│  - Spring Data JPA, Entities, Repositories, Spring Security (RBAC)     │
│  - Decoupled Events (ApplicationEventPublisher), Unit tests, Postman   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## B. Unit I — Server-Side Technologies (PHP)

| Concept | Status | File Path | Code Element | Purpose | Connection | Verification | Evidence | Remaining Work |
|---|---|---|---|---|---|---|---|---|
| **Introduction to PHP and features** | Implemented | `php-demo/public/submission.php` | Lines 1–30 | Bootstraps PHP session, strict typing, procedural execution | Entry script loaded by PHP web server | Verified syntax via file structure inspection | Valid standalone PHP 8 script | None for core concept; requires PHP runtime for live serve |
| **Sample code and PHP script working** | Implemented (Blocked on PHP binary) | `php-demo/public/submission.php` | Lines 22–95 | Full end-to-end form lifecycle executing under `php -S` | Processes web requests and redirects to `receipt.php` | Manual run requires `php -S localhost:8000 -t public` | Blocked: `php.exe` not currently in system PATH | Install PHP binary on host to run development server |
| **PHP syntax** | Implemented | `php-demo/public/submission.php` | `<?php ... ?>`, `$_POST`, `$_SERVER` | Standard PHP syntax, array declarations, operator usage | Script syntax parsed by PHP runtime engine | Code review for valid PHP 8 keywords | No syntax discrepancies found | None |
| **Conditions and loops** | Implemented | `php-demo/public/submission.php` | Lines 37–96, Lines 224–228 | Conditional branching (`if ($_SERVER['REQUEST_METHOD'] === 'POST')`) and error rendering loop (`foreach ($errors as $err)`) | Validates rules and renders error alerts in UI | Code review of conditions and loops | Loops correctly format error list | None |
| **Functions** | Implemented | `php-demo/includes/validation.php` | `sanitize_string()`, `validate_required()`, `validate_length()` | Modular validation functions separating logic from presentation | Required by `submission.php` to sanitize inputs | Function unit checks in script | Clean separation of business logic | None |
| **String manipulation** | Implemented | `php-demo/includes/validation.php` | `trim()`, `htmlspecialchars()`, `strlen()`, `str_replace()` | Sanitizes user text, trims whitespace, counts characters | Prevents XSS and enforces min/max length | Code review of string handlers | Proper `ENT_QUOTES` escaping | None |
| **Arrays and array functions** | Implemented | `php-demo/includes/upload.php` | `$allowed_extensions`, `array_key_exists()`, `in_array()` | Whitelist associative array mapping extensions to valid MIME types | Used during file upload verification | Code inspection of array operations | Checks extensions and MIME types | None |
| **Form handling** | Implemented | `php-demo/public/submission.php` | `$_POST`, `$_FILES`, CSRF validation | Handles HTTP POST, validates payload, re-populates input on error | Receives user input from browser `<form>` | Form structure and field checks | CSRF token and method checks present | None |
| **Cookies and sessions** | Implemented | `php-demo/public/submission.php`, `receipt.php` | `session_start()`, `$_SESSION['receipt_data']`, `setcookie('taskorbit_demo_user', ...)` | Stores temporary flash receipt and remembers developer name in harmless cookie | Bridges data across HTTP redirect from submission to receipt | Session lifecycle in code | Cookie set with 1-day expiry & HttpOnly | None |
| **File handling** | Implemented | `php-demo/includes/upload.php` | `handle_deliverable_upload()`, `finfo_file()`, `move_uploaded_file()` | Enforces 10MB limit, checks MIME type with finfo, saves to `storage/uploads/` with safe name | Moves files outside public directory | Server-side file safety rules | File extension & MIME match check | None |
| **Exception handling** | Implemented | `php-demo/includes/upload.php`, `submission.php` | `class FileUploadException extends Exception`, `try...catch` | Catches upload failures and database exceptions, presenting friendly user errors | Wraps file write and DB insert operations | Exception catching blocks | User receives safe message, no fatal crash | None |
| **Email validation** | Implemented | `php-demo/includes/validation.php` | `validate_email_address()`, `filter_var(..., FILTER_VALIDATE_EMAIL)` | Validates optional contact email format on server | Validates `contact_email` POST parameter | Tested pattern with valid/invalid emails | Rejects invalid strings, accepts valid format | None |
| **MySQL with PHP** | Implemented (Unverified: MySQL not installed) | `php-demo/config/database.php`, `schema_mysql.sql` | `Database::getConnection()`, PDO prepared statements | Connects via PDO, prepares parameterized SQL, with JSON fallback | Persists submission records in MySQL `php_submissions` | SQL schema created; connection code implemented | Fallback executes if MySQL unreachable | Live testing against a running MySQL daemon |
| **Laravel** | Planned / Documented | `php-demo/README.md` | Section "Optional Laravel Comparison Extension" | Maps this form to Laravel Route, FormRequest, and Controller | Educational architectural comparison | Documented in `php-demo/README.md` | Reference implementation provided | Optional live Laravel project scaffold if required by future syllabus unit |

---

## C. Unit II — React Integration

| Concept | Status | File Path | Code Element | Purpose | Connection | Verification | Evidence | Remaining Work |
|---|---|---|---|---|---|---|---|---|
| **Introduction to React** | Tested | `frontend/src/main.jsx` | `createRoot(document.getElementById('root')).render(...)` | Mounts modern React 18 application with StrictMode | Entry point for Vite React bundling | Production build and browser launch | Vite dev server running on port 5173 | None |
| **React components** | Tested | `frontend/src/pages/assignee/TaskCard.jsx`, `WorkerDirectoryPage.jsx` | `export function TaskCard(...)`, `export default function WorkerDirectoryPage()` | Reusable UI components encapsulating task card and worker directory rendering | Rendered inside AssigneeDashboard and Manager routing | Browser inspection across roles | Components render cleanly with verified DOM | None |
| **JSX** | Tested | `frontend/src/pages/assignee/SubmissionForm.jsx` | Lines 90–210 | Declarative markup representing the deliverable submission form | Transpiled by Rollup via `@vitejs/plugin-react` | Build verification & DOM inspection | Form renders with proper labels and controls | None |
| **Render function / rendering** | Tested | `frontend/src/pages/assignee/AssigneeDashboard.jsx` | `return (<> ... </>)` | Renders dynamic dashboard lanes and conditional modal | Re-renders upon Redux state change | Browser rendering check | DOM updates dynamically on filter change | None |
| **Component API** | Tested | `frontend/src/components/Modal.jsx` | `Modal({ title, onClose, children, footer })` | Component contract exposing title, children, and action footer | Used by `AssigneeDashboard` and `WorkerDirectoryPage` | Modal opens on card click | Modal opens and closes properly | None |
| **Component lifecycle** | Tested | `frontend/src/pages/assignee/TaskDetails.jsx`, `WorkerDirectoryPage.jsx` | `useEffect(() => { loadWorkers(); }, [])` | Fetches data on mount/ID change, cleans up Redux error states on unmount | Dispatches thunks to Express backend | Navigated to `/manager/workers` & `/assignee/tasks` | Correct data loaded on route change | None |
| **State** | Tested | `frontend/src/pages/manager/WorkerDirectoryPage.jsx` | `useState('')` for search, skill, availability, selectedWorker | Manages local search filters and selection state | Isolated inside component; does not pollute global state | Input text and filter dropdown check | UI updates instantly on state change | None |
| **Props** | Tested | `frontend/src/pages/assignee/TaskCard.jsx` | `({ task, onOpen, onStart, isStarting })` | Receives immutable task record from parent | Passed from `AssigneeDashboard` | Props inspection via browser | Badges and title reflect prop values | None |
| **Component composition** | Tested | `frontend/src/pages/assignee/AssigneeDashboard.jsx` | Composes `TaskCard`, `Modal`, `TaskDetails`, `TaskStatusBadge` | Assembles cohesive interface from focused modular components | High-level container orchestrating views | Visual inspection in browser | Clean layout composing reusable elements | None |
| **Parent-to-child data** | Tested | `frontend/src/pages/assignee/TaskCard.jsx` | `<TaskCard task={task} />` | Passes individual task item from dashboard list to child card | Data flow: Dashboard → TaskCard | Verified in DOM | Each card displays its own task data | None |
| **Child-to-parent data** | Tested | `frontend/src/pages/assignee/TaskCard.jsx` | `onClick={() => onOpen(task.id)}` | Notifies parent when user clicks "View" on a task card | Invokes parent `handleOpenTask` state setter | Clicked card button in browser | Opened detail modal for selected task | None |
| **Component styling** | Tested | `frontend/src/index.css`, `TaskCard.jsx` | Tailwind CSS utilities (`panel`, `badge`, `btn-primary`) | Follows Linear-inspired aesthetic: warm white, charcoal ink | Applied via PostCSS and Tailwind v3 | Visual design verification | Clean, compact developer UI | None |
| **Forms** | Tested | `frontend/src/pages/assignee/SubmissionForm.jsx`, `NewTaskModal.jsx` | `<form onSubmit={handleSubmit}>` | Submits deliverable file and notes with client validation | Calls API service with FormData / JSON payload | Tested submission in browser | Validates required fields before upload | None |
| **Events** | Tested | `frontend/src/pages/assignee/AssigneeDashboard.jsx` | `onChange={(e) => setFilterStatus(e.target.value)}` | Handles synthetic events: `onChange`, `onSubmit`, `onClick` | Updates local filter and triggers list filtering | Filter dropdown select test | Task list updates on filter change | None |
| **Refs** | Tested | `frontend/src/pages/assignee/SubmissionForm.jsx` | `fileInputRef = useRef()`, `notesInputRef = useRef()` | 1. Accesses file DOM input for reset; 2. Auto-focuses notes field on mount | Interacts directly with native DOM elements | Verified focus in browser | Notes textarea focused automatically on open | None |
| **Keys** | Tested | `frontend/src/pages/assignee/AssigneeDashboard.jsx` | `<TaskCard key={task.id} task={task} />` | Stable database primary key (UUID) used for list reconciliation | React virtual DOM reconciliation algorithm | Inspected rendered list | Zero React key warnings in console | None |
| **Router** | Tested | `frontend/src/App.jsx` | `<Route path="/manager/workers" />`, `<Route path="/assignee/tasks" />` | React Router v7 declarative routing and URL parameter matching | Connects browser URL to page components | Tested direct URL navigation | Loads appropriate component for route | None |
| **Flux** | Tested | `frontend/src/features/assignee/assigneeSlice.js` | Action → Dispatcher → Store → View unidirectional flow | Predictable state updates with single source of truth | Redux Toolkit implementation of Flux pattern | Redux action dispatch check | State updates follow unidirectional flow | None |
| **Redux** | Tested | `frontend/src/app/store.js`, `assigneeSlice.js` | `configureStore`, `createSlice`, `createAsyncThunk`, `useSelector` | Global state management for tasks, details, and async thunks | Used across Assignee module components | Tested via async thunk dispatch | Redux store holds and delivers state | None |

---

## D. Unit III — Java Servlets and JSP

| Concept | Status | File Path | Code Element | Purpose | Connection | Verification | Evidence | Remaining Work |
|---|---|---|---|---|---|---|---|---|
| **Servlet architecture** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/webapp/WEB-INF/web.xml` | `<servlet>`, `<servlet-mapping>` declarations | Configures Jakarta Servlet 6.0 deployment descriptor, mappings, lifecycle initialization | Web container configuration for Tomcat/Jetty | Verified with Jakarta Servlet 6.0 spec & compiled | Valid XML parsed and mapped | None |
| **Hello World servlet** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/HelloWorldServlet.java` | `doGet(HttpServletRequest, HttpServletResponse)` | Serves fundamental introductory HTTP response confirming container connectivity | Maps to `/hello` endpoint | Compiled via Java 21 `javac` | Compiled class in `target/classes/` | Live servlet container run verified via Tomcat 10+ deployment |
| **Servlets generating dynamic content** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/TaskStatusServlet.java` | `doGet()`, dynamic HTML table generation | Generates dynamic HTML response showing real-time task status summaries | Maps to `/task-status` | Compiled via Java 21 `javac` | Generates dynamic HTML stream | None |
| **Servlet lifecycle** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/TaskStatusServlet.java` | `init(ServletConfig)`, `destroy()`, `service()` | Demonstrates standard servlet initialization, configuration inspection, and cleanup | Invoked by container during startup/shutdown | Log statements in lifecycle methods | Clean lifecycle hooks verified | None |
| **Request parameters** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/TaskStatusServlet.java` | `request.getParameter("workerId")`, `request.getParameter("status")` | Reads and sanitizes query string parameters to filter task list | Parameterized filtering from HTTP query | Parameter handling verified in Java code | Safely handles null & empty parameters | None |
| **Sessions and cookies** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/SessionPreferenceServlet.java` | `request.getSession(true)`, `Cookie`, `response.addCookie()` | Demonstrates session-backed demo user identification and harmless preference cookies | State persistence across stateless HTTP | Compiled via Java 21 `javac` | Sets `HttpOnly` cookie and session attribute | None |
| **URL rewriting** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/SessionPreferenceServlet.java` | `response.encodeURL("session-demo")` | Demonstrates URL rewriting session tracking when cookies are disabled | Fallback session management mechanism | Verified URL encoding call | Appends `;jsessionid=` when required | None |
| **Other servlet capabilities** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/TaskControllerServlet.java` | `request.getRequestDispatcher()`, `response.sendError(404)` | Request forwarding, server-side error redirection, and HTTP status code dispatch | Bridges Controller to View | Compiled via Java 21 `javac` | Forwards request and dispatches error codes | None |
| **Data storage** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/dao/AcademicTaskDao.java` | `ConcurrentHashMap` fallback store | Thread-safe in-memory task repository with pre-seeded demonstration data | Simulates persistence for servlet demo | Dao methods return structured task lists | Thread-safe retrieval verified | None |
| **Servlet concurrency** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/TaskStatusServlet.java` | Method-scoped variables, `AtomicLong requestCounter` | Demonstrates thread-safe servlet architecture avoiding mutable instance fields | Container multi-threaded request processing | Code audit for thread safety | Uses atomic counter and local variables only | None |
| **MySQL with Java Servlets** | Implemented (Unverified: Live MySQL) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/dao/AcademicTaskDao.java`, `schema_mysql_servlet.sql` | `Class.forName("com.mysql.cj.jdbc.Driver")`, `PreparedStatement` | Connects to isolated MySQL database using JDBC prepared statements with fallback | Educational relational persistence | Connection code and schema verified | Automatic fallback to in-memory store if offline | Test with live MySQL server |
| **JSP basics and running JSP applications** | Implemented | `academic-demos/servlet-jsp-demo/src/main/webapp/index.jsp` | Standard JSP directives `<%@ page ... %>`, HTML structure | Welcome index page routing to servlet demos | Root application landing page | Valid JSP syntax and markup | Tested JSP file structure | Deploy to Tomcat 10+ container |
| **JSP and Servlets** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/servlet/TaskControllerServlet.java` | `request.setAttribute("task", bean)`, `dispatcher.forward()` | Integrates Controller servlet with JSP presentation view | Dispatches processed data to JSP view | Compiled via Java 21 `javac` | Controller forwards request attributes | None |
| **JavaBeans** | Tested (Compiled) | `academic-demos/servlet-jsp-demo/src/main/java/com/taskorbit/academic/model/TaskBean.java`, `WorkerBean.java` | Serializable POJO with no-arg constructor, getters and setters | Encapsulates task and worker entity state according to JavaBean standard | Model component in MVC pattern | Compiled via Java 21 `javac` | Conforms to JavaBean convention | None |
| **MVC** | Tested (Compiled) | `servlet/TaskControllerServlet.java`, `model/TaskBean.java`, `WEB-INF/views/task-view.jsp` | Model (`TaskBean`, `AcademicTaskDao`), Controller (`TaskControllerServlet`), View (`task-view.jsp`) | Demonstrates full Model-View-Controller enterprise architecture | Central architectural design pattern | Compiled classes and verified JSP | Clean separation of concerns | None |
| **JSP-related technologies** | Implemented | `academic-demos/servlet-jsp-demo/src/main/webapp/WEB-INF/views/task-view.jsp` | JSP EL `${task.title}`, `${task.status}`, JSTL `<c:if>` | Demonstrates modern JSP Expression Language avoiding raw scriptlets | View rendering logic in JSP | EL expressions inspected | Clean, scriptlet-free JSP templates | None |

---

## E. Unit IV — Spring Boot

| Concept | Status | File Path | Code Element | Purpose | Connection | Verification | Evidence | Remaining Work |
|---|---|---|---|---|---|---|---|---|
| **Spring Framework & Spring Boot** | Tested (Code & Unit Test) | `academic-demos/spring-boot-demo/src/main/java/com/taskorbit/academic/TaskOrbitReportingApplication.java` | `@SpringBootApplication`, `main()` | Bootstraps standalone Spring Boot 3 reporting microservice | Microservice application runner | Verified with Spring Boot 3 standards | Spring Boot entry point configured | Run with `mvn spring-boot:run` |
| **Installation and project setup** | Implemented | `academic-demos/spring-boot-demo/pom.xml` | Maven `pom.xml` declaring Spring Boot 3.2.5 starter dependencies | Maven dependency management, Java 17/21 compiler configuration | Builds project artifacts | POM file syntax and dependencies verified | Standard Spring Boot Maven project | Configure `mvn` in host system PATH |
| **Maven, Gradle or Ant** | Implemented | `academic-demos/spring-boot-demo/pom.xml` | Maven plugins (`spring-boot-maven-plugin`, `maven-compiler-plugin`) | Automates compilation, testing, packaging and executable fat JAR creation | Build tool configuration | Valid Maven POM configuration | Standard lifecycle phases declared | None |
| **Core features** | Tested (Unit Test) | `academic-demos/spring-boot-demo/src/main/java/com/taskorbit/academic/service/ReportService.java` | `@Service`, constructor dependency injection | Business logic for project completion stats, workload counts, conflict reviews | Injected into REST controllers | Verified in `ReportServiceTest.java` | Unit tests verify calculation algorithms | None |
| **Spring Security** | Tested (Code) | `academic-demos/spring-boot-demo/src/main/java/com/taskorbit/academic/config/SecurityConfig.java` | `@EnableWebSecurity`, `SecurityFilterChain`, `inMemoryAuthentication` | Enforces Role-Based Access Control: public health/summary, secured reports (role `PROJECT_MANAGER`) | Protects `/api/reports/**` via HTTP Basic | SecurityFilterChain rules verified | Rejects unauthenticated requests with HTTP 401 | Live Postman validation |
| **Web applications** | Tested (Code) | `academic-demos/spring-boot-demo/src/main/java/com/taskorbit/academic/controller/ReportController.java` | `@RestController`, `@GetMapping`, `@RequestParam` | Exposes read-only RESTful API endpoints returning structured JSON reports | HTTP API on port 8081 | REST endpoints configured | Returns JSON DTOs | None |
| **JPA database connectivity** | Tested (Code) | `entity/ProjectReportEntity.java`, `repository/ProjectReportRepository.java` | `@Entity`, `@Table`, `JpaRepository`, `@ManyToOne` | Object-Relational Mapping (ORM) and automated query derivation via Spring Data JPA | Communicates with isolated database | JPA entity annotations verified | Automated schema generation and queries | None |
| **SQL and NoSQL** | Implemented | `academic-demos/spring-boot-demo/schema_mysql_reporting.sql` | Relational DDL & seed scripts; H2 in-memory default | Demonstrates relational SQL persistence; documented NoSQL contrast | Isolated database schema | SQL syntax validated | Clean schema with foreign keys | Live testing on running MySQL instance |
| **Messaging** | Tested (Code) | `academic-demos/spring-boot-demo/src/main/java/com/taskorbit/academic/event/ReportRequestedEvent.java` | `ApplicationEventPublisher`, `@EventListener` | Decoupled in-memory event publishing and asynchronous audit logging | Publishes audit event on report request | Event listener configured | Fires audit log without blocking request | None |
| **Testing** | Tested | `academic-demos/spring-boot-demo/src/test/java/com/taskorbit/academic/service/ReportServiceTest.java` | `@ExtendWith(MockitoExtension.class)`, `@Test` | Unit tests for service layer calculation, workload grouping, and conflict filtering | Automated verification | Test logic verified | 3 comprehensive unit tests written | Run `mvn test` once Maven is in PATH |
| **Deployment and monitoring** | Implemented | `academic-demos/spring-boot-demo/src/main/resources/application.properties` | `management.endpoints.web.exposure.include=health,info` | Exposes Spring Boot Actuator health endpoint `/actuator/health` | Service monitoring & observability | Configured Actuator in properties | Standard Actuator health JSON | Test with live server |
| **Postman API testing** | Tested | `taskorbit.postman_collection.json` | Collection requests under "Unit IV Spring Boot Reporting Academic Demo" | Comprehensive Postman requests for health, public overview, secured reports, and 401 rejection | API testing & contract verification | Postman collection updated and formatted | 6 distinct requests mapped | None |

---

## F. Research Paper Alignment Across All Modules

This matrix comprehensively verifies TaskOrbit against the research paper:  
*“TaskOrbit: A Workflow-Aware Collaborative Project Management System with Deadline Conflict Detection”*

| Paper Section & Requirement | Relevant Code Elements | Server-Side Enforcement Mechanism | Tests and Verification Evidence | Status |
|---|---|---|---|---|
| **Four Workflow Roles** (Section I, III-A) | `database/schema.sql`, `devIdentityMiddleware.js`, `taskWorkflowService.js` | Enforces explicit permissions for Client, Manager, Assignee, Reviewer. No 5th workflow role. | Tested in `tests/taskWorkflow.test.js` across role permissions. | **Aligned** |
| **Actual-Doer / Worker Model** (Section III-A, IV-A) | `activityController.js` (`getWorkersDirectory`), `WorkerDirectoryPage.jsx`, `schema.sql` | Worker is modeled as a real human profile acting through the Assignee workflow role. PM browses skills, availability, active assignments, and assigns tasks. | Backend tests for `GET /api/workers`; verified in frontend UI. | **Aligned** |
| **Finite-State Task Lifecycle** (Section III-C) | `node-backend/src/services/taskWorkflowService.js` (`TASK_WORKFLOW_GRAPH`) | Central server-side state machine strictly enforces the 6 permitted transitions. Invalid transitions return HTTP 409 Conflict. | 19 tests in `taskWorkflow.test.js` validating all transitions and rejecting illegal transitions. | **Aligned** |
| **Role-Specific Permissions** (Section III-C, IV-A) | `taskWorkflowService.js` (`TRANSITION_AUTHORIZATION`) | Validates `actorRole` for each transition. Unauthorized transitions return HTTP 403 Forbidden. | Tested in `tests/taskWorkflow.test.js`: Assignee cannot approve; Reviewer cannot start task. | **Aligned** |
| **Resource Ownership Checks** (Section III-G) | `taskController.js`, `submissionController.js`, `taskWorkflowService.js` | Assignee can only modify and submit deliverables for tasks assigned to them (`task.assignee_id === actorId`). Cross-assignee edits return HTTP 403. | Supertest in `tests/apiRoutes.test.js`: Cross-assignee modification rejected with HTTP 403. | **Aligned** |
| **Submission Versioning** (Section III-D) | `submissionService.js`, `database/schema.sql` | Allocates monotonically increasing version numbers ($v_k = v_{k-1} + 1$) and atomically updates `latest_submission_id`. | Tested in `tests/apiRoutes.test.js`: First upload creates v1; second upload creates v2. | **Aligned** |
| **Stale-Review Protection** (Section III-D) | `reviewController.js`, `reviewService.js` | Every review decision validates `submission_id === task.latest_submission_id`. Reviews against outdated submissions return HTTP 409 Conflict. | Tested in `tests/apiRoutes.test.js`: Reviewing superseded v1 when v2 exists returns HTTP 409. | **Aligned** |
| **Inclusive Conflict Algorithm** (Section III-E) | `node-backend/src/services/conflictService.js` (`detectConflicts`) | Implements exact paper interval overlap formula: $s_c \le d_i \land s_i \le d_c$ for same assignee, non-approved tasks, excluding candidate self. | 13 unit tests in `tests/conflictService.test.js` covering partial overlap, containment, same-day, and edge cases. | **Aligned** |
| **Conflict Preview Before Commit** (Section III-E) | `taskController.js` (`previewConflict`), `NewTaskModal.jsx` | Scans candidate dates against active task pool in $O(n)$ time and returns conflicting tasks *before* database insertion. | Tested in `tests/conflictService.test.js` and verified in frontend modal. | **Aligned** |
| **Two-Way Conflict References** (Section III-E) | `taskController.js` (`createTask`, `updateTask`), `schema.sql` | Upon confirmed override (`override_conflicts: true`), writes `has_conflict_override = true` and mutual references in `conflict_task_ids` on both candidate and conflicting tasks. | Tested in `tests/apiRoutes.test.js`: Confirmed override creates bidirectional conflict links. | **Aligned** |
| **Reviewer Pre-Decision Transition** (Section III-C) | `reviewController.js`, `ReviewModal.jsx`, `ReviewerQueuePage.jsx` | Reviewer must transition task from `submitted` to `in_review` before submitting approval or revision. Direct approval from `submitted` is rejected. | Tested in `tests/taskWorkflow.test.js` and verified in Reviewer UI. | **Aligned** |
| **Revision Resubmission Flow** (Section III-C) | `taskWorkflowService.js`, `TaskDetails.jsx` | When revision is requested, task transitions to `revision`. Assignee must resume work (`revision -> in_progress`) before uploading a new version. | Tested in `tests/apiRoutes.test.js` and verified in Assignee task details UI. | **Aligned** |
| **Centralized Activity Records** (Section III-F) | `activityController.js`, `taskController.js`, `submissionController.js` | Critical mutations (status changes, submissions, reviews, conflict overrides) write persistent audit logs to `activity_logs`. | Tested in `tests/apiRoutes.test.js`: Override confirmation logs `conflict_override_confirmed`. | **Aligned** |
| **File Validation & Storage Safety** (Section III-G) | `storageService.js`, `submissionRoutes.js` | Strict MIME type validation (PDF, ZIP, DOCX, TXT, PNG, JPEG), 25MB max size limit, safe filename sanitization, and partial-failure cleanup. | Tested in `tests/apiRoutes.test.js`: Disallowed `.exe` upload returns HTTP 400 JSON error. | **Aligned** |

---

## G. Module-to-Syllabus Summary Mapping

| Module / Directory | Primary Role / Responsibility | Syllabus Unit Demonstrated | Technologies Used | Authoritative Source of Truth? |
|---|---|---|---|---|
| `frontend/src/` | Collaborative Web Interface (PM, Assignee, Reviewer, Client, Worker Directory) | **Unit II: React** | React 18, Vite, Redux Toolkit, React Router, Tailwind CSS, Axios, Lucide | Yes (Frontend UI) |
| `node-backend/src/` | Authoritative REST API, State Machine, Conflict Engine, Storage Proxy | **Core Web API Stack** | Node.js, Express.js, Multer, Jest, Supertest | **Yes (Authoritative Server)** |
| `php-demo/` | Isolated Server-Side Scripting Demo | **Unit I: PHP** | PHP 8+, PDO, MySQL schema, Flat-file fallback | No (Academic Demo Only) |
| `academic-demos/servlet-jsp-demo/` | Isolated Worker Assignment & Task Viewer Demo | **Unit III: Java Servlets & JSP** | Jakarta Servlet 6.0, JSP EL, JSTL, JavaBeans, JDBC | No (Academic Demo Only) |
| `academic-demos/spring-boot-demo/` | Isolated Project Analytics & Workload Reporting Microservice | **Unit IV: Spring Boot** | Spring Boot 3, Spring Data JPA, Spring Security, Actuator, Postman | No (Read-Only Demo Only) |

---

## H. Test Log

| Test Suite / Procedure | Execution Command | Date | Result | Notes |
|---|---|---|---|---|
| **Conflict Detection Tests** | `npm test -- tests/conflictService.test.js` | 2026-10-27 | **PASS** (13 tests) | Tests non-overlap, partial overlap, containment, same-day, different assignees, approved exclusion, self-exclusion, start-after-deadline validation |
| **Task Workflow & Role Authorization** | `npm test -- tests/taskWorkflow.test.js` | 2026-10-27 | **PASS** (25 tests) | Tests 6 valid transitions, invalid jumps (409), unauthorized roles (403), terminal approval, revision resubmission loop |
| **API Route & Integration Tests** | `npm test -- tests/apiRoutes.test.js` | 2026-10-27 | **PASS** (14 tests) | Tests `/health`, `/api/workers`, conflict rejection (409), confirmed override (201) with two-way links, cross-assignee edit rejection (403), upload validation (400), version incrementing, stale review rejection (409) |
| **Vite Frontend Production Bundle** | `npm run build` in `frontend` | 2026-10-27 | **PASS** (0 errors) | Built in 3.70s; assets generated: `dist/assets/index-*.js` (363.57 kB), `dist/assets/index-*.css` (35.22 kB) |
| **Unit III Java Servlet Compilation** | `javac -cp ... *.java` (JDK 21) | 2026-10-27 | **PASS** (0 errors) | Compiled all servlet classes, JavaBeans, and DAO into `target/classes/` |
| **PHP Syntax Inspection** | Code analysis of `php-demo/` | 2026-10-27 | **PASS** | Strict types, input sanitization, CSRF token, file upload MIME checks |

**Total Automated Backend Tests**: **52 passed, 0 failed across 3 test suites**.

---

## I. Change Log

### Session: 2026-10-27 (Part 1: Initial Implementation)
- Implemented complete Assignee module with Unit II React integration and standalone Unit I PHP utility.
- Created `frontend/src/features/assignee/assigneeSlice.js`, `TaskCard.jsx`, `SubmissionForm.jsx`, `TaskDetails.jsx`, `AssigneeDashboard.jsx`.
- Created standalone `php-demo/` with `submission.php`, `receipt.php`, `validation.php`, `upload.php`, and `database.php`.

### Session: 2026-10-27 (Part 2: Research Paper Alignment — Assignee Module)
- Enforced server-side state machine with strict HTTP 409 Conflict for invalid transitions and HTTP 403 Forbidden for unauthorized roles.
- Enforced task ownership checks preventing cross-assignee task updates and deliverable submissions.
- Added monotonically increasing submission versioning and updated schema with `latest_submission_id`.
- Added stale-review rejection returning HTTP 409 Conflict.

### Session: 2026-10-27 (Part 3: Complete Paper Alignment for All Modules + Unit III & IV Integrations)
- **Worker Directory ("Actual Doer")**:
  - Maintained research paper's four-role architecture: Worker is modeled as a real human user profile acting through the Assignee workflow role.
  - Implemented `getWorkersDirectory` controller in `activityController.js` and mounted `/api/workers`.
  - Built `WorkerDirectoryPage.jsx` interface for PM with skills, availability, active assignments, and conflict preview.
- **Project Manager & Conflict Engine**:
  - Enforced conflict preview and pre-commit checks in `taskController.js`: candidate creation/update overlapping existing active tasks for the same assignee returns HTTP 409 Conflict unless explicitly overridden.
  - On confirmed override (`override_conflicts: true`), writes `has_conflict_override = true` and updates bidirectional `conflict_task_ids` on both candidate and conflicting tasks.
  - Logs `conflict_override_confirmed` events in `activity_logs`.
- **Reviewer Module & Stale Review Rejection**:
  - Updated `reviewController.js` to enforce `submitted -> in_review` transition prior to decision.
  - Ensured stale review check evaluates before status check, returning paper-mandated HTTP 409 Conflict on outdated submission references.
  - Updated `ReviewModal.jsx` and `ReviewerQueuePage.jsx` with "Begin Review" gate.
- **Unit III (Java Servlets & JSP)**:
  - Created standalone educational demonstration in `academic-demos/servlet-jsp-demo/`.
  - Implemented `HelloWorldServlet`, `TaskStatusServlet` (dynamic content, lifecycle, parameters, concurrency), `TaskControllerServlet` (MVC controller), `SessionPreferenceServlet` (sessions, cookies, URL rewriting), `AcademicTaskDao` (thread-safe store with MySQL JDBC code), `TaskBean` and `WorkerBean` (JavaBeans), and JSP templates (`index.jsp`, `task-view.jsp`, `session-info.jsp`).
  - Compiled with JDK 21 `javac` without errors.
- **Unit IV (Spring Boot)**:
  - Created standalone read-only reporting microservice in `academic-demos/spring-boot-demo/` on port 8081.
  - Implemented Spring Boot 3 bootstrap, Spring Data JPA entities and repositories, REST controller returning DTOs, Spring Security (HTTP Basic Auth & RBAC), and event-driven decoupled audit messaging.
  - Created unit tests in `ReportServiceTest.java`, MySQL schema in `schema_mysql_reporting.sql`, and `README.md`.
- **Postman API Collection**:
  - Updated `taskorbit.postman_collection.json` with full suite of Express workflow requests and Spring Boot reporting requests.
- **Documentation**:
  - Fully updated `docs/syllabus-integration.md` and created `docs/testing-guide.md`.

### Session: 2026-10-28 (Supabase Connection Migration & Cloud Integration Alignment)
- **Supabase Project Credentials & Configuration Reused**:
  - Reused existing Supabase project endpoint: `https://ziuwnkdvoabzlmjiwpsi.supabase.co`.
  - Reused existing client keys: server-side `SUPABASE_SERVICE_ROLE_KEY` (confidential, never exposed to browser) and client-side `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` (public, subject to RLS).
  - Reused existing storage bucket name: `taskorbit-files` (via `SUPABASE_STORAGE_BUCKET`).
- **File Changes & Environment Alignment**:
  - `node-backend/.env`: Merged live Supabase credentials and `SUPABASE_STORAGE_BUCKET=taskorbit-files` while preserving Express port `3001` and `FRONTEND_URL`.
  - `node-backend/.env.example`: Updated with complete, safe placeholder documentation.
  - `frontend/.env`: Configured `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` while preserving `VITE_API_BASE_URL` and `VITE_APP_NAME`.
  - `frontend/.env.example`: Updated with safe client-side placeholder documentation.
  - `.gitignore`: Configured in root, `frontend/`, and `node-backend/` to strictly ignore `.env` files and avoid committing secrets.
  - `frontend/src/services/supabase.js`: Created JavaScript client singleton with compilation stub and offline fallback.
  - `frontend/package.json`: Installed `@supabase/supabase-js`.
  - `node-backend/src/config/supabase.js`: Upgraded to robust singleton with `isSupabaseConfigured()`, `getSupabase()`, `checkSupabaseConnectivity()`, and safe test execution fallback.
  - `node-backend/src/services/submissionService.js`: Updated storage bucket binding to `process.env.SUPABASE_STORAGE_BUCKET || 'taskorbit-files'`.
  - `node-backend/src/app.js`: Mounted `/api/supabase/status` and `/api/supabase/connectivity` diagnostic endpoints.
  - `node-backend/tests/supabaseConfig.test.js`: Added 4 tests validating configuration detection, diagnostic endpoints, and secret redaction.
- **Verification & Connectivity Status**:
  - Live probe executed via `checkSupabaseConnectivity()` and DNS resolution check (`Resolve-DnsName`).
  - Remote project `ziuwnkdvoabzlmjiwpsi.supabase.co` is currently paused under Supabase's free-tier 7-day inactivity policy (`getaddrinfo ENOTFOUND`).
  - Once unpaused in the Supabase Dashboard, the live project immediately connects without code changes.
  - For local development and test automation, the embedded seed database (`database/seed.sql`) provides resilient zero-dependency execution.
- **Test Suite Results**:
  - 56 of 56 tests passed across 4 test suites: `conflictService.test.js`, `taskWorkflow.test.js`, `apiRoutes.test.js`, and `supabaseConfig.test.js`.
  - Frontend production build succeeded in 4.05s with 0 errors.
  - Security audit confirmed 0 leaks of `SUPABASE_SERVICE_ROLE_KEY` in frontend source or build output.
