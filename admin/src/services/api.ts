import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — auth failures (never redirect on login/signup failures)
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? '');

    const isAuthRoute =
      url.includes('/api/v1/admin/auth/login-password') ||
      url.includes('/api/v1/admin/auth/signup') ||
      url.includes('/api/v1/admin/auth/request-otp') ||
      url.includes('/api/v1/admin/auth/verify-otp');

    if ((status === 401 || status === 403) && !isAuthRoute) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
