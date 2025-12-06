import { http, HttpResponse } from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Create a mock API response
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} path - API path
 * @param {Object|Function} response - Response data or function
 * @param {number} status - HTTP status code
 * @returns {Object} MSW handler
 */
export function mockApiResponse(method, path, response, status = 200) {
  const fullPath = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  const handler = http[method](fullPath, ({ request, params, cookies }) => {
    const responseData = typeof response === 'function' 
      ? response({ request, params, cookies })
      : response;
    
    return HttpResponse.json(responseData, { status });
  });
  
  return handler;
}

/**
 * Create a mock error response
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {number} status - HTTP status code
 * @param {Object} error - Error data
 * @returns {Object} MSW handler
 */
export function mockApiError(method, path, status = 500, error = {}) {
  const fullPath = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  const defaultError = {
    error: 'Internal server error',
    message: 'Something went wrong',
    ...error,
  };
  
  return http[method](fullPath, () => {
    return HttpResponse.json(defaultError, { status });
  });
}

/**
 * Create a mock validation error response
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {Object} errors - Validation errors by field
 * @returns {Object} MSW handler
 */
export function mockValidationError(method, path, errors = {}) {
  return mockApiError(method, path, 422, {
    error: 'Validation failed',
    errors,
  });
}

/**
 * Create a mock unauthorized response
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @returns {Object} MSW handler
 */
export function mockUnauthorized(method, path) {
  return mockApiError(method, path, 401, {
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource',
  });
}

/**
 * Create a mock forbidden response
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @returns {Object} MSW handler
 */
export function mockForbidden(method, path) {
  return mockApiError(method, path, 403, {
    error: 'Forbidden',
    message: 'You do not have permission to access this resource',
  });
}

/**
 * Create a mock not found response
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @returns {Object} MSW handler
 */
export function mockNotFound(method, path) {
  return mockApiError(method, path, 404, {
    error: 'Not found',
    message: 'The requested resource was not found',
  });
}

/**
 * Create a delayed response (for testing loading states)
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {Object} response - Response data
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} MSW handler
 */
export function mockDelayedResponse(method, path, response, delay = 1000) {
  const fullPath = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  return http[method](fullPath, async () => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return HttpResponse.json(response);
  });
}

/**
 * Create a mock paginated response
 * @param {Array} items - Array of items
 * @param {number} page - Current page
 * @param {number} perPage - Items per page
 * @returns {Object} Paginated response
 */
export function createPaginatedResponse(items, page = 1, perPage = 10) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedItems = items.slice(start, end);
  
  return {
    data: paginatedItems,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_pages: Math.ceil(items.length / perPage),
      total_count: items.length,
    },
  };
}

/**
 * Wait for API call to complete
 * @param {Function} callback - Function that triggers API call
 * @param {Object} expect - Vitest expect function
 * @returns {Promise} Promise that resolves when API call completes
 */
export async function waitForApiCall(callback, expect) {
  const { waitFor } = await import('@testing-library/react');
  
  let apiCallCompleted = false;
  
  callback().finally(() => {
    apiCallCompleted = true;
  });
  
  await waitFor(() => {
    expect(apiCallCompleted).toBe(true);
  });
}

/**
 * Create mock file for upload testing
 * @param {string} name - File name
 * @param {string} type - MIME type
 * @param {string} content - File content
 * @returns {File} Mock file object
 */
export function createMockFile(name = 'test.pdf', type = 'application/pdf', content = 'test content') {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Create mock form data
 * @param {Object} data - Form data
 * @returns {FormData} FormData object
 */
export function createMockFormData(data) {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  
  return formData;
}

/**
 * Reset all MSW handlers to default
 */
export async function resetHandlers() {
  const { server } = await import('../mocks/server.js');
  server.resetHandlers();
}

/**
 * Add temporary handler for a single test
 * @param {Object} handler - MSW handler
 */
export async function useHandler(handler) {
  const { server } = await import('../mocks/server.js');
  server.use(handler);
}

/**
 * Add multiple temporary handlers for a single test
 * @param {Array} handlers - Array of MSW handlers
 */
export async function useHandlers(...handlers) {
  const { server } = await import('../mocks/server.js');
  server.use(...handlers);
}
