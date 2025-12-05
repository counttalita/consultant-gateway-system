import api from './api';

const onboardingService = {
  async getStatus() {
    const response = await api.get('/onboarding');
    return response.data;
  },

  async initialize() {
    const response = await api.post('/onboarding/initialize');
    return response.data;
  },

  async completeStep(stepName, stepData) {
    const response = await api.post(`/onboarding/steps/${stepName}`, {
      step_data: stepData
    });
    return response.data;
  }
};

export default onboardingService;
