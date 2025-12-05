import BaseService from './BaseService';

class ConsultantService extends BaseService {
  constructor() {
    super('/consultants');
  }

  async getProfile(id) {
    return this.get(`/${id}/profile`);
  }

  async updateProfile(id, profileData) {
    return this.patch(`/${id}/profile`, profileData);
  }

  async uploadCv(id, formData, onUploadProgress = null) {
    return this.uploadFile(`/${id}/cv`, formData, onUploadProgress);
  }

  async updateAvailability(consultantId, availabilityStatus) {
    return this.patch(`/availability/${consultantId}`, {
      availability_status: availabilityStatus
    });
  }
  
  async getTalentPool() {
    return this.get('/availability/talent_pool');
  }
}

const consultantService = new ConsultantService();
export default consultantService;
