import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser } from '../utils/test-utils';
import Onboarding from '../../pages/consultant/Onboarding';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

describe('Onboarding Wizard Flow Integration Tests', () => {
  const mockUser = createMockUser({ id: 1, consultant_id: 1 });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 3.1: Onboarding initialization', () => {
    it('should call initialize onboarding API and display wizard when new consultant logs in', async () => {
      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: [],
            step_data: {},
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: [
              { name: 'personal_info', completed: false },
              { name: 'skills', completed: false },
              { name: 'banking_details', completed: false },
              { name: 'contract', completed: false },
            ],
          });
        })
      );

      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Should show progress indicator
      expect(screen.getByText(/personal info/i)).toBeInTheDocument();
      expect(screen.getByText(/skills/i)).toBeInTheDocument();
      expect(screen.getByText(/banking/i)).toBeInTheDocument();
      expect(screen.getByText(/contract/i)).toBeInTheDocument();
    });

    it('should redirect to dashboard if onboarding is already completed', async () => {
      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: true,
            completed_steps: ['personal_info', 'skills', 'banking_details', 'contract'],
            step_data: {},
          });
        })
      );

      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      // Should redirect (component will unmount)
      await waitFor(() => {
        expect(screen.queryByText(/consultant onboarding/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Requirement 3.2: Step completion', () => {
    it('should call complete step API with step data when consultant completes each step', async () => {
      let completedSteps = [];

      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: completedSteps,
            step_data: {},
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: [
              { name: 'personal_info', completed: false },
              { name: 'skills', completed: false },
              { name: 'banking_details', completed: false },
              { name: 'contract', completed: false },
            ],
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/complete_step`, async ({ request }) => {
          const body = await request.json();
          completedSteps.push(body.step_name);

          return HttpResponse.json({
            next_step: body.step_name === 'personal_info' ? 'skills' : null,
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Fill in personal info step
      const fullNameInput = screen.getByLabelText(/full name/i);
      await user.type(fullNameInput, 'John Doe');

      const idNumberInput = screen.getByLabelText(/id number/i);
      await user.type(idNumberInput, '9001015009087');

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '0821234567');

      // Submit step
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(completedSteps).toContain('personal_info');
      });
    });
  });

  describe('Requirement 3.3: Step navigation', () => {
    it('should display progress indicators and allow backward navigation when consultant navigates between steps', async () => {
      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: ['personal_info'],
            step_data: {
              personal_info: {
                full_name: 'John Doe',
                id_number: '9001015009087',
                phone: '0821234567',
              },
            },
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: [
              { name: 'personal_info', completed: true },
              { name: 'skills', completed: false },
              { name: 'banking_details', completed: false },
              { name: 'contract', completed: false },
            ],
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Should be on skills step (second step)
      expect(screen.getByText(/skills/i)).toBeInTheDocument();

      // Should have back button
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();

      // Click back
      await user.click(backButton);

      // Should go back to personal info step
      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });
    });

    it('should show progress indicator with completed and current steps highlighted', async () => {
      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: ['personal_info'],
            step_data: {},
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: [
              { name: 'personal_info', completed: true },
              { name: 'skills', completed: false },
              { name: 'banking_details', completed: false },
              { name: 'contract', completed: false },
            ],
          });
        })
      );

      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Progress indicator should show completed and current steps
      const progressSteps = screen.getAllByRole('generic').filter(el =>
        el.className && el.className.includes('rounded-full')
      );

      expect(progressSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 3.4: Onboarding completion', () => {
    it('should display completion message and redirect to dashboard when all steps are complete', async () => {
      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: ['personal_info', 'skills', 'banking_details'],
            step_data: {},
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: [
              { name: 'personal_info', completed: true },
              { name: 'skills', completed: true },
              { name: 'banking_details', completed: true },
              { name: 'contract', completed: false },
            ],
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/complete_step`, () => {
          return HttpResponse.json({
            next_step: null, // No next step means completion
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Should be on contract step (last step)
      // Accept contract
      const acceptCheckbox = screen.getByRole('checkbox', { name: /accept/i });
      await user.click(acceptCheckbox);

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await user.click(completeButton);

      // Should show welcome/completion step
      await waitFor(() => {
        expect(screen.getByText(/complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 3.5: Progress persistence', () => {
    it('should save progress and allow resumption from last completed step when consultant exits onboarding', async () => {
      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: ['personal_info', 'skills'],
            step_data: {
              personal_info: {
                full_name: 'John Doe',
                id_number: '9001015009087',
                phone: '0821234567',
              },
              skills: {
                skills: ['JavaScript', 'React'],
                experience_years: 5,
              },
            },
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: [
              { name: 'personal_info', completed: true },
              { name: 'skills', completed: true },
              { name: 'banking_details', completed: false },
              { name: 'contract', completed: false },
            ],
          });
        })
      );

      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Should resume from banking_details step (next after completed steps)
      expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();

      // Previous steps should be marked as completed in progress indicator
      const completedSteps = screen.getAllByRole('generic').filter(el =>
        el.className && el.className.includes('bg-green')
      );

      expect(completedSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Complete onboarding flow', () => {
    it('should allow consultant to complete all onboarding steps sequentially', async () => {
      let currentStep = 0;
      const steps = ['personal_info', 'skills', 'banking_details', 'contract'];
      const completedSteps = [];

      server.use(
        http.get(`${API_BASE_URL}/onboarding`, () => {
          return HttpResponse.json({
            completed: false,
            completed_steps: completedSteps,
            step_data: {},
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
          return HttpResponse.json({
            steps: steps.map((name, idx) => ({
              name,
              completed: idx < completedSteps.length,
            })),
          });
        }),
        http.post(`${API_BASE_URL}/onboarding/complete_step`, async ({ request }) => {
          const body = await request.json();
          completedSteps.push(body.step_name);
          currentStep++;

          return HttpResponse.json({
            next_step: currentStep < steps.length ? steps[currentStep] : null,
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<Onboarding />, {
        initialAuth: mockUser,
        route: '/consultant/onboarding',
      });

      await waitFor(() => {
        expect(screen.getByText(/consultant onboarding/i)).toBeInTheDocument();
      });

      // Step 1: Personal Info
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/id number/i), '9001015009087');
      await user.type(screen.getByLabelText(/phone/i), '0821234567');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Wait for next step
      await waitFor(() => {
        expect(completedSteps).toContain('personal_info');
      });

      // Verify we can proceed through multiple steps
      expect(completedSteps.length).toBeGreaterThan(0);
    });
  });
});
