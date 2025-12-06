/**
 * Client-side logging and monitoring utility
 * Provides structured logging with different levels, performance monitoring,
 * error tracking, user action tracking, and log aggregation
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.level = import.meta.env.MODE === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
    this.remoteLoggingEnabled = import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true';
    this.debugMode = import.meta.env.MODE === 'development' || localStorage.getItem('debug_mode') === 'true';
    this.logBuffer = [];
    this.maxBufferSize = 100;
    this.performanceMarks = new Map();
    this.userContext = null;
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
    
    // Initialize error tracking
    this.initErrorTracking();
  }

  /**
   * Set user context for logging
   */
  setUserContext(user) {
    this.userContext = user ? {
      id: user.id,
      email: user.email,
      role: user.role,
    } : null;
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (enabled) {
      localStorage.setItem('debug_mode', 'true');
      this.level = LOG_LEVELS.DEBUG;
    } else {
      localStorage.removeItem('debug_mode');
      this.level = import.meta.env.MODE === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
    }
  }

  /**
   * Get current log level name
   */
  getCurrentLevel() {
    return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === this.level);
  }

  /**
   * Create log entry with metadata
   */
  createLogEntry(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userContext: this.userContext,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Add to buffer for aggregation
    this.addToBuffer(entry);

    return entry;
  }

  /**
   * Add log entry to buffer
   */
  addToBuffer(entry) {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Get buffered logs
   */
  getBufferedLogs(filter = {}) {
    let logs = [...this.logBuffer];

    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }

    return logs;
  }

  /**
   * Clear log buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logBuffer, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Log debug messages (development only)
   */
  debug(message, data = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data);
      this.createLogEntry('debug', message, data);
    }
  }

  /**
   * Log informational messages
   */
  info(message, data = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, data);
      this.createLogEntry('info', message, data);
    }
  }

  /**
   * Log warning messages
   */
  warn(message, data = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data);
    }
    
    const entry = this.createLogEntry('warn', message, data);
    
    if (this.remoteLoggingEnabled) {
      this.sendToRemote('warn', message, data);
    }
  }

  /**
   * Log error messages
   */
  error(message, error = null, data = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, error, data);
    }
    
    const errorData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
    };

    const entry = this.createLogEntry('error', message, errorData);
    
    if (this.remoteLoggingEnabled) {
      this.sendToRemote('error', message, errorData);
    }
  }

  /**
   * Log API errors with request/response details
   */
  apiError(message, error, requestConfig = {}) {
    const errorData = {
      url: requestConfig.url,
      method: requestConfig.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestData: requestConfig.data,
    };

    this.error(message, error, errorData);
  }

  /**
   * Track user action for analytics
   */
  trackAction(action, category, label = null, value = null) {
    const actionData = {
      action,
      category,
      label,
      value,
      timestamp: new Date().toISOString(),
    };

    this.info(`User action: ${action}`, actionData);

    // Send to analytics service (e.g., Google Analytics, Mixpanel)
    if (this.remoteLoggingEnabled) {
      this.sendAnalytics(actionData);
    }
  }

  /**
   * Track page view
   */
  trackPageView(path, title = null) {
    this.trackAction('page_view', 'navigation', path, null);
  }

  /**
   * Track button click
   */
  trackClick(buttonName, context = null) {
    this.trackAction('click', 'interaction', buttonName, context);
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName, success = true) {
    this.trackAction('form_submit', 'form', formName, success ? 1 : 0);
  }

  /**
   * Initialize performance monitoring
   */
  initPerformanceMonitoring() {
    // Monitor page load time
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
          const firstPaintTime = timing.responseEnd - timing.fetchStart;

          this.info('Page load performance', {
            pageLoadTime,
            domReadyTime,
            firstPaintTime,
            url: window.location.href,
          });

          if (this.remoteLoggingEnabled) {
            this.sendPerformanceMetrics({
              type: 'page_load',
              pageLoadTime,
              domReadyTime,
              firstPaintTime,
            });
          }
        }, 0);
      });
    }

    // Monitor long tasks (tasks taking > 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.warn('Long task detected', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  /**
   * Start performance measurement
   */
  startPerformanceMark(name) {
    const startTime = performance.now();
    this.performanceMarks.set(name, startTime);
    
    if (this.debugMode) {
      this.debug(`Performance mark started: ${name}`);
    }
  }

  /**
   * End performance measurement and log duration
   */
  endPerformanceMark(name) {
    const startTime = this.performanceMarks.get(name);
    if (!startTime) {
      this.warn(`Performance mark not found: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    this.performanceMarks.delete(name);

    this.info(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });

    if (this.remoteLoggingEnabled && duration > 1000) {
      // Log slow operations to remote service
      this.sendPerformanceMetrics({
        type: 'operation',
        name,
        duration,
      });
    }

    return duration;
  }

  /**
   * Measure API response time
   */
  measureApiCall(url, method, duration, status) {
    const data = {
      url,
      method,
      duration: `${duration.toFixed(2)}ms`,
      status,
    };

    if (duration > 3000) {
      this.warn('Slow API call detected', data);
    } else {
      this.debug('API call completed', data);
    }

    if (this.remoteLoggingEnabled) {
      this.sendPerformanceMetrics({
        type: 'api_call',
        ...data,
        duration, // Send as number for aggregation
      });
    }
  }

  /**
   * Initialize error tracking
   */
  initErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', event.reason, {
        promise: event.promise,
      });
    });

    // React error boundary integration
    window.__logReactError = (error, errorInfo) => {
      this.error('React error boundary caught error', error, {
        componentStack: errorInfo.componentStack,
      });
    };
  }

  /**
   * Send logs to remote logging service (e.g., Sentry, LogRocket)
   */
  sendToRemote(level, message, data) {
    // Placeholder for remote logging integration
    // In production, this would send to a service like Sentry
    try {
      // Example integrations:
      // Sentry: Sentry.captureMessage(message, { level, extra: data });
      // LogRocket: LogRocket.captureMessage(message, { level, extra: data });
      // Custom endpoint: fetch('/api/logs', { method: 'POST', body: JSON.stringify({ level, message, data }) });
      
      if (this.debugMode) {
        console.log('[REMOTE LOG]', { level, message, data });
      }
    } catch (err) {
      console.error('Failed to send log to remote service', err);
    }
  }

  /**
   * Send analytics data
   */
  sendAnalytics(data) {
    try {
      // Example integrations:
      // Google Analytics: gtag('event', data.action, { event_category: data.category, event_label: data.label });
      // Mixpanel: mixpanel.track(data.action, data);
      // Custom endpoint: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
      
      if (this.debugMode) {
        console.log('[ANALYTICS]', data);
      }
    } catch (err) {
      console.error('Failed to send analytics', err);
    }
  }

  /**
   * Send performance metrics
   */
  sendPerformanceMetrics(metrics) {
    try {
      // Example integrations:
      // Custom endpoint: fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metrics) });
      // New Relic: newrelic.addPageAction(metrics.type, metrics);
      
      if (this.debugMode) {
        console.log('[PERFORMANCE METRICS]', metrics);
      }
    } catch (err) {
      console.error('Failed to send performance metrics', err);
    }
  }
}

export const logger = new Logger();
export default logger;
