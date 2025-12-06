/**
 * Accessibility Utilities
 * Helper functions for improving accessibility across the application
 * Meets WCAG 2.1 AA standards
 */

/**
 * Announce message to screen readers using ARIA live region
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if an element is visible and focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
export const isFocusable = (element) => {
  if (!element) return false;
  
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  
  const matches = focusableSelectors.some(selector => 
    element.matches(selector)
  );
  
  return matches && element.offsetParent !== null;
};

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {Array<HTMLElement>}
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  
  return Array.from(
    container.querySelectorAll(focusableSelectors.join(','))
  ).filter(el => el.offsetParent !== null);
};

/**
 * Generate a unique ID for accessibility attributes
 * @param {string} prefix - Prefix for the ID
 * @returns {string}
 */
export const generateA11yId = (prefix = 'a11y') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check color contrast ratio (simplified)
 * For full WCAG compliance, use a proper contrast checker library
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} - Contrast ratio
 */
export const getContrastRatio = (foreground, background) => {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast meets WCAG AA standards
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {boolean} largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {boolean}
 */
export const meetsWCAGAA = (foreground, background, largeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Add keyboard navigation to a list of items
 * @param {Array<HTMLElement>} items - List items
 * @param {number} currentIndex - Currently focused index
 * @param {Function} onSelect - Callback when item is selected
 * @returns {Function} - Keyboard event handler
 */
export const createKeyboardNavigationHandler = (items, currentIndex, onSelect) => {
  return (event) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return;
      default:
        return;
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }
  };
};

/**
 * Manage focus for roving tabindex pattern
 * Useful for toolbars, menus, and other composite widgets
 * @param {Array<HTMLElement>} elements - Elements to manage
 * @param {number} activeIndex - Currently active index
 */
export const manageRovingTabindex = (elements, activeIndex) => {
  elements.forEach((element, index) => {
    if (index === activeIndex) {
      element.setAttribute('tabindex', '0');
    } else {
      element.setAttribute('tabindex', '-1');
    }
  });
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get appropriate animation duration based on user preference
 * @param {number} defaultDuration - Default duration in ms
 * @returns {number} - Duration in ms (0 if reduced motion preferred)
 */
export const getAnimationDuration = (defaultDuration) => {
  return prefersReducedMotion() ? 0 : defaultDuration;
};
