
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://furp02-staging.funtechcom.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
    // The ApiKey can be set here if it's static, or added dynamically
    // 'ApiKey': process.env.NEXT_PUBLIC_FURP_API_KEY
  },
});

// Add a request interceptor to include the JWT token from localStorage
api.interceptors.request.use(
  config => {
    // This check ensures we're in a browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
