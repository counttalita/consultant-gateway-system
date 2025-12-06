/**
 * Animation Utilities
 * 
 * Provides reusable animation configurations and utilities for smooth UI interactions.
 * Includes support for reduced motion preferences for accessibility.
 */

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration based on user preferences
 * @param {number} duration - Default duration in milliseconds
 * @returns {number} - Adjusted duration
 */
export const getAnimationDuration = (duration) => {
  return prefersReducedMotion() ? 0 : duration;
};

/**
 * Animation timing functions
 */
export const easings = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

/**
 * Standard animation durations (in milliseconds)
 */
export const durations = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375,
  enteringScreen: 225,
  leavingScreen: 195,
};

/**
 * Page transition variants for Framer Motion or CSS
 */
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
};

/**
 * Modal/Drawer animation variants
 */
export const modalTransitions = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: getAnimationDuration(durations.shorter) / 1000 },
  },
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { 
      duration: getAnimationDuration(durations.enteringScreen) / 1000,
      ease: easings.easeOut,
    },
  },
  drawer: {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
      transition: { duration: getAnimationDuration(durations.enteringScreen) / 1000 },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      transition: { duration: getAnimationDuration(durations.enteringScreen) / 1000 },
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
      transition: { duration: getAnimationDuration(durations.enteringScreen) / 1000 },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      transition: { duration: getAnimationDuration(durations.enteringScreen) / 1000 },
    },
  },
};

/**
 * Micro-interaction animations
 */
export const microInteractions = {
  tap: {
    scale: 0.97,
    transition: { duration: getAnimationDuration(durations.shortest) / 1000 },
  },
  hover: {
    scale: 1.02,
    transition: { duration: getAnimationDuration(durations.shortest) / 1000 },
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: getAnimationDuration(durations.standard) / 1000,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Skeleton loader animation
 */
export const skeletonAnimation = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: getAnimationDuration(1500) / 1000,
    repeat: Infinity,
    ease: 'linear',
  },
};

/**
 * List item stagger animation
 */
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: getAnimationDuration(50) / 1000,
    },
  },
};

export const listItemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Notification/Toast animations
 */
export const notificationTransitions = {
  topRight: {
    initial: { opacity: 0, x: 100, y: 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 100, y: 0 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
  topLeft: {
    initial: { opacity: 0, x: -100, y: 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: -100, y: 0 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
  bottomRight: {
    initial: { opacity: 0, x: 100, y: 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 100, y: 0 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
  bottomLeft: {
    initial: { opacity: 0, x: -100, y: 0 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: -100, y: 0 },
    transition: { duration: getAnimationDuration(durations.standard) / 1000 },
  },
};

/**
 * Progress bar animation
 */
export const progressBarTransition = {
  width: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
};

/**
 * CSS class names for common animations
 */
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  slideInRight: 'animate-slide-in-right',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  striped: 'animate-striped',
};

/**
 * Smooth scroll to element
 * @param {string|HTMLElement} target - Element or selector to scroll to
 * @param {Object} options - Scroll options
 */
export const smoothScrollTo = (target, options = {}) => {
  const element = typeof target === 'string' 
    ? document.querySelector(target) 
    : target;
  
  if (!element) return;
  
  const defaultOptions = {
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options,
  };
  
  element.scrollIntoView(defaultOptions);
};

/**
 * Smooth scroll to top of page
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
};

/**
 * Create a delayed animation
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} - Animation config with delay
 */
export const withDelay = (delay) => ({
  transition: {
    delay: getAnimationDuration(delay) / 1000,
  },
});

/**
 * Create a spring animation
 * @param {Object} config - Spring configuration
 * @returns {Object} - Spring animation config
 */
export const springAnimation = (config = {}) => ({
  type: 'spring',
  stiffness: 300,
  damping: 30,
  ...config,
});

/**
 * Optimistic UI update helper
 * Creates a temporary optimistic state while waiting for server response
 * 
 * @param {Function} updateFn - Function to update local state optimistically
 * @param {Function} apiFn - API function to call
 * @param {Function} rollbackFn - Function to rollback on error
 * @returns {Promise} - Promise that resolves with API response
 */
export const optimisticUpdate = async (updateFn, apiFn, rollbackFn) => {
  // Apply optimistic update immediately
  updateFn();
  
  try {
    // Call API
    const result = await apiFn();
    return result;
  } catch (error) {
    // Rollback on error
    if (rollbackFn) {
      rollbackFn();
    }
    throw error;
  }
};

/**
 * Debounced animation frame
 * Useful for performance-intensive animations
 * 
 * @param {Function} callback - Function to call
 * @returns {Function} - Debounced function
 */
export const rafDebounce = (callback) => {
  let rafId = null;
  
  return (...args) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      callback(...args);
      rafId = null;
    });
  };
};

/**
 * Create a CSS transition string
 * @param {string|string[]} properties - CSS properties to transition
 * @param {number} duration - Duration in milliseconds
 * @param {string} easing - Easing function
 * @returns {string} - CSS transition string
 */
export const createTransition = (
  properties,
  duration = durations.standard,
  easing = easings.easeInOut
) => {
  const props = Array.isArray(properties) ? properties : [properties];
  const adjustedDuration = getAnimationDuration(duration);
  
  return props
    .map(prop => `${prop} ${adjustedDuration}ms ${easing}`)
    .join(', ');
};

/**
 * Animation state machine helper
 * Manages complex animation sequences
 */
export class AnimationSequence {
  constructor() {
    this.queue = [];
    this.isRunning = false;
  }
  
  add(animation, duration) {
    this.queue.push({ animation, duration: getAnimationDuration(duration) });
    return this;
  }
  
  async run() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    for (const { animation, duration } of this.queue) {
      await animation();
      if (duration > 0) {
        await new Promise(resolve => setTimeout(resolve, duration));
      }
    }
    
    this.isRunning = false;
    this.queue = [];
  }
  
  clear() {
    this.queue = [];
    this.isRunning = false;
  }
}

export default {
  prefersReducedMotion,
  getAnimationDuration,
  easings,
  durations,
  pageTransitions,
  modalTransitions,
  microInteractions,
  skeletonAnimation,
  staggerChildren,
  listItemVariants,
  notificationTransitions,
  progressBarTransition,
  animationClasses,
  smoothScrollTo,
  scrollToTop,
  withDelay,
  springAnimation,
  optimisticUpdate,
  rafDebounce,
  createTransition,
  AnimationSequence,
};
