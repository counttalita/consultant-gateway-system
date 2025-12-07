import { useEffect, useRef, useState } from 'react';
import { announceToScreenReader } from '../utils/accessibility';

/**
 * useAccessibility - Comprehensive accessibility hook
 * Provides utilities for managing focus, announcements, and keyboard navigation
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFocus - Whether to auto-focus the element on mount
 * @param {string} options.announcement - Message to announce on mount
 * @param {Object} options.keyboardShortcuts - Keyboard shortcuts to register
 * @returns {Object} - Accessibility utilities
 */
export const useAccessibility = (options = {}) => {
  const {
    autoFocus = false,
    announcement = null,
    keyboardShortcuts = {},
  } = options;

  const elementRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [autoFocus]);

  // Announce on mount
  useEffect(() => {
    if (announcement) {
      announceToScreenReader(announcement);
    }
  }, [announcement]);

  // Register keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      Object.entries(keyboardShortcuts).forEach(([key, handler]) => {
        const keys = key.split('+').map(k => k.trim().toLowerCase());
        const eventKey = event.key.toLowerCase();
        
        const modifiersMatch = 
          (!keys.includes('ctrl') || event.ctrlKey || event.metaKey) &&
          (!keys.includes('alt') || event.altKey) &&
          (!keys.includes('shift') || event.shiftKey);
        
        const mainKey = keys.find(k => !['ctrl', 'alt', 'shift'].includes(k));
        
        if (modifiersMatch && eventKey === mainKey) {
          event.preventDefault();
          handler(event);
        }
      });
    };

    if (Object.keys(keyboardShortcuts).length > 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [keyboardShortcuts]);

  return {
    ref: elementRef,
    announce: announceToScreenReader,
  };
};

/**
 * useAriaLive - Hook for managing ARIA live regions
 * 
 * @param {string} initialMessage - Initial message to announce
 * @param {string} politeness - 'polite' or 'assertive'
 * @returns {Function} - Function to update the announcement
 */
export const useAriaLive = (initialMessage = '', politeness = 'polite') => {
  const liveRegionRef = useRef(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', politeness);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    // Set initial message
    if (initialMessage && liveRegionRef.current) {
      liveRegionRef.current.textContent = initialMessage;
    }

    // Cleanup
    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, [initialMessage, politeness]);

  const announce = (message) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  };

  return announce;
};

/**
 * useSkipLink - Hook for managing skip links
 * 
 * @param {string} targetId - ID of the target element to skip to
 * @returns {Object} - Skip link props
 */
export const useSkipLink = (targetId = 'main-content') => {
  const handleSkip = (event) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return {
    href: `#${targetId}`,
    onClick: handleSkip,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg',
  };
};

/**
 * useReducedMotion - Hook to detect user's motion preference
 * 
 * @returns {boolean} - Whether user prefers reduced motion
 */
export const useReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  useEffect(() => {
    const handleChange = () => {
      // Re-render when preference changes
    };
    
    prefersReducedMotion.addEventListener('change', handleChange);
    return () => prefersReducedMotion.removeEventListener('change', handleChange);
  }, [prefersReducedMotion]);
  
  return prefersReducedMotion.matches;
};

/**
 * useAriaExpanded - Hook for managing aria-expanded state
 * 
 * @param {boolean} initialExpanded - Initial expanded state
 * @returns {Object} - Expanded state and toggle function
 */
export const useAriaExpanded = (initialExpanded = false) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  const toggle = () => setIsExpanded(prev => !prev);
  
  return {
    'aria-expanded': isExpanded,
    isExpanded,
    toggle,
  };
};

export default useAccessibility;
