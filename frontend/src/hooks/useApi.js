import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook for API calls with loading, error states, and automatic cancellation
 * 
 * @param {Function} apiFunction - Async function that makes the API call
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to execute immediately on mount (default: true)
 * @param {Array} options.dependencies - Dependencies array for re-execution
 * @param {Function} options.onSuccess - Callback on successful response
 * @param {Function} options.onError - Callback on error
 * @returns {Object} { data, loading, error, execute, reset }
 * 
 * @example
 * // Immediate execution on mount
 * const { data, loading, error } = useApi(() => adminService.getDashboard());
 * 
 * @example
 * // Manual execution
 * const { data, loading, error, execute } = useApi(
 *   (id) => consultantService.getProfile(id),
 *   { immediate: false }
 * );
 * 
 * // Later...
 * execute(consultantId);
 * 
 * @example
 * // With dependencies
 * const { data, loading } = useApi(
 *   () => projectsService.getProjects(filters),
 *   { dependencies: [filters] }
 * );
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = true,
    dependencies = [],
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  /**
   * Execute the API call
   */
  const execute = useCallback(async (...args) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);

    try {
      logger.debug('useApi: Executing API call', { args });
      
      // Pass signal as part of options if the API function supports it
      const result = await apiFunction(...args, { signal });
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        logger.debug('useApi: API call successful', { result });
      }
      
      return result;
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        logger.debug('useApi: Request cancelled');
        return;
      }

      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
        
        if (onError) {
          onError(err);
        }
        
        logger.error('useApi: API call failed', err);
      }
      
      throw err;
    }
  }, [apiFunction, onSuccess, onError]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  /**
   * Execute immediately on mount if configured
   */
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...dependencies]);

  /**
   * Cleanup: cancel pending requests on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export default useApi;
