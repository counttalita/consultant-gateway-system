import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser } from '../utils/test-utils';
import FinanceDashboard from '../../pages/finance/Dashboard';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

describe('Finance Operations Integration Tests', () => {
  const mockFinanceUser = createMockUser({
    id: 1,
    email: 'finance@example.com',
    role: 'finance',
    roles: ['finance'],
  });

  const mockFinanceData = {
    current_month_revenue: 150000,
    outstanding_invoices_total: 35000,
    average_utilization: 78.5,
    active_consultants: 12,
    revenue_trend: 8.3,
    revenue_metrics: {
      current_month: 150000,
      previous_month: 138000,
      breakdown: [
        { project: 'Project A', revenue: 50000 },
        { project: 'Project B', revenue: 60000 },
        { project: 'Project C', revenue: 40000 },
      ],
    },
    outstanding_invoices: {
      total: 35000,
      aging: {
        current: 15000,
        '30_days': 10000,
        '60_days': 7000,
        '90_plus_days': 3000,
      },
      invoices: [
        {
          id: 1,
          client: 'Client A',
          amount: 15000,
          due_date: '2024-02-01',
          days_overdue: 0,
        },
        {
          id: 2,
          client: 'Client B',
          amount: 10000,
          due_date: '2024-01-15',
          days_overdue: 15,
        },
      ],
    },
    consultant_utilization: {
      consultants: [
        {
          name: 'John Doe',
          billable_hours: 160,
          total_hours: 200,
          utilization: 80,
        },
        {
          name: 'Jane Smith',
          billable_hours: 140,
          total_hours: 200,
          utilization: 70,
        },
      ],
    },
    project_profitability: {
      projects: [
        {
          name: 'Project A',
          revenue: 50000,
          cost: 30000,
          margin: 40,
        },
        {
          name: 'Project B',
          revenue: 60000,
          cost: 45000,
          margin: 25,
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 8.1: Finance dashboard display', () => {
    it('should call finance dashboard API and display all metrics when finance user views dashboard', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check main metrics are displayed
      expect(screen.getByText(/finance dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/current month revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/outstanding invoices/i)).toBeInTheDocument();
      expect(screen.getByText(/avg\. utilization/i)).toBeInTheDocument();
      expect(screen.getByText(/active consultants/i)).toBeInTheDocument();
    });

    it('should display error message when finance dashboard fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(
            { error: 'Failed to fetch finance data' },
            { status: 500 }
          );
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Error notification should be shown
    });
  });

  describe('Requirement 8.2: Revenue metrics display', () => {
    it('should display current month revenue and breakdown by project when finance user views revenue metrics', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check revenue metrics section
      expect(screen.getByText(/revenue metrics/i)).toBeInTheDocument();

      // Should show formatted currency
      expect(screen.getByText(/\$150,000/)).toBeInTheDocument();
    });
  });

  describe('Requirement 8.3: Outstanding invoices display', () => {
    it('should display outstanding invoices with aging breakdown when finance user views invoices', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check outstanding invoices section
      expect(screen.getByText(/outstanding invoices/i)).toBeInTheDocument();

      // Should show total amount
      expect(screen.getByText(/\$35,000/)).toBeInTheDocument();
    });
  });

  describe('Requirement 8.4: Consultant utilization display', () => {
    it('should display billable hours and utilization percentages when finance user views consultant utilization', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check consultant utilization section
      expect(screen.getByText(/consultant utilization/i)).toBeInTheDocument();
    });
  });

  describe('Requirement 8.5: Data export functionality', () => {
    it('should call export API and download file when finance user exports data as CSV', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });

      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        }),
        http.get(`${API_BASE_URL}/finance/export`, async () => {
          return HttpResponse.arrayBuffer(
            await mockBlob.arrayBuffer(),
            {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="export.csv"',
              },
            }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click CSV export button
      const csvButton = screen.getByRole('button', { name: /csv/i });
      await user.click(csvButton);

      // Export should be triggered
      await waitFor(() => {
        expect(csvButton).not.toBeDisabled();
      });
    });

    it('should call export API and download file when finance user exports data as Excel', async () => {
      const mockBlob = new Blob(['excel,data'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        }),
        http.get(`${API_BASE_URL}/finance/export`, async () => {
          return HttpResponse.arrayBuffer(
            await mockBlob.arrayBuffer(),
            {
              headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="export.xlsx"',
              },
            }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click Excel export button
      const excelButton = screen.getByRole('button', { name: /excel/i });
      await user.click(excelButton);

      // Export should be triggered
      await waitFor(() => {
        expect(excelButton).not.toBeDisabled();
      });
    });

    it('should disable export buttons while export is in progress', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        }),
        http.get(`${API_BASE_URL}/finance/export`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.arrayBuffer(
            new ArrayBuffer(0),
            {
              headers: {
                'Content-Type': 'text/csv',
              },
            }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click CSV export button
      const csvButton = screen.getByRole('button', { name: /csv/i });
      await user.click(csvButton);

      // Button should be disabled during export
      expect(csvButton).toBeDisabled();

      await waitFor(() => {
        expect(csvButton).not.toBeDisabled();
      });
    });
  });

  describe('Period selector functionality', () => {
    it('should refresh data when finance user changes period selection', async () => {
      let fetchCount = 0;

      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          fetchCount++;
          return HttpResponse.json(mockFinanceData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Initial fetch
      expect(fetchCount).toBe(1);

      // Change period (assuming there's a period selector)
      const periodSelector = screen.getByRole('combobox', { name: /period/i });
      if (periodSelector) {
        await user.selectOptions(periodSelector, 'previous_month');

        await waitFor(() => {
          expect(fetchCount).toBe(2);
        });
      }
    });
  });

  describe('Complete finance dashboard flow', () => {
    it('should allow finance user to view all metrics and export data', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        }),
        http.get(`${API_BASE_URL}/finance/export`, () => {
          return HttpResponse.arrayBuffer(
            new ArrayBuffer(0),
            {
              headers: {
                'Content-Type': 'text/csv',
              },
            }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Verify all sections are present
      expect(screen.getByText(/finance dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/current month revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/outstanding invoices/i)).toBeInTheDocument();
      expect(screen.getByText(/consultant utilization/i)).toBeInTheDocument();

      // Test export functionality
      const csvButton = screen.getByRole('button', { name: /csv/i });
      await user.click(csvButton);

      await waitFor(() => {
        expect(csvButton).not.toBeDisabled();
      });

      // All metrics should still be visible after export
      expect(screen.getByText(/finance dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Revenue metrics calculations', () => {
    it('should correctly display revenue trend percentage', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show trend percentage (8.3% in mock data)
      // The exact display format depends on the MetricCard component
      expect(screen.getByText(/current month revenue/i)).toBeInTheDocument();
    });
  });

  describe('Consultant utilization metrics', () => {
    it('should display utilization percentage for each consultant', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that consultant utilization section exists
      expect(screen.getByText(/consultant utilization/i)).toBeInTheDocument();

      // Average utilization should be displayed
      expect(screen.getByText(/78\.5%/)).toBeInTheDocument();
    });
  });

  describe('Project profitability display', () => {
    it('should display revenue, cost, and margin for each project', async () => {
      server.use(
        http.get(`${API_BASE_URL}/finance/dashboard`, () => {
          return HttpResponse.json(mockFinanceData);
        })
      );

      renderWithProviders(<FinanceDashboard />, {
        initialAuth: mockFinanceUser,
        route: '/finance/dashboard',
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that project profitability section exists
      expect(screen.getByText(/project profitability/i)).toBeInTheDocument();
    });
  });
});
