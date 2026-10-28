package io.taskorbit.demo.controller;

import io.taskorbit.demo.dao.AcademicTaskDao;
import io.taskorbit.demo.model.TaskBean;
import io.taskorbit.demo.model.WorkerBean;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * TaskControllerServlet — MVC Front Controller for Task Management.
 * 
 * Demonstrates Syllabus Concepts:
 * 1. "MVC" (Model-View-Controller architecture in Web Technology)
 * 2. "JSP and Servlets" (Servlet controllers forwarding to JSP presentation views)
 * 3. "JavaBeans" (Model objects populated and accessed via EL in JSP)
 * 4. "Other servlet capabilities" (RequestDispatcher forwarding, request attributes)
 */
@WebServlet(name = "TaskControllerServlet", urlPatterns = {"/tasks"})
public class TaskControllerServlet extends HttpServlet {

    private AcademicTaskDao taskDao;

    @Override
    public void init() throws ServletException {
        super.init();
        this.taskDao = new AcademicTaskDao();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        // 1. Extract query parameter (workerId)
        String workerId = req.getParameter("workerId");
        if (workerId == null || workerId.trim().isEmpty()) {
            workerId = "assignee-001";
        }

        // 2. Query Model layer via DAO
        List<TaskBean> tasks = taskDao.getTasksByWorkerId(workerId);
        WorkerBean worker = taskDao.getWorkerById(workerId);
        List<WorkerBean> allWorkers = taskDao.getAllWorkers();

        // 3. Attach data as request attributes for JSP View access
        req.setAttribute("taskList", tasks);
        req.setAttribute("selectedWorker", worker);
        req.setAttribute("allWorkers", allWorkers);
        req.setAttribute("activeWorkerId", workerId);

        // 4. Forward to JSP View (MVC pattern: Controller forwards to View)
        RequestDispatcher dispatcher = req.getRequestDispatcher("/WEB-INF/views/task-view.jsp");
        dispatcher.forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        // Handle POST parameter
        String workerId = req.getParameter("workerId");
        if (workerId == null || workerId.trim().isEmpty()) {
            workerId = "assignee-001";
        }

        // Redirect-after-post to prevent double submission
        resp.sendRedirect("tasks?workerId=" + workerId);
    }
}
