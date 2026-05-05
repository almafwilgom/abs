import axios from 'axios';

const productionApiUrl = 'https://automated-banking-system.onrender.com/api';
const localApiUrl = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApiUrl : localApiUrl),
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
