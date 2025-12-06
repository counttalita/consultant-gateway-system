import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * useLocalStorage - Hook for managing localStorage with React state
 * 
 * Automatically syncs state with localStorage and handles JSON serialization.
 * Includes error handling and cross-tab synchronization.
 * 
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[*, Function, Function]} - [storedValue, setValue, removeValue]
 * 
 * @example
 * const [user, setUser, removeUser] = useLocalStorage('user', null);
 * 
 * // Set value
 * setUser({ id: 1, name: 'John' });
 * 
 * // Remove value
 * removeUser();
 */
export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error('useLocalStorage: Error reading from localStorage', error);
      return initialValue;
    }
  });

  /**
   * Return a wrapped version of useState's setter function that
   * persists the new value to localStorage.
   */
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        logger.debug('useLocalStorage: Value saved', { key, value: valueToStore });
      }
    } catch (error) {
      logger.error('useLocalStorage: Error saving to localStorage', error);
    }
  }, [key, storedValue]);

  /**
   * Remove the value from localStorage
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        logger.debug('useLocalStorage: Value removed', { key });
      }
    } catch (error) {
      logger.error('useLocalStorage: Error removing from localStorage', error);
    }
  }, [key, initialValue]);

  /**
   * Listen for changes to this key in other tabs/windows
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
          logger.debug('useLocalStorage: Value synced from another tab', { key, value: newValue });
        } catch (error) {
          logger.error('useLocalStorage: Error parsing storage event', error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed in another tab
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
