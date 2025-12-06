import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import { Card, Button, Table, Select, Input, SkeletonLoader } from '../../components/shared';

/**
 * Projects List Page
 * Displays all projects with filtering capabilities
 * Requirements: 11.1, 11.2
 */
const Projects = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectsService.getProjects(filters);
      setProjects(data.projects || data);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (projectId) => {
    navigate(`/admin/projects/${projectId}`);
  };

  const getStatusBadgeClass = (status) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'setup':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'archived':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'client_name',
      label: 'Client',
      render: (value) => (
        <span className="text-gray-700">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={getStatusBadgeClass(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'end_date',
      label: 'End Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'consultants_count',
      label: 'Consultants',
      render: (value, row) => {
        const count = row.consultants?.length || 0;
        return (
          <span className="text-gray-700">{count}</span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleViewDetails(row.id)}
        >
          View Details
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        </div>
        <Card>
          <SkeletonLoader type="table" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'setup', label: 'Setup' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' }
            ]}
          />
          <Input
            label="Search"
            placeholder="Search by project or client name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filters.status || filters.search
                ? 'Try adjusting your filters'
                : 'Projects will appear here once they are created'}
            </p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={projects}
            keyField="id"
          />
        )}
      </Card>
    </div>
  );
};

export default Projects;
