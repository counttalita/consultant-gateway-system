import { useState } from 'react';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Card from '../shared/Card';
import { useNotification } from '../../hooks/useNotification';
import adminService from '../../services/admin.service';

const RoleEditor = ({ user, onUpdate }) => {
  const [selectedRoles, setSelectedRoles] = useState(user.roles || []);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Determine available roles based on user type
  const availableRoles = user.role === 'consultant' 
    ? ['consultant'] // Consultants can only have consultant role
    : ['admin', 'finance', 'user']; // Internal staff can have multiple

  const handleToggleRole = (role, checked) => {
    if (user.role === 'consultant') {
      // Consultants cannot change their role
      return;
    }

    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      showError('User must have at least one role');
      return;
    }

    setSaving(true);
    try {
      await adminService.updateUserRoles(user.id, selectedRoles);
      showSuccess('Roles updated successfully');
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify((user.roles || []).sort());

  return (
    <Card title="Manage Roles" subtitle="Assign roles to control user permissions">
      <div className="space-y-4">
        <div className="space-y-3">
          {availableRoles.map(role => (
            <div key={role} className="flex items-center">
              <Checkbox
                id={`role-${role}`}
                label={role.charAt(0).toUpperCase() + role.slice(1)}
                checked={selectedRoles.includes(role)}
                onChange={(checked) => handleToggleRole(role, checked)}
                disabled={user.role === 'consultant'}
              />
            </div>
          ))}
        </div>

        {user.role === 'consultant' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Consultant roles cannot be modified. Consultants always have the consultant role.
            </p>
          </div>
        )}

        {selectedRoles.length === 0 && user.role !== 'consultant' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              Warning: User must have at least one role assigned.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setSelectedRoles(user.roles || [])}
            disabled={!hasChanges || saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges || saving || selectedRoles.length === 0}
          >
            Save Roles
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RoleEditor;
