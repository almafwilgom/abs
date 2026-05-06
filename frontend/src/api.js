import axios from 'axios';

// Dynamically determine API URL
const getBaseURL = () => {
  const { hostname } = window.location;
  
  // If we're on localhost or an IP address (testing on phone), 
  // we might want to hit a local backend or the production one.
  // For now, let's prioritize the environment variable if it exists.
  
  if (import.meta.env.VITE_API_URL && import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to production for deployed sites
  if (hostname.includes('pages.dev') || hostname.includes('onrender.com')) {
    return 'https://automated-banking-system.onrender.com/api';
  }
  
  // If we're on a local IP (phone testing), try to hit the computer's backend
  // This assumes the backend is running on port 5000 on the same machine
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return `http://${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

const baseURL = getBaseURL();
console.log(`API Base URL: ${baseURL}`);

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
