import { cn } from '../../utils/cn';
import { useIsTouchDevice } from '../../hooks/useMediaQuery';

/**
 * TouchFriendly - Wrapper component that makes child elements more touch-friendly
 * Increases tap target size and adds visual feedback for touch interactions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.feedback - Whether to show touch feedback (default: true)
 * @param {string} props.minHeight - Minimum height for touch target (default: '44px')
 * @param {Function} props.onClick - Click handler
 */
const TouchFriendly = ({
  children,
  className,
  feedback = true,
  minHeight = '44px',
  onClick,
  ...props
}) => {
  const isTouch = useIsTouchDevice();
  
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        isTouch && 'min-h-[44px] min-w-[44px]',
        feedback && isTouch && 'active:scale-95 active:opacity-80 transition-transform',
        onClick && 'cursor-pointer',
        className
      )}
      style={isTouch ? { minHeight } : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * TouchButton - Touch-optimized button component
 */
export const TouchButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) => {
  const isTouch = useIsTouchDevice();
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  };
  
  const sizes = {
    sm: isTouch ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-sm',
    md: isTouch ? 'px-6 py-3 text-base' : 'px-4 py-2 text-base',
    lg: isTouch ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        isTouch && 'min-h-[44px] active:scale-95',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * TouchIconButton - Touch-optimized icon button
 */
export const TouchIconButton = ({
  children,
  className,
  label,
  ...props
}) => {
  const isTouch = useIsTouchDevice();
  
  return (
    <button
      className={cn(
        'rounded-lg p-2 transition-all',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        isTouch && 'min-h-[44px] min-w-[44px] active:scale-90',
        className
      )}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
};

export default TouchFriendly;
