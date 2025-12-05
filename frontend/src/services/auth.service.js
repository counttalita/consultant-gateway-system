import api from './api';

const authService = {
  async requestOtp(email) {
    const response = await api.post('/auth/request-otp', { email });
    return response.data;
  },

  async validateOtp(email, otp) {
    const response = await api.post('/auth/validate-otp', { email, otp });
    return response.data;
  },

  async logout() {
    const response = await api.delete('/auth/logout');
    return response.data;
  },

  async getSession() {
    const response = await api.get('/auth/session');
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  }
};

export default authService;
