/**
 * Performance monitoring utilities
 * Provides helpers for measuring and tracking application performance
 */

import logger from './logger';

/**
 * Measure component render time
 */
export const measureRender = (componentName) => {
  const startMark = `${componentName}-render-start`;
  const endMark = `${componentName}-render-end`;
  const measureName = `${componentName}-render`;

  return {
    start: () => {
      if (performance.mark) {
        performance.mark(startMark);
      }
    },
    end: () => {
      if (performance.mark && performance.measure) {
        performance.mark(endMark);
        try {
          performance.measure(measureName, startMark, endMark);
          const measure = performance.getEntriesByName(measureName)[0];
          logger.debug(`Component render: ${componentName}`, {
            duration: `${measure.duration.toFixed(2)}ms`,
          });
          
          // Clean up marks
          performance.clearMarks(startMark);
          performance.clearMarks(endMark);
          performance.clearMeasures(measureName);
          
          return measure.duration;
        } catch (e) {
          // Marks might not exist
          return null;
        }
      }
      return null;
    },
  };
};

/**
 * Measure async operation time
 */
export const measureAsync = async (name, operation) => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    logger.info(`Async operation: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error(`Async operation failed: ${name}`, error, {
      duration: `${duration.toFixed(2)}ms`,
    });
    
    throw error;
  }
};

/**
 * Measure function execution time
 */
export const measureFunction = (name, fn) => {
  return (...args) => {
    const startTime = performance.now();
    
    try {
      const result = fn(...args);
      const duration = performance.now() - startTime;
      
      if (duration > 16) { // Longer than one frame (60fps)
        logger.warn(`Slow function: ${name}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Function error: ${name}`, error, {
        duration: `${duration.toFixed(2)}ms`,
      });
      throw error;
    }
  };
};

/**
 * Monitor memory usage (if available)
 */
export const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usedPercentage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2),
    };
  }
  return null;
};

/**
 * Log memory usage
 */
export const logMemoryUsage = () => {
  const memory = getMemoryUsage();
  if (memory) {
    logger.info('Memory usage', memory);
  }
};

/**
 * Monitor FPS (frames per second)
 */
export const monitorFPS = (duration = 5000, callback) => {
  let frameCount = 0;
  let lastTime = performance.now();
  let rafId;

  const countFrame = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + duration) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      logger.info('FPS measurement', { fps, duration: `${duration}ms` });
      
      if (callback) {
        callback(fps);
      }
      
      // Reset for next measurement
      frameCount = 0;
      lastTime = currentTime;
    }
    
    rafId = requestAnimationFrame(countFrame);
  };

  rafId = requestAnimationFrame(countFrame);

  // Return cleanup function
  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
};

/**
 * Get navigation timing metrics
 */
export const getNavigationTiming = () => {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const navigation = {
    // Network
    redirectTime: timing.redirectEnd - timing.redirectStart,
    dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
    tcpTime: timing.connectEnd - timing.connectStart,
    requestTime: timing.responseStart - timing.requestStart,
    responseTime: timing.responseEnd - timing.responseStart,
    
    // Processing
    domProcessingTime: timing.domComplete - timing.domLoading,
    domContentLoadedTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
    loadEventTime: timing.loadEventEnd - timing.loadEventStart,
    
    // Total
    totalTime: timing.loadEventEnd - timing.navigationStart,
  };

  return navigation;
};

/**
 * Get resource timing metrics
 */
export const getResourceTiming = () => {
  if (!window.performance || !window.performance.getEntriesByType) {
    return [];
  }

  const resources = window.performance.getEntriesByType('resource');
  
  return resources.map(resource => ({
    name: resource.name,
    type: resource.initiatorType,
    duration: resource.duration,
    size: resource.transferSize,
    startTime: resource.startTime,
  }));
};

/**
 * Get slow resources (> 1 second)
 */
export const getSlowResources = (threshold = 1000) => {
  const resources = getResourceTiming();
  return resources.filter(resource => resource.duration > threshold);
};

/**
 * Log performance summary
 */
export const logPerformanceSummary = () => {
  const navigation = getNavigationTiming();
  const slowResources = getSlowResources();
  const memory = getMemoryUsage();

  logger.info('Performance summary', {
    navigation,
    slowResourcesCount: slowResources.length,
    slowResources: slowResources.slice(0, 5), // Top 5 slowest
    memory,
  });
};

/**
 * Create performance observer for specific entry types
 */
export const observePerformance = (entryTypes, callback) => {
  if (!('PerformanceObserver' in window)) {
    logger.warn('PerformanceObserver not supported');
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      callback(entries);
    });

    observer.observe({ entryTypes });

    return observer;
  } catch (e) {
    logger.error('Failed to create PerformanceObserver', e);
    return null;
  }
};

/**
 * Monitor largest contentful paint (LCP)
 */
export const monitorLCP = (callback) => {
  return observePerformance(['largest-contentful-paint'], (entries) => {
    const lastEntry = entries[entries.length - 1];
    const lcp = lastEntry.renderTime || lastEntry.loadTime;
    
    logger.info('Largest Contentful Paint', {
      lcp: `${lcp.toFixed(2)}ms`,
      element: lastEntry.element?.tagName,
    });
    
    if (callback) {
      callback(lcp);
    }
  });
};

/**
 * Monitor first input delay (FID)
 */
export const monitorFID = (callback) => {
  return observePerformance(['first-input'], (entries) => {
    const firstInput = entries[0];
    const fid = firstInput.processingStart - firstInput.startTime;
    
    logger.info('First Input Delay', {
      fid: `${fid.toFixed(2)}ms`,
      eventType: firstInput.name,
    });
    
    if (callback) {
      callback(fid);
    }
  });
};

/**
 * Monitor cumulative layout shift (CLS)
 */
export const monitorCLS = (callback) => {
  let clsScore = 0;

  return observePerformance(['layout-shift'], (entries) => {
    for (const entry of entries) {
      if (!entry.hadRecentInput) {
        clsScore += entry.value;
      }
    }
    
    logger.info('Cumulative Layout Shift', { cls: clsScore.toFixed(4) });
    
    if (callback) {
      callback(clsScore);
    }
  });
};

/**
 * Initialize core web vitals monitoring
 */
export const initCoreWebVitals = () => {
  monitorLCP((lcp) => {
    if (lcp > 2500) {
      logger.warn('Poor LCP detected', { lcp: `${lcp.toFixed(2)}ms` });
    }
  });

  monitorFID((fid) => {
    if (fid > 100) {
      logger.warn('Poor FID detected', { fid: `${fid.toFixed(2)}ms` });
    }
  });

  monitorCLS((cls) => {
    if (cls > 0.1) {
      logger.warn('Poor CLS detected', { cls: cls.toFixed(4) });
    }
  });
};

export default {
  measureRender,
  measureAsync,
  measureFunction,
  getMemoryUsage,
  logMemoryUsage,
  monitorFPS,
  getNavigationTiming,
  getResourceTiming,
  getSlowResources,
  logPerformanceSummary,
  observePerformance,
  monitorLCP,
  monitorFID,
  monitorCLS,
  initCoreWebVitals,
};
