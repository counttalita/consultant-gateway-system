import axios from 'axios';
import logger from '../utils/logger';
import { API_TIMEOUT, MAX_RETRIES, RETRY_DELAY_BASE } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    timeout: API_TIMEOUT,
    withCredentials: true, // Important for cookie-based sessions
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Track retry attempts for each request
const retryTracker = new WeakMap();

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (retryCount) => {
    return RETRY_DELAY_BASE * Math.pow(2, retryCount);
};

/**
 * Determine if request should be retried
 */
const shouldRetry = (error, retryCount) => {
    // Don't retry if max retries reached
    if (retryCount >= MAX_RETRIES) {
        return false;
    }

    // Don't retry if no response (likely network error) - but do retry
    if (!error.response) {
        return true;
    }

    const status = error.response.status;

    // Retry on 5xx server errors
    if (status >= 500 && status < 600) {
        return true;
    }

    // Retry on 429 (Too Many Requests)
    if (status === 429) {
        return true;
    }

    // Retry on 408 (Request Timeout)
    if (status === 408) {
        return true;
    }

    // Don't retry on client errors (4xx except 408 and 429)
    return false;
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor for logging and performance tracking
api.interceptors.request.use(
    (config) => {
        // Add request start time for performance monitoring
        config.metadata = { startTime: performance.now() };
        
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
        });
        return config;
    },
    (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
    }
);

// Response interceptor with retry logic and comprehensive error handling
api.interceptors.response.use(
    (response) => {
        // Calculate API response time
        const duration = response.config.metadata?.startTime 
            ? performance.now() - response.config.metadata.startTime 
            : null;
        
        if (duration !== null) {
            logger.measureApiCall(
                response.config.url,
                response.config.method?.toUpperCase(),
                duration,
                response.status
            );
        }
        
        logger.debug(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            duration: duration ? `${duration.toFixed(2)}ms` : 'unknown',
            data: response.data,
        });
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Initialize retry count if not exists
        if (!retryTracker.has(originalRequest)) {
            retryTracker.set(originalRequest, 0);
        }

        const retryCount = retryTracker.get(originalRequest);

        // Check if we should retry
        if (shouldRetry(error, retryCount)) {
            retryTracker.set(originalRequest, retryCount + 1);
            const delay = getRetryDelay(retryCount);

            logger.warn(
                `Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES})`,
                {
                    url: originalRequest.url,
                    method: originalRequest.method,
                    delay,
                    error: error.message,
                }
            );

            await sleep(delay);

            // Retry the request
            return api(originalRequest);
        }

        // Handle specific error status codes
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            logger.error(`API Error: ${status} - ${originalRequest.url}`, error, {
                status,
                data,
                url: originalRequest.url,
                method: originalRequest.method,
            });

            switch (status) {
                case 401:
                    // Unauthorized - clear session and redirect to login
                    logger.warn('Unauthorized access - redirecting to login');
                    localStorage.removeItem('session_token');
                    
                    // Only redirect if not already on login page
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                    break;

                case 403:
                    // Forbidden - user doesn't have permission
                    logger.warn('Access forbidden', {
                        url: originalRequest.url,
                        user: data.user,
                    });
                    // Error will be handled by component
                    break;

                case 404:
                    // Not found
                    logger.warn('Resource not found', {
                        url: originalRequest.url,
                    });
                    break;

                case 422:
                    // Validation errors
                    logger.warn('Validation errors', {
                        errors: data.errors,
                        url: originalRequest.url,
                    });
                    // Return validation errors for form handling
                    break;

                case 429:
                    // Too many requests - already retried with backoff
                    logger.warn('Rate limit exceeded', {
                        url: originalRequest.url,
                        retryAfter: error.response.headers['retry-after'],
                    });
                    break;

                case 500:
                case 502:
                case 503:
                case 504:
                    // Server errors - already retried
                    logger.error('Server error', error, {
                        status,
                        url: originalRequest.url,
                    });
                    break;

                default:
                    logger.error('Unexpected API error', error, {
                        status,
                        url: originalRequest.url,
                    });
            }
        } else if (error.request) {
            // Request made but no response received (network error)
            logger.error('Network error - no response received', error, {
                url: originalRequest.url,
                method: originalRequest.method,
            });
        } else {
            // Something else happened
            logger.error('Request setup error', error, {
                message: error.message,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
