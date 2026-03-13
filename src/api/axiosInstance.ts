import axios from 'axios';

const APP_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const TOKEN_KEY = 'hyperpc_dashboard_token';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('hyperpc_dashboard_user');
      window.location.href = `${APP_BASE}/login`;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
