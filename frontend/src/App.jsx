import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './app/store';
import { bootstrapSession, selectCurrentUser, selectAuthStatus } from './features/auth/authSlice';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute, PublicOnlyRoute, ROLE_HOME } from './components/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForbiddenPage } from './pages/auth/ForbiddenPage';

// Manager pages
import { ManagerProjectsPage } from './pages/manager/ManagerProjectsPage';
import { ManagerProjectDetailPage } from './pages/manager/ManagerProjectDetailPage';
import { ManagerTasksPage } from './pages/manager/ManagerTasksPage';
import { ManagerRequestsPage } from './pages/manager/ManagerRequestsPage';
import { WorkerDirectoryPage } from './pages/manager/WorkerDirectoryPage';

// Assignee pages
import { AssigneeTasksPage } from './pages/assignee/AssigneeTasksPage';
import { TaskDetails } from './pages/assignee/TaskDetails';

// Reviewer pages
import { ReviewerQueuePage } from './pages/reviewer/ReviewerQueuePage';

// Client pages
import { ClientRequestsPage } from './pages/client/ClientRequestsPage';
import { ClientProjectsPage } from './pages/client/ClientProjectsPage';
import { ClientProjectDetailPage } from './pages/client/ClientProjectDetailPage';

function RootRedirect() {
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  if (status !== 'ready') return null;
  return <Navigate to={user ? ROLE_HOME[user.role] || '/login' : '/login'} replace />;
}

/** Authenticated shell: sidebar layout + nested pages. */
function Shell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

const only = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

export function AppRoutes() {
  const dispatch = useDispatch();

  // Restore the session from the HttpOnly cookie on first load.
  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      <Route element={<Shell />}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Manager */}
        <Route path="/manager/projects" element={only(['project_manager'], <ManagerProjectsPage />)} />
        <Route path="/manager/projects/:id" element={only(['project_manager'], <ManagerProjectDetailPage />)} />
        <Route path="/manager/tasks" element={only(['project_manager'], <ManagerTasksPage />)} />
        <Route path="/manager/workers" element={only(['project_manager'], <WorkerDirectoryPage />)} />
        <Route path="/manager/requests" element={only(['project_manager'], <ManagerRequestsPage />)} />

        {/* Assignee */}
        <Route path="/assignee/tasks" element={only(['assignee'], <AssigneeTasksPage />)} />
        <Route path="/assignee/tasks/:id" element={only(['assignee'], <TaskDetails />)} />

        {/* Reviewer */}
        <Route path="/reviewer/queue" element={only(['reviewer'], <ReviewerQueuePage />)} />

        {/* Client */}
        <Route path="/client/requests" element={only(['client'], <ClientRequestsPage />)} />
        <Route path="/client/projects" element={only(['client'], <ClientProjectsPage />)} />
        <Route path="/client/projects/:id" element={only(['client'], <ClientProjectDetailPage />)} />

        <Route path="*" element={<RootRedirect />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
