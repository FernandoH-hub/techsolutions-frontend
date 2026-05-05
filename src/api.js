import axios from 'axios';

const api = axios.create({
  baseURL: 'https://techsolutions-backend-636p.onrender.com/api'});

// Este interceptor saca el token del localStorage y lo pone en el header
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
