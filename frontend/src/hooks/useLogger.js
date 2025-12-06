/**
 * Custom hook for logging and monitoring
 * Provides easy access to logging, performance tracking, and analytics
 */

import { useEffect, useRef, useCallback } from 'react';
import logger from '../utils/logger';
import analytics from '../utils/analytics';
import { measureRender } from '../utils/performance';

/**
 * Hook for component-level logging
 */
export const useLogger = (componentName) => {
  const renderMeasure = useRef(null);

  useEffect(() => {
    // Start measuring render on mount
    renderMeasure.current = measureRender(componentName);
    renderMeasure.current.start();

    logger.debug(`Component mounted: ${componentName}`);

    return () => {
      // End measuring render on unmount
      if (renderMeasure.current) {
        renderMeasure.current.end();
      }
      logger.debug(`Component unmounted: ${componentName}`);
    };
  }, [componentName]);

  const logInfo = useCallback((message, data) => {
    logger.info(`[${componentName}] ${message}`, data);
  }, [componentName]);

  const logError = useCallback((message, error, data) => {
    logger.error(`[${componentName}] ${message}`, error, data);
  }, [componentName]);

  const logWarn = useCallback((message, data) => {
    logger.warn(`[${componentName}] ${message}`, data);
  }, [componentName]);

  const logDebug = useCallback((message, data) => {
    logger.debug(`[${componentName}] ${message}`, data);
  }, [componentName]);

  return {
    logInfo,
    logError,
    logWarn,
    logDebug,
  };
};

/**
 * Hook for tracking user actions
 */
export const useAnalytics = () => {
  const trackClick = useCallback((elementName, context) => {
    analytics.click(elementName, context);
  }, []);

  const trackFormSubmit = useCallback((formName, success, errors) => {
    analytics.formSubmit(formName, success, errors);
  }, []);

  const trackFeature = useCallback((featureName, context) => {
    analytics.featureUsed(featureName, context);
  }, []);

  const trackSearch = useCallback((query, resultsCount, filters) => {
    analytics.search(query, resultsCount, filters);
  }, []);

  const trackModal = useCallback((modalName, action) => {
    analytics.modalInteraction(modalName, action);
  }, []);

  const trackTab = useCallback((tabName, context) => {
    analytics.tabChange(tabName, context);
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackFeature,
    trackSearch,
    trackModal,
    trackTab,
  };
};

/**
 * Hook for performance monitoring
 */
export const usePerformance = (operationName) => {
  const startTime = useRef(null);

  const startMeasure = useCallback(() => {
    startTime.current = performance.now();
    logger.startPerformanceMark(operationName);
  }, [operationName]);

  const endMeasure = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      logger.info(`Performance: ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
      startTime.current = null;
    }
    logger.endPerformanceMark(operationName);
  }, [operationName]);

  const measureAsync = useCallback(async (operation) => {
    startMeasure();
    try {
      const result = await operation();
      endMeasure();
      return result;
    } catch (error) {
      endMeasure();
      throw error;
    }
  }, [startMeasure, endMeasure]);

  return {
    startMeasure,
    endMeasure,
    measureAsync,
  };
};

/**
 * Hook for tracking page views
 */
export const usePageTracking = (pageName) => {
  const startTime = useRef(null);

  useEffect(() => {
    // Track page view
    analytics.pageView(window.location.pathname, pageName);
    logger.info(`Page view: ${pageName}`);

    // Start timing
    startTime.current = Date.now();

    return () => {
      // Track time on page
      if (startTime.current) {
        const duration = Date.now() - startTime.current;
        analytics.timeOnPage(window.location.pathname, duration);
      }
    };
  }, [pageName]);
};

/**
 * Hook for tracking form interactions
 */
export const useFormTracking = (formName) => {
  const trackFieldFocus = useCallback((fieldName) => {
    analytics.formFieldInteraction(formName, fieldName, 'focus');
  }, [formName]);

  const trackFieldBlur = useCallback((fieldName) => {
    analytics.formFieldInteraction(formName, fieldName, 'blur');
  }, [formName]);

  const trackFieldChange = useCallback((fieldName) => {
    analytics.formFieldInteraction(formName, fieldName, 'change');
  }, [formName]);

  const trackSubmit = useCallback((success, errors) => {
    analytics.formSubmit(formName, success, errors);
  }, [formName]);

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackSubmit,
  };
};

export default useLogger;
