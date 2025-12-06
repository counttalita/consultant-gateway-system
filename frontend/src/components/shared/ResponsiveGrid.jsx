import { cn } from '../../utils/cn';

/**
 * ResponsiveGrid - A flexible grid component that adapts to different screen sizes
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Grid items
 * @param {number} props.cols - Number of columns on mobile (default: 1)
 * @param {number} props.sm - Number of columns on small screens (default: 2)
 * @param {number} props.md - Number of columns on medium screens (default: 3)
 * @param {number} props.lg - Number of columns on large screens (default: 4)
 * @param {number} props.xl - Number of columns on extra large screens (default: 4)
 * @param {string} props.gap - Gap between grid items (default: '6')
 * @param {string} props.className - Additional CSS classes
 */
const ResponsiveGrid = ({
  children,
  cols = 1,
  sm = 2,
  md = 3,
  lg = 4,
  xl = 4,
  gap = '6',
  className,
  ...props
}) => {
  const gridClasses = cn(
    'grid',
    `grid-cols-${cols}`,
    `sm:grid-cols-${sm}`,
    `md:grid-cols-${md}`,
    `lg:grid-cols-${lg}`,
    `xl:grid-cols-${xl}`,
    `gap-${gap}`,
    className
  );
  
  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
