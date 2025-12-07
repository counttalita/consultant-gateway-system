import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import RoleEditor from '../../components/admin/RoleEditor';
import { useNotification } from '../../hooks/useNotification';
import adminService from '../../services/admin.service';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUser(id);
      setUser(data);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [id, showError, navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleDeactivate = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      return;
    }

    try {
      await adminService.deactivateUser(id);
      showSuccess('User deactivated successfully');
      loadUser();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Button onClick={() => navigate('/admin/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/users')}
            className="mb-2"
          >
            ← Back to Users
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{user.email}</h1>
          <p className="mt-1 text-sm text-gray-500">
            User ID: {user.id}
          </p>
        </div>
        <div className="flex space-x-3">
          {user.active && (
            <Button variant="danger" onClick={handleDeactivate}>
              Deactivate User
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card title="User Information">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Primary Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">All Roles</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-1">
                  {(user.roles || []).map(role => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  ))}
                  {(!user.roles || user.roles.length === 0) && (
                    <span className="text-sm text-gray-500">No roles assigned</span>
                  )}
                </div>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updated_at)}</dd>
            </div>
          </dl>
        </Card>

        {/* Role Editor */}
        <RoleEditor user={user} onUpdate={loadUser} />
      </div>

      {/* Additional Information for Consultants */}
      {user.role === 'consultant' && user.consultant && (
        <Card title="Consultant Information">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.consultant.full_name || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.consultant.phone || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Availability Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.consultant.availability_status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : user.consultant.availability_status === 'partially_available'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.consultant.availability_status || 'N/A'}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Onboarding Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.consultant.onboarding_status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : user.consultant.onboarding_status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.consultant.onboarding_status || 'N/A'}
                </span>
              </dd>
            </div>
          </dl>
        </Card>
      )}

      {/* Activity Log */}
      <Card title="Recent Activity">
        <div className="text-sm text-gray-500">
          Activity log coming soon...
        </div>
      </Card>
    </div>
  );
};

export default UserDetails;
