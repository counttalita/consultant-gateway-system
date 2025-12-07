/**
 * Demo component showcasing all custom hooks
 * This file is for demonstration and testing purposes only
 */

import React, { useState } from 'react';
import {
  useDebounce,
  usePagination,
  useForm,
  useLocalStorage,
  useMediaQuery,
  useOnClickOutside,
  useKeyPress,
  useKeyboardShortcut
} from './index';

/**
 * Demo: useDebounce
 */
const DebounceDemo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useDebounce Demo</h3>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Type to search..."
        className="border p-2 rounded"
      />
      <p className="mt-2">Immediate: {searchTerm}</p>
      <p>Debounced (500ms): {debouncedSearchTerm}</p>
    </div>
  );
};

/**
 * Demo: usePagination
 */
const PaginationDemo = () => {
  const {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    getPageNumbers
  } = usePagination({
    initialPage: 1,
    initialPageSize: 10,
    totalItems: 100
  });

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">usePagination Demo</h3>
      <div className="flex gap-2 items-center">
        <button
          onClick={previousPage}
          disabled={!hasPreviousPage}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-1 border rounded ${
              page === currentPage ? 'bg-blue-500 text-white' : ''
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={nextPage}
          disabled={!hasNextPage}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <p className="mt-2">
        Page {currentPage} of {totalPages} (Page size: {pageSize})
      </p>
    </div>
  );
};

/**
 * Demo: useLocalStorage
 */
const LocalStorageDemo = () => {
  const [name, setName, removeName] = useLocalStorage('demo-name', '');

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useLocalStorage Demo</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name..."
        className="border p-2 rounded"
      />
      <button
        onClick={removeName}
        className="ml-2 px-3 py-1 border rounded bg-red-500 text-white"
      >
        Clear
      </button>
      <p className="mt-2">Stored value: {name || '(empty)'}</p>
      <p className="text-sm text-gray-600">
        Open this page in another tab to see sync in action!
      </p>
    </div>
  );
};

/**
 * Demo: useMediaQuery
 */
const MediaQueryDemo = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useMediaQuery Demo</h3>
      <p>Mobile: {isMobile ? '✓' : '✗'}</p>
      <p>Tablet: {isTablet ? '✓' : '✗'}</p>
      <p>Desktop: {isDesktop ? '✓' : '✗'}</p>
      <p className="text-sm text-gray-600 mt-2">
        Resize your browser window to see changes
      </p>
    </div>
  );
};

/**
 * Demo: useOnClickOutside
 */
const OnClickOutsideDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useOnClickOutside(() => setIsOpen(false));

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useOnClickOutside Demo</h3>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 border rounded bg-blue-500 text-white"
      >
        Open Dropdown
      </button>
      
      {isOpen && (
        <div
          ref={ref}
          className="mt-2 p-4 border rounded bg-white shadow-lg"
        >
          <p>Click outside this box to close it</p>
        </div>
      )}
    </div>
  );
};

/**
 * Demo: useKeyPress
 */
const KeyPressDemo = () => {
  const [log, setLog] = useState([]);
  
  const enterPressed = useKeyPress('Enter', {
    onKeyDown: () => {
      setLog(prev => [...prev, 'Enter pressed']);
    }
  });

  useKeyboardShortcut('Control+s', () => {
    setLog(prev => [...prev, 'Ctrl+S pressed (save shortcut)']);
  });

  useKeyboardShortcut('Escape', () => {
    setLog([]);
  });

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useKeyPress Demo</h3>
      <p>Enter key: {enterPressed ? 'Pressed' : 'Not pressed'}</p>
      <p className="text-sm text-gray-600 mt-2">
        Try pressing: Enter, Ctrl+S, or Escape (to clear log)
      </p>
      <div className="mt-2 p-2 bg-gray-100 rounded max-h-32 overflow-y-auto">
        {log.length === 0 ? (
          <p className="text-gray-500">No keys pressed yet</p>
        ) : (
          log.map((entry, i) => <p key={i}>{entry}</p>)
        )}
      </div>
    </div>
  );
};

/**
 * Demo: useForm
 */
const FormDemo = () => {
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting
  } = useForm(
    { email: '', password: '' },
    {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      }
    },
    async (values) => {
      console.log('Form submitted:', values);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Form submitted successfully!');
    }
  );

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">useForm Demo</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <input
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="Email"
            className="border p-2 rounded w-full"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>
        
        <div>
          <input
            type="password"
            value={values.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="Password"
            className="border p-2 rounded w-full"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

/**
 * Main demo component
 */
const HooksDemo = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Custom Hooks Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DebounceDemo />
        <PaginationDemo />
        <LocalStorageDemo />
        <MediaQueryDemo />
        <OnClickOutsideDemo />
        <KeyPressDemo />
        <div className="md:col-span-2">
          <FormDemo />
        </div>
      </div>
    </div>
  );
};

export default HooksDemo;
