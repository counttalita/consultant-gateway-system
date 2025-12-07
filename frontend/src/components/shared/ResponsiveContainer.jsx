import { cn } from '../../utils/cn';

/**
 * ResponsiveContainer - A container component that provides consistent padding and max-width
 * across different screen sizes
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Container content
 * @param {string} props.maxWidth - Maximum width (default: '7xl')
 * @param {boolean} props.fluid - Whether to use full width (default: false)
 * @param {string} props.className - Additional CSS classes
 */
const ResponsiveContainer = ({
  children,
  maxWidth = '7xl',
  fluid = false,
  className,
  ...props
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };
  
  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-4 sm:px-6 lg:px-8',
        !fluid && maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveSection - A section component with responsive spacing
 */
export const ResponsiveSection = ({
  children,
  className,
  spacing = 'normal',
  ...props
}) => {
  const spacingClasses = {
    tight: 'py-4 md:py-6',
    normal: 'py-6 md:py-8 lg:py-12',
    loose: 'py-8 md:py-12 lg:py-16',
  };
  
  return (
    <section
      className={cn(spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </section>
  );
};

/**
 * ResponsiveStack - A vertical stack with responsive spacing
 */
export const ResponsiveStack = ({
  children,
  spacing = 'normal',
  className,
  ...props
}) => {
  const spacingClasses = {
    tight: 'space-y-2 md:space-y-3',
    normal: 'space-y-4 md:space-y-6',
    loose: 'space-y-6 md:space-y-8',
  };
  
  return (
    <div
      className={cn('flex flex-col', spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
