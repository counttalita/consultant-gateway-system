/**
 * Mock data for development and testing
 * Used when VITE_USE_MOCK_API is enabled
 */

export const mockUsers = [
  {
    id: 1,
    email: 'consultant@example.com',
    role: 'consultant',
    roles: ['consultant'],
    active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'admin@example.com',
    role: 'admin',
    roles: ['admin'],
    active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    email: 'finance@example.com',
    role: 'finance',
    roles: ['finance'],
    active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const mockProfiles = {
  1: {
    id: 1,
    user_id: 1,
    full_name: 'John Consultant',
    bio: 'Experienced software consultant',
    skills: ['JavaScript', 'React', 'Node.js'],
    availability_status: 'available',
    banking_details: {
      bank_name: 'Standard Bank',
      account_number: '1234567890',
      branch_code: '051001'
    }
  }
};

export const mockProjects = [
  {
    id: 1,
    name: 'Project Alpha',
    client_name: 'Acme Corp',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    clickup_link: 'https://clickup.com/project/1',
    google_drive_link: 'https://drive.google.com/folder/1',
    assignments: []
  },
  {
    id: 2,
    name: 'Project Beta',
    client_name: 'Tech Inc',
    status: 'setup',
    start_date: '2024-02-01',
    end_date: '2024-11-30',
    clickup_link: 'https://clickup.com/project/2',
    google_drive_link: 'https://drive.google.com/folder/2',
    assignments: []
  }
];

export const mockTenders = [
  {
    id: 1,
    title: 'Software Development Services',
    description: 'Full stack development for enterprise application',
    bid_decision: 'pending',
    bid_score: 85,
    deadline: '2024-06-30',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    title: 'Cloud Infrastructure Setup',
    description: 'AWS infrastructure design and implementation',
    bid_decision: 'pursue',
    bid_score: 92,
    deadline: '2024-07-15',
    created_at: '2024-01-20T00:00:00Z'
  }
];

export const mockDashboard = {
  active_users: 25,
  recent_logins: 15,
  integration_health: {
    airtable: { status: 'healthy', last_sync: '2024-01-01T12:00:00Z', error_count_24h: 0 },
    clickup: { status: 'healthy', last_sync: '2024-01-01T12:00:00Z', error_count_24h: 0 },
    xero: { status: 'degraded', last_sync: '2024-01-01T10:00:00Z', error_count_24h: 2 },
    harvest: { status: 'healthy', last_sync: '2024-01-01T12:00:00Z', error_count_24h: 0 }
  },
  activity_trends: {
    logins_last_7_days: [10, 12, 15, 13, 14, 16, 15],
    profile_updates_last_7_days: [5, 3, 7, 4, 6, 5, 8]
  },
  error_summary: {
    critical: 0,
    high: 2,
    medium: 5,
    low: 10
  },
  data_quality: {
    incomplete_profiles: 3,
    pending_onboarding: 2
  }
};

export const mockFinanceDashboard = {
  current_month_revenue: 125000,
  revenue_trend: 5.2,
  outstanding_invoices: 45000,
  pending_payments: 32000,
  consultant_utilization: [
    { consultant_name: 'John Doe', billable_hours: 160, utilization: 95 },
    { consultant_name: 'Jane Smith', billable_hours: 140, utilization: 82 }
  ],
  project_profitability: [
    { project_name: 'Project Alpha', revenue: 50000, cost: 35000, margin: 30 },
    { project_name: 'Project Beta', revenue: 75000, cost: 45000, margin: 40 }
  ]
};

export const mockOnboardingStatus = {
  steps: [
    { name: 'personal_info', completed: false, order: 1 },
    { name: 'banking', completed: false, order: 2 },
    { name: 'skills', completed: false, order: 3 },
    { name: 'contract', completed: false, order: 4 },
    { name: 'welcome', completed: false, order: 5 }
  ],
  current_step: 'personal_info'
};

export const mockAuditLogs = [
  {
    id: 1,
    user_email: 'admin@example.com',
    action: 'user.update',
    details: { user_id: 5, changes: ['role'] },
    created_at: '2024-01-01T12:00:00Z'
  },
  {
    id: 2,
    user_email: 'consultant@example.com',
    action: 'profile.update',
    details: { profile_id: 1, changes: ['bio', 'skills'] },
    created_at: '2024-01-01T11:30:00Z'
  }
];

/**
 * Simulate API delay
 */
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate mock response with pagination
 */
export const mockPaginatedResponse = (data, page = 1, perPage = 10) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_pages: Math.ceil(data.length / perPage),
      total_count: data.length
    }
  };
};
