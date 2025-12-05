import { useCallback } from 'react';
import { useNotification } from './useNotification';
import { handleApiError, isValidationError } from '../utils/errorHandler';

/**
 * Custom hook for handling API errors with notifications
 */
export const useApiError = () => {
  const { showError } = useNotification();

  const handleError = useCallback((error, customMessage = null) => {
    return handleApiError(error, showError, customMessage);
  }, [showError]);

  const getValidationErrors = useCallback((error) => {
    if (isValidationError(error)) {
      return handleApiError(error, showError);
    }
    return null;
  }, [showError]);

  return {
    handleError,
    getValidationErrors,
  };
};

export default useApiError;
