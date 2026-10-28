# TaskOrbit — Unit III Java Servlets & JSP Academic Demonstration

## Overview
This module demonstrates the **Unit III (Java Server-Side Technologies: Servlets & JSP)** concepts of the Web Technology syllabus for the **TaskOrbit** project.

It provides an isolated educational demonstration of:
1. **Servlet Architecture:** Standard HTTP request processing through the container.
2. **Hello World Servlet:** `HelloWorldServlet.java` producing dynamic markup.
3. **Dynamic Content:** `TaskStatusServlet.java` reading parameters and generating dynamic tables.
4. **Servlet Lifecycle:** `init()`, `service()`/`doGet()`, `destroy()` with execution logging.
5. **Request Parameters:** Extracting query strings and form parameters (`workerId`, `taskId`).
6. **Sessions & Cookies:** `HttpSession` demo identity, `HttpOnly` preference cookies (`taskorbit_worker_pref`).
7. **URL Rewriting:** `response.encodeURL()` for cookie-less tracking.
8. **JavaBeans:** `TaskBean.java` and `WorkerBean.java` implementing standard JavaBean conventions.
9. **MVC Architecture:** `TaskControllerServlet.java` (Controller) &rarr; `AcademicTaskDao.java` (Model) &rarr; `task-view.jsp` (View).
10. **Concurrency:** Stateless per-request stack allocation documented and proven in `TaskStatusServlet.java`.
11. **MySQL with Java Servlets:** `AcademicTaskDao.java` using JDBC prepared statements with fallback to in-memory fixtures.

---

## Directory Structure
```
academic-demos/servlet-jsp-demo/
├── pom.xml                                   # Maven POM specifying Java 21 & Jakarta Servlet 6.0
├── schema_mysql_servlet.sql                  # Educational isolated MySQL database schema
├── lib/
│   └── jakarta.servlet-api-6.0.0.jar         # Compilation dependency jar
├── src/main/
│   ├── java/io/taskorbit/demo/
│   │   ├── controller/
│   │   │   ├── HelloWorldServlet.java       # Hello World & architecture
│   │   │   ├── TaskStatusServlet.java       # Lifecycle, dynamic content & concurrency
│   │   │   ├── TaskControllerServlet.java   # MVC front controller
│   │   │   └── SessionPreferenceServlet.java# Sessions, cookies, URL rewriting
│   │   ├── dao/
│   │   │   └── AcademicTaskDao.java         # JDBC PreparedStatement + in-memory fallback
│   │   └── model/
│   │       ├── TaskBean.java                # JavaBean representing tasks
│   │       └── WorkerBean.java              # JavaBean representing assignees
│   └── webapp/
│       ├── WEB-INF/
│       │   ├── web.xml                      # Deployment descriptor
│       │   └── views/
│       │       ├── task-view.jsp            # MVC JSP view with Expression Language
│       │       └── session-info.jsp         # Session & cookie inspection view
│       └── index.jsp                        # Entry portal
└── target/classes/                          # Compiled bytecode classes (verified Java 21)
```

---

## Compilation & Verification

### Standalone Compilation (without Maven)
Using Java 21 `javac`:
```bash
javac -cp "lib/jakarta.servlet-api-6.0.0.jar" -d target/classes $(find src/main/java -name "*.java")
```

### Running in Apache Tomcat 10+
1. Package the WAR:
   ```bash
   jar -cvf taskorbit-servlet-demo.war -C src/main/webapp/ . -C target/classes/ WEB-INF/classes
   ```
2. Copy `taskorbit-servlet-demo.war` to `$CATALINA_HOME/webapps/`.
3. Start Tomcat:
   ```bash
   $CATALINA_HOME/bin/startup.sh   # or startup.bat on Windows
   ```
4. Access in browser:
   - Portal: `http://localhost:8080/taskorbit-servlet-demo/`
   - Hello World: `http://localhost:8080/taskorbit-servlet-demo/hello`
   - Dynamic Task Status: `http://localhost:8080/taskorbit-servlet-demo/task-status?workerId=assignee-001`
   - MVC Controller: `http://localhost:8080/taskorbit-servlet-demo/tasks?workerId=assignee-001`
   - Session & Cookie: `http://localhost:8080/taskorbit-servlet-demo/session-pref`
