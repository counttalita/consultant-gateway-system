import logger from './logger';

/**
 * Error handler utility for consistent error handling across the application
 */

/**
 * Get user-friendly error message based on error type and status
 */
export const getErrorMessage = (error) => {
  // Handle normalized errors from BaseService
  if (error.type) {
    switch (error.type) {
      case 'network_error':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'api_error':
        return error.message || 'An error occurred while processing your request.';
      case 'unknown_error':
        return error.message || 'An unexpected error occurred.';
      default:
        return 'An error occurred.';
    }
  }

  // Handle axios errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data?.error || data?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return data?.error || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
      case 503:
        return 'The service is temporarily unavailable. Please try again later.';
      case 504:
        return 'The request timed out. Please try again.';
      default:
        return data?.error || data?.message || 'An error occurred while processing your request.';
    }
  }

  // Handle network errors
  if (error.request) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle other errors
  return error.message || 'An unexpected error occurred.';
};

/**
 * Get validation errors from API response
 */
export const getValidationErrors = (error) => {
  if (error.errors) {
    return error.errors;
  }

  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }

  return {};
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
  if (error.type === 'api_error' && error.status === 422) {
    return true;
  }

  if (error.response?.status === 422) {
    return true;
  }

  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error) => {
  if (error.type === 'api_error' && error.status === 401) {
    return true;
  }

  if (error.response?.status === 401) {
    return true;
  }

  return false;
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error) => {
  if (error.type === 'api_error' && error.status === 403) {
    return true;
  }

  if (error.response?.status === 403) {
    return true;
  }

  return false;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  if (error.type === 'network_error') {
    return true;
  }

  if (!error.response && error.request) {
    return true;
  }

  return false;
};

/**
 * Handle API error with notification
 * This is a helper that can be used in components
 */
export const handleApiError = (error, showError, customMessage = null) => {
  logger.error('Handling API error', error);

  if (isValidationError(error)) {
    // Validation errors are typically handled by forms
    return getValidationErrors(error);
  }

  if (isAuthError(error)) {
    // Auth errors are handled by interceptor (redirect to login)
    return null;
  }

  const message = customMessage || getErrorMessage(error);
  showError(message);

  return null;
};

/**
 * Create error object for form validation
 */
export const createFormError = (field, message) => {
  return { [field]: [message] };
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors) => {
  const formatted = {};
  
  Object.keys(errors).forEach(field => {
    const messages = errors[field];
    if (Array.isArray(messages)) {
      formatted[field] = messages.join(', ');
    } else {
      formatted[field] = messages;
    }
  });

  return formatted;
};

export default {
  getErrorMessage,
  getValidationErrors,
  isValidationError,
  isAuthError,
  isPermissionError,
  isNetworkError,
  handleApiError,
  createFormError,
  formatValidationErrors,
};
