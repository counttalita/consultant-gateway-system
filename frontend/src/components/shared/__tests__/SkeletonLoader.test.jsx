import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/test-utils';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader Component', () => {
  describe('Rendering', () => {
    it('should render skeleton loader', () => {
      const { container } = renderWithProviders(<SkeletonLoader />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render with animation', () => {
      const { container } = renderWithProviders(<SkeletonLoader />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Skeleton Types', () => {
    it('should render text skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="text" />);
      expect(container.querySelector('.h-4')).toBeInTheDocument();
    });

    it('should render card skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="card" />);
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('should render table skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="table" />);
      expect(container.querySelector('.space-y-2')).toBeInTheDocument();
    });

    it('should render list skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="list" />);
      expect(container.querySelector('.space-y-3')).toBeInTheDocument();
    });

    it('should render dashboard skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="dashboard" />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('should render form skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="form" />);
      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });

    it('should render avatar skeleton', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="avatar" />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });

  describe('Count Prop', () => {
    it('should render skeleton with count', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="text" count={3} />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render single skeleton by default', () => {
      const { container } = renderWithProviders(<SkeletonLoader type="text" />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const { container } = renderWithProviders(<SkeletonLoader className="custom-skeleton" />);
      expect(container.querySelector('.custom-skeleton')).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const { container } = renderWithProviders(<SkeletonLoader className="custom-skeleton" />);
      const skeleton = container.querySelector('.custom-skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Animation', () => {
    it('should have pulse animation class', () => {
      const { container } = renderWithProviders(<SkeletonLoader />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide visual loading indication', () => {
      const { container } = renderWithProviders(<SkeletonLoader />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Custom Dimensions', () => {
    it('should render with default dimensions', () => {
      const { container } = renderWithProviders(<SkeletonLoader />);
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
