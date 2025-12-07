import { useState } from 'react';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';

const UserFilters = ({ filters, onChange, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      role: '',
      active: '',
      search: ''
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
    if (onReset) onReset();
  };

  const hasActiveFilters = localFilters.role || localFilters.active || localFilters.search;

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          label="Search"
          placeholder="Search by email..."
          value={localFilters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />

        <Select
          label="Role"
          value={localFilters.role}
          onChange={(e) => handleChange('role', e.target.value)}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'consultant', label: 'Consultant' },
            { value: 'admin', label: 'Admin' },
            { value: 'finance', label: 'Finance' },
            { value: 'user', label: 'User' }
          ]}
        />

        <Select
          label="Status"
          value={localFilters.active}
          onChange={(e) => handleChange('active', e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' }
          ]}
        />

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;
