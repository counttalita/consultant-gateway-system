/**
 * Mock API adapter for development
 * Intercepts API calls and returns mock data when VITE_USE_MOCK_API is enabled
 */

import {
  mockUsers,
  mockProfiles,
  mockProjects,
  mockTenders,
  mockDashboard,
  mockFinanceDashboard,
  mockOnboardingStatus,
  mockAuditLogs,
  delay,
  mockPaginatedResponse
} from './mockData';
import logger from '../utils/logger';

class MockAdapter {
  constructor() {
    this.enabled = import.meta.env.VITE_USE_MOCK_API === 'true';
    this.delay = parseInt(import.meta.env.VITE_MOCK_DELAY || '500', 10);
  }

  /**
   * Check if mock mode is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Handle mock API request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} config - Request config
   * @returns {Promise} Mock response
   */
  async handleRequest(method, url, data = null, config = {}) {
    if (!this.enabled) {
      return null; // Let real API handle it
    }

    logger.debug(`[MOCK API] ${method} ${url}`, { data, config });

    // Simulate network delay
    await delay(this.delay);

    try {
      const response = this.routeRequest(method, url, data, config);
      logger.debug(`[MOCK API] Response for ${method} ${url}`, response);
      return { data: response };
    } catch (error) {
      logger.error(`[MOCK API] Error for ${method} ${url}`, error);
      throw error;
    }
  }

  /**
   * Route request to appropriate mock handler
   */
  routeRequest(method, url, data, config) {
    // Remove base URL if present
    const path = url.replace(/^\/api\/v1/, '');

    // Auth endpoints
    if (path.startsWith('/auth/request-otp')) {
      return this.mockRequestOtp(data);
    }
    if (path.startsWith('/auth/validate-otp')) {
      return this.mockValidateOtp(data);
    }
    if (path.startsWith('/auth/logout')) {
      return this.mockLogout();
    }

    // User endpoints
    if (path === '/users/me') {
      return this.mockGetCurrentUser();
    }
    if (path === '/users' && method === 'GET') {
      return this.mockGetUsers(config.params);
    }
    if (path.match(/^\/users\/\d+$/)) {
      const id = parseInt(path.split('/')[2]);
      return this.mockGetUser(id);
    }

    // Profile endpoints
    if (path.match(/^\/consultants\/\d+\/profile$/)) {
      const id = parseInt(path.split('/')[2]);
      return this.mockGetProfile(id);
    }
    if (path.match(/^\/consultants\/\d+\/profile$/) && method === 'PATCH') {
      const id = parseInt(path.split('/')[2]);
      return this.mockUpdateProfile(id, data);
    }

    // Projects endpoints
    if (path === '/projects' && method === 'GET') {
      return this.mockGetProjects(config.params);
    }
    if (path.match(/^\/projects\/\d+$/)) {
      const id = parseInt(path.split('/')[2]);
      return this.mockGetProject(id);
    }

    // Tenders endpoints
    if (path === '/tenders' && method === 'GET') {
      return this.mockGetTenders(config.params);
    }
    if (path.match(/^\/tenders\/\d+$/)) {
      const id = parseInt(path.split('/')[2]);
      return this.mockGetTender(id);
    }

    // Admin endpoints
    if (path === '/admin/dashboard') {
      return mockDashboard;
    }
    if (path === '/admin/talent_pool') {
      return mockUsers.filter(u => u.role === 'consultant');
    }
    if (path === '/admin/audit_logs') {
      return mockPaginatedResponse(mockAuditLogs, config.params?.page || 1);
    }

    // Finance endpoints
    if (path === '/finance/dashboard') {
      return mockFinanceDashboard;
    }

    // Onboarding endpoints
    if (path === '/onboarding') {
      return mockOnboardingStatus;
    }
    if (path === '/onboarding/initialize') {
      return mockOnboardingStatus;
    }

    // Default: return empty success response
    logger.warn(`[MOCK API] No mock handler for ${method} ${path}`);
    return { success: true, message: 'Mock response' };
  }

  // Mock handlers for specific endpoints

  mockRequestOtp(data) {
    return {
      success: true,
      message: 'OTP sent to email'
    };
  }

  mockValidateOtp(data) {
    // Accept any OTP in mock mode
    return {
      success: true,
      session_token: 'mock-session-token-' + Date.now(),
      user: mockUsers[0]
    };
  }

  mockLogout() {
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  mockGetCurrentUser() {
    return mockUsers[0];
  }

  mockGetUsers(params = {}) {
    let users = [...mockUsers];

    // Apply filters
    if (params.role) {
      users = users.filter(u => u.role === params.role);
    }
    if (params.active !== undefined) {
      users = users.filter(u => u.active === (params.active === 'true'));
    }
    if (params.search) {
      users = users.filter(u => 
        u.email.toLowerCase().includes(params.search.toLowerCase())
      );
    }

    return mockPaginatedResponse(users, params.page || 1);
  }

  mockGetUser(id) {
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw { response: { status: 404, data: { error: 'User not found' } } };
    }
    return user;
  }

  mockGetProfile(id) {
    const profile = mockProfiles[id];
    if (!profile) {
      throw { response: { status: 404, data: { error: 'Profile not found' } } };
    }
    return profile;
  }

  mockUpdateProfile(id, data) {
    const profile = mockProfiles[id];
    if (!profile) {
      throw { response: { status: 404, data: { error: 'Profile not found' } } };
    }
    return { ...profile, ...data };
  }

  mockGetProjects(params = {}) {
    let projects = [...mockProjects];

    if (params.status) {
      projects = projects.filter(p => p.status === params.status);
    }

    return mockPaginatedResponse(projects, params.page || 1);
  }

  mockGetProject(id) {
    const project = mockProjects.find(p => p.id === id);
    if (!project) {
      throw { response: { status: 404, data: { error: 'Project not found' } } };
    }
    return project;
  }

  mockGetTenders(params = {}) {
    let tenders = [...mockTenders];

    if (params.status) {
      tenders = tenders.filter(t => t.bid_decision === params.status);
    }

    return mockPaginatedResponse(tenders, params.page || 1);
  }

  mockGetTender(id) {
    const tender = mockTenders.find(t => t.id === id);
    if (!tender) {
      throw { response: { status: 404, data: { error: 'Tender not found' } } };
    }
    return tender;
  }
}

export const mockAdapter = new MockAdapter();
export default mockAdapter;
