/**
 * Client-side logging utility
 * Provides structured logging with different levels and optional remote logging
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
  }

  /**
   * Log debug messages (development only)
   */
  debug(message, data = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }

  /**
   * Log informational messages
   */
  info(message, data = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, data);
    }
  }

  /**
   * Log warning messages
   */
  warn(message, data = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data);
    }
    
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
    
    if (this.remoteLoggingEnabled) {
      this.sendToRemote('error', message, {
        ...data,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : null,
      });
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
   * Send logs to remote logging service (e.g., Sentry, LogRocket)
   */
  sendToRemote(level, message, data) {
    // Placeholder for remote logging integration
    // In production, this would send to a service like Sentry
    try {
      // Example: Sentry.captureMessage(message, { level, extra: data });
      console.log('[REMOTE LOG]', { level, message, data });
    } catch (err) {
      console.error('Failed to send log to remote service', err);
    }
  }
}

export const logger = new Logger();
export default logger;
