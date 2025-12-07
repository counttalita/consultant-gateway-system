import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import Card from '../Card';

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render card with children', () => {
      renderWithProviders(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      renderWithProviders(<Card title="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render without title', () => {
      renderWithProviders(<Card>Content</Card>);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render with subtitle', () => {
      renderWithProviders(<Card title="Title" subtitle="Subtitle">Content</Card>);
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('should render with footer', () => {
      renderWithProviders(
        <Card footer={<button>Action</button>}>Content</Card>
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should render title and content', () => {
      renderWithProviders(
        <Card title="Title">Content</Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply default styling', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.querySelector('article');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
    });

    it('should apply shadow styling', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.querySelector('article');
      expect(card).toHaveClass('shadow');
    });
  });

  describe('Padding', () => {
    it('should have default padding', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const bodyDiv = container.querySelector('[class*="p-4"]');
      expect(bodyDiv).toBeInTheDocument();
    });

    it('should apply no padding when padding is none', () => {
      renderWithProviders(<Card padding="none">Content</Card>);
      const content = screen.getByText('Content');
      expect(content.parentElement).not.toHaveClass('p-4');
    });
  });

  describe('Interactive Cards', () => {
    it('should be clickable when onClick is provided', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      const { container } = renderWithProviders(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = container.querySelector('article');
      
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have hover effect', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.querySelector('article');
      expect(card).toHaveClass('hover:shadow-md');
    });
  });

  describe('Content Display', () => {
    it('should show content', () => {
      renderWithProviders(<Card>Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const { container } = renderWithProviders(<Card className="custom-card">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-card');
    });

    it('should merge custom className with default classes', () => {
      const { container } = renderWithProviders(<Card className="custom-card">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('rounded-lg');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure when title is provided', () => {
      renderWithProviders(<Card title="Card Title">Content</Card>);
      const heading = screen.getByRole('heading', { name: /card title/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const { container } = renderWithProviders(<Card>Content</Card>);
      const card = container.querySelector('article');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Dividers', () => {
    it('should show divider between header and content', () => {
      const { container } = renderWithProviders(<Card title="Title">Content</Card>);
      const dividers = container.querySelectorAll('.border-b');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('should show divider between content and footer', () => {
      const { container } = renderWithProviders(
        <Card footer={<div>Footer</div>}>Content</Card>
      );
      const dividers = container.querySelectorAll('.border-t');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });
});
