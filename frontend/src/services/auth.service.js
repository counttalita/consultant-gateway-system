import BaseService from './BaseService';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  async requestOtp(email) {
    return this.post('/request-otp', { email });
  }

  async validateOtp(email, otp) {
    return this.post('/validate-otp', { email, otp });
  }

  async logout() {
    return this.delete('/logout');
  }

  async getSession() {
    return this.get('/session');
  }

  async getCurrentUser() {
    return this.get('/users/me');
  }
}

const authService = new AuthService();
export default authService;
