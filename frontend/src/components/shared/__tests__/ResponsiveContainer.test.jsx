import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/test-utils';
import ResponsiveContainer from '../ResponsiveContainer';

describe('ResponsiveContainer Component', () => {
  let matchMediaMock;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  describe('Rendering', () => {
    it('should render children', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      renderWithProviders(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should apply responsive classes', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = renderWithProviders(
        <ResponsiveContainer>Content</ResponsiveContainer>
      );
      const wrapper = container.querySelector('[class*="w-full"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Responsive Padding', () => {
    it('should apply responsive padding', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = renderWithProviders(
        <ResponsiveContainer>Content</ResponsiveContainer>
      );
      const wrapper = container.querySelector('[class*="px-4"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Fallback Rendering', () => {
    it('should render children when no specific breakpoint content is provided', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      renderWithProviders(
        <ResponsiveContainer>
          <div>Default Content</div>
        </ResponsiveContainer>
      );
      expect(screen.getByText('Default Content')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = renderWithProviders(
        <ResponsiveContainer className="custom-container">
          Content
        </ResponsiveContainer>
      );
      expect(container.firstChild).toHaveClass('custom-container');
    });
  });

  describe('Max Width', () => {
    it('should apply max width classes', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { container } = renderWithProviders(
        <ResponsiveContainer maxWidth="lg">Content</ResponsiveContainer>
      );
      const wrapper = container.querySelector('[class*="max-w-lg"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility across breakpoints', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      renderWithProviders(
        <ResponsiveContainer>
          <button>Accessible Button</button>
        </ResponsiveContainer>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
