import { useState, useEffect, useCallback, useRef } from 'react';
import { prefersReducedMotion, getAnimationDuration } from '../utils/animations';

/**
 * Hook to detect if user prefers reduced motion
 * @returns {boolean}
 */
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e) => {
      setReducedMotion(e.matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  return reducedMotion;
};

/**
 * Hook for managing animation state
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Object} - Animation state and controls
 */
export const useAnimationState = (duration = 300) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const reducedMotion = useReducedMotion();
  
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    
    const adjustedDuration = getAnimationDuration(duration);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (adjustedDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, adjustedDuration);
    } else {
      setIsAnimating(false);
    }
  }, [duration]);
  
  const stopAnimation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsAnimating(false);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    isAnimating,
    startAnimation,
    stopAnimation,
    reducedMotion,
  };
};

/**
 * Hook for entrance animations
 * @param {boolean} isVisible - Whether element should be visible
 * @param {number} delay - Delay before animation starts
 * @returns {Object} - Animation state
 */
export const useEntranceAnimation = (isVisible, delay = 0) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const reducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const adjustedDelay = getAnimationDuration(delay);
      
      const timer = setTimeout(() => {
        setIsEntering(true);
        setIsExiting(false);
      }, adjustedDelay);
      
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
      setIsExiting(true);
      
      const adjustedDuration = getAnimationDuration(300);
      
      if (adjustedDuration > 0) {
        const timer = setTimeout(() => {
          setShouldRender(false);
          setIsExiting(false);
        }, adjustedDuration);
        
        return () => clearTimeout(timer);
      } else {
        setShouldRender(false);
        setIsExiting(false);
      }
    }
  }, [isVisible, delay]);
  
  return {
    shouldRender,
    isEntering,
    isExiting,
    reducedMotion,
  };
};

/**
 * Hook for staggered list animations
 * @param {number} itemCount - Number of items in list
 * @param {number} staggerDelay - Delay between each item
 * @returns {Function} - Function to get delay for each item
 */
export const useStaggeredAnimation = (itemCount, staggerDelay = 50) => {
  const reducedMotion = useReducedMotion();
  
  const getItemDelay = useCallback((index) => {
    if (reducedMotion) return 0;
    return index * staggerDelay;
  }, [staggerDelay, reducedMotion]);
  
  return getItemDelay;
};

/**
 * Hook for scroll-triggered animations
 * @param {Object} ref - React ref to element
 * @param {Object} options - Intersection observer options
 * @returns {boolean} - Whether element is in view
 */
export const useScrollAnimation = (ref, options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, hasAnimated, options]);
  
  return isInView;
};

/**
 * Hook for optimistic UI updates
 * @returns {Object} - Optimistic update utilities
 */
export const useOptimisticUpdate = () => {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState(null);
  
  const performOptimisticUpdate = useCallback(async (
    optimisticFn,
    apiFn,
    rollbackFn
  ) => {
    setIsOptimistic(true);
    setError(null);
    
    // Apply optimistic update
    optimisticFn();
    
    try {
      // Call API
      const result = await apiFn();
      setIsOptimistic(false);
      return result;
    } catch (err) {
      // Rollback on error
      setError(err);
      setIsOptimistic(false);
      
      if (rollbackFn) {
        rollbackFn();
      }
      
      throw err;
    }
  }, []);
  
  return {
    isOptimistic,
    error,
    performOptimisticUpdate,
  };
};

/**
 * Hook for managing transition states
 * @param {boolean} show - Whether to show element
 * @param {number} duration - Transition duration
 * @returns {Object} - Transition state
 */
export const useTransition = (show, duration = 300) => {
  const [shouldMount, setShouldMount] = useState(show);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (show) {
      setShouldMount(true);
      // Small delay to ensure mount before transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      
      const adjustedDuration = getAnimationDuration(duration);
      
      if (adjustedDuration > 0) {
        const timer = setTimeout(() => {
          setShouldMount(false);
        }, adjustedDuration);
        
        return () => clearTimeout(timer);
      } else {
        setShouldMount(false);
      }
    }
  }, [show, duration]);
  
  return {
    shouldMount,
    isVisible,
    reducedMotion,
  };
};

/**
 * Hook for page transition animations
 * @returns {Object} - Page transition state
 */
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const reducedMotion = useReducedMotion();
  
  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);
  
  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);
  
  return {
    isTransitioning,
    startTransition,
    endTransition,
    reducedMotion,
  };
};

/**
 * Hook for skeleton loading state
 * @param {boolean} isLoading - Whether data is loading
 * @param {number} minDisplayTime - Minimum time to show skeleton (prevents flashing)
 * @returns {boolean} - Whether to show skeleton
 */
export const useSkeletonLoading = (isLoading, minDisplayTime = 300) => {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const startTimeRef = useRef(null);
  
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShowSkeleton(true);
    } else if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      
      const adjustedRemaining = getAnimationDuration(remaining);
      
      if (adjustedRemaining > 0) {
        const timer = setTimeout(() => {
          setShowSkeleton(false);
          startTimeRef.current = null;
        }, adjustedRemaining);
        
        return () => clearTimeout(timer);
      } else {
        setShowSkeleton(false);
        startTimeRef.current = null;
      }
    }
  }, [isLoading, minDisplayTime]);
  
  return showSkeleton;
};

export default {
  useReducedMotion,
  useAnimationState,
  useEntranceAnimation,
  useStaggeredAnimation,
  useScrollAnimation,
  useOptimisticUpdate,
  useTransition,
  usePageTransition,
  useSkeletonLoading,
};
