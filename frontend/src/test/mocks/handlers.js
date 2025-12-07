import { http, HttpResponse } from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/request_otp`, () => {
    return HttpResponse.json({
      message: 'OTP sent successfully',
    });
  }),

  http.post(`${API_BASE_URL}/auth/validate_otp`, () => {
    return HttpResponse.json({
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'consultant',
        roles: ['consultant'],
      },
      session_token: 'mock-session-token',
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      message: 'Logged out successfully',
    });
  }),

  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      role: 'consultant',
      roles: ['consultant'],
    });
  }),

  // Profile endpoints
  http.get(`${API_BASE_URL}/profiles/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      bio: 'Test bio',
      skills: ['JavaScript', 'React'],
      banking_details: {
        bank_name: 'Test Bank',
        account_number: '1234567890',
        branch_code: '051001',
      },
    });
  }),

  http.put(`${API_BASE_URL}/profiles/:id`, () => {
    return HttpResponse.json({
      message: 'Profile updated successfully',
    });
  }),

  // CV Upload
  http.post(`${API_BASE_URL}/cv_uploads`, () => {
    return HttpResponse.json({
      data: {
        parsed_skills: ['JavaScript', 'React', 'Node.js'],
        parsed_experience: ['5 years of web development'],
        parsed_qualifications: ['BSc Computer Science'],
      },
    });
  }),

  // Onboarding endpoints
  http.post(`${API_BASE_URL}/onboarding/initialize`, () => {
    return HttpResponse.json({
      steps: [
        { name: 'personal_info', completed: false },
        { name: 'banking', completed: false },
        { name: 'skills', completed: false },
        { name: 'contract', completed: false },
      ],
    });
  }),

  http.post(`${API_BASE_URL}/onboarding/complete_step`, () => {
    return HttpResponse.json({
      next_step: 'banking',
    });
  }),

  // Availability endpoints
  http.get(`${API_BASE_URL}/availability`, () => {
    return HttpResponse.json({
      status: 'available',
      utilization: 75,
      projects: [
        {
          id: 1,
          name: 'Test Project',
          allocated_hours: 40,
        },
      ],
    });
  }),

  http.put(`${API_BASE_URL}/availability`, () => {
    return HttpResponse.json({
      message: 'Availability updated',
    });
  }),

  // Admin dashboard
  http.get(`${API_BASE_URL}/admin/dashboard`, () => {
    return HttpResponse.json({
      active_users: 50,
      recent_logins: 25,
      integration_health: {
        airtable: { status: 'healthy', last_sync: '2024-01-01T00:00:00Z', error_count_24h: 0 },
        xero: { status: 'healthy', last_sync: '2024-01-01T00:00:00Z', error_count_24h: 0 },
      },
      activity_trends: {
        logins_last_7_days: [10, 15, 20, 18, 22, 25, 30],
        profile_updates_last_7_days: [5, 8, 6, 10, 12, 9, 11],
      },
      error_summary: {
        critical: 0,
        warning: 2,
        info: 5,
      },
      data_quality: {
        incomplete_profiles: 5,
        pending_onboarding: 3,
      },
    });
  }),

  // Users management
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
      users: [
        {
          id: 1,
          email: 'user1@example.com',
          roles: ['consultant'],
          active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_count: 1,
      },
    });
  }),

  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      email: 'user@example.com',
      roles: ['consultant'],
      active: true,
      created_at: '2024-01-01T00:00:00Z',
    });
  }),

  http.put(`${API_BASE_URL}/users/:id/roles`, () => {
    return HttpResponse.json({
      message: 'Roles updated successfully',
    });
  }),

  // Finance dashboard
  http.get(`${API_BASE_URL}/finance/dashboard`, () => {
    return HttpResponse.json({
      current_month_revenue: 100000,
      revenue_trend: 5.2,
      outstanding_invoices: 25000,
      pending_payments: 15000,
      consultant_utilization: [
        {
          consultant_name: 'John Doe',
          billable_hours: 160,
          utilization: 80,
        },
      ],
      project_profitability: [
        {
          project_name: 'Project A',
          revenue: 50000,
          cost: 30000,
          margin: 40,
        },
      ],
    });
  }),

  // Projects
  http.get(`${API_BASE_URL}/projects`, () => {
    return HttpResponse.json({
      projects: [
        {
          id: 1,
          name: 'Test Project',
          status: 'active',
          client_name: 'Test Client',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/projects/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Project',
      status: 'active',
      client_name: 'Test Client',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      assigned_consultants: [],
      clickup_link: 'https://clickup.com/project/1',
      google_drive_link: 'https://drive.google.com/folder/1',
    });
  }),

  // Tenders
  http.get(`${API_BASE_URL}/tenders`, () => {
    return HttpResponse.json({
      tenders: [
        {
          id: 1,
          title: 'Test Tender',
          status: 'pending',
          bid_score: 85,
          bid_decision: 'bid',
        },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/tenders/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'Test Tender',
      status: 'pending',
      bid_score: 85,
      bid_decision: 'bid',
      description: 'Test tender description',
    });
  }),

  // Audit logs
  http.get(`${API_BASE_URL}/audit_logs`, () => {
    return HttpResponse.json({
      logs: [
        {
          id: 1,
          user_email: 'user@example.com',
          action: 'login',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
    });
  }),

  // System config
  http.get(`${API_BASE_URL}/config`, () => {
    return HttpResponse.json({
      config: {
        feature_flags: {
          new_feature: true,
        },
      },
    });
  }),

  http.put(`${API_BASE_URL}/config`, () => {
    return HttpResponse.json({
      message: 'Configuration updated',
    });
  }),
];
