import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsService, consultantService } from '../../services';
import { useNotification } from '../../hooks/useNotification';
import {
  Card,
  Button,
  Table,
  Modal,
  Select,
  Input,
  SkeletonLoader
} from '../../components/shared';

/**
 * Project Details Page
 * Displays detailed project information and manages consultant assignments
 * Requirements: 11.3, 11.4, 11.5
 */
const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableConsultants, setAvailableConsultants] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    consultant_id: '',
    role: '',
    allocated_hours: '',
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await projectsService.getProject(id);
      setProject(data);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load project details');
      if (error.response?.status === 404) {
        navigate('/admin/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableConsultants = async () => {
    try {
      const data = await consultantService.getTalentPool({ availability_status: 'available' });
      setAvailableConsultants(data.consultants || data);
    } catch {
      showError('Failed to load available consultants');
    }
  };

  const handleOpenAssignModal = () => {
    loadAvailableConsultants();
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setAssignmentForm({
      consultant_id: '',
      role: '',
      allocated_hours: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleAssignConsultant = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await projectsService.assignConsultant(id, assignmentForm.consultant_id, {
        role: assignmentForm.role,
        allocated_hours: parseFloat(assignmentForm.allocated_hours) || 0,
        start_date: assignmentForm.start_date || null,
        end_date: assignmentForm.end_date || null
      });
      showSuccess('Consultant assigned successfully');
      handleCloseAssignModal();
      loadProject();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to assign consultant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveConsultant = async (assignmentId, consultantName) => {
    if (!window.confirm(`Remove ${consultantName} from this project?`)) {
      return;
    }

    try {
      await projectsService.removeConsultant(id, assignmentId);
      showSuccess('Consultant removed successfully');
      loadProject();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to remove consultant');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full';
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

  const consultantColumns = [
    {
      key: 'consultant_name',
      label: 'Consultant',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value || row.consultant?.name || 'Unknown'}</p>
          <p className="text-sm text-gray-500">{row.consultant?.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => value || 'N/A'
    },
    {
      key: 'allocated_hours',
      label: 'Allocated Hours',
      render: (value) => `${value || 0} hrs/week`
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleRemoveConsultant(row.id, row.consultant_name || row.consultant?.name)}
        >
          Remove
        </Button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/projects')}
            className="mb-2"
          >
            ← Back to Projects
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        </div>
        <span className={getStatusBadgeClass(project.status)}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      {/* Project Information */}
      <Card title="Project Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <p className="text-gray-900">{project.client_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <p className="text-gray-900">{project.status}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <p className="text-gray-900">{formatDate(project.start_date)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <p className="text-gray-900">{formatDate(project.end_date)}</p>
          </div>

          {project.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-900">{project.description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Integration Links */}
      <Card title="Integration Links">
        <div className="flex flex-wrap gap-4">
          {project.clickup_project_id ? (
            <a
              href={`https://app.clickup.com/${project.clickup_project_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 18h7v2H2v-2zm0-7h9v2H2v-2zm0-7h20v2H2V4zm18.674 9.025l1.156-.391 1.156.391-1.156 3.391-1.156-3.391z"/>
              </svg>
              Open in ClickUp
            </a>
          ) : (
            <p className="text-sm text-gray-500">No ClickUp project linked</p>
          )}

          {project.drive_folder_id ? (
            <a
              href={`https://drive.google.com/drive/folders/${project.drive_folder_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.71 3.5L1.15 15l2.85 5h5.7l6.56-11.5-2.85-5h-5.7zM8 19l-2.85-5L8 9l5.7 10H8zm6.56-11.5L12.7 10 9.85 5h5.7l2.86 5-2.85 5-2.86-5 2.86-2.5z"/>
              </svg>
              Open in Google Drive
            </a>
          ) : (
            <p className="text-sm text-gray-500">No Google Drive folder linked</p>
          )}
        </div>
      </Card>

      {/* Assigned Consultants */}
      <Card
        title="Assigned Consultants"
        action={
          <Button onClick={handleOpenAssignModal}>
            Assign Consultant
          </Button>
        }
      >
        {project.project_assignments && project.project_assignments.length > 0 ? (
          <Table
            columns={consultantColumns}
            data={project.project_assignments}
            keyField="id"
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No consultants assigned yet</p>
            <Button
              onClick={handleOpenAssignModal}
              className="mt-4"
            >
              Assign First Consultant
            </Button>
          </div>
        )}
      </Card>

      {/* Assign Consultant Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={handleCloseAssignModal}
        title="Assign Consultant"
      >
        <form onSubmit={handleAssignConsultant} className="space-y-4">
          <Select
            label="Consultant"
            value={assignmentForm.consultant_id}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, consultant_id: e.target.value })}
            required
            options={[
              { value: '', label: 'Select a consultant' },
              ...availableConsultants.map(c => ({
                value: c.id,
                label: `${c.name || c.user?.email} - ${c.availability_status}`
              }))
            ]}
          />

          <Input
            label="Role"
            value={assignmentForm.role}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, role: e.target.value })}
            placeholder="e.g., Developer, Designer, Project Manager"
          />

          <Input
            label="Allocated Hours (per week)"
            type="number"
            min="0"
            step="0.5"
            value={assignmentForm.allocated_hours}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, allocated_hours: e.target.value })}
            placeholder="40"
          />

          <Input
            label="Start Date"
            type="date"
            value={assignmentForm.start_date}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, start_date: e.target.value })}
          />

          <Input
            label="End Date"
            type="date"
            value={assignmentForm.end_date}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, end_date: e.target.value })}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseAssignModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || !assignmentForm.consultant_id}
            >
              Assign Consultant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
