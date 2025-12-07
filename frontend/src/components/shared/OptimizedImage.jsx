import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '../../utils/cn';

/**
 * OptimizedImage component with lazy loading and placeholder support
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Error handling with fallback
 * - Responsive image support
 */
const OptimizedImage = memo(({
  src,
  alt,
  className,
  placeholderSrc,
  fallbackSrc = '/placeholder-image.png',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  // Determine initial src based on loading strategy
  const getInitialSrc = () => {
    if (loading === 'eager' || !('IntersectionObserver' in window)) {
      return src;
    }
    return placeholderSrc || src;
  };

  const [imageSrc, setImageSrc] = useState(getInitialSrc);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Skip if already loading eagerly or no observer support
    if (loading === 'eager' || !('IntersectionObserver' in window)) {
      return;
    }

    let isMounted = true;

    // Set up Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isMounted) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      isMounted = false;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, loading]);

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e) => {
    setImageError(true);
    setImageSrc(fallbackSrc);
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        'transition-opacity duration-300',
        imageLoaded && !imageError ? 'opacity-100' : 'opacity-0',
        placeholderSrc && !imageLoaded && 'blur-sm',
        className
      )}
      onLoad={handleLoad}
      onError={handleError}
      loading={loading}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
