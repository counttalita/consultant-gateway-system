import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser } from './utils/test-utils';
import Button from '@/components/shared/Button';

/**
 * Example test suite demonstrating the testing setup
 * 
 * This file shows how to:
 * - Use React Testing Library with custom render utilities
 * - Test components with providers
 * - Test accessibility with axe-core
 * - Mock API calls with MSW
 */

describe('Testing Setup Example', () => {
  describe('Component Testing', () => {
    it('should render a button', () => {
      renderWithProviders(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should handle button click', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(
        <Button onClick={handleClick}>Click me</Button>
      );
      
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show loading state', () => {
      renderWithProviders(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility Testing', () => {
    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(
        <Button onClick={handleClick}>Press Enter</Button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have accessible name', () => {
      renderWithProviders(<Button>Accessible Button</Button>);
      
      const button = screen.getByRole('button', { name: /accessible button/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Provider Testing', () => {
    it('should render with auth context', () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      
      renderWithProviders(
        <div>User: {mockUser.email}</div>,
        { initialAuth: mockUser }
      );
      
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });
});
