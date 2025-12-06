import { useEffect, useRef } from 'react';

/**
 * Custom hook for using services with automatic request cancellation on unmount
 * @param {Object} service - Service instance (must extend BaseService)
 * @returns {Object} Service instance
 * 
 * @example
 * const MyComponent = () => {
 *   const adminService = useService(adminServiceInstance);
 *   
 *   useEffect(() => {
 *     // This request will be automatically cancelled if component unmounts
 *     adminService.getDashboard().then(setData);
 *   }, []);
 * };
 */
export const useService = (service) => {
  const serviceRef = useRef(service);

  useEffect(() => {
    // Store the service instance in a variable for cleanup
    const currentService = serviceRef.current;
    
    // Cleanup: cancel all pending requests when component unmounts
    return () => {
      if (currentService && typeof currentService.cancelAllRequests === 'function') {
        currentService.cancelAllRequests();
      }
    };
  }, []);

  return service;
};

export default useService;
