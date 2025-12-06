import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/test-utils';
import ValidationMessage from '../ValidationMessage';

describe('ValidationMessage Component', () => {
  describe('Rendering', () => {
    it('should not render when no message is provided', () => {
      renderWithProviders(<ValidationMessage />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should render error message', () => {
      renderWithProviders(<ValidationMessage message="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should render with error type by default', () => {
      renderWithProviders(<ValidationMessage message="Error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-red-600');
    });
  });

  describe('Message Types', () => {
    it('should render error type with red styling', () => {
      renderWithProviders(<ValidationMessage message="Error" type="error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-red-600');
    });

    it('should render warning type with yellow styling', () => {
      renderWithProviders(<ValidationMessage message="Warning" type="warning" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-yellow-600');
    });

    it('should render success type with green styling', () => {
      renderWithProviders(<ValidationMessage message="Success" type="success" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-green-600');
    });

    it('should render info type with blue styling', () => {
      renderWithProviders(<ValidationMessage message="Info" type="info" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('text-blue-600');
    });
  });

  describe('Icons', () => {
    it('should show error icon for error type', () => {
      const { container } = renderWithProviders(<ValidationMessage message="Error" type="error" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show warning icon for warning type', () => {
      const { container } = renderWithProviders(<ValidationMessage message="Warning" type="warning" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show success icon for success type', () => {
      const { container } = renderWithProviders(<ValidationMessage message="Success" type="success" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show info icon for info type', () => {
      const { container } = renderWithProviders(<ValidationMessage message="Info" type="info" />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" for error messages', () => {
      renderWithProviders(<ValidationMessage message="Error" type="error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have role="alert" for success messages', () => {
      renderWithProviders(<ValidationMessage message="Success" type="success" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have role="alert" for info messages', () => {
      renderWithProviders(<ValidationMessage message="Info" type="info" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should be announced to screen readers', () => {
      renderWithProviders(<ValidationMessage message="Important error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Important error');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      renderWithProviders(<ValidationMessage message="Error" className="custom-validation" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-validation');
    });

    it('should merge custom className with default classes', () => {
      renderWithProviders(<ValidationMessage message="Error" className="custom-validation" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-validation');
      expect(alert).toHaveClass('text-sm');
    });
  });

  describe('Message Content', () => {
    it('should render simple string message', () => {
      renderWithProviders(<ValidationMessage message="Simple error" />);
      expect(screen.getByText('Simple error')).toBeInTheDocument();
    });

    it('should render message with special characters', () => {
      renderWithProviders(<ValidationMessage message="Error: Invalid email@domain.com" />);
      expect(screen.getByText(/error: invalid email@domain\.com/i)).toBeInTheDocument();
    });

    it('should render long messages', () => {
      const longMessage = 'This is a very long error message that should still be displayed correctly without any issues';
      renderWithProviders(<ValidationMessage message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when message is empty string', () => {
      renderWithProviders(<ValidationMessage message="" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not render when message is null', () => {
      renderWithProviders(<ValidationMessage message={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not render when message is undefined', () => {
      renderWithProviders(<ValidationMessage message={undefined} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should render when message is "0"', () => {
      renderWithProviders(<ValidationMessage message="0" />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
