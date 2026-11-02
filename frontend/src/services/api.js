import axios from 'axios';
import { store } from '../app/store';
import { sessionExpired } from '../features/auth/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // Send the HttpOnly session cookie on every request (the token itself is never readable by JS).
  withCredentials: true,
});

const UNSAFE = new Set(['post', 'put', 'patch', 'delete']);

// CSRF: echo the per-session token on every state-changing call.
api.interceptors.request.use((config) => {
  if (UNSAFE.has((config.method || 'get').toLowerCase())) {
    const token = store.getState().auth?.csrfToken;
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

// Normalise errors; a 401 anywhere (except the auth endpoints themselves) ends the local session.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    if (status === 401 && !url.includes('/api/auth/')) {
      store.dispatch(sessionExpired());
    }

    const details = err.response?.data?.details;
    let message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'Network error';
    if (Array.isArray(details) && details.length && status === 400) {
      message = `${message}: ${details.map((d) => d.message).join('; ')}`;
    }
    if (status === 429) message = 'Too many requests — please wait a moment and try again.';
    return Promise.reject(Object.assign(err, { friendlyMessage: message }));
  }
);

export default api;
