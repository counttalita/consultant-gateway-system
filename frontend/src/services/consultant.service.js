import BaseService from './BaseService';

/**
 * Consultant Service
 * Handles all consultant-related API calls including profile management,
 * CV uploads, and availability updates
 */
class ConsultantService extends BaseService {
  constructor() {
    super('/consultants');
  }

  /**
   * Get consultant profile
   * @param {number|string} id - Consultant ID
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Profile data
   */
  async getProfile(id, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getProfile-${id}`);
    return this.get(`/${id}/profile`, { signal });
  }

  /**
   * Update consultant profile
   * @param {number|string} id - Consultant ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(id, profileData) {
    return this.patch(`/${id}/profile`, profileData);
  }

  /**
   * Upload CV file
   * @param {number|string} id - Consultant ID
   * @param {FormData} formData - Form data containing CV file
   * @param {Function} onUploadProgress - Progress callback
   * @returns {Promise<Object>} Upload result with parsed data
   */
  async uploadCv(id, formData, onUploadProgress = null) {
    return this.uploadFile(`/${id}/cv`, formData, onUploadProgress);
  }

  /**
   * Update consultant availability status
   * @param {number|string} consultantId - Consultant ID
   * @param {string} availabilityStatus - New availability status
   * @returns {Promise<Object>} Updated availability data
   */
  async updateAvailability(consultantId, availabilityStatus) {
    return this.patch(`/availability/${consultantId}`, {
      availability_status: availabilityStatus
    });
  }

  /**
   * Get consultant's current projects and assignments
   * @param {number|string} consultantId - Consultant ID
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Projects and assignments data
   */
  async getProjects(consultantId, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getProjects-${consultantId}`);
    return this.get(`/${consultantId}/projects`, { signal });
  }

  /**
   * Get consultant's utilization metrics
   * @param {number|string} consultantId - Consultant ID
   * @returns {Promise<Object>} Utilization data
   */
  async getUtilization(consultantId) {
    return this.get(`/${consultantId}/utilization`);
  }
}

const consultantService = new ConsultantService();
export default consultantService;
