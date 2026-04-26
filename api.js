import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 - auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ── Reflections ───────────────────────────────
export const reflectionsAPI = {
  create: (data) => api.post('/reflections', data),
  getAll: (params) => api.get('/reflections', { params }),
  getOne: (id) => api.get(`/reflections/${id}`),
  update: (id, data) => api.put(`/reflections/${id}`, data),
  delete: (id) => api.delete(`/reflections/${id}`),
  addFeedback: (id, data) => api.post(`/reflections/${id}/feedback`, data),
  getStats: () => api.get('/reflections/stats/summary'),
};

// ── Faculty ───────────────────────────────────
export const facultyAPI = {
  getStudents: () => api.get('/faculty/students'),
  getQueue: () => api.get('/faculty/queue'),
  getOverview: () => api.get('/faculty/overview'),
};

export default api;
