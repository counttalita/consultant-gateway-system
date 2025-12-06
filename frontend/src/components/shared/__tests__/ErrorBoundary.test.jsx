import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress console.error for these tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      renderWithProviders(
        <ErrorBoundary>
          <div>Child component</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child component')).toBeInTheDocument();
    });

    it('should not show error UI when no error', () => {
      renderWithProviders(
        <ErrorBoundary>
          <div>Child component</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should show default error message', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/we're sorry for the inconvenience/i)).toBeInTheDocument();
    });

    it('should show Try Again button', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should show Go Home button', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when Try Again is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;
      const ThrowErrorDynamic = () => {
        if (shouldThrow) throw new Error('Test error');
        return <div>No error</div>;
      };

      renderWithProviders(
        <ErrorBoundary>
          <ThrowErrorDynamic />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Change the condition so it won't throw on next render
      shouldThrow = false;

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should call onReset callback when provided', async () => {
      const onReset = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback UI', () => {
      const customFallback = ({ error, resetError }) => (
        <div>
          <h1>Custom Error</h1>
          <p>{error.message}</p>
          <button onClick={resetError}>Reset</button>
        </div>
      );

      renderWithProviders(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should allow custom fallback to reset error', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;
      const ThrowErrorDynamic = () => {
        if (shouldThrow) throw new Error('Test error');
        return <div>No error</div>;
      };

      const customFallback = ({ resetError }) => (
        <button onClick={resetError}>Custom Reset</button>
      );

      renderWithProviders(
        <ErrorBoundary fallback={customFallback}>
          <ThrowErrorDynamic />
        </ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /custom reset/i });

      // Change condition before reset
      shouldThrow = false;
      await user.click(resetButton);

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log error when caught', () => {
      const loggerSpy = vi.spyOn(console, 'error');

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });

  describe('Named Error Boundaries', () => {
    it('should accept name prop for identification', () => {
      renderWithProviders(
        <ErrorBoundary name="TestBoundary">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Children', () => {
    it('should catch errors from any child', () => {
      renderWithProviders(
        <ErrorBoundary>
          <div>First child</div>
          <ThrowError shouldThrow={true} />
          <div>Third child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('First child')).not.toBeInTheDocument();
    });
  });

  describe('Nested Error Boundaries', () => {
    it('should catch errors at the nearest boundary', () => {
      renderWithProviders(
        <ErrorBoundary name="Outer">
          <div>Outer content</div>
          <ErrorBoundary name="Inner">
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      // Outer content should still be visible
      expect(screen.getByText('Outer content')).toBeInTheDocument();
    });
  });

  describe('Error Icon', () => {
    it('should display error icon', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { name: /something went wrong/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });
  });
});
