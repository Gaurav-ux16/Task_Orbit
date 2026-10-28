import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './app/store';
import { selectCurrentUser } from './app/devIdentitySlice';
import { AppLayout } from './layouts/AppLayout';

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
  if (user?.role === 'assignee') return <Navigate to="/assignee/tasks" replace />;
  if (user?.role === 'reviewer') return <Navigate to="/reviewer/queue" replace />;
  if (user?.role === 'client') return <Navigate to="/client/requests" replace />;
  return <Navigate to="/manager/projects" replace />;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            {/* Manager Routes */}
            <Route path="/manager/projects" element={<ManagerProjectsPage />} />
            <Route path="/manager/projects/:id" element={<ManagerProjectDetailPage />} />
            <Route path="/manager/tasks" element={<ManagerTasksPage />} />
            <Route path="/manager/workers" element={<WorkerDirectoryPage />} />
            <Route path="/manager/requests" element={<ManagerRequestsPage />} />

            {/* Assignee Routes */}
            <Route path="/assignee/tasks" element={<AssigneeTasksPage />} />
            <Route path="/assignee/tasks/:id" element={<TaskDetails />} />

            {/* Reviewer Routes */}
            <Route path="/reviewer/queue" element={<ReviewerQueuePage />} />

            {/* Client Routes */}
            <Route path="/client/requests" element={<ClientRequestsPage />} />
            <Route path="/client/projects" element={<ClientProjectsPage />} />
            <Route path="/client/projects/:id" element={<ClientProjectDetailPage />} />

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </Provider>
  );
}
