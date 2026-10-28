import { configureStore } from '@reduxjs/toolkit';
import devIdentityReducer from './devIdentitySlice';
import tasksReducer from '../features/tasks/tasksSlice';
import projectsReducer from '../features/projects/projectsSlice';
import projectRequestsReducer from '../features/clients/projectRequestsSlice';
import assigneeReducer from '../features/assignee/assigneeSlice';

export const store = configureStore({
  reducer: {
    devIdentity: devIdentityReducer,
    tasks: tasksReducer,
    projects: projectsReducer,
    projectRequests: projectRequestsReducer,
    assignee: assigneeReducer,
  },
});
