import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5050/api',
});

// Attach the JWT token automatically if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;