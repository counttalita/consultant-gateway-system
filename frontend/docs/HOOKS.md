# Custom Hooks Documentation

This document describes all custom React hooks available in the application.

## Table of Contents

- [State Management Hooks](#state-management-hooks)
- [API Hooks](#api-hooks)
- [UI Hooks](#ui-hooks)
- [Utility Hooks](#utility-hooks)

## State Management Hooks

### useAuth

Access authentication state and methods.

**Returns:**

```typescript
{
  user: User | null;
  loading: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
```

**Usage:**

```jsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### useNotification

Show toast notifications.

**Returns:**

```typescript
{
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}
```

**Usage:**

```jsx
import { useNotification } from '@/hooks/useNotification';

function MyComponent() {
  const { showSuccess, showError } = useNotification();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data');
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

### useForm

Form state management with validation.

**Parameters:**

```typescript
{
  initialValues: object;
  validationRules?: object;
  onSubmit: (values: object) => Promise<void>;
}
```

**Returns:**

```typescript
{
  values: object;
  errors: object;
  touched: object;
  isSubmitting: boolean;
  handleChange: (e: Event) => void;
  handleBlur: (e: Event) => void;
  handleSubmit: (e: Event) => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  resetForm: () => void;
}
```

**Usage:**

```jsx
import { useForm } from '@/hooks/useForm';

function MyForm() {
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting
  } = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validationRules: {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 }
    },
    onSubmit: async (values) => {
      await login(values);
    }
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
      />
      <Input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
      />
      <Button type="submit" loading={isSubmitting}>
        Login
      </Button>
    </form>
  );
}
```

## API Hooks

### useApi

Fetch data from API with loading and error states.

**Parameters:**

```typescript
{
  apiFunction: () => Promise<any>;
  dependencies?: any[];
  immediate?: boolean;
}
```

**Returns:**

```typescript
{
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Usage:**

```jsx
import { useApi } from '@/hooks/useApi';
import consultantService from '@/services/consultant.service';

function ProfilePage() {
  const { data: profile, loading, error, refetch } = useApi({
    apiFunction: () => consultantService.getProfile(userId),
    dependencies: [userId],
    immediate: true
  });
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <ProfileDisplay profile={profile} />
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useService

Generic service hook with loading and error handling.

**Parameters:**

```typescript
{
  service: ServiceClass;
  method: string;
  params?: any[];
}
```

**Returns:**

```typescript
{
  data: any;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<any>;
}
```

**Usage:**

```jsx
import { useService } from '@/hooks/useService';
import adminService from '@/services/admin.service';

function UserManagement() {
  const {
    data: users,
    loading,
    execute: fetchUsers
  } = useService({
    service: adminService,
    method: 'getUsers'
  });
  
  useEffect(() => {
    fetchUsers({ page: 1, limit: 10 });
  }, []);
  
  return <UserList users={users} loading={loading} />;
}
```

## UI Hooks

### useMediaQuery

Responsive design hook for media queries.

**Parameters:**

```typescript
query: string;  // CSS media query
```

**Returns:**

```typescript
boolean;  // true if query matches
```

**Usage:**

```jsx
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  if (isMobile) return <MobileView />;
  if (isTablet) return <TabletView />;
  return <DesktopView />;
}
```

### useOnClickOutside

Detect clicks outside an element.

**Parameters:**

```typescript
{
  ref: RefObject;
  handler: () => void;
  enabled?: boolean;
}
```

**Usage:**

```jsx
import { useRef } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

function Dropdown() {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useOnClickOutside({
    ref: dropdownRef,
    handler: () => setIsOpen(false),
    enabled: isOpen
  });
  
  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <DropdownMenu />}
    </div>
  );
}
```

### useFocusTrap

Trap focus within a component (useful for modals).

**Parameters:**

```typescript
{
  ref: RefObject;
  enabled?: boolean;
}
```

**Usage:**

```jsx
import { useRef } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  
  useFocusTrap({
    ref: modalRef,
    enabled: isOpen
  });
  
  if (!isOpen) return null;
  
  return (
    <div ref={modalRef} role="dialog">
      <h2>Modal Title</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### useKeyPress

Detect keyboard key presses.

**Parameters:**

```typescript
{
  targetKey: string;
  handler: () => void;
  enabled?: boolean;
}
```

**Usage:**

```jsx
import { useKeyPress } from '@/hooks/useKeyPress';

function SearchModal({ isOpen, onClose }) {
  useKeyPress({
    targetKey: 'Escape',
    handler: onClose,
    enabled: isOpen
  });
  
  useKeyPress({
    targetKey: 'Enter',
    handler: handleSearch,
    enabled: isOpen
  });
  
  return <div>...</div>;
}
```

## Utility Hooks

### useDebounce

Debounce a value.

**Parameters:**

```typescript
{
  value: any;
  delay: number;  // milliseconds
}
```

**Returns:**

```typescript
any;  // debounced value
```

**Usage:**

```jsx
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### useLocalStorage

Persist state in localStorage.

**Parameters:**

```typescript
{
  key: string;
  initialValue: any;
}
```

**Returns:**

```typescript
[value: any, setValue: (value: any) => void];
```

**Usage:**

```jsx
import { useLocalStorage } from '@/hooks/useLocalStorage';

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### usePagination

Pagination state management.

**Parameters:**

```typescript
{
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}
```

**Returns:**

```typescript
{
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  startIndex: number;
  endIndex: number;
}
```

**Usage:**

```jsx
import { usePagination } from '@/hooks/usePagination';

function UserList({ users }) {
  const {
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    startIndex,
    endIndex
  } = usePagination({
    totalItems: users.length,
    itemsPerPage: 10
  });
  
  const visibleUsers = users.slice(startIndex, endIndex);
  
  return (
    <div>
      <UserTable users={visibleUsers} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </div>
  );
}
```

### useAccessibility

Accessibility utilities.

**Returns:**

```typescript
{
  announceToScreenReader: (message: string) => void;
  setFocusToElement: (selector: string) => void;
  trapFocus: (containerRef: RefObject) => void;
}
```

**Usage:**

```jsx
import { useAccessibility } from '@/hooks/useAccessibility';

function FormComponent() {
  const { announceToScreenReader } = useAccessibility();
  
  const handleSubmit = async () => {
    try {
      await saveForm();
      announceToScreenReader('Form saved successfully');
    } catch (error) {
      announceToScreenReader('Error saving form');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Best Practices

### Hook Composition

Combine hooks for complex functionality:

```jsx
function useUserProfile(userId) {
  const { data, loading, error, refetch } = useApi({
    apiFunction: () => consultantService.getProfile(userId),
    dependencies: [userId]
  });
  
  const { showSuccess, showError } = useNotification();
  
  const updateProfile = async (updates) => {
    try {
      await consultantService.updateProfile(userId, updates);
      showSuccess('Profile updated');
      refetch();
    } catch (error) {
      showError('Failed to update profile');
    }
  };
  
  return { profile: data, loading, error, updateProfile };
}
```

### Dependency Arrays

Always specify dependencies correctly:

```jsx
// Good
useEffect(() => {
  fetchData(userId);
}, [userId]);

// Bad - missing dependency
useEffect(() => {
  fetchData(userId);
}, []);
```

### Cleanup

Clean up side effects:

```jsx
useEffect(() => {
  const subscription = subscribeToUpdates();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```
