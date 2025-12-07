import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  announceToScreenReader,
  isFocusable,
  getFocusableElements,
  generateA11yId,
  getContrastRatio,
  meetsWCAGAA,
  prefersReducedMotion,
  getAnimationDuration,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('announceToScreenReader', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    afterEach(() => {
      vi.clearAllTimers();
    });

    it('should create an announcement element', () => {
      announceToScreenReader('Test message', 'polite');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement.textContent).toBe('Test message');
      expect(announcement.getAttribute('aria-live')).toBe('polite');
      expect(announcement.getAttribute('aria-atomic')).toBe('true');
    });

    it('should use assertive priority when specified', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[role="status"]');
      expect(announcement.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('isFocusable', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should return true for focusable button', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      Object.defineProperty(button, 'offsetParent', { value: document.body });

      expect(isFocusable(button)).toBe(true);
    });

    it('should return false for disabled button', () => {
      const button = document.createElement('button');
      button.disabled = true;
      document.body.appendChild(button);
      Object.defineProperty(button, 'offsetParent', { value: document.body });

      expect(isFocusable(button)).toBe(false);
    });

    it('should return true for link with href', () => {
      const link = document.createElement('a');
      link.href = '#';
      document.body.appendChild(link);
      Object.defineProperty(link, 'offsetParent', { value: document.body });

      expect(isFocusable(link)).toBe(true);
    });

    it('should return false for null element', () => {
      expect(isFocusable(null)).toBe(false);
    });
  });

  describe('getFocusableElements', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should return all focusable elements in container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <a href="#">Link</a>
        <input type="text" />
        <button disabled>Disabled</button>
      `;
      document.body.appendChild(container);

      // Mock offsetParent for all children
      Array.from(container.children).forEach(child => {
        Object.defineProperty(child, 'offsetParent', { value: document.body });
      });

      const focusable = getFocusableElements(container);
      expect(focusable.length).toBe(3); // Excludes disabled button
    });

    it('should return empty array for null container', () => {
      expect(getFocusableElements(null)).toEqual([]);
    });
  });

  describe('generateA11yId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateA11yId();
      const id2 = generateA11yId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^a11y-/);
    });

    it('should use custom prefix', () => {
      const id = generateA11yId('custom');
      expect(id).toMatch(/^custom-/);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('should calculate contrast ratio for gray colors', () => {
      const ratio = getContrastRatio('#767676', '#FFFFFF');
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass for sufficient contrast (normal text)', () => {
      expect(meetsWCAGAA('#000000', '#FFFFFF')).toBe(true);
      expect(meetsWCAGAA('#767676', '#FFFFFF')).toBe(true);
    });

    it('should fail for insufficient contrast (normal text)', () => {
      expect(meetsWCAGAA('#AAAAAA', '#FFFFFF')).toBe(false);
    });

    it('should pass for large text with lower contrast', () => {
      expect(meetsWCAGAA('#767676', '#FFFFFF', true)).toBe(true);
    });

    it('should fail for large text with very low contrast', () => {
      expect(meetsWCAGAA('#CCCCCC', '#FFFFFF', true)).toBe(false);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should check media query for reduced motion', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      window.matchMedia = mockMatchMedia;

      const result = prefersReducedMotion();

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(result).toBe(true);
    });
  });

  describe('getAnimationDuration', () => {
    it('should return 0 when reduced motion is preferred', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
      });
      window.matchMedia = mockMatchMedia;

      expect(getAnimationDuration(300)).toBe(0);
    });

    it('should return default duration when reduced motion is not preferred', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: false,
      });
      window.matchMedia = mockMatchMedia;

      expect(getAnimationDuration(300)).toBe(300);
    });
  });
});
