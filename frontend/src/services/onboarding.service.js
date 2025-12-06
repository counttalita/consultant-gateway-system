import BaseService from './BaseService';

/**
 * Onboarding Service
 * Handles all onboarding-related API calls for new consultant setup
 */
class OnboardingService extends BaseService {
  constructor() {
    super('/onboarding');
  }

  /**
   * Get current onboarding status
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Onboarding status with completed steps
   */
  async getStatus(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getStatus');
    return this.get('', { signal });
  }

  /**
   * Initialize onboarding process
   * @returns {Promise<Object>} Onboarding data with steps
   */
  async initialize() {
    return this.post('/initialize');
  }

  /**
   * Complete an onboarding step
   * @param {string} stepName - Name of the step (personal_info, banking, skills, contract)
   * @param {Object} stepData - Data for the step
   * @returns {Promise<Object>} Updated onboarding status
   */
  async completeStep(stepName, stepData) {
    return this.post(`/steps/${stepName}`, {
      step_data: stepData
    });
  }

  /**
   * Get data for a specific step
   * @param {string} stepName - Name of the step
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Step data
   */
  async getStepData(stepName, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getStepData-${stepName}`);
    return this.get(`/steps/${stepName}`, { signal });
  }

  /**
   * Skip an optional onboarding step
   * @param {string} stepName - Name of the step to skip
   * @returns {Promise<Object>} Updated onboarding status
   */
  async skipStep(stepName) {
    return this.post(`/steps/${stepName}/skip`);
  }

  /**
   * Reset onboarding progress (admin only)
   * @param {number|string} consultantId - Consultant ID
   * @returns {Promise<Object>} Response data
   */
  async resetOnboarding(consultantId) {
    return this.post(`/reset/${consultantId}`);
  }
}

const onboardingService = new OnboardingService();
export default onboardingService;
