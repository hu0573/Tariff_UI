// API client setup with interceptors
import axios from 'axios';

export function getApiBaseURL(): string {
  const forceRelative = ['1', 'true'].includes(import.meta.env.VITE_API_FORCE_RELATIVE);
  if (forceRelative) {
    console.log('API Client: Forcing relative /api base');
    return '';
  }

  if (import.meta.env.VITE_API_BASE_URL !== undefined) {
    console.log('API Client: Using VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }

  console.log('API Client: Defaulting to relative /api base');
  return '';
}

export const API_BASE_URL = getApiBaseURL();
console.log('API Client: Detected API Base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // Default timeout 5 minutes (300 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate client for long-running operations (like config updates with connection tests)
export const longRunningApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for long operations
  headers: {
    'Content-Type': 'application/json',
  },
});

longRunningApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        console.error('Unauthorized: API key may be missing or invalid');
      } else if (status === 403) {
        console.error('Forbidden: Invalid API key');
      }
      
      // Add error message to error object for easier handling
      // Handle FastAPI error format: {detail: {error: {message: "...", ...}}}
      let errorMessage = 'An error occurred';
      if (data?.detail?.error?.message) {
        errorMessage = data.detail.error.message;
      } else if (data?.detail && typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (data?.error?.message) {
        errorMessage = data.error.message;
      } else if (data?.message && typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      error.message = errorMessage;
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout: The operation took too long. Please check if the configuration was saved.';
      } else {
        error.message = 'Network error: Unable to connect to server. Please check your connection.';
      }
    } else {
      error.message = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        // Unauthorized - API key missing or invalid
      console.error('Unauthorized: API key may be missing or invalid');
        // Could show notification to user
      } else if (status === 403) {
        // Forbidden - Invalid API key
        console.error('Forbidden: Invalid API key');
      } else if (status === 404) {
        // Not found
        console.error('Resource not found:', error.config?.url);
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', status, data);
      }
      
      // Add error message to error object for easier handling
      // Handle FastAPI error format: {detail: {error: {message: "...", ...}}}
      let errorMessage = 'An error occurred';
      if (data?.detail?.error?.message) {
        errorMessage = data.detail.error.message;
      } else if (data?.detail && typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (data?.error?.message) {
        errorMessage = data.error.message;
      } else if (data?.message && typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      error.message = errorMessage;
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('Network error: No response received');
      error.message = 'Network error: Unable to connect to server. Please check your connection.';
    } else {
      // Error setting up request
      console.error('Request setup error:', error.message);
      error.message = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
