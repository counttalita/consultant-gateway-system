/**
 * User analytics tracking
 * Provides utilities for tracking user actions and behavior
 */

import logger from './logger';

class Analytics {
  constructor() {
    this.enabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
    this.debugMode = import.meta.env.MODE === 'development';
    this.sessionId = this.generateSessionId();
    this.userContext = null;
    this.eventQueue = [];
    this.flushInterval = 5000; // Flush events every 5 seconds
    this.maxQueueSize = 50;
    
    if (this.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user context
   */
  setUser(user) {
    this.userContext = user ? {
      id: user.id,
      email: user.email,
      role: user.role,
    } : null;

    if (this.userContext) {
      this.track('user_identified', {
        userId: user.id,
        role: user.role,
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (this.userContext) {
      this.track('user_logout', {
        userId: this.userContext.id,
      });
    }
    
    this.userContext = null;
  }

  /**
   * Track event
   */
  track(eventName, properties = {}) {
    if (!this.enabled) {
      return;
    }

    const event = {
      event: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      },
      user: this.userContext,
    };

    this.eventQueue.push(event);
    logger.debug('Analytics event tracked', event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  pageView(path = null, title = null) {
    this.track('page_view', {
      path: path || window.location.pathname,
      title: title || document.title,
      search: window.location.search,
      hash: window.location.hash,
    });
  }

  /**
   * Track button click
   */
  click(elementName, context = {}) {
    this.track('click', {
      element: elementName,
      ...context,
    });
  }

  /**
   * Track form submission
   */
  formSubmit(formName, success = true, errors = null) {
    this.track('form_submit', {
      form: formName,
      success,
      errors: errors ? Object.keys(errors).length : 0,
      errorFields: errors ? Object.keys(errors) : [],
    });
  }

  /**
   * Track form field interaction
   */
  formFieldInteraction(formName, fieldName, action = 'focus') {
    this.track('form_field_interaction', {
      form: formName,
      field: fieldName,
      action,
    });
  }

  /**
   * Track search
   */
  search(query, resultsCount = null, filters = {}) {
    this.track('search', {
      query,
      resultsCount,
      filters,
    });
  }

  /**
   * Track file upload
   */
  fileUpload(fileName, fileSize, fileType, success = true) {
    this.track('file_upload', {
      fileName,
      fileSize,
      fileType,
      success,
    });
  }

  /**
   * Track download
   */
  download(fileName, fileType) {
    this.track('download', {
      fileName,
      fileType,
    });
  }

  /**
   * Track error
   */
  error(errorType, errorMessage, context = {}) {
    this.track('error', {
      errorType,
      errorMessage,
      ...context,
    });
  }

  /**
   * Track feature usage
   */
  featureUsed(featureName, context = {}) {
    this.track('feature_used', {
      feature: featureName,
      ...context,
    });
  }

  /**
   * Track time spent on page
   */
  timeOnPage(path, duration) {
    this.track('time_on_page', {
      path,
      duration,
    });
  }

  /**
   * Track API call
   */
  apiCall(method, endpoint, duration, status, success = true) {
    this.track('api_call', {
      method,
      endpoint,
      duration,
      status,
      success,
    });
  }

  /**
   * Track modal interaction
   */
  modalInteraction(modalName, action = 'open') {
    this.track('modal_interaction', {
      modal: modalName,
      action,
    });
  }

  /**
   * Track tab change
   */
  tabChange(tabName, context = {}) {
    this.track('tab_change', {
      tab: tabName,
      ...context,
    });
  }

  /**
   * Track filter usage
   */
  filterUsed(filterName, filterValue, context = {}) {
    this.track('filter_used', {
      filter: filterName,
      value: filterValue,
      ...context,
    });
  }

  /**
   * Track sort usage
   */
  sortUsed(sortField, sortDirection, context = {}) {
    this.track('sort_used', {
      field: sortField,
      direction: sortDirection,
      ...context,
    });
  }

  /**
   * Track pagination
   */
  pagination(page, totalPages, context = {}) {
    this.track('pagination', {
      page,
      totalPages,
      ...context,
    });
  }

  /**
   * Flush event queue
   */
  async flush() {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to analytics service
      await this.sendEvents(events);
      logger.debug('Analytics events flushed', { count: events.length });
    } catch (error) {
      logger.error('Failed to flush analytics events', error);
      // Re-add events to queue if send failed
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Send events to analytics service
   */
  async sendEvents(events) {
    if (this.debugMode) {
      console.log('[ANALYTICS] Events:', events);
      return;
    }

    // Example integrations:
    // Google Analytics:
    // events.forEach(event => {
    //   gtag('event', event.event, event.properties);
    // });

    // Mixpanel:
    // events.forEach(event => {
    //   mixpanel.track(event.event, event.properties);
    // });

    // Custom endpoint:
    // await fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events }),
    // });
  }

  /**
   * Start flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Cleanup on page unload
   */
  cleanup() {
    this.flush();
    this.stopFlushTimer();
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Flush events before page unload
window.addEventListener('beforeunload', () => {
  analytics.cleanup();
});

export default analytics;
