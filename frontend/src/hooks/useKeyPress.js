import { useState, useEffect, useCallback } from 'react';

/**
 * useKeyPress - Hook to detect when a specific key is pressed
 * 
 * @param {string|string[]} targetKey - Key(s) to listen for (e.g., 'Enter', 'Escape', ['Control', 's'])
 * @param {Object} options - Configuration options
 * @param {Function} options.onKeyDown - Callback when key is pressed down
 * @param {Function} options.onKeyUp - Callback when key is released
 * @param {boolean} options.preventDefault - Whether to prevent default behavior (default: false)
 * @param {HTMLElement} options.target - Target element to listen on (default: window)
 * @returns {boolean} - Whether the key is currently pressed
 * 
 * @example
 * // Simple key detection
 * const enterPressed = useKeyPress('Enter');
 * 
 * @example
 * // With callback
 * useKeyPress('Escape', {
 *   onKeyDown: () => closeModal()
 * });
 * 
 * @example
 * // Keyboard shortcut (Ctrl+S)
 * useKeyPress(['Control', 's'], {
 *   onKeyDown: (e) => {
 *     e.preventDefault();
 *     saveDocument();
 *   },
 *   preventDefault: true
 * });
 */
export const useKeyPress = (targetKey, options = {}) => {
  const {
    onKeyDown,
    onKeyUp,
    preventDefault = false,
    target = typeof window !== 'undefined' ? window : null
  } = options;

  const [keyPressed, setKeyPressed] = useState(false);

  /**
   * Check if the pressed keys match the target keys
   */
  const keysMatch = useCallback((event) => {
    // Convert targetKey to array for consistent handling
    const targetKeys = Array.isArray(targetKey) ? targetKey : [targetKey];

    // For single key
    if (targetKeys.length === 1) {
      return event.key === targetKeys[0];
    }

    // For key combinations (e.g., Ctrl+S)
    const modifierKeys = {
      Control: event.ctrlKey || event.metaKey, // metaKey for Mac Cmd
      Alt: event.altKey,
      Shift: event.shiftKey,
      Meta: event.metaKey
    };

    // Check if all keys in combination are pressed
    return targetKeys.every(key => {
      if (Object.prototype.hasOwnProperty.call(modifierKeys, key)) {
        return modifierKeys[key];
      }
      return event.key === key;
    });
  }, [targetKey]);

  useEffect(() => {
    if (!target) return;

    /**
     * Handle key down event
     */
    const handleKeyDown = (event) => {
      if (keysMatch(event)) {
        if (preventDefault) {
          event.preventDefault();
        }

        setKeyPressed(true);

        if (onKeyDown) {
          onKeyDown(event);
        }
      }
    };

    /**
     * Handle key up event
     */
    const handleKeyUp = (event) => {
      if (keysMatch(event)) {
        setKeyPressed(false);

        if (onKeyUp) {
          onKeyUp(event);
        }
      }
    };

    // Add event listeners
    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
    };
  }, [target, keysMatch, preventDefault, onKeyDown, onKeyUp]);

  return keyPressed;
};

/**
 * useKeyboardShortcut - Convenience hook for keyboard shortcuts
 * 
 * @param {string} keys - Keys in the format 'Ctrl+S', 'Alt+Enter', etc.
 * @param {Function} callback - Callback function to execute
 * @param {Object} options - Additional options
 * 
 * @example
 * useKeyboardShortcut('Ctrl+S', () => saveDocument());
 * useKeyboardShortcut('Escape', () => closeModal());
 * useKeyboardShortcut('Ctrl+K', () => openCommandPalette());
 */
export const useKeyboardShortcut = (keys, callback, options = {}) => {
  const parseKeys = (keyString) => {
    return keyString.split('+').map(k => k.trim());
  };

  const targetKeys = parseKeys(keys);

  useKeyPress(targetKeys, {
    ...options,
    onKeyDown: callback,
    preventDefault: true
  });
};

export default useKeyPress;
