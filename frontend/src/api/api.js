import axios from 'axios';

// In a Vite project, environment variables are accessed via `import.meta.env`.
// `process.env` is a Node.js feature and is not available in the browser.
// Variables must be prefixed with `VITE_` to be exposed to the client.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create a custom instance of axios
const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor to automatically attach the JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // This part handles errors that happen before the request is sent
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => {
        // Any status code that lies within the range of 2xx cause this function to trigger
        return response;
    },
    (error) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // If we get a 401 (Unauthorized) or 403 (Forbidden) error, it means the user's
            // session is invalid or their permissions have changed. The safest action is to log them out.
            localStorage.clear();
            // Use window.location to force a full page reload to clear any component state.
            window.location.href = '/login';
            // We can show a toast message here, but the page will reload immediately.
            // The login page can be updated to show a message if needed.
        }
        return Promise.reject(error);
    }
);

export default api;
