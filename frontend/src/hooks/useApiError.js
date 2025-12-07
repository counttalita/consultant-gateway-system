import { useCallback } from 'react';
import { useNotification } from './useNotification';
import logger from '../utils/logger';

/**
 * Hook for handling API errors with user-friendly notifications
 * Provides consistent error handling across the application
 * 
 * @example
 * ```jsx
 * const MyComponent = () => {
 *   const { handleApiError, isValidationError, handleValidationErrors } = useApiError();
 *   const [errors, setErrors] = useState({});
 * 
 *   const handleSubmit = async (data) => {
 *     try {
 *       await api.post('/endpoint', data);
 *     } catch (error) {
 *       if (isValidationError(error)) {
 *         setErrors(handleValidationErrors(error));
 *       } else {
 *         handleApiError(error, 'Failed to submit form');
 *       }
 *     }
 *   };
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * };
 * ```
 */
export const useApiError = () => {
  const { showError, showWarning, showNotification } = useNotification();

  /**
   * Handle API error response with specific status handling
   */
  const handleApiErrorResponse = useCallback((error, customMessage) => {
    const status = error.status;

    switch (status) {
      case 400: {
        showError(
          customMessage || error.message || 'Invalid request',
          'Bad Request'
        );
        break;
      }

      case 403: {
        showError(
          customMessage || 'You do not have permission to perform this action',
          'Access Denied'
        );
        break;
      }

      case 404: {
        showError(
          customMessage || 'The requested resource was not found',
          'Not Found'
        );
        break;
      }

      case 422: {
        // Validation errors
        const validationMessage = customMessage || 
          Object.values(error.errors || {})[0]?.[0] || 
          error.message || 
          'Validation failed';
        showError(validationMessage, 'Validation Error');
        break;
      }

      case 429: {
        showWarning(
          'Too many requests. Please wait a moment and try again.',
          'Rate Limit Exceeded'
        );
        break;
      }

      case 500:
      case 502:
      case 503:
      case 504: {
        showError(
          customMessage || 'A server error occurred. Please try again later.',
          'Server Error'
        );
        break;
      }

      default: {
        showError(
          customMessage || error.message || 'An error occurred',
          'Error'
        );
        break;
      }
    }
  }, [showError, showWarning]);

  /**
   * Handle API error and show appropriate notification
   */
  const handleApiError = useCallback((error, customMessage = null) => {
    // Log the error
    logger.error('API Error handled by useApiError', error);

    // If error is already normalized by BaseService
    if (error.type) {
      switch (error.type) {
        case 'api_error': {
          handleApiErrorResponse(error, customMessage);
          break;
        }
        case 'network_error': {
          showError(
            customMessage || error.message,
            'Connection Error'
          );
          break;
        }
        case 'unknown_error': {
          showError(
            customMessage || error.message,
            'Error'
          );
          break;
        }
        default: {
          showError(
            customMessage || 'An unexpected error occurred',
            'Error'
          );
          break;
        }
      }
    } else if (error.response) {
      // Handle raw axios error
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400: {
          showError(
            customMessage || data?.error || 'Invalid request',
            'Bad Request'
          );
          break;
        }

        case 401: {
          // Handled by API interceptor (redirects to login)
          break;
        }

        case 403: {
          showError(
            customMessage || 'You do not have permission to perform this action',
            'Access Denied'
          );
          break;
        }

        case 404: {
          showError(
            customMessage || 'The requested resource was not found',
            'Not Found'
          );
          break;
        }

        case 422: {
          // Validation errors - show first error or custom message
          const validationMessage = customMessage || 
            Object.values(data?.errors || {})[0]?.[0] || 
            'Validation failed';
          showError(validationMessage, 'Validation Error');
          break;
        }

        case 429: {
          showWarning(
            'Too many requests. Please wait a moment and try again.',
            'Rate Limit Exceeded'
          );
          break;
        }

        case 500:
        case 502:
        case 503:
        case 504: {
          showError(
            customMessage || 'A server error occurred. Please try again later.',
            'Server Error'
          );
          break;
        }

        default: {
          showError(
            customMessage || data?.error || 'An error occurred',
            'Error'
          );
          break;
        }
      }
    } else if (error.request) {
      // Network error
      showNotification({
        type: 'error',
        title: 'Connection Error',
        message: customMessage || 'Unable to connect to the server. Please check your internet connection.',
        duration: 7000,
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    } else {
      // Unknown error
      showError(
        customMessage || error.message || 'An unexpected error occurred',
        'Error'
      );
    }
  }, [showError, showWarning, showNotification, handleApiErrorResponse]);

  /**
   * Handle validation errors from 422 responses
   * Returns formatted errors object for form handling
   */
  const handleValidationErrors = useCallback((error) => {
    if (error.type === 'api_error' && error.status === 422) {
      return error.errors || {};
    }
    if (error.response?.status === 422) {
      return error.response.data?.errors || {};
    }
    return {};
  }, []);

  /**
   * Check if error is a validation error
   */
  const isValidationError = useCallback((error) => {
    return (
      (error.type === 'api_error' && error.status === 422) ||
      error.response?.status === 422
    );
  }, []);

  /**
   * Check if error is a network error
   */
  const isNetworkError = useCallback((error) => {
    return error.type === 'network_error' || (!error.response && error.request);
  }, []);

  return {
    handleApiError,
    handleValidationErrors,
    isValidationError,
    isNetworkError,
  };
};

export default useApiError;
