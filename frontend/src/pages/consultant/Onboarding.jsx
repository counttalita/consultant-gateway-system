import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useNotification } from '../../hooks/useNotification';
import onboardingService from '../../services/onboarding.service';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import PersonalInfoStep from '../../components/onboarding/PersonalInfoStep';
import BankingStep from '../../components/onboarding/BankingStep';
import SkillsStep from '../../components/onboarding/SkillsStep';
import ContractStep from '../../components/onboarding/ContractStep';
import WelcomeStep from '../../components/onboarding/WelcomeStep';

const STEPS = [
  { id: 'personal_info', name: 'Personal Info', component: PersonalInfoStep },
  { id: 'skills', name: 'Skills', component: SkillsStep },
  { id: 'banking_details', name: 'Banking', component: BankingStep },
  { id: 'contract', name: 'Contract', component: ContractStep },
  { id: 'welcome', name: 'Complete', component: WelcomeStep }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const initializeOnboarding = useCallback(async () => {
    try {
      // Try to get existing onboarding status
      const status = await onboardingService.getStatus();
      
      if (status.completed) {
        // If onboarding is already completed, redirect to dashboard
        navigate('/consultant');
        return;
      }

      // Determine current step based on completed steps
      if (status.completed_steps && status.completed_steps.length > 0) {
        const lastCompletedIndex = STEPS.findIndex(
          step => step.id === status.completed_steps[status.completed_steps.length - 1]
        );
        if (lastCompletedIndex !== -1 && lastCompletedIndex < STEPS.length - 1) {
          setCurrentStepIndex(lastCompletedIndex + 1);
        }
      }

      // Pre-fill any existing data
      if (status.step_data) {
        setStepData(status.step_data);
      }

      setInitialized(true);
    } catch {
      // If status endpoint fails, try to initialize
      try {
        await onboardingService.initialize();
        setInitialized(true);
      } catch (initError) {
        showError('Failed to initialize onboarding');
        console.error('Onboarding initialization error:', initError);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, showError]);

  useEffect(() => {
    initializeOnboarding();
  }, [initializeOnboarding]);

  const handleStepComplete = async (stepName, data) => {
    try {
      const result = await onboardingService.completeStep(stepName, data);
      
      // Save step data locally
      setStepData(prev => ({ ...prev, [stepName]: data }));

      // Check if this was the last step before welcome
      if (currentStepIndex === STEPS.length - 2) {
        // Move to welcome step
        setCurrentStepIndex(STEPS.length - 1);
        showSuccess('Onboarding completed successfully!');
      } else if (result.next_step) {
        // Move to next step
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // Onboarding complete, redirect
        navigate('/consultant');
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to save step');
      throw error; // Re-throw to let the step component handle it
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to initialize onboarding</p>
          <button
            onClick={initializeOnboarding}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];
  const StepComponent = currentStep.component;
  const isWelcomeStep = currentStep.id === 'welcome';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Consultant Onboarding</h1>
          <p className="mt-2 text-gray-600">
            Complete the following steps to set up your consultant profile
          </p>
        </div>

        {/* Progress Indicator */}
        {!isWelcomeStep && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.slice(0, -1).map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    {/* Step Circle */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors',
                        index < currentStepIndex
                          ? 'bg-green-600 text-white'
                          : index === currentStepIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      )}
                    >
                      {index < currentStepIndex ? (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {/* Step Label */}
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium text-center',
                        index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                      )}
                    >
                      {step.name}
                    </span>
                  </div>
                  {/* Connector Line */}
                  {index < STEPS.length - 2 && (
                    <div
                      className={cn(
                        'h-1 flex-1 mx-2 transition-colors',
                        index < currentStepIndex ? 'bg-green-600' : 'bg-gray-300'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8">
          <StepComponent
            data={stepData[currentStep.id]}
            onComplete={handleStepComplete}
            onBack={handleBack}
            canGoBack={currentStepIndex > 0 && !isWelcomeStep}
          />
        </div>

        {/* Help Text */}
        {!isWelcomeStep && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Need help? Contact support at{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-700">
                support@example.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
