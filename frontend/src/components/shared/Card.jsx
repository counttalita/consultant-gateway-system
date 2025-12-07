import { cn } from '../../utils/cn';

const Card = ({
  title,
  subtitle,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  padding = 'default',
  as = 'article',
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-3 md:p-4',
    default: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };
  
  const Component = as;
  
  return (
    <Component
      className={cn(
        'bg-white rounded-lg shadow border border-gray-200 transition-shadow hover:shadow-md',
        className
      )}
      role={as === 'div' ? 'region' : undefined}
      aria-labelledby={title ? 'card-title' : undefined}
      {...props}
    >
      {/* Header */}
      {(title || subtitle) && (
        <header
          className={cn(
            'border-b border-gray-200',
            paddings[padding],
            headerClassName
          )}
        >
          {title && (
            <h3 id="card-title" className="text-base md:text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-xs md:text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </header>
      )}
      
      {/* Body */}
      <div
        className={cn(
          paddings[padding],
          bodyClassName
        )}
      >
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <footer
          className={cn(
            'border-t border-gray-200 bg-gray-50 rounded-b-lg',
            paddings[padding],
            footerClassName
          )}
        >
          {footer}
        </footer>
      )}
    </Component>
  );
};

export default Card;
