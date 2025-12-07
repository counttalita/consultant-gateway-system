import { useState, useEffect } from 'react';

/**
 * useMediaQuery - Hook to detect media query matches
 * 
 * @param {string} query - Media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    // Initialize with current match state
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Create event listener
    const listener = (e) => setMatches(e.matches);
    
    // Add listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }
    
    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);
  
  return matches;
};

/**
 * Predefined breakpoint hooks
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1280px)');

/**
 * useIsTouchDevice - Hook to detect if the device supports touch
 * 
 * @returns {boolean} - Whether the device supports touch
 */
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    
    checkTouch();
  }, []);
  
  return isTouch;
};

export default useMediaQuery;
