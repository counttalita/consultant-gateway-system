import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import Checkbox from './Checkbox';
import Modal from './Modal';
import Drawer from './Drawer';
import Card from './Card';
import Table from './Table';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';
import ExampleForm from './ExampleForm';

/**
 * Component Demo Page
 * This component demonstrates all shared components
 * Used for testing and documentation purposes
 */
const ComponentDemo = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  ];

  const tableColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'actions',
      label: 'Actions',
      render: () => (
        <Button size="sm" variant="outline">
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Component Library Demo</h1>

      {/* Buttons */}
      <Card title="Buttons" subtitle="Various button styles and states">
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Card>

      {/* Form Inputs */}
      <Card title="Form Inputs" subtitle="Input fields with validation">
        <div className="space-y-4 max-w-md">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="We'll never share your email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            error="Password must be at least 8 characters"
            required
          />
          <Select
            label="Role"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'user', label: 'User' },
              { value: 'guest', label: 'Guest' },
            ]}
            placeholder="Select a role"
          />
          <Checkbox
            label="I agree to the terms and conditions"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </div>
      </Card>

      {/* Modal & Drawer */}
      <Card title="Modal & Drawer" subtitle="Overlay components">
        <div className="flex gap-4">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example Modal"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </div>
          }
        >
          <p>This is an example modal with a title, body content, and footer actions.</p>
        </Modal>

        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Example Drawer"
          position="right"
        >
          <div className="space-y-4">
            <p>This is a drawer that slides in from the side.</p>
            <Button onClick={() => setDrawerOpen(false)}>Close Drawer</Button>
          </div>
        </Drawer>
      </Card>

      {/* Table */}
      <Card title="Table" subtitle="Data table with actions">
        <Table columns={tableColumns} data={tableData} />
      </Card>

      {/* Loading States */}
      <Card title="Loading States" subtitle="Spinners and skeleton loaders">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Loading Spinners</h4>
            <div className="flex items-center gap-8">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <LoadingSpinner size="md" showLabel label="Loading..." />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Skeleton Loaders</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Card Skeleton</p>
                <SkeletonLoader type="card" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">List Skeleton</p>
                <SkeletonLoader type="list" count={3} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Form Skeleton</p>
                <SkeletonLoader type="form" count={3} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading Toggle */}
      <Card title="Loading Toggle" subtitle="Test loading states">
        <Button onClick={() => setLoading(!loading)}>
          {loading ? 'Hide' : 'Show'} Loading State
        </Button>
        {loading && (
          <div className="mt-4">
            <SkeletonLoader type="dashboard" />
          </div>
        )}
      </Card>

      {/* Form Validation System */}
      <Card 
        title="Form Validation System" 
        subtitle="Complete form with real-time validation using useForm hook"
      >
        <ExampleForm />
      </Card>
    </div>
  );
};

export default ComponentDemo;
