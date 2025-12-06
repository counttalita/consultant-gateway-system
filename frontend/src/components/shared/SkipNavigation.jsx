import { cn } from '../../utils/cn';

/**
 * Skip Navigation Component
 * Provides keyboard users a way to skip repetitive navigation and jump to main content
 * Meets WCAG 2.1 AA - Bypass Blocks (2.4.1)
 */
const SkipNavigation = ({ mainContentId = 'main-content', className }) => {
  return (
    <a
      href={`#${mainContentId}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'focus:px-4 focus:py-2',
        'focus:bg-blue-600 focus:text-white',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all',
        className
      )}
    >
      Skip to main content
    </a>
  );
};

export default SkipNavigation;
