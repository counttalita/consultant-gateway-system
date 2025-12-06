import { useState, useEffect } from 'react';
import adminService from '../../services/admin.service';
import useNotification from '../../hooks/useNotification';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Select from '../../components/shared/Select';
import Input from '../../components/shared/Input';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import Modal from '../../components/shared/Modal';

const TalentPool = () => {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: '',
    availability_status: '',
    search: ''
  });
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadTalentPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadTalentPool = async () => {
    setLoading(true);
    try {
      const data = await adminService.getTalentPool(filters);
      setConsultants(data.consultants || data);
    } catch (error) {
      showError('Failed to load talent pool');
      console.error('Error loading talent pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (consultant) => {
    setSelectedConsultant(consultant);
    setShowDetailModal(true);
  };

  const handleAssignToProject = (consultant) => {
    setSelectedConsultant(consultant);
    setShowAssignModal(true);
  };

  const getFilteredConsultants = () => {
    return consultants.filter(consultant => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          consultant.full_name?.toLowerCase().includes(searchLower) ||
          consultant.email?.toLowerCase().includes(searchLower) ||
          consultant.skills?.some(skill => skill.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Skills filter
      if (filters.skills) {
        const skillsLower = filters.skills.toLowerCase();
        const hasSkill = consultant.skills?.some(skill => 
          skill.toLowerCase().includes(skillsLower)
        );
        if (!hasSkill) return false;
      }

      // Availability status filter
      if (filters.availability_status && consultant.availability_status !== filters.availability_status) {
        return false;
      }

      return true;
    });
  };

  const filteredConsultants = getFilteredConsultants();

  const getAvailabilityBadge = (status) => {
    const badges = {
      available: 'bg-green-100 text-green-800',
      partially_available: 'bg-yellow-100 text-yellow-800',
      unavailable: 'bg-red-100 text-red-800',
      on_leave: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      available: 'Available',
      partially_available: 'Partially Available',
      unavailable: 'Unavailable',
      on_leave: 'On Leave'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || badges.unavailable}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talent Pool</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and manage available consultants
          </p>
        </div>
        <Button onClick={loadTalentPool}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search"
            placeholder="Search by name, email, or skills"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          
          <Input
            label="Skills"
            placeholder="Filter by skill"
            value={filters.skills}
            onChange={(e) => handleFilterChange('skills', e.target.value)}
          />
          
          <Select
            label="Availability Status"
            value={filters.availability_status}
            onChange={(e) => handleFilterChange('availability_status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'available', label: 'Available' },
              { value: 'partially_available', label: 'Partially Available' },
              { value: 'unavailable', label: 'Unavailable' },
              { value: 'on_leave', label: 'On Leave' }
            ]}
          />
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredConsultants.length} of {consultants.length} consultants
      </div>

      {/* Consultant Cards */}
      {filteredConsultants.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No consultants found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to see more results.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConsultants.map((consultant) => (
            <ConsultantCard
              key={consultant.id}
              consultant={consultant}
              onViewDetails={handleViewDetails}
              onAssignToProject={handleAssignToProject}
              getAvailabilityBadge={getAvailabilityBadge}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedConsultant && (
        <ConsultantDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConsultant(null);
          }}
          consultant={selectedConsultant}
          getAvailabilityBadge={getAvailabilityBadge}
        />
      )}

      {/* Assignment Modal */}
      {selectedConsultant && (
        <ProjectAssignmentModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedConsultant(null);
          }}
          consultant={selectedConsultant}
          onSuccess={() => {
            showSuccess('Consultant assigned to project successfully');
            setShowAssignModal(false);
            setSelectedConsultant(null);
            loadTalentPool();
          }}
        />
      )}
    </div>
  );
};

// Consultant Card Component
const ConsultantCard = ({ consultant, onViewDetails, onAssignToProject, getAvailabilityBadge }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header with Avatar and Name */}
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-medium text-blue-600">
                {consultant.full_name?.charAt(0) || consultant.email?.charAt(0) || '?'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {consultant.full_name || 'Unnamed Consultant'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {consultant.email}
            </p>
          </div>
        </div>

        {/* Availability Status */}
        <div>
          {getAvailabilityBadge(consultant.availability_status)}
        </div>

        {/* Utilization */}
        {consultant.utilization_percentage !== undefined && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Utilization</span>
              <span className="font-medium">{consultant.utilization_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  consultant.utilization_percentage >= 90
                    ? 'bg-red-500'
                    : consultant.utilization_percentage >= 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(consultant.utilization_percentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Skills */}
        {consultant.skills && consultant.skills.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {consultant.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {skill}
                </span>
              ))}
              {consultant.skills.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  +{consultant.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current Projects */}
        {consultant.current_projects && consultant.current_projects.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Current Projects</p>
            <p className="text-sm text-gray-600">
              {consultant.current_projects.length} active project{consultant.current_projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(consultant)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAssignToProject(consultant)}
            className="flex-1"
            disabled={consultant.availability_status === 'unavailable'}
          >
            Assign
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Consultant Detail Modal Component
const ConsultantDetailModal = ({ isOpen, onClose, consultant, getAvailabilityBadge }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consultant Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{consultant.full_name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{consultant.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{consultant.phone || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Availability Status</dt>
              <dd className="mt-1">{getAvailabilityBadge(consultant.availability_status)}</dd>
            </div>
          </dl>
        </div>

        {/* Utilization */}
        {consultant.utilization_percentage !== undefined && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilization</h3>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Current Utilization</span>
              <span className="font-medium">{consultant.utilization_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  consultant.utilization_percentage >= 90
                    ? 'bg-red-500'
                    : consultant.utilization_percentage >= 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(consultant.utilization_percentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Skills */}
        {consultant.skills && consultant.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {consultant.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {consultant.bio && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bio</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{consultant.bio}</p>
          </div>
        )}

        {/* Current Projects */}
        {consultant.current_projects && consultant.current_projects.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Projects</h3>
            <div className="space-y-2">
              {consultant.current_projects.map((project, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {project.name || project.project_name || `Project ${index + 1}`}
                  </p>
                  {project.allocated_hours && (
                    <p className="text-xs text-gray-500 mt-1">
                      Allocated: {project.allocated_hours} hours
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {consultant.experience && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Experience</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{consultant.experience}</p>
          </div>
        )}

        {/* Qualifications */}
        {consultant.qualifications && consultant.qualifications.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Qualifications</h3>
            <ul className="list-disc list-inside space-y-1">
              {consultant.qualifications.map((qual, index) => (
                <li key={index} className="text-sm text-gray-700">{qual}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Project Assignment Modal Component
const ProjectAssignmentModal = ({ isOpen, onClose, consultant, onSuccess }) => {
  const [projectId, setProjectId] = useState('');
  const [allocatedHours, setAllocatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectId) {
      showError('Please enter a project ID');
      return;
    }

    setSubmitting(true);
    try {
      // This would call a project assignment API
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess();
    } catch (error) {
      showError('Failed to assign consultant to project');
      console.error('Error assigning consultant:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign to Project"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Assigning: <span className="font-medium">{consultant.full_name || consultant.email}</span>
          </p>
        </div>

        <Input
          label="Project ID"
          type="text"
          required
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID"
        />

        <Input
          label="Allocated Hours (optional)"
          type="number"
          min="0"
          step="0.5"
          value={allocatedHours}
          onChange={(e) => setAllocatedHours(e.target.value)}
          placeholder="Enter allocated hours"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting}
          >
            Assign to Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TalentPool;
