
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://furp02-staging.funtechcom.com/api/v1/mito',
  headers: {
    'Content-Type': 'application/json',
    'ApiKey': 'd2783dc0-0ebc-4980-98ec-6203215f81ec'
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
