import BaseService from './BaseService';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  /**
   * Request OTP for email address
   * @param {string} email - User's email address
   * @returns {Promise} Response from API
   */
  async requestOtp(email) {
    try {
      const response = await this.post('/request-otp', { email });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate OTP and establish session
   * @param {string} email - User's email address
   * @param {string} otp - One-time password
   * @returns {Promise} Response with user data and session token
   */
  async validateOtp(email, otp) {
    try {
      const response = await this.post('/validate-otp', { email, otp });
      
      // Store session token if provided
      if (response.session_token) {
        localStorage.setItem('session_token', response.session_token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout and invalidate session
   * @returns {Promise} Response from API
   */
  async logout() {
    try {
      const response = await this.delete('/logout');
      
      // Clear session token from local storage
      localStorage.removeItem('session_token');
      
      return response;
    } catch (error) {
      // Even if API call fails, clear local session
      localStorage.removeItem('session_token');
      throw error;
    }
  }

  /**
   * Get current session information
   * @returns {Promise} Session data
   */
  async getSession() {
    try {
      return await this.get('/session');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise} User data
   */
  async getCurrentUser() {
    try {
      // Note: This endpoint is at /users/me, not /auth/users/me
      // So we need to use the api directly instead of basePath
      const response = await this.api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService;
