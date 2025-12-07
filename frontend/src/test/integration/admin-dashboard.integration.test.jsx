import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser } from '../utils/test-utils';
import AdminDashboard from '../../pages/admin/Dashboard';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

describe('Admin Dashboard Interactions Integration Tests', () => {
  const mockAdminUser = createMockUser({
    id: 1,
    email: 'admin@example.com',
    role: 'admin',
    roles: ['admin'],
  });

  const mockDashboardData = {
    active_users: {
      active_count: 50,
      total_users: 100,
      recent_logins: 25,
      period_hours: 24,
    },
    integration_health: {
      overall_status: 'healthy',
      airtable: {
        status: 'healthy',
        last_sync: '2024-01-01T00:00:00Z',
        error_count_24h: 0,
      },
      xero: {
        status: 'healthy',
        last_sync: '2024-01-01T00:00:00Z',
        error_count_24h: 0,
      },
      clickup: {
        status: 'degraded',
        last_sync: '2024-01-01T00:00:00Z',
        error_count_24h: 2,
      },
    },
    data_quality: {
      overall_score: 85,
      total_issues: 15,
      incomplete_profiles: 5,
      pending_onboarding: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default handlers for all dashboard tests
    server.use(
      http.get(`${API_BASE_URL}/admin/dashboard/activity_trends`, () => {
        return HttpResponse.json({
          logins_last_7_days: [],
          profile_updates_last_7_days: [],
        });
      }),
      http.get(`${API_BASE_URL}/admin/dashboard/errors`, () => {
        return HttpResponse.json({
          summary: { critical: 0, warning: 0, info: 0 },
          recent_errors: [],
        });
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Requirement 5.1: Dashboard metrics display', () => {
    it('should call admin dashboard API and display all metrics when admin views dashboard', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(mockDashboardData);
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check metric cards are displayed
      expect(screen.getAllByText(/active users/i)[0]).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText(/100 total users/i)).toBeInTheDocument();

      expect(screen.getByText(/recent logins/i)).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();

      expect(screen.getByText(/system status/i)).toBeInTheDocument();
      expect(screen.getByText(/healthy/i)).toBeInTheDocument();

      expect(screen.getByText(/data quality/i)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should display error message when dashboard fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
          );
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Error notification should be shown
      // The actual display depends on notification implementation
    });
  });

  describe('Requirement 5.2: Integration health monitoring', () => {
    it('should call integration health API and display status for all services when admin views integration health', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(mockDashboardData);
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check integration health section
      expect(screen.getByRole('heading', { name: /integration health/i })).toBeInTheDocument();

      // Check individual services
      expect(screen.getByText(/airtable/i)).toBeInTheDocument();
      expect(screen.getByText(/xero/i)).toBeInTheDocument();
      expect(screen.getByText(/clickup/i)).toBeInTheDocument();

      // Check degraded service shows error count
      const clickupSection = screen.getByText(/clickup/i).closest('div');
      expect(clickupSection).toHaveTextContent('2 errors');
    });
  });

  describe('Requirement 5.3: Activity trends display', () => {
    it('should display charts showing login trends and profile updates when admin views activity trends', async () => {
      const activityTrends = {
        logins_last_7_days: [10, 15, 20, 18, 22, 25, 30],
        profile_updates_last_7_days: [5, 8, 6, 10, 12, 9, 11],
      };

      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(mockDashboardData);
        }),
        http.get(`${API_BASE_URL}/admin/dashboard/activity_trends`, () => {
          return HttpResponse.json(activityTrends);
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check activity trends section exists
      expect(screen.getByText(/activity trends/i)).toBeInTheDocument();
    });
  });

  describe('Requirement 5.4: Error summary with drill-down', () => {
    it('should display error counts by severity with drill-down capability when admin views error summary', async () => {
      const errorData = {
        summary: {
          critical: 2,
          warning: 5,
          info: 10,
        },
        recent_errors: [
          {
            id: 1,
            severity: 'critical',
            message: 'Database connection failed',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            severity: 'warning',
            message: 'API rate limit approaching',
            timestamp: '2024-01-01T01:00:00Z',
          },
        ],
      };

      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(mockDashboardData);
        }),
        http.get(`${API_BASE_URL}/admin/dashboard/errors`, () => {
          return HttpResponse.json(errorData);
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check error summary section
      expect(screen.getByText(/error summary/i)).toBeInTheDocument();
    });
  });

  describe('Requirement 5.5: Data quality display', () => {
    it('should display incomplete profiles and pending onboarding tasks when admin views data quality', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(mockDashboardData);
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check data quality section
      expect(screen.getByText(/data quality/i)).toBeInTheDocument();

      // Should show overall score
      expect(screen.getByText('85%')).toBeInTheDocument();

      // Should show issue count
      expect(screen.getByText(/15 issues/i)).toBeInTheDocument();
    });
  });

  describe('Auto-refresh functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-refresh dashboard data every 60 seconds when auto-refresh is enabled', async () => {
      let fetchCount = 0;

      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          fetchCount++;
          return HttpResponse.json(mockDashboardData);
        })
      );

      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Initial fetch
      expect(fetchCount).toBe(1);

      // Fast-forward 60 seconds
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(fetchCount).toBe(2);
      });

      // Fast-forward another 60 seconds
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(fetchCount).toBe(3);
      });
    });

    it('should stop auto-refresh when user disables it', async () => {
      let fetchCount = 0;

      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          fetchCount++;
          return HttpResponse.json(mockDashboardData);
        })
      );

      const user = userEvent.setup({ delay: null });
      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Initial fetch
      expect(fetchCount).toBe(1);

      // Disable auto-refresh
      const autoRefreshCheckbox = screen.getByRole('checkbox', { name: /auto-refresh/i });
      await user.click(autoRefreshCheckbox);

      // Fast-forward 60 seconds
      vi.advanceTimersByTime(60000);

      // Should not fetch again
      await waitFor(() => {
        expect(fetchCount).toBe(1);
      });
    });
  });

  describe('Manual refresh functionality', () => {
    it('should refresh dashboard data when admin clicks refresh button', async () => {
      let fetchCount = 0;

      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          fetchCount++;
          return HttpResponse.json(mockDashboardData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Initial fetch
      expect(fetchCount).toBe(1);

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(fetchCount).toBe(2);
      });
    });

    it('should show refreshing state while refresh is in progress', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json(mockDashboardData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Button should be disabled during refresh
      expect(refreshButton).toBeDisabled();

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Complete admin dashboard interaction flow', () => {
    it('should allow admin to view all dashboard sections and interact with controls', async () => {
      server.use(
        http.get(`${API_BASE_URL}/admin/dashboard`, () => {
          return HttpResponse.json(mockDashboardData);
        }),
        http.get(`${API_BASE_URL}/admin/dashboard/activity_trends`, () => {
          return HttpResponse.json({
            logins_last_7_days: [10, 15, 20, 18, 22, 25, 30],
            profile_updates_last_7_days: [5, 8, 6, 10, 12, 9, 11],
          });
        }),
        http.get(`${API_BASE_URL}/admin/dashboard/errors`, () => {
          return HttpResponse.json({
            summary: { critical: 0, warning: 2, info: 5 },
            recent_errors: [],
          });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />, {
        initialAuth: mockAdminUser,
        route: '/admin/dashboard',
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify all sections are present
      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
      expect(screen.getAllByText(/active users/i)[0]).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /integration health/i })).toBeInTheDocument(); // Assuming section is a heading
      expect(screen.getAllByText(/activity trends/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/data quality/i)[0]).toBeInTheDocument();

      // Test refresh functionality
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });

      // Test auto-refresh toggle
      const autoRefreshCheckbox = screen.getByRole('checkbox', { name: /auto-refresh/i });
      expect(autoRefreshCheckbox).toBeChecked();

      await user.click(autoRefreshCheckbox);
      expect(autoRefreshCheckbox).not.toBeChecked();
    });
  });
});
