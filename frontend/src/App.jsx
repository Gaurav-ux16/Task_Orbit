import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './app/store';
import { bootstrapSession, selectCurrentUser, selectAuthStatus } from './features/auth/authSlice';
import { AppLayout } from './layouts/AppLayout';
import { Spinner } from './components/Spinner';
import { ProtectedRoute, PublicOnlyRoute, ROLE_HOME } from './components/ProtectedRoute';

import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForbiddenPage } from './pages/auth/ForbiddenPage';

// Manager pages
const ManagerProjectsPage = lazy(() => import('./pages/manager/ManagerProjectsPage').then((m) => ({ default: m.ManagerProjectsPage })));
const ManagerProjectDetailPage = lazy(() => import('./pages/manager/ManagerProjectDetailPage').then((m) => ({ default: m.ManagerProjectDetailPage })));
const ManagerTasksPage = lazy(() => import('./pages/manager/ManagerTasksPage').then((m) => ({ default: m.ManagerTasksPage })));
const ManagerRequestsPage = lazy(() => import('./pages/manager/ManagerRequestsPage').then((m) => ({ default: m.ManagerRequestsPage })));
const WorkerDirectoryPage = lazy(() => import('./pages/manager/WorkerDirectoryPage').then((m) => ({ default: m.WorkerDirectoryPage })));

// Assignee pages
const AssigneeTasksPage = lazy(() => import('./pages/assignee/AssigneeTasksPage').then((m) => ({ default: m.AssigneeTasksPage })));
const TaskDetails = lazy(() => import('./pages/assignee/TaskDetails').then((m) => ({ default: m.TaskDetails })));

// Reviewer pages
const ReviewerQueuePage = lazy(() => import('./pages/reviewer/ReviewerQueuePage').then((m) => ({ default: m.ReviewerQueuePage })));

// Client pages
const ClientRequestsPage = lazy(() => import('./pages/client/ClientRequestsPage').then((m) => ({ default: m.ClientRequestsPage })));
const ClientProjectsPage = lazy(() => import('./pages/client/ClientProjectsPage').then((m) => ({ default: m.ClientProjectsPage })));
const ClientProjectDetailPage = lazy(() => import('./pages/client/ClientProjectDetailPage').then((m) => ({ default: m.ClientProjectDetailPage })));

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
        <Suspense fallback={<div className="flex justify-center py-24" role="status" aria-label="Loading page"><Spinner size={22} /></div>}>
          <Outlet />
        </Suspense>
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
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      <Route element={<Shell />}>
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
