
import axios from 'axios';

// The base URL now points to our internal Next.js proxy route.
// The proxy will then forward the request to the actual Furp API.
// The ApiKey is now handled by the proxy, so it's removed from here.
export const api = axios.create({
  baseURL: '/api/proxy',
  headers: {
    'Content-Type': 'application/json',
  },
});

// The request interceptor to add the JWT token is still needed,
// as the proxy will forward the Authorization header.
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
