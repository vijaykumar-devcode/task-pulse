import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (payload) => apiClient.post('/api/auth/register', payload),
  login: (payload) => apiClient.post('/api/auth/login', payload),
  me: () => apiClient.get('/api/auth/me'),
};

export const usersApi = {
  list: (params) => apiClient.get('/api/users', { params }),
  create: (payload) => apiClient.post('/api/users', payload),
  update: (id, payload) => apiClient.put(`/api/users/${id}`, payload),
  remove: (id) => apiClient.delete(`/api/users/${id}`),
};

export const tasksApi = {
  list: (params) => apiClient.get('/api/tasks', { params }),
  detail: (id) => apiClient.get(`/api/tasks/${id}`),
  create: (formData) => apiClient.post('/api/tasks', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => apiClient.put(`/api/tasks/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => apiClient.delete(`/api/tasks/${id}`),
  removeDocument: (taskId, documentId) => apiClient.delete(`/api/tasks/${taskId}/documents/${documentId}`),
  documentUrl: (taskId, documentId, download = false) => `${apiClient.defaults.baseURL}/api/tasks/${taskId}/documents/${documentId}${download ? '?download=true' : ''}`,
};

export default apiClient;
