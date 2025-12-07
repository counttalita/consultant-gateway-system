# Component API Documentation

This document describes the props and usage for all shared components in the application.

## Table of Contents

- [Form Components](#form-components)
- [Feedback Components](#feedback-components)
- [Layout Components](#layout-components)
- [Data Display Components](#data-display-components)
- [Navigation Components](#navigation-components)

## Form Components

### Button

A versatile button component with multiple variants and states.

**Props:**

```typescript
{
  children: ReactNode;           // Button content
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;             // Shows spinner and disables button
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
}
```

**Usage:**

```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Save Changes
</Button>

<Button variant="danger" loading={isDeleting}>
  Delete
</Button>
```

### Input

Text input component with validation support.

**Props:**

```typescript
{
  label?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChange: (e: Event) => void;
  onBlur?: (e: Event) => void;
  error?: string;                // Validation error message
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
```

**Usage:**

```jsx
<Input
  label="Email Address"
  name="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  required
/>
```

### Select

Dropdown select component.

**Props:**

```typescript
{
  label?: string;
  name: string;
  value: string;
  onChange: (e: Event) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
```

**Usage:**

```jsx
<Select
  label="Status"
  name="status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
/>
```

### Checkbox

Checkbox input component.

**Props:**

```typescript
{
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}
```

**Usage:**

```jsx
<Checkbox
  label="I accept the terms and conditions"
  name="terms"
  checked={acceptedTerms}
  onChange={setAcceptedTerms}
/>
```

### TextArea

Multi-line text input component.

**Props:**

```typescript
{
  label?: string;
  name: string;
  value: string;
  onChange: (e: Event) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}
```

**Usage:**

```jsx
<TextArea
  label="Bio"
  name="bio"
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  rows={5}
  maxLength={1000}
/>
```

## Feedback Components

### LoadingSpinner

Animated loading spinner.

**Props:**

```typescript
{
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}
```

**Usage:**

```jsx
<LoadingSpinner size="lg" showLabel label="Loading profile..." />
```

### SkeletonLoader

Skeleton screen for loading states.

**Props:**

```typescript
{
  type?: 'card' | 'table' | 'list' | 'dashboard' | 'form';
  count?: number;               // Number of skeleton items
  className?: string;
}
```

**Usage:**

```jsx
<SkeletonLoader type="card" count={3} />
```

### Modal

Modal dialog component.

**Props:**

```typescript
{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}
```

**Usage:**

```jsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex justify-end space-x-2 mt-4">
    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </div>
</Modal>
```

### Drawer

Slide-out drawer component.

**Props:**

```typescript
{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Usage:**

```jsx
<Drawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  title="Filters"
  position="right"
>
  <FilterForm />
</Drawer>
```

### ProgressBar

Progress indicator component.

**Props:**

```typescript
{
  value: number;                // 0-100
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}
```

**Usage:**

```jsx
<ProgressBar
  value={75}
  showLabel
  label="Profile Completion"
  variant="success"
/>
```

## Layout Components

### Card

Container card component.

**Props:**

```typescript
{
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;          // Header actions
  footer?: ReactNode;
  className?: string;
}
```

**Usage:**

```jsx
<Card
  title="Profile Information"
  subtitle="Update your personal details"
  actions={<Button size="sm">Edit</Button>}
>
  <ProfileContent />
</Card>
```

### Tabs

Tabbed interface component.

**Props:**

```typescript
{
  tabs: Array<{
    label: string;
    icon?: ReactNode;
    content: ReactNode;
  }>;
  defaultTab?: number;
  onChange?: (index: number) => void;
  className?: string;
}
```

**Usage:**

```jsx
<Tabs
  tabs={[
    {
      label: 'Profile',
      icon: <UserIcon />,
      content: <ProfileForm />
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      content: <SettingsForm />
    }
  ]}
  defaultTab={0}
/>
```

## Data Display Components

### Table

Data table component with sorting and pagination.

**Props:**

```typescript
{
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => ReactNode;
  }>;
  data: Array<any>;
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
}
```

**Usage:**

```jsx
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <Badge variant={status === 'active' ? 'success' : 'default'}>
          {status}
        </Badge>
      )
    }
  ]}
  data={users}
  loading={isLoading}
/>
```

### Pagination

Pagination controls component.

**Props:**

```typescript
{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxPageNumbers?: number;
  className?: string;
}
```

**Usage:**

```jsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  showPageNumbers
  maxPageNumbers={5}
/>
```

## Navigation Components

### Breadcrumbs

Breadcrumb navigation component.

**Props:**

```typescript
{
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}
```

**Usage:**

```jsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Users', href: '/admin/users' },
    { label: 'John Doe' }
  ]}
/>
```

## Best Practices

### Component Composition

Prefer composition over configuration:

```jsx
// Good
<Card>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardBody>
    Content
  </CardBody>
</Card>

// Avoid
<Card
  title="Title"
  body="Content"
  headerClassName="..."
  bodyClassName="..."
/>
```

### Accessibility

Always include proper ARIA attributes:

```jsx
<Button
  aria-label="Close dialog"
  aria-pressed={isActive}
>
  <CloseIcon />
</Button>
```

### Error Handling

Display validation errors inline:

```jsx
<Input
  label="Email"
  error={errors.email}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <span id="email-error" className="error-message">
    {errors.email}
  </span>
)}
```

### Loading States

Show loading states for async operations:

```jsx
<Button loading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```
