import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookie-based sessions
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Redirect to login or handle session expiry
            console.log('Unauthorized, redirecting to login...');
            // window.location.href = '/login'; // Simple redirect for now
        }
        return Promise.reject(error);
    }
);

export default api;
