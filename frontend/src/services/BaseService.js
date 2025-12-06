import api from './api';
import logger from '../utils/logger';

/**
 * Base service class with common functionality
 * All service classes should extend this to inherit retry logic, error handling, and logging
 */
class BaseService {
  constructor(basePath = '') {
    this.basePath = basePath;
    this.api = api;
    this.abortControllers = new Map(); // Track abort controllers for request cancellation
  }

  /**
   * Create an abort controller for request cancellation
   * @param {string} key - Unique key to identify the request
   * @returns {Object} Abort signal and cancel function
   */
  createCancelToken(key) {
    // Cancel any existing request with the same key
    this.cancelRequest(key);

    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    return {
      signal: controller.signal,
      cancel: () => this.cancelRequest(key)
    };
  }

  /**
   * Cancel a pending request
   * @param {string} key - Unique key identifying the request
   */
  cancelRequest(key) {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
      logger.debug(`Request cancelled: ${key}`);
    }
  }

  /**
   * Cancel all pending requests for this service
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller, key) => {
      controller.abort();
      logger.debug(`Request cancelled: ${key}`);
    });
    this.abortControllers.clear();
  }

  /**
   * Make a GET request
   */
  async get(endpoint, config = {}) {
    try {
      // Check for mock mode
      const mockAdapter = await this.getMockAdapter();
      if (mockAdapter?.isEnabled()) {
        const mockResponse = await mockAdapter.handleRequest('GET', `${this.basePath}${endpoint}`, null, config);
        if (mockResponse) return mockResponse.data;
      }

      logger.debug(`GET ${this.basePath}${endpoint}`, config);
      const response = await this.api.get(`${this.basePath}${endpoint}`, config);
      logger.debug(`GET ${this.basePath}${endpoint} - Success`, response.data);
      return response.data;
    } catch (error) {
      logger.apiError(`GET ${this.basePath}${endpoint} - Failed`, error, {
        url: `${this.basePath}${endpoint}`,
        method: 'GET',
        ...config,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data = {}, config = {}) {
    try {
      // Check for mock mode
      const mockAdapter = await this.getMockAdapter();
      if (mockAdapter?.isEnabled()) {
        const mockResponse = await mockAdapter.handleRequest('POST', `${this.basePath}${endpoint}`, data, config);
        if (mockResponse) return mockResponse.data;
      }

      logger.debug(`POST ${this.basePath}${endpoint}`, { data, config });
      const response = await this.api.post(`${this.basePath}${endpoint}`, data, config);
      logger.debug(`POST ${this.basePath}${endpoint} - Success`, response.data);
      return response.data;
    } catch (error) {
      logger.apiError(`POST ${this.basePath}${endpoint} - Failed`, error, {
        url: `${this.basePath}${endpoint}`,
        method: 'POST',
        data,
        ...config,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Make a PATCH request
   */
  async patch(endpoint, data = {}, config = {}) {
    try {
      // Check for mock mode
      const mockAdapter = await this.getMockAdapter();
      if (mockAdapter?.isEnabled()) {
        const mockResponse = await mockAdapter.handleRequest('PATCH', `${this.basePath}${endpoint}`, data, config);
        if (mockResponse) return mockResponse.data;
      }

      logger.debug(`PATCH ${this.basePath}${endpoint}`, { data, config });
      const response = await this.api.patch(`${this.basePath}${endpoint}`, data, config);
      logger.debug(`PATCH ${this.basePath}${endpoint} - Success`, response.data);
      return response.data;
    } catch (error) {
      logger.apiError(`PATCH ${this.basePath}${endpoint} - Failed`, error, {
        url: `${this.basePath}${endpoint}`,
        method: 'PATCH',
        data,
        ...config,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data = {}, config = {}) {
    try {
      // Check for mock mode
      const mockAdapter = await this.getMockAdapter();
      if (mockAdapter?.isEnabled()) {
        const mockResponse = await mockAdapter.handleRequest('PUT', `${this.basePath}${endpoint}`, data, config);
        if (mockResponse) return mockResponse.data;
      }

      logger.debug(`PUT ${this.basePath}${endpoint}`, { data, config });
      const response = await this.api.put(`${this.basePath}${endpoint}`, data, config);
      logger.debug(`PUT ${this.basePath}${endpoint} - Success`, response.data);
      return response.data;
    } catch (error) {
      logger.apiError(`PUT ${this.basePath}${endpoint} - Failed`, error, {
        url: `${this.basePath}${endpoint}`,
        method: 'PUT',
        data,
        ...config,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Get mock adapter instance (lazy loaded to avoid circular dependencies)
   */
  async getMockAdapter() {
    if (!this._mockAdapter && import.meta.env.VITE_USE_MOCK_API === 'true') {
      const { mockAdapter } = await import('./mockAdapter');
      this._mockAdapter = mockAdapter;
    }
    return this._mockAdapter;
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, config = {}) {
    try {
      // Check for mock mode
      const mockAdapter = await this.getMockAdapter();
      if (mockAdapter?.isEnabled()) {
        const mockResponse = await mockAdapter.handleRequest('DELETE', `${this.basePath}${endpoint}`, null, config);
        if (mockResponse) return mockResponse.data;
      }

      logger.debug(`DELETE ${this.basePath}${endpoint}`, config);
      const response = await this.api.delete(`${this.basePath}${endpoint}`, config);
      logger.debug(`DELETE ${this.basePath}${endpoint} - Success`, response.data);
      return response.data;
    } catch (error) {
      logger.apiError(`DELETE ${this.basePath}${endpoint} - Failed`, error, {
        url: `${this.basePath}${endpoint}`,
        method: 'DELETE',
        ...config,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Handle and normalize errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        type: 'api_error',
        status: error.response.status,
        message: error.response.data?.error || error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors || {},
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        type: 'network_error',
        message: 'Unable to connect to the server. Please check your internet connection.',
      };
    } else {
      // Something else happened
      return {
        type: 'unknown_error',
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Upload file with multipart/form-data
   */
  async uploadFile(endpoint, formData, onUploadProgress = null) {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    return this.post(endpoint, formData, config);
  }

  /**
   * Download file as blob
   */
  async downloadFile(endpoint, config = {}) {
    try {
      logger.debug(`DOWNLOAD ${this.basePath}${endpoint}`, config);
      const response = await this.api.get(`${this.basePath}${endpoint}`, {
        ...config,
        responseType: 'blob',
      });
      logger.debug(`DOWNLOAD ${this.basePath}${endpoint} - Success`);
      return response.data;
    } catch (error) {
      logger.apiError(`DOWNLOAD ${this.basePath}${endpoint} - Failed`, error, {
        url: `${this.basePath}${endpoint}`,
        method: 'GET',
        ...config,
      });
      throw this.handleError(error);
    }
  }
}

export default BaseService;
