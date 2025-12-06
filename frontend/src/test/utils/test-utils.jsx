import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ValidationProvider } from '@/contexts/ValidationContext';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.initialAuth - Initial auth state
 * @param {string} options.route - Initial route
 * @param {Object} options.renderOptions - Additional render options
 * @returns {Object} Render result with additional utilities
 */
export function renderWithProviders(
  ui,
  {
    initialAuth = null,
    route = '/',
    ...renderOptions
  } = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <NotificationProvider>
          <ValidationProvider>
            <AuthProvider initialUser={initialAuth}>
              {children}
            </AuthProvider>
          </ValidationProvider>
        </NotificationProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Render component with only Router (no other providers)
 */
export function renderWithRouter(ui, { route = '/', ...renderOptions } = {}) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    role: 'consultant',
    roles: ['consultant'],
    active: true,
    ...overrides,
  };
}

/**
 * Create a mock consultant profile
 */
export function createMockProfile(overrides = {}) {
  return {
    id: 1,
    bio: 'Test bio',
    skills: ['JavaScript', 'React'],
    experience_years: 5,
    banking_details: {
      bank_name: 'Test Bank',
      account_number: '1234567890',
      branch_code: '051001',
    },
    ...overrides,
  };
}

/**
 * Create a mock project
 */
export function createMockProject(overrides = {}) {
  return {
    id: 1,
    name: 'Test Project',
    status: 'active',
    client_name: 'Test Client',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    assigned_consultants: [],
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 * @param {Object} expect - Vitest expect function
 */
export async function waitForLoadingToFinish(expect) {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
  });
}

/**
 * Simulate form input
 */
export async function fillForm(fields) {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();

  for (const [name, value] of Object.entries(fields)) {
    const input = document.querySelector(`[name="${name}"]`);
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}

/**
 * Mock console methods to suppress expected errors in tests
 * Note: Import beforeAll and afterAll from vitest in your test file
 * @param {Function} beforeAll - Vitest beforeAll function
 * @param {Function} afterAll - Vitest afterAll function
 */
export function suppressConsoleErrors(beforeAll, afterAll) {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Warning: ReactDOM.render') ||
          args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    console.warn = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('componentWillReceiveProps')
      ) {
        return;
      }
      originalWarn.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
