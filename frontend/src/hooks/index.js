/**
 * Central export for all custom hooks
 */

// API and Data Fetching
export { default as useApi } from './useApi';
export { default as useService } from './useService';

// Form Management
export { default as useForm } from './useForm';

// UI State Management
export { default as useDebounce } from './useDebounce';
export { default as usePagination } from './usePagination';
export { default as useLocalStorage } from './useLocalStorage';
export { default as useOnClickOutside } from './useOnClickOutside';
export { default as useKeyPress, useKeyboardShortcut } from './useKeyPress';

// Notifications and Errors
export { default as useNotification } from './useNotification';
export { default as useApiError } from './useApiError';
export { default as useLoadingTimeout } from './useLoadingTimeout';

// Responsive Design
export { 
  default as useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsLargeScreen,
  useIsTouchDevice
} from './useMediaQuery';

// Logging and Monitoring
export { 
  default as useLogger,
  useAnalytics,
  usePerformance,
  usePageTracking,
  useFormTracking,
} from './useLogger';

// Animations
export { default as useAnimation } from './useAnimation';

// Accessibility
export { default as useFocusTrap } from './useFocusTrap';
export { 
  default as useAccessibility,
  useAriaLive,
  useSkipLink,
  useReducedMotion,
  useAriaExpanded
} from './useAccessibility';
