# Consultant Gateway Frontend

A modern React-based user interface for the Consultant Gateway System, built with React 19, Vite, and Tailwind CSS.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)

## Overview

The Consultant Gateway Frontend provides role-specific interfaces for consultants, administrators, and finance users. It features:

- **OTP-based authentication** with role-based routing
- **Consultant features**: Profile management, CV upload with parsing, onboarding wizard, availability management
- **Admin features**: System dashboard, user management, talent pool, projects, tenders, audit logs
- **Finance features**: Financial dashboard, month-end processing, SimplePay exports, revenue tracking
- **Responsive design** optimized for mobile, tablet, and desktop
- **Accessibility-first** approach with WCAG 2.1 AA compliance
- **Comprehensive error handling** with user-friendly feedback

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with interceptors
- **Lucide React** - Icon library
- **Vitest** - Unit and integration testing
- **React Testing Library** - Component testing
- **MSW** - API mocking for tests

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see main project README)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.development

# Update API base URL in .env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── consultant/     # Consultant-specific components
│   ├── finance/        # Finance-specific components
│   ├── forms/          # Form components
│   ├── onboarding/     # Onboarding wizard steps
│   └── shared/         # Shared/common components
├── contexts/           # React Context providers
│   ├── AuthContext.jsx
│   ├── NotificationContext.jsx
│   └── ValidationContext.jsx
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── pages/              # Page components (routes)
│   ├── admin/
│   ├── auth/
│   ├── consultant/
│   └── finance/
├── services/           # API service modules
├── test/               # Test utilities and mocks
│   ├── integration/    # Integration tests
│   ├── mocks/          # MSW handlers
│   └── utils/          # Test helpers
├── utils/              # Utility functions
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI
- `npm run test:coverage` - Generate coverage report

### Code Style

The project uses ESLint and Prettier for code formatting:

- ESLint configuration: `eslint.config.js`
- Prettier configuration: `.prettierrc`

Run `npm run lint` to check for issues.

### Environment Variables

Create `.env.development` and `.env.production` files:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENABLE_MOCK_API=false
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Open test UI
npm run test:ui
```

### Test Structure

- **Unit tests**: Located alongside components (`*.test.jsx`)
- **Integration tests**: Located in `src/test/integration/`
- **Test utilities**: Located in `src/test/utils/`

### Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

See [Testing Guide](./docs/TESTING.md) for more details.

## Deployment

### Build Process

```bash
# Production build
npm run build

# Output will be in dist/ directory
```

### Environment Configuration

Set the following environment variables for production:

- `VITE_API_BASE_URL` - Backend API URL

### Deployment Platforms

The application can be deployed to:

- **Vercel** - Recommended for React apps
- **Netlify** - Alternative with similar features
- **AWS S3 + CloudFront** - For AWS infrastructure
- **Docker** - See Dockerfile in project root

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## Documentation

Additional documentation is available in the `docs/` directory:

- [Component API](./docs/COMPONENTS.md) - Component props and usage
- [Custom Hooks](./docs/HOOKS.md) - Custom hooks documentation
- [Style Guide](./docs/STYLE_GUIDE.md) - Design system and styling
- [Testing Guide](./docs/TESTING.md) - Testing best practices
- [User Guides](./docs/USER_GUIDES.md) - Role-specific user guides

## Architecture

### Authentication Flow

1. User enters email on login page
2. Backend sends OTP to email
3. User enters OTP code
4. Backend validates and returns session token
5. Token stored in localStorage
6. User redirected based on role (consultant/admin/finance)

### State Management

- **AuthContext** - User authentication state
- **NotificationContext** - Toast notifications
- **ValidationContext** - Form validation state
- Local component state with useState/useReducer

### API Communication

All API calls go through service modules in `src/services/`:

```javascript
import consultantService from '@/services/consultant.service';

const profile = await consultantService.getProfile(userId);
```

Services use Axios with interceptors for:
- Adding authentication headers
- Handling errors globally
- Retry logic with exponential backoff

### Error Handling

Errors are handled at multiple levels:

1. **API Interceptors** - Global error handling
2. **Error Boundaries** - Catch React errors
3. **Service Layer** - Transform API errors
4. **Component Level** - Display user-friendly messages

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linting and tests
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team or create an issue in the project repository.
