import axios from 'axios';

// Always use Render API in production
// Only use localhost for local development when explicitly on localhost:5173
const productionApiUrl = 'https://automated-banking-system.onrender.com/api';

// HARDCODED FOR PRODUCTION DEBUG
const baseURL = productionApiUrl;
console.log(`DEBUG MODE: Using API Base URL: ${baseURL}`);

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
