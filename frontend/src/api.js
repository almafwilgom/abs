import axios from 'axios';

// Always use Render API in production
// Only use localhost for local development when explicitly on localhost:5173
const isLocalDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
                   (window.location.port === '5173' || window.location.port === '3000');
const productionApiUrl = 'https://automated-banking-system.onrender.com/api';
const localApiUrl = `http://${window.location.hostname}:5000/api`;

const baseURL = isLocalDev ? localApiUrl : (import.meta.env.VITE_API_URL || productionApiUrl);
console.log(`API Base URL: ${baseURL} (isLocalDev: ${isLocalDev})`);

const api = axios.create({
  baseURL,
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
