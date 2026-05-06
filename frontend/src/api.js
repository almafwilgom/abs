import axios from 'axios';

// Always use Render API in production
// Only use localhost for local development when explicitly on localhost:5173
const isLocalDev = window.location.hostname === 'localhost' && window.location.port === '5173';
const productionApiUrl = 'https://automated-banking-system.onrender.com/api';
const localApiUrl = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: isLocalDev ? localApiUrl : (import.meta.env.VITE_API_URL || productionApiUrl),
});

export const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  },
});

export const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;
