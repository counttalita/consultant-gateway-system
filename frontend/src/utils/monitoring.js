/**
 * Monitoring initialization
 * Sets up all monitoring services (logging, error tracking, analytics, performance)
 */

import logger from './logger';
import errorTracker from './errorTracking';
import analytics from './analytics';
import { initCoreWebVitals, logPerformanceSummary } from './performance';

/**
 * Initialize all monitoring services
 */
export const initMonitoring = async (config = {}) => {
  const {
    enableErrorTracking = true,
    enableAnalytics = true,
    enablePerformanceMonitoring = true,
    user = null,
  } = config;

  logger.info('Initializing monitoring services', {
    enableErrorTracking,
    enableAnalytics,
    enablePerformanceMonitoring,
  });

  // Initialize error tracking
  if (enableErrorTracking) {
    try {
      await errorTracker.init();
      logger.info('Error tracking initialized');
    } catch (error) {
      logger.error('Failed to initialize error tracking', error);
    }
  }

  // Set user context if provided
  if (user) {
    setUserContext(user);
  }

  // Initialize performance monitoring
  if (enablePerformanceMonitoring) {
    try {
      initCoreWebVitals();
      logger.info('Performance monitoring initialized');

      // Log performance summary after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          logPerformanceSummary();
        }, 1000);
      });
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error);
    }
  }

  // Initialize analytics
  if (enableAnalytics) {
    logger.info('Analytics initialized');
  }

  logger.info('Monitoring services initialized successfully');
};

/**
 * Set user context across all monitoring services
 */
export const setUserContext = (user) => {
  if (!user) {
    return;
  }

  logger.setUserContext(user);
  errorTracker.setUser(user);
  analytics.setUser(user);

  logger.info('User context set', {
    userId: user.id,
    role: user.role,
  });
};

/**
 * Clear user context across all monitoring services
 */
export const clearUserContext = () => {
  logger.setUserContext(null);
  errorTracker.clearUser();
  analytics.clearUser();

  logger.info('User context cleared');
};

/**
 * Enable debug mode
 */
export const enableDebugMode = () => {
  logger.setDebugMode(true);
  logger.info('Debug mode enabled');
};

/**
 * Disable debug mode
 */
export const disableDebugMode = () => {
  logger.setDebugMode(false);
  logger.info('Debug mode disabled');
};

/**
 * Get current monitoring status
 */
export const getMonitoringStatus = () => {
  return {
    logLevel: logger.getCurrentLevel(),
    debugMode: logger.debugMode,
    errorTrackingEnabled: errorTracker.enabled,
    analyticsEnabled: analytics.enabled,
    bufferedLogsCount: logger.logBuffer.length,
  };
};

/**
 * Export logs for debugging
 */
export const exportLogs = () => {
  logger.exportLogs();
};

/**
 * Get buffered logs
 */
export const getBufferedLogs = (filter) => {
  return logger.getBufferedLogs(filter);
};

/**
 * Clear log buffer
 */
export const clearLogs = () => {
  logger.clearBuffer();
  logger.info('Log buffer cleared');
};

export default {
  initMonitoring,
  setUserContext,
  clearUserContext,
  enableDebugMode,
  disableDebugMode,
  getMonitoringStatus,
  exportLogs,
  getBufferedLogs,
  clearLogs,
};
