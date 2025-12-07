import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import Button from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      renderWithProviders(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const { rerender } = renderWithProviders(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
    });

    it('should render with different sizes', () => {
      const { rerender } = renderWithProviders(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3');

      rerender(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-4');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-6');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      renderWithProviders(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button loading onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button disabled onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle space key press', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Button Types', () => {
    it('should default to type="button"', () => {
      renderWithProviders(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should support type="submit"', () => {
      renderWithProviders(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should support type="reset"', () => {
      renderWithProviders(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      renderWithProviders(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      renderWithProviders(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name', () => {
      renderWithProviders(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button', { name: /accessible button/i })).toBeInTheDocument();
    });

    it('should announce loading state to screen readers', () => {
      renderWithProviders(<Button loading>Loading</Button>);
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    it('should have proper aria attributes when disabled', () => {
      renderWithProviders(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
