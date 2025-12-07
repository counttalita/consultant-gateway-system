import BaseService from './BaseService';
import logger from '../utils/logger';

/**
 * Authentication Service
 * Handles all authentication-related API calls including OTP flow,
 * session management, and user authentication
 */
class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  /**
   * Request OTP for email address
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Response from API
   */
  async requestOtp(email) {
    logger.info('Requesting OTP', { email });
    const response = await this.post('/request-otp', { email });
    logger.info('OTP requested successfully', { email });
    return response;
  }

  /**
   * Validate OTP and establish session
   * @param {string} email - User's email address
   * @param {string} otp - One-time password
   * @returns {Promise<Object>} Response with user data and session token
   */
  async validateOtp(email, otp) {
    logger.info('Validating OTP', { email });
    const response = await this.post('/validate-otp', { email, otp });
    
    // Store session token if provided
    if (response.session_token) {
      localStorage.setItem('session_token', response.session_token);
      logger.info('Session token stored', { email });
    }
    
    logger.info('OTP validated successfully', { email, user: response.user });
    return response;
  }

  /**
   * Logout and invalidate session
   * @returns {Promise<Object>} Response from API
   */
  async logout() {
    logger.info('Logging out');
    try {
      const response = await this.delete('/logout');
      
      // Clear session token from local storage
      localStorage.removeItem('session_token');
      logger.info('Logged out successfully');
      
      return response;
    } catch (error) {
      // Even if API call fails, clear local session
      localStorage.removeItem('session_token');
      logger.warn('Logout API call failed, but local session cleared', error);
      throw error;
    }
  }

  /**
   * Get current session information
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Session data
   */
  async getSession(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getSession');
    return await this.get('/session', { signal });
  }

  /**
   * Get current authenticated user
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} User data with roles and profile
   */
  async getCurrentUser(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getCurrentUser');
    // Note: This endpoint is at /users/me, not /auth/users/me
    // So we need to use the api directly instead of basePath
    const response = await this.api.get('/users/me', { signal });
    return response.data;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if session token exists
   */
  isAuthenticated() {
    return !!localStorage.getItem('session_token');
  }

  /**
   * Get stored session token
   * @returns {string|null} Session token or null
   */
  getToken() {
    return localStorage.getItem('session_token');
  }

  /**
   * Clear local session data
   */
  clearSession() {
    localStorage.removeItem('session_token');
    logger.info('Local session cleared');
  }
}

const authService = new AuthService();
export default authService;
