import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Pagination from '../../components/shared/Pagination';
import UserFilters from '../../components/admin/UserFilters';
import { useNotification } from '../../hooks/useNotification';
import adminService from '../../services/admin.service';

const Users = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20
  });
  const [filters, setFilters] = useState({
    role: '',
    active: '',
    search: ''
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current_page,
        per_page: pagination.per_page
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const data = await adminService.getUsers(params);
      setUsers(data.users || data);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current_page, pagination.per_page, showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeactivate = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userEmail}?`)) {
      return;
    }

    try {
      await adminService.deactivateUser(userId);
      showSuccess('User deactivated successfully');
      loadUsers();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (email) => (
        <span className="font-medium text-gray-900">{email}</span>
      )
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (roles) => (
        <div className="flex flex-wrap gap-1">
          {(roles || []).map(role => (
            <span
              key={role}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {role}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'active',
      label: 'Status',
      render: (active) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (date) => (
        <span className="text-gray-500">{formatDate(date)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, user) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/users/${user.id}`)}
          >
            View
          </Button>
          {user.active && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeactivate(user.id, user.email)}
            >
              Deactivate
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <UserFilters filters={filters} onChange={handleFilterChange} />

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-gray-700">
          Showing {users.length} of {pagination.total_count || users.length} users
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
      />

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Users;
