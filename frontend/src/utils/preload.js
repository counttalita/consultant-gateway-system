/**
 * Resource preloading utilities
 * 
 * Helps optimize initial page load by preloading critical resources
 */

/**
 * Preload a script
 */
export const preloadScript = (src) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Preload a stylesheet
 */
export const preloadStyle = (href) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Preload an image
 */
export const preloadImage = (src) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Preload a font
 */
export const preloadFont = (href, type = 'font/woff2') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = type;
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

/**
 * Prefetch a resource for future navigation
 */
export const prefetchResource = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Preconnect to a domain
 */
export const preconnect = (url) => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
};

/**
 * DNS prefetch for a domain
 */
export const dnsPrefetch = (url) => {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
};

/**
 * Preload critical resources for the application
 */
export const preloadCriticalResources = () => {
  // Preconnect to API server
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  preconnect(apiUrl);
  
  // DNS prefetch for external services (if any)
  // dnsPrefetch('https://external-service.com');
};

/**
 * Prefetch route chunks for faster navigation
 */
export const prefetchRouteChunks = (routes) => {
  routes.forEach(route => {
    if (route.component && route.component.preload) {
      // For lazy-loaded components
      route.component.preload();
    }
  });
};
