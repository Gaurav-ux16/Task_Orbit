import api from './api';

// Project Requests
export const projectRequestsApi = {
  list: (params) => api.get('/api/project-requests', { params }),
  get: (id) => api.get(`/api/project-requests/${id}`),
  create: (data) => api.post('/api/project-requests', data),
  update: (id, data) => api.patch(`/api/project-requests/${id}`, data),
};

// Projects
export const projectsApi = {
  list: (params) => api.get('/api/projects', { params }),
  get: (id) => api.get(`/api/projects/${id}`),
  create: (data) => api.post('/api/projects', data),
  update: (id, data) => api.patch(`/api/projects/${id}`, data),
  getActivity: (projectId, params) => api.get(`/api/projects/${projectId}/activity`, { params }),
};

// Tasks
export const tasksApi = {
  list: (params) => api.get('/api/tasks', { params }),
  get: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post('/api/tasks', data),
  update: (id, data) => api.patch(`/api/tasks/${id}`, data),
  updateStatus: (id, status) => api.post(`/api/tasks/${id}/status`, { status }),
  previewConflicts: (taskId, data) => api.post(`/api/tasks/${taskId}/conflict-preview`, data),
};

// Submissions
export const submissionsApi = {
  list: (taskId) => api.get(`/api/tasks/${taskId}/submissions`),
  create: (taskId, formData) =>
    api.post(`/api/tasks/${taskId}/submissions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDownloadUrl: (id) => api.get(`/api/submissions/${id}/download`),
};

// Reviews
export const reviewsApi = {
  getPending: () => api.get('/api/reviews/pending'),
  getForTask: (taskId) => api.get(`/api/tasks/${taskId}/reviews`),
  create: (submissionId, data) => api.post(`/api/submissions/${submissionId}/reviews`, data),
};

// Profiles
export const profilesApi = {
  list: (params) => api.get('/api/profiles', { params }),
};

// Workers Directory
export const workersApi = {
  list: () => api.get('/api/workers'),
};


// Authentication & session
export const authApi = {
  me: () => api.get('/api/auth/me'),
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  logoutAll: () => api.post('/api/auth/logout-all'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
};

// Account provisioning (project managers only)
export const usersApi = {
  create: (data) => api.post('/api/users', data),
};

// Reports (project managers only)
export const reportsApi = {
  summary: () => api.get('/api/reports/summary'),
  tasksCsv: () => api.get('/api/reports/tasks.csv', { responseType: 'blob' }),
};
