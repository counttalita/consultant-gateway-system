import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Breadcrumbs component for navigation hierarchy
 * Automatically generates breadcrumbs from the current route
 */
const Breadcrumbs = ({ items, className }) => {
  const location = useLocation();
  
  // If items are provided, use them; otherwise generate from path
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);
  
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-sm', className)}>
      <Link
        to="/"
        className="text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <React.Fragment key={item.path || index}>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {isLast ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  // Route label mappings
  const labelMap = {
    admin: 'Admin',
    consultant: 'Consultant',
    finance: 'Finance',
    users: 'Users',
    'talent-pool': 'Talent Pool',
    projects: 'Projects',
    tenders: 'Tenders',
    'audit-logs': 'Audit Logs',
    health: 'System Health',
    config: 'Configuration',
    settings: 'Settings',
    profile: 'Profile',
    availability: 'Availability',
    onboarding: 'Onboarding',
    'month-end': 'Month-End Processing',
    'simplepay-export': 'SimplePay Export',
    invoices: 'Invoices',
    payments: 'Payments',
  };
  
  let currentPath = '';
  
  paths.forEach((segment) => {
    currentPath += `/${segment}`;
    
    // Skip IDs (numeric segments)
    if (/^\d+$/.test(segment)) {
      return;
    }
    
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      path: currentPath,
    });
  });
  
  return breadcrumbs;
}

export default Breadcrumbs;
