import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer, { logout, sessionExpired } from '../features/auth/authSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import projectsReducer from '../features/projects/projectsSlice';
import projectRequestsReducer from '../features/clients/projectRequestsSlice';
import assigneeReducer from '../features/assignee/assigneeSlice';

const appReducer = combineReducers({
  auth: authReducer,
  tasks: tasksReducer,
  projects: projectsReducer,
  projectRequests: projectRequestsReducer,
  assignee: assigneeReducer,
});

/**
 * When a session ends, wipe every cached business slice so the next person to sign in
 * on this browser can never see the previous user's data.
 */
const rootReducer = (state, action) => {
  if (state && (logout.fulfilled.match(action) || sessionExpired.match(action))) {
    return appReducer({ auth: state.auth }, action);
  }
  return appReducer(state, action);
};

export const makeStore = (preloadedState) => configureStore({ reducer: rootReducer, preloadedState });

export const store = makeStore();
