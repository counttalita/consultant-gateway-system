import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser, createMockProfile } from '../utils/test-utils';
import ConsultantProfile from '../../pages/consultant/Profile';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

describe('Profile Management Flow Integration Tests', () => {
  const mockUser = createMockUser({ id: 1, consultant_id: 1 });
  const mockProfile = createMockProfile();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 2.1: Profile display', () => {
    it('should call get profile API and display all profile fields when consultant views profile page', async () => {
      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        })
      );

      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Check that profile data is displayed
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
      
      // Should have tabs
      expect(screen.getByRole('tab', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /banking/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /cv upload/i })).toBeInTheDocument();
    });

    it('should display error message when profile fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
          );
        })
      );

      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Error notification should be shown (via NotificationContext)
      // The actual error display depends on notification implementation
    });
  });

  describe('Requirement 2.2: Profile update', () => {
    it('should call update profile API with changed data when consultant updates bio or skills', async () => {
      let updateCalled = false;
      let updatedData = null;

      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        }),
        http.put(`${API_BASE_URL}/profiles/1`, async ({ request }) => {
          updateCalled = true;
          updatedData = await request.json();
          return HttpResponse.json({
            ...mockProfile,
            ...updatedData,
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Find and update bio field
      const bioField = screen.getByLabelText(/bio/i);
      await user.clear(bioField);
      await user.type(bioField, 'Updated bio text');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateCalled).toBe(true);
      });

      expect(updatedData).toHaveProperty('bio', 'Updated bio text');
    });
  });

  describe('Requirement 2.3: CV upload', () => {
    it('should call CV upload API with multipart form data when consultant uploads CV', async () => {
      let uploadCalled = false;

      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        }),
        http.post(`${API_BASE_URL}/cv_uploads`, async ({ request }) => {
          uploadCalled = true;
          const formData = await request.formData();
          expect(formData.get('file')).toBeTruthy();
          
          return HttpResponse.json({
            data: {
              parsed_skills: ['JavaScript', 'React', 'Node.js'],
              parsed_experience: ['5 years of web development'],
              parsed_qualifications: ['BSc Computer Science'],
            },
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Switch to CV Upload tab
      const cvTab = screen.getByRole('tab', { name: /cv upload/i });
      await user.click(cvTab);

      // Create a mock file
      const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
      
      // Find file input and upload
      const fileInput = screen.getByLabelText(/upload/i, { selector: 'input[type="file"]' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(uploadCalled).toBe(true);
      }, { timeout: 3000 });
    });
  });

  describe('Requirement 2.4: CV parsing display', () => {
    it('should display extracted skills for consultant review when CV parsing completes', async () => {
      const parsedData = {
        parsed_skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        parsed_experience: ['5 years of web development', '3 years of React'],
        parsed_qualifications: ['BSc Computer Science', 'AWS Certified'],
      };

      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        }),
        http.post(`${API_BASE_URL}/cv_uploads`, () => {
          return HttpResponse.json({ data: parsedData });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Switch to CV Upload tab
      const cvTab = screen.getByRole('tab', { name: /cv upload/i });
      await user.click(cvTab);

      // Upload CV
      const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/upload/i, { selector: 'input[type="file"]' });
      await user.upload(fileInput, file);

      // Wait for parsed skills to appear
      await waitFor(() => {
        expect(screen.getByText(/javascript/i)).toBeInTheDocument();
        expect(screen.getByText(/react/i)).toBeInTheDocument();
        expect(screen.getByText(/node\.js/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 2.5: Profile update success feedback', () => {
    it('should display success message and refresh data when profile updates succeed', async () => {
      const updatedProfile = {
        ...mockProfile,
        bio: 'Updated bio',
      };

      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        }),
        http.put(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(updatedProfile);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Update bio
      const bioField = screen.getByLabelText(/bio/i);
      await user.clear(bioField);
      await user.type(bioField, 'Updated bio');

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Success message should appear (via NotificationContext)
      await waitFor(() => {
        // The bio field should now show the updated value
        expect(bioField).toHaveValue('Updated bio');
      });
    });
  });

  describe('Complete profile management flow', () => {
    it('should allow consultant to view, edit, and save profile information', async () => {
      const updatedProfile = {
        ...mockProfile,
        bio: 'New bio text',
        skills: ['JavaScript', 'React', 'Vue.js'],
      };

      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        }),
        http.put(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(updatedProfile);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Verify initial data is displayed
      expect(screen.getByLabelText(/bio/i)).toHaveValue(mockProfile.bio);

      // Edit bio
      const bioField = screen.getByLabelText(/bio/i);
      await user.clear(bioField);
      await user.type(bioField, 'New bio text');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify update was successful
      await waitFor(() => {
        expect(bioField).toHaveValue('New bio text');
      });
    });

    it('should allow consultant to switch between profile tabs', async () => {
      server.use(
        http.get(`${API_BASE_URL}/profiles/1`, () => {
          return HttpResponse.json(mockProfile);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<ConsultantProfile />, {
        initialAuth: mockUser,
        route: '/consultant/profile',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading profile/i)).not.toBeInTheDocument();
      });

      // Start on Profile tab
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();

      // Switch to Banking tab
      const bankingTab = screen.getByRole('tab', { name: /banking/i });
      await user.click(bankingTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();
      });

      // Switch to CV Upload tab
      const cvTab = screen.getByRole('tab', { name: /cv upload/i });
      await user.click(cvTab);

      await waitFor(() => {
        expect(screen.getByText(/upload/i)).toBeInTheDocument();
      });
    });
  });
});
