import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMediaQuery from '../useMediaQuery';

describe('useMediaQuery Hook', () => {
  let matchMediaMock;

  beforeEach(() => {
    // Create a mock for window.matchMedia
    matchMediaMock = vi.fn();
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return true when media query matches', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(min-width: 768px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(true);
    });

    it('should return false when media query does not match', () => {
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);
    });
  });

  describe('Media Query Changes', () => {
    it('should update when media query match changes', () => {
      const listeners = [];
      const addListener = vi.fn((event, handler) => {
        listeners.push(handler);
      });
      const removeListener = vi.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        addEventListener: addListener,
        removeEventListener: removeListener,
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        listeners.forEach(handler => handler({ matches: true }));
      });

      expect(result.current).toBe(true);
    });
  });

  describe('Common Breakpoints', () => {
    it('should work with mobile breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(max-width: 640px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));
      expect(result.current).toBe(true);
    });

    it('should work with tablet breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(min-width: 768px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(true);
    });

    it('should work with desktop breakpoint', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(min-width: 1024px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
      expect(result.current).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeListener = vi.fn();
      matchMediaMock.mockReturnValue({
        matches: false,
        media: '(min-width: 768px)',
        addEventListener: vi.fn(),
        removeEventListener: removeListener,
      });

      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      unmount();

      expect(removeListener).toHaveBeenCalled();
    });
  });

  describe('Multiple Queries', () => {
    it('should handle multiple media queries independently', () => {
      const mobileQuery = '(max-width: 640px)';
      const desktopQuery = '(min-width: 1024px)';

      matchMediaMock.mockImplementation((query) => ({
        matches: query === mobileQuery,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result: mobileResult } = renderHook(() => useMediaQuery(mobileQuery));
      const { result: desktopResult } = renderHook(() => useMediaQuery(desktopQuery));

      expect(mobileResult.current).toBe(true);
      expect(desktopResult.current).toBe(false);
    });
  });

  describe('Orientation Queries', () => {
    it('should work with orientation queries', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(orientation: portrait)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(orientation: portrait)'));
      expect(result.current).toBe(true);
    });
  });

  describe('Preference Queries', () => {
    it('should work with prefers-color-scheme', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));
      expect(result.current).toBe(true);
    });

    it('should work with prefers-reduced-motion', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));
      expect(result.current).toBe(true);
    });
  });
});
