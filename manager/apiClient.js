import axios from "axios";

// Use relative URL in development (via Vite proxy) or absolute URL from env
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  timeout: 30000 // 30 second timeout for better reliability
});

apiClient.interceptors.request.use(config => {
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    // Don't redirect on 401 for:
    // 1. /auth/me calls (handled in useAuth)
    // 2. /auth/login calls (handled in LoginPage for email verification)
    // 3. /auth/register calls (handled in RegisterPage for email verification)
    const url = error.config?.url || '';
    const shouldRedirect = error.response?.status === 401 && 
      !url.includes('/auth/me') && 
      !url.includes('/auth/login') && 
      !url.includes('/auth/register');
    
    if (shouldRedirect) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;


