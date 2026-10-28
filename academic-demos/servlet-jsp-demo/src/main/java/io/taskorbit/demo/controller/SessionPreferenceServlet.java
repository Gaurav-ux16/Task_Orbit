package io.taskorbit.demo.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * SessionPreferenceServlet — Demonstrates Session management, Cookies, and URL Rewriting.
 * 
 * Demonstrates Syllabus Concepts:
 * 1. "Sessions and cookies" (HttpSession lifecycle, reading/writing HTTP cookies)
 * 2. "URL rewriting" (response.encodeURL for cookie-less session tracking)
 */
@WebServlet(name = "SessionPreferenceServlet", urlPatterns = {"/session-pref"})
public class SessionPreferenceServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        // 1. Session Demonstration (Syllabus: "Sessions")
        HttpSession session = req.getSession(true);
        if (session.getAttribute("demoUser") == null) {
            session.setAttribute("demoUser", "Carol Singh (Assignee Developer)");
            session.setAttribute("sessionCreatedAt", LocalDateTime.now().toString());
            session.setAttribute("accessCount", 1);
        } else {
            Integer count = (Integer) session.getAttribute("accessCount");
            session.setAttribute("accessCount", count != null ? count + 1 : 1);
        }

        // 2. Cookie Demonstration (Syllabus: "Cookies")
        String workerIdParam = req.getParameter("workerId");
        if (workerIdParam != null && !workerIdParam.trim().isEmpty()) {
            Cookie workerCookie = new Cookie("taskorbit_worker_pref", workerIdParam);
            workerCookie.setMaxAge(60 * 60 * 24); // 24 hours expiry
            workerCookie.setHttpOnly(true);      // Security best practice
            workerCookie.setPath(req.getContextPath() + "/");
            resp.addCookie(workerCookie);
            session.setAttribute("currentPreference", workerIdParam);
        }

        // Read existing cookies from request
        Cookie[] cookies = req.getCookies();
        String cookieValue = "Not set";
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("taskorbit_worker_pref".equals(c.getName())) {
                    cookieValue = c.getValue();
                    break;
                }
            }
        }

        // 3. URL Rewriting Demonstration (Syllabus: "URL rewriting")
        // Demonstrates container URL encoding (appends ;jsessionid=... if cookies are disabled)
        String rewrittenUrl = resp.encodeURL("session-pref?workerId=" + (workerIdParam != null ? workerIdParam : "assignee-001"));

        req.setAttribute("sessionId", session.getId());
        req.setAttribute("accessCount", session.getAttribute("accessCount"));
        req.setAttribute("sessionUser", session.getAttribute("demoUser"));
        req.setAttribute("cookiePreference", cookieValue);
        req.setAttribute("rewrittenUrl", rewrittenUrl);

        RequestDispatcher dispatcher = req.getRequestDispatcher("/WEB-INF/views/session-info.jsp");
        dispatcher.forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        doGet(req, resp);
    }
}
