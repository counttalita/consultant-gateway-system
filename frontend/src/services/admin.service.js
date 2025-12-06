import BaseService from './BaseService';

/**
 * Admin Service
 * Handles all admin-related API calls including user management,
 * system monitoring, and configuration
 */
class AdminService extends BaseService {
  constructor() {
    super('');
  }

  /**
   * Get list of users with optional filters
   * @param {Object} params - Filter parameters (role, active, search, page)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Users data with pagination
   */
  async getUsers(params = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getUsers');
    return this.get('/users', { params, signal });
  }

  /**
   * Get single user by ID
   * @param {number|string} id - User ID
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} User data
   */
  async getUser(id, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getUser-${id}`);
    return this.get(`/users/${id}`, { signal });
  }

  /**
   * Update user roles
   * @param {number|string} id - User ID
   * @param {Array<string>} roles - Array of role names
   * @returns {Promise<Object>} Updated user data
   */
  async updateUserRoles(id, roles) {
    return this.patch(`/users/${id}/roles`, { roles });
  }

  /**
   * Deactivate a user
   * @param {number|string} id - User ID
   * @returns {Promise<Object>} Response data
   */
  async deactivateUser(id) {
    return this.patch(`/users/${id}/deactivate`);
  }

  /**
   * Activate a user
   * @param {number|string} id - User ID
   * @returns {Promise<Object>} Response data
   */
  async activateUser(id) {
    return this.patch(`/users/${id}/activate`);
  }

  /**
   * Get admin dashboard metrics
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboard(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getDashboard');
    return this.get('/admin/dashboard', { signal });
  }

  /**
   * Get integration health status
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Integration health data
   */
  async getIntegrationHealth(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getIntegrationHealth');
    return this.get('/admin/integration_health', { signal });
  }

  /**
   * Get system health status
   * @returns {Promise<Object>} System health data
   */
  async getSystemHealth() {
    return this.get('/health');
  }

  /**
   * Get talent pool with filters
   * @param {Object} filters - Filter parameters (skills, availability, etc.)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Array>} Consultant data
   */
  async getTalentPool(filters = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getTalentPool');
    return this.get('/admin/talent_pool', { params: filters, signal });
  }

  /**
   * Get audit logs with filters
   * @param {Object} params - Filter parameters (user, action, date_range, page)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Audit logs with pagination
   */
  async getAuditLogs(params = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getAuditLogs');
    return this.get('/admin/audit_logs', { params, signal });
  }

  /**
   * Export audit logs as file
   * @param {Object} params - Filter parameters
   * @returns {Promise<Blob>} File blob
   */
  async exportAuditLogs(params = {}) {
    return this.downloadFile('/admin/audit_logs/export', { params });
  }

  /**
   * Get system configuration
   * @returns {Promise<Object>} Configuration data
   */
  async getConfig() {
    return this.get('/config');
  }

  /**
   * Update system configuration
   * @param {Object} config - Configuration data
   * @returns {Promise<Object>} Updated configuration
   */
  async updateConfig(config) {
    return this.patch('/config', config);
  }

  /**
   * Reload system configuration from source
   * @returns {Promise<Object>} Response data
   */
  async reloadConfig() {
    return this.post('/config/reload');
  }
}

const adminService = new AdminService();
export default adminService;
