import api from './api';

const consultantService = {
  async getProfile(id) {
    const response = await api.get(`/consultants/${id}/profile`);
    return response.data;
  },

  async updateProfile(id, profileData) {
    const response = await api.patch(`/consultants/${id}/profile`, profileData);
    return response.data;
  },

  async uploadCv(id, formData) {
    const response = await api.post(`/consultants/${id}/cv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateAvailability(consultantId, availabilityStatus) {
    const response = await api.patch(`/api/v1/availability/${consultantId}`, {
      availability_status: availabilityStatus
    });
    return response.data;
  },
  
  async getTalentPool() {
    const response = await api.get('/availability/talent_pool');
    return response.data;
  }
};

export default consultantService;
