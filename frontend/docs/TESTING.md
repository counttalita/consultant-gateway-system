# Testing Guide

Comprehensive guide to testing in the Consultant Gateway Frontend.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Testing Philosophy

Our testing approach follows these principles:

1. **Test behavior, not implementation** - Focus on what the component does, not how it does it
2. **Write tests that resemble how users interact** - Use Testing Library's user-centric queries
3. **Maintain test independence** - Each test should run in isolation
4. **Keep tests simple and readable** - Tests are documentation
5. **Balance coverage with maintainability** - Aim for meaningful coverage, not 100%

## Test Types

### Unit Tests

Test individual components and functions in isolation.

**Location:** Alongside the component (`ComponentName.test.jsx`)

**Example:**

```jsx
// Button.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Tests

Test how multiple components work together.

**Location:** `src/test/integration/`

**Example:**

```jsx
// auth.integration.test.jsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import Login from '../../pages/auth/Login';

describe('Authentication Flow', () => {
  it('completes full login flow', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    // Enter email
    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send code/i }));

    // Wait for OTP step
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter 6-digit code/i)).toBeInTheDocument();
    });

    // Enter OTP
    await user.type(screen.getByPlaceholderText(/enter 6-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests

Ensure components are accessible.

**Example:**

```jsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Running Tests

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- Button.test.jsx

# Run tests matching pattern
npm test -- --grep="authentication"
```

### Coverage Reports

Coverage reports are generated in `coverage/` directory:

```bash
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Writing Tests

### Test Structure

Follow the Arrange-Act-Assert pattern:

```jsx
it('updates profile when form is submitted', async () => {
  // Arrange - Set up test data and render
  const user = userEvent.setup();
  const mockProfile = { name: 'John Doe', email: 'john@example.com' };
  renderWithProviders(<ProfileForm profile={mockProfile} />);

  // Act - Perform user actions
  await user.clear(screen.getByLabelText(/name/i));
  await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
  await user.click(screen.getByRole('button', { name: /save/i }));

  // Assert - Verify expected outcomes
  await waitFor(() => {
    expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
  });
});
```

### Query Priority

Use queries in this order of preference:

1. **Accessible queries** (preferred)
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`

2. **Semantic queries**
   - `getByAltText`
   - `getByTitle`

3. **Test IDs** (last resort)
   - `getByTestId`

```jsx
// Good - Accessible queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email address/i);

// Avoid - Test IDs
screen.getByTestId('submit-button');
```

### Async Testing

Use `waitFor` for async operations:

```jsx
it('loads and displays data', async () => {
  renderWithProviders(<UserList />);

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  // Verify data is displayed
  expect(screen.getByText(/john doe/i)).toBeInTheDocument();
});
```

### User Interactions

Use `@testing-library/user-event` for realistic interactions:

```jsx
import userEvent from '@testing-library/user-event';

it('handles user input', async () => {
  const user = userEvent.setup();
  render(<SearchInput />);

  // Type text
  await user.type(screen.getByRole('textbox'), 'search query');

  // Click button
  await user.click(screen.getByRole('button', { name: /search/i }));

  // Select option
  await user.selectOptions(screen.getByRole('combobox'), 'option1');

  // Check checkbox
  await user.click(screen.getByRole('checkbox', { name: /agree/i }));
});
```

### Mocking API Calls

Use MSW (Mock Service Worker) for API mocking:

```jsx
// src/test/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/users', () => {
    return HttpResponse.json({
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' }
      ]
    });
  }),

  http.post('/api/v1/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 2,
      ...body
    }, { status: 201 });
  }),
];
```

Override handlers in tests:

```jsx
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

it('handles API error', async () => {
  // Override handler for this test
  server.use(
    http.get('/api/v1/users', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );

  renderWithProviders(<UserList />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

### Testing Context

Use `renderWithProviders` helper:

```jsx
// src/test/utils/test-utils.jsx
export function renderWithProviders(ui, options = {}) {
  const { initialAuth = null, route = '/', ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider initialUser={initialAuth}>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Usage
renderWithProviders(<MyComponent />, {
  initialAuth: { id: 1, email: 'test@example.com' },
  route: '/profile'
});
```

### Testing Hooks

Use `renderHook` from Testing Library:

```jsx
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

it('fetches data successfully', async () => {
  const { result } = renderHook(() => 
    useApi({ apiFunction: () => fetchUsers() })
  );

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual(mockUsers);
});
```

## Best Practices

### 1. Test User Behavior

```jsx
// Good - Tests what user sees and does
it('shows error when email is invalid', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText(/email/i), 'invalid-email');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});

// Avoid - Tests implementation details
it('sets error state when email is invalid', () => {
  const { result } = renderHook(() => useForm());
  act(() => {
    result.current.setFieldError('email', 'Invalid email');
  });
  expect(result.current.errors.email).toBe('Invalid email');
});
```

### 2. Use Descriptive Test Names

```jsx
// Good
it('displays validation error when email field is empty', () => {});
it('redirects to dashboard after successful login', () => {});

// Avoid
it('works correctly', () => {});
it('test 1', () => {});
```

### 3. Keep Tests Independent

```jsx
// Good - Each test is independent
describe('UserList', () => {
  it('displays users', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('filters users by name', () => {
    render(<UserList users={mockUsers} />);
    // Test filtering
  });
});

// Avoid - Tests depend on each other
describe('UserList', () => {
  let component;

  it('displays users', () => {
    component = render(<UserList users={mockUsers} />);
    // ...
  });

  it('filters users', () => {
    // Uses component from previous test
  });
});
```

### 4. Don't Test Implementation Details

```jsx
// Good - Tests behavior
it('shows loading spinner while fetching data', async () => {
  render(<UserList />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

// Avoid - Tests internal state
it('sets loading state to true', () => {
  const { result } = renderHook(() => useUsers());
  expect(result.current.loading).toBe(true);
});
```

### 5. Use Appropriate Assertions

```jsx
// Good - Specific assertions
expect(screen.getByRole('button')).toBeEnabled();
expect(screen.getByText('Success')).toBeVisible();

// Avoid - Generic assertions
expect(screen.getByRole('button')).toBeTruthy();
expect(screen.getByText('Success')).not.toBeNull();
```

## Common Patterns

### Testing Forms

```jsx
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();
  
  render(<ContactForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/name/i), 'John Doe');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.type(screen.getByLabelText(/message/i), 'Hello world');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world'
    });
  });
});
```

### Testing Modals

```jsx
it('opens and closes modal', async () => {
  const user = userEvent.setup();
  render(<ModalExample />);

  // Modal should not be visible initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // Open modal
  await user.click(screen.getByRole('button', { name: /open modal/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Close modal
  await user.click(screen.getByRole('button', { name: /close/i }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

### Testing Navigation

```jsx
it('navigates to profile page when link is clicked', async () => {
  const user = userEvent.setup();
  renderWithProviders(<Navigation />, { route: '/' });

  await user.click(screen.getByRole('link', { name: /profile/i }));

  await waitFor(() => {
    expect(window.location.pathname).toBe('/profile');
  });
});
```

### Testing Error States

```jsx
it('displays error message when API call fails', async () => {
  server.use(
    http.get('/api/v1/users', () => {
      return HttpResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    })
  );

  renderWithProviders(<UserList />);

  await waitFor(() => {
    expect(screen.getByText(/failed to fetch users/i)).toBeInTheDocument();
  });
});
```

## Debugging Tests

### View Rendered Output

```jsx
import { screen } from '@testing-library/react';

// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Use Testing Playground

```jsx
import { screen } from '@testing-library/react';

// Get suggested queries
screen.logTestingPlaygroundURL();
```

### Check Available Queries

```jsx
// See all available roles
screen.getByRole(''); // Will show error with available roles

// See all text content
screen.getByText(''); // Will show error with available text
```

## Resources

- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
