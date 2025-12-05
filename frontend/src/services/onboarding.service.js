import BaseService from './BaseService';

class OnboardingService extends BaseService {
  constructor() {
    super('/onboarding');
  }

  async getStatus() {
    return this.get('');
  }

  async initialize() {
    return this.post('/initialize');
  }

  async completeStep(stepName, stepData) {
    return this.post(`/steps/${stepName}`, {
      step_data: stepData
    });
  }

  async getStepData(stepName) {
    return this.get(`/steps/${stepName}`);
  }
}

const onboardingService = new OnboardingService();
export default onboardingService;
