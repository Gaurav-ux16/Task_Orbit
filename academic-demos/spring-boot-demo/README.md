# TaskOrbit Unit IV Academic Demonstration: Spring Boot Reporting Service

## 1. Overview & Academic Syllabus Alignment

This module demonstrates **Unit IV (Spring Boot & Enterprise Web Development)** from the Computer Engineering Web Technology syllabus in the context of the **TaskOrbit** collaborative project management system.

It is structured as an **isolated, read-only reporting microservice** that provides management analytics, project completion statistics, worker workload metrics, and deadline conflict audit summaries.

### Architecture Isolation Guarantee
- **Core Production Stack**: React + Express + Supabase PostgreSQL (`http://localhost:3001`).
- **Academic Demonstration Port**: `http://localhost:8081` (strictly isolated, never mutates live production tasks).
- **Database Isolation**: By default runs in-memory H2 database with seeded snapshot data; optional MySQL schema provided in `schema_mysql_reporting.sql`.

---

## 2. Implemented Syllabus Concepts

| Syllabus Concept | Code Artifact | Purpose |
|---|---|---|
| **Spring Framework & Spring Boot** | `TaskOrbitReportingApplication.java` | Spring Boot 3 entry point, `@SpringBootApplication`, automatic component scanning and bootstrap. |
| **Dependency Injection** | `ReportService.java`, `ReportController.java` | Constructor-based dependency injection (`@Service`, `@RestController`). |
| **JPA & Database Connectivity** | `ProjectReportEntity.java`, `TaskSummaryEntity.java`, `ProjectReportRepository.java` | Spring Data JPA entities, relational mapping (`@ManyToOne`), query derivation and derived aggregation. |
| **Spring Security** | `SecurityConfig.java` | Role-Based Access Control (RBAC), HTTP Basic authentication, CSRF configuration, stateless session management. |
| **Web REST APIs** | `ReportController.java` | RESTful endpoints returning JSON DTOs (`ProjectReportDTO`, `WorkerWorkloadDTO`, `ConflictSummaryDTO`). |
| **Messaging & Events** | `ReportRequestedEvent.java`, `ReportAuditListener.java` | Decoupled event publication via Spring's `ApplicationEventPublisher` and asynchronous audit logging via `@EventListener`. |
| **Deployment & Monitoring** | `pom.xml`, `application.properties` | Spring Boot Actuator health endpoint (`/actuator/health`), application metrics. |
| **Testing** | `ReportServiceTest.java` | Unit tests for service logic, workload calculations, and conflict filtering with Mockito. |

---

## 3. Configuration & Ports

- **Port**: `8081` (defined in `src/main/resources/application.properties`).
- **Default Database**: H2 in-memory (`jdbc:h2:mem:taskorbit_reporting;DB_CLOSE_DELAY=-1`).
- **Security Credentials**:
  - Username: `manager`
  - Password: `manager123`
  - Role: `PROJECT_MANAGER`

---

## 4. Endpoints & API Reference

### Public Endpoints (No Authentication Required)
- `GET http://localhost:8081/actuator/health`
  - Returns Spring Boot Actuator service health: `{"status": "UP"}`.
- `GET http://localhost:8081/api/reports/public`
  - Returns public platform overview: total projects, active projects, and system timestamp.

### Secured Endpoints (Requires Basic Auth: `manager` / `manager123`)
- `GET http://localhost:8081/api/reports/projects`
  - Returns list of projects with task counts and completion percentages.
- `GET http://localhost:8081/api/reports/workers`
  - Returns aggregated workload breakdown per worker (active tasks, completed tasks, flagged conflicts).
- `GET http://localhost:8081/api/reports/conflicts`
  - Returns list of tasks that have confirmed deadline conflict overrides (`has_conflict_override = true`) and their two-way conflict links.

---

## 5. How to Build & Run

### Prerequisites
- Java Development Kit (JDK 17 or JDK 21). Verified with OpenJDK 21.
- Apache Maven (3.8+).

### Commands
```bash
# Navigate to the demonstration directory
cd academic-demos/spring-boot-demo

# Run tests
mvn test

# Start the Spring Boot application on port 8081
mvn spring-boot:run
```

### Optional MySQL Setup
To run against a local MySQL server instead of in-memory H2:
1. Execute `schema_mysql_reporting.sql` on MySQL 8.0+.
2. Activate the MySQL profile in `application.properties`:
   ```properties
   spring.profiles.active=mysql
   ```

---

## 6. Testing via Postman & cURL

### cURL Examples
```bash
# 1. Check Service Health
curl -s http://localhost:8081/actuator/health

# 2. Public Platform Summary
curl -s http://localhost:8081/api/reports/public

# 3. Access Secured Project Reports (Rejection without auth -> HTTP 401)
curl -i http://localhost:8081/api/reports/projects

# 4. Access Secured Project Reports with Basic Auth
curl -u manager:manager123 http://localhost:8081/api/reports/projects

# 5. Access Worker Workload Report
curl -u manager:manager123 http://localhost:8081/api/reports/workers

# 6. Access Conflict Overrides Audit
curl -u manager:manager123 http://localhost:8081/api/reports/conflicts
```
