/**
 * Performance monitoring utilities
 * 
 * Provides tools for measuring and reporting performance metrics
 */

/**
 * Measure component render time
 */
export const measureRenderTime = (componentName, callback) => {
  const startTime = performance.now();
  const result = callback();
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  if (import.meta.env.DEV && renderTime > 16) {
    console.warn(
      `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (>16ms threshold)`
    );
  }

  return result;
};

/**
 * Report Web Vitals
 */
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Measure API call performance
 */
export const measureApiCall = async (apiName, apiCall) => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (import.meta.env.DEV) {
      console.log(`[API Performance] ${apiName}: ${duration.toFixed(2)}ms`);
    }

    // Log slow API calls
    if (duration > 1000) {
      console.warn(`[API Performance] Slow API call detected: ${apiName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`[API Performance] ${apiName} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

/**
 * Mark performance milestones
 */
export const markPerformance = (markName) => {
  if (performance.mark) {
    performance.mark(markName);
  }
};

/**
 * Measure between two performance marks
 */
export const measurePerformance = (measureName, startMark, endMark) => {
  if (performance.measure) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${measureName}: ${measure.duration.toFixed(2)}ms`);
      }
      
      return measure.duration;
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }
  return null;
};

/**
 * Get bundle size information (development only)
 */
export const logBundleInfo = () => {
  if (import.meta.env.DEV) {
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.name.includes('.js'));
    const styles = resources.filter(r => r.name.includes('.css'));
    
    const totalScriptSize = scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0);
    const totalStyleSize = styles.reduce((sum, s) => sum + (s.transferSize || 0), 0);
    
    console.group('[Bundle Info]');
    console.log(`Scripts: ${scripts.length} files, ${(totalScriptSize / 1024).toFixed(2)} KB`);
    console.log(`Styles: ${styles.length} files, ${(totalStyleSize / 1024).toFixed(2)} KB`);
    console.log(`Total: ${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)} KB`);
    console.groupEnd();
  }
};

/**
 * Monitor long tasks (tasks that block the main thread for >50ms)
 */
export const monitorLongTasks = () => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(
            `[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`,
            entry
          );
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      
      return () => observer.disconnect();
    } catch {
      // Long task API not supported
      console.log('Long task monitoring not supported');
    }
  }
  
  return () => {};
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
