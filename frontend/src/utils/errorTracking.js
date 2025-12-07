/**
 * Error tracking integration
 * Provides integration with error tracking services like Sentry
 */

import logger from './logger';

class ErrorTracker {
  constructor() {
    this.initialized = false;
    this.sentryDSN = import.meta.env.VITE_SENTRY_DSN;
    this.environment = import.meta.env.MODE;
    this.enabled = import.meta.env.VITE_ERROR_TRACKING_ENABLED === 'true';
    this.userContext = null;
  }

  /**
   * Initialize error tracking service
   */
  async init() {
    if (!this.enabled || !this.sentryDSN) {
      logger.info('Error tracking disabled or not configured');
      return;
    }

    try {
      // Dynamically import Sentry only if needed
      // This keeps the bundle size smaller when error tracking is disabled
      // const Sentry = await import('@sentry/react');
      
      // Sentry.init({
      //   dsn: this.sentryDSN,
      //   environment: this.environment,
      //   tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
      //   beforeSend: (event, hint) => {
      //     // Filter out errors we don't want to track
      //     return this.beforeSend(event, hint);
      //   },
      // });

      this.initialized = true;
      logger.info('Error tracking initialized');
    } catch (error) {
      logger.error('Failed to initialize error tracking', error);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user) {
    this.userContext = user ? {
      id: user.id,
      email: user.email,
      role: user.role,
    } : null;

    if (this.initialized && this.userContext) {
      // Sentry.setUser(this.userContext);
      logger.debug('User context set for error tracking', this.userContext);
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    this.userContext = null;
    
    if (this.initialized) {
      // Sentry.setUser(null);
      logger.debug('User context cleared');
    }
  }

  /**
   * Capture exception
   */
  captureException(error, context = {}) {
    if (!this.enabled) {
      return;
    }

    logger.error('Capturing exception', error, context);

    if (this.initialized) {
      // Sentry.captureException(error, {
      //   extra: context,
      // });
    }
  }

  /**
   * Capture message
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.enabled) {
      return;
    }

    logger.info('Capturing message', { message, level, context });

    if (this.initialized) {
      // Sentry.captureMessage(message, {
      //   level,
      //   extra: context,
      // });
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb) {
    if (!this.enabled || !this.initialized) {
      return;
    }

    // Sentry.addBreadcrumb({
    //   message: breadcrumb.message,
    //   category: breadcrumb.category || 'default',
    //   level: breadcrumb.level || 'info',
    //   data: breadcrumb.data,
    // });
  }

  /**
   * Set custom context
   */
  setContext(name, context) {
    if (!this.enabled || !this.initialized) {
      return;
    }

    // Sentry.setContext(name, context);
  }

  /**
   * Set tag for filtering
   */
  setTag(key, value) {
    if (!this.enabled || !this.initialized) {
      return;
    }

    // Sentry.setTag(key, value);
  }

  /**
   * Filter events before sending
   */
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames) {
      const frames = event.exception.values[0].stacktrace.frames;
      if (frames.some(frame => frame.filename?.includes('chrome-extension://'))) {
        return null;
      }
    }

    // Filter out network errors that are expected
    if (event.message?.includes('Network Error') && event.tags?.expected === true) {
      return null;
    }

    // Add custom data
    event.extra = {
      ...event.extra,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    return event;
  }

  /**
   * Track API error
   */
  trackApiError(error, requestConfig) {
    const context = {
      url: requestConfig.url,
      method: requestConfig.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    };

    this.captureException(error, context);
    this.addBreadcrumb({
      message: `API Error: ${requestConfig.method} ${requestConfig.url}`,
      category: 'api',
      level: 'error',
      data: context,
    });
  }

  /**
   * Track navigation
   */
  trackNavigation(from, to) {
    this.addBreadcrumb({
      message: `Navigation: ${from} -> ${to}`,
      category: 'navigation',
      level: 'info',
      data: { from, to },
    });
  }

  /**
   * Track user action
   */
  trackAction(action, data = {}) {
    this.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user',
      level: 'info',
      data,
    });
  }

  /**
   * Create error boundary handler
   */
  createErrorBoundaryHandler() {
    return (error, errorInfo) => {
      this.captureException(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    };
  }
}

export const errorTracker = new ErrorTracker();
export default errorTracker;
