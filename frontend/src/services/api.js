import axios from 'axios';
import { store } from '../app/store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach dev identity headers from Redux state
api.interceptors.request.use((config) => {
  const state = store.getState();
  const user = state.devIdentity?.currentUser;
  if (user) {
    config.headers['X-Dev-User-Id'] = user.id;
    config.headers['X-Dev-Role'] = user.role;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'Network error';
    return Promise.reject(Object.assign(err, { friendlyMessage: message }));
  }
);

export default api;
