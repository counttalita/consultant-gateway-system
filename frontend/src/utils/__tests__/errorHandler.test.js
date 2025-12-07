import { describe, it, expect, vi } from 'vitest';
import { 
  getErrorMessage, 
  getValidationErrors, 
  isNetworkError, 
  isValidationError,
  isAuthError,
  isPermissionError,
  handleApiError
} from '../errorHandler';

describe('Error Handler Utilities', () => {
  describe('getErrorMessage', () => {
    it('should return message for 401 unauthorized error', () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('session');
    });

    it('should return message for 403 forbidden error', () => {
      const error = {
        response: {
          status: 403,
          data: { error: 'Forbidden' }
        }
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('permission');
    });

    it('should return message for 404 not found error', () => {
      const error = {
        response: {
          status: 404,
          data: { error: 'Not found' }
        }
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('not found');
    });

    it('should return message for 422 validation error', () => {
      const error = {
        response: {
          status: 422,
          data: { error: 'Validation failed' }
        }
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('Validation failed');
    });

    it('should return message for 500 server error', () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('server');
    });

    it('should return message for 503 service unavailable error', () => {
      const error = {
        response: {
          status: 503,
          data: { error: 'Service unavailable' }
        }
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('unavailable');
    });

    it('should return message for network error', () => {
      const error = {
        message: 'Network Error',
        request: {}
      };
      
      const message = getErrorMessage(error);
      expect(message).toContain('connect');
    });

    it('should return message for unknown error', () => {
      const error = new Error('Unknown error');
      
      const message = getErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('should handle error with only message property', () => {
      const error = { message: 'Simple error' };
      
      const message = getErrorMessage(error);
      expect(message).toBe('Simple error');
    });
  });

  describe('getValidationErrors', () => {
    it('should extract validation errors from response', () => {
      const error = {
        response: {
          data: {
            errors: {
              email: 'Email is invalid',
              password: 'Password is too short'
            }
          }
        }
      };
      
      const errors = getValidationErrors(error);
      expect(errors).toEqual({
        email: 'Email is invalid',
        password: 'Password is too short'
      });
    });

    it('should return empty object when no errors', () => {
      const error = {
        response: {
          data: {}
        }
      };
      
      const errors = getValidationErrors(error);
      expect(errors).toEqual({});
    });

    it('should handle errors property directly', () => {
      const error = {
        errors: {
          field: 'Error message'
        }
      };
      
      const errors = getValidationErrors(error);
      expect(errors).toEqual({ field: 'Error message' });
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network error', () => {
      const error = {
        message: 'Network Error',
        request: {}
      };
      
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for normalized network error', () => {
      const error = {
        type: 'network_error'
      };
      
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for API error', () => {
      const error = {
        response: {
          status: 500
        }
      };
      
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for validation error', () => {
      const error = {
        response: {
          status: 422
        }
      };
      
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for 422 status', () => {
      const error = {
        response: {
          status: 422
        }
      };
      
      expect(isValidationError(error)).toBe(true);
    });

    it('should return true for normalized validation error', () => {
      const error = {
        type: 'api_error',
        status: 422
      };
      
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = {
        response: {
          status: 500
        }
      };
      
      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for network error', () => {
      const error = {
        message: 'Network Error'
      };
      
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 status', () => {
      const error = {
        response: {
          status: 401
        }
      };
      
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = {
        response: {
          status: 403
        }
      };
      
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isPermissionError', () => {
    it('should return true for 403 status', () => {
      const error = {
        response: {
          status: 403
        }
      };
      
      expect(isPermissionError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = {
        response: {
          status: 401
        }
      };
      
      expect(isPermissionError(error)).toBe(false);
    });
  });

  describe('handleApiError', () => {
    it('should return validation errors for validation error', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: 'Invalid email'
            }
          }
        }
      };
      const showError = vi.fn();
      
      const result = handleApiError(error, showError);
      expect(result).toEqual({ email: 'Invalid email' });
      expect(showError).not.toHaveBeenCalled();
    });

    it('should return null for auth error', () => {
      const error = {
        response: {
          status: 401
        }
      };
      const showError = vi.fn();
      
      const result = handleApiError(error, showError);
      expect(result).toBeNull();
      expect(showError).not.toHaveBeenCalled();
    });

    it('should call showError for other errors', () => {
      const error = {
        response: {
          status: 500
        }
      };
      const showError = vi.fn();
      
      handleApiError(error, showError);
      expect(showError).toHaveBeenCalled();
    });

    it('should use custom message when provided', () => {
      const error = {
        response: {
          status: 500
        }
      };
      const showError = vi.fn();
      const customMessage = 'Custom error message';
      
      handleApiError(error, showError, customMessage);
      expect(showError).toHaveBeenCalledWith(customMessage);
    });
  });
});
