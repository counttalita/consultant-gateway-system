import { useState, useCallback, useMemo } from 'react';

/**
 * usePagination - Hook for managing pagination state
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.initialPageSize - Initial page size (default: 10)
 * @param {number} options.totalItems - Total number of items
 * @returns {Object} Pagination state and handlers
 * 
 * @example
 * const {
 *   currentPage,
 *   pageSize,
 *   totalPages,
 *   hasNextPage,
 *   hasPreviousPage,
 *   goToPage,
 *   nextPage,
 *   previousPage,
 *   setPageSize,
 *   reset
 * } = usePagination({
 *   initialPage: 1,
 *   initialPageSize: 10,
 *   totalItems: 100
 * });
 */
export const usePagination = (options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems = 0
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1;
  }, [totalItems, pageSize]);

  /**
   * Check if there's a next page
   */
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  /**
   * Check if there's a previous page
   */
  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  /**
   * Calculate start and end indices for current page
   */
  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize, totalItems);
  }, [startIndex, pageSize, totalItems]);

  /**
   * Go to a specific page
   */
  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  /**
   * Change page size and reset to first page
   */
  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  /**
   * Reset pagination to initial state
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  /**
   * Get page numbers for pagination UI
   */
  const getPageNumbers = useCallback((maxVisible = 5) => {
    const pages = [];
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return {
    // State
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,

    // Actions
    goToPage,
    nextPage,
    previousPage,
    setPageSize: changePageSize,
    reset,
    getPageNumbers
  };
};

export default usePagination;
