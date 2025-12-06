import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage loading states with timeout messages
 * @param {boolean} isLoading - Current loading state
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @param {string} timeoutMessage - Message to show after timeout
 * @returns {object} - { showTimeout, timeoutMessage, elapsedTime }
 */
const useLoadingTimeout = (
  isLoading,
  timeout = 5000,
  timeoutMessage = 'This is taking longer than expected...'
) => {
  const [showTimeout, setShowTimeout] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (isLoading) {
      // Start tracking time
      startTimeRef.current = Date.now();
      setShowTimeout(false);
      setElapsedTime(0);
      
      // Update elapsed time every second
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      
      // Set timeout for showing message
      timeoutRef.current = setTimeout(() => {
        setShowTimeout(true);
      }, timeout);
    } else {
      // Clear everything when loading stops
      setShowTimeout(false);
      setElapsedTime(0);
      startTimeRef.current = null;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, timeout]);
  
  return {
    showTimeout,
    timeoutMessage,
    elapsedTime,
  };
};

export default useLoadingTimeout;
