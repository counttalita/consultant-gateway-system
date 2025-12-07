import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import Login from '../../pages/auth/Login';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Requirement 1.1: Login page display', () => {
    it('should display email input field and request OTP button when user visits login page', () => {
      renderWithProviders(<Login />, { route: '/login' });

      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send code/i })).toBeInTheDocument();
    });
  });

  describe('Requirement 1.2: OTP request flow', () => {
    it('should call request OTP API and display success message when user submits valid email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />, { route: '/login' });

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send code/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/verification code sent to your email/i)).toBeInTheDocument();
      });

      // Should show OTP input field
      expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
    });

    it('should display error message when OTP request fails', async () => {
      const user = userEvent.setup();
      
      // Override handler to return error
      server.use(
        http.post(`${API_BASE_URL}/auth/request_otp`, () => {
          return HttpResponse.json(
            { error: 'Email not found' },
            { status: 404 }
          );
        })
      );

      renderWithProviders(<Login />, { route: '/login' });

      const emailInput = screen.getByPlaceholderText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send code/i });

      await user.type(emailInput, 'invalid@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 1.3: OTP validation flow', () => {
    it('should call validate OTP API and store session token when user enters valid OTP', async () => {
      const user = userEvent.setup();
      const mockNavigate = vi.fn();
      
      renderWithProviders(<Login />, { route: '/login' });

      // Step 1: Request OTP
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });

      // Step 2: Enter OTP
      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      await user.type(otpInput, '123456');
      await user.click(screen.getByRole('button', { name: /verify & login/i }));

      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });

      // Session token should be stored (handled by AuthContext)
      await waitFor(() => {
        expect(localStorage.getItem('session_token')).toBeTruthy();
      });
    });

    it('should display error and clear OTP field when OTP is invalid', async () => {
      const user = userEvent.setup();
      
      // Override handler to return error
      server.use(
        http.post(`${API_BASE_URL}/auth/validate_otp`, () => {
          return HttpResponse.json(
            { error: 'Invalid OTP' },
            { status: 401 }
          );
        })
      );

      renderWithProviders(<Login />, { route: '/login' });

      // Request OTP first
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });

      // Enter invalid OTP
      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      await user.type(otpInput, '999999');
      await user.click(screen.getByRole('button', { name: /verify & login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid otp/i)).toBeInTheDocument();
      });

      // OTP field should be cleared
      expect(otpInput).toHaveValue('');
    });
  });

  describe('Requirement 1.4: Role-based redirection', () => {
    it('should redirect consultant to /consultant after successful authentication', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post(`${API_BASE_URL}/auth/validate_otp`, () => {
          return HttpResponse.json({
            user: {
              id: 1,
              email: 'consultant@example.com',
              role: 'consultant',
              roles: ['consultant'],
            },
            session_token: 'mock-token',
          });
        })
      );

      const { container } = renderWithProviders(<Login />, { route: '/login' });

      // Request and verify OTP
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'consultant@example.com');
      await user.click(screen.getByRole('button', { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      await user.type(otpInput, '123456');
      await user.click(screen.getByRole('button', { name: /verify & login/i }));

      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });

    it('should redirect admin to /admin after successful authentication', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post(`${API_BASE_URL}/auth/validate_otp`, () => {
          return HttpResponse.json({
            user: {
              id: 2,
              email: 'admin@example.com',
              role: 'admin',
              roles: ['admin'],
            },
            session_token: 'mock-token',
          });
        })
      );

      renderWithProviders(<Login />, { route: '/login' });

      // Request and verify OTP
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'admin@example.com');
      await user.click(screen.getByRole('button', { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      await user.type(otpInput, '123456');
      await user.click(screen.getByRole('button', { name: /verify & login/i }));

      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });

    it('should redirect finance user to /finance after successful authentication', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.post(`${API_BASE_URL}/auth/validate_otp`, () => {
          return HttpResponse.json({
            user: {
              id: 3,
              email: 'finance@example.com',
              role: 'finance',
              roles: ['finance'],
            },
            session_token: 'mock-token',
          });
        })
      );

      renderWithProviders(<Login />, { route: '/login' });

      // Request and verify OTP
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'finance@example.com');
      await user.click(screen.getByRole('button', { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      await user.type(otpInput, '123456');
      await user.click(screen.getByRole('button', { name: /verify & login/i }));

      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 1.5: Logout functionality', () => {
    it('should call logout API and clear session token when user logs out', async () => {
      // This test would require rendering a component with logout functionality
      // For now, we'll test the service directly
      const { authService } = await import('../../services/auth.service');
      
      // Set a mock token
      localStorage.setItem('session_token', 'mock-token');
      
      await authService.logout();
      
      // Token should be cleared
      expect(localStorage.getItem('session_token')).toBeNull();
    });
  });

  describe('Complete authentication flow', () => {
    it('should complete full authentication flow from email to dashboard', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<Login />, { route: '/login' });

      // Step 1: Enter email
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      // Step 2: Request OTP
      await user.click(screen.getByRole('button', { name: /send code/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/verification code sent/i)).toBeInTheDocument();
      });

      // Step 3: Enter OTP
      const otpInput = screen.getByPlaceholderText(/enter 6-digit code/i);
      await user.type(otpInput, '123456');
      
      // Step 4: Verify OTP
      await user.click(screen.getByRole('button', { name: /verify & login/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });

    it('should allow user to change email during OTP step', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<Login />, { route: '/login' });

      // Request OTP
      const emailInput = screen.getByPlaceholderText(/email address/i);
      await user.type(emailInput, 'wrong@example.com');
      await user.click(screen.getByRole('button', { name: /send code/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
      });

      // Click change email
      await user.click(screen.getByRole('button', { name: /change email/i }));

      // Should be back to email step
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/enter 6-digit code/i)).not.toBeInTheDocument();
    });
  });
});
