import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const activeWorkspace = localStorage.getItem('activeWorkspace');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (activeWorkspace) {
      config.headers['x-workspace-id'] = activeWorkspace;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s (token expiry)
api.interceptors.response.use(
  (response) => response.data, // Simplify accessing the response payload
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
