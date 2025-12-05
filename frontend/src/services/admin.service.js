import BaseService from './BaseService';

class AdminService extends BaseService {
  constructor() {
    super('');
  }

  async getUsers(params = {}) {
    return this.get('/users', { params });
  }

  async getUser(id) {
    return this.get(`/users/${id}`);
  }

  async updateUserRoles(id, roles) {
    return this.patch(`/users/${id}/roles`, { roles });
  }

  async deactivateUser(id) {
    return this.patch(`/users/${id}/deactivate`);
  }

  async getDashboard() {
    return this.get('/admin/dashboard');
  }

  async getIntegrationHealth() {
    return this.get('/admin/integration_health');
  }

  async getSystemHealth() {
    return this.get('/health');
  }
}

const adminService = new AdminService();
export default adminService;
