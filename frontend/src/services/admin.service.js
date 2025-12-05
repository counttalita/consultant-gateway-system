import api from './api';

const adminService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateUserRoles(id, roles) {
    const response = await api.patch(`/users/${id}/roles`, { roles });
    return response.data;
  },

  async getSystemHealth() {
    const response = await api.get('/health');
    return response.data;
  }
};

export default adminService;
