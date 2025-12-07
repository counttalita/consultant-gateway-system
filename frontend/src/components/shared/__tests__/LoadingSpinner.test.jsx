import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/test-utils';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render loading spinner', () => {
      renderWithProviders(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have default aria-label', () => {
      renderWithProviders(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    });

    it('should accept custom label', () => {
      renderWithProviders(<LoadingSpinner label="Processing..." />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Processing...');
    });

    it('should show label text when showLabel is true', () => {
      renderWithProviders(<LoadingSpinner showLabel label="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should not show label text by default', () => {
      renderWithProviders(<LoadingSpinner label="Loading..." />);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should apply small size class', () => {
      renderWithProviders(<LoadingSpinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('should apply medium size class by default', () => {
      renderWithProviders(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('should apply large size class', () => {
      renderWithProviders(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });

    it('should apply extra large size class', () => {
      renderWithProviders(<LoadingSpinner size="xl" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-16', 'w-16');
    });
  });

  describe('Colors', () => {
    it('should apply blue color by default', () => {
      renderWithProviders(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-blue-600');
    });

    it('should apply gray color', () => {
      renderWithProviders(<LoadingSpinner color="gray" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-gray-600');
    });

    it('should apply white color', () => {
      renderWithProviders(<LoadingSpinner color="white" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-white');
    });

    it('should apply green color', () => {
      renderWithProviders(<LoadingSpinner color="green" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-green-600');
    });

    it('should apply red color', () => {
      renderWithProviders(<LoadingSpinner color="red" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-red-600');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      renderWithProviders(<LoadingSpinner className="custom-spinner" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-spinner');
    });

    it('should merge custom className with default classes', () => {
      renderWithProviders(<LoadingSpinner className="custom-spinner" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-spinner');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      renderWithProviders(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label for screen readers', () => {
      renderWithProviders(<LoadingSpinner label="Loading content" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should be announced to screen readers', () => {
      renderWithProviders(<LoadingSpinner label="Please wait" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Please wait');
    });
  });

  describe('Animation', () => {
    it('should have spin animation class', () => {
      renderWithProviders(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
