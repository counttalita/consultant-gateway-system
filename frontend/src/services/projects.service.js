import BaseService from './BaseService';

/**
 * Projects Service
 * Handles all project-related API calls including project management
 * and consultant assignments
 */
class ProjectsService extends BaseService {
  constructor() {
    super('/projects');
  }

  /**
   * Get all projects with optional filters
   * @param {Object} filters - Filter parameters (status, client_name, etc.)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Projects data with pagination
   */
  async getProjects(filters = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getProjects');
    return this.get('', { params: filters, signal });
  }

  /**
   * Get a single project by ID
   * @param {number|string} id - Project ID
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Project data with assignments and details
   */
  async getProject(id, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getProject-${id}`);
    return this.get(`/${id}`, { signal });
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} Created project data
   */
  async createProject(projectData) {
    return this.post('', projectData);
  }

  /**
   * Update project details
   * @param {number|string} id - Project ID
   * @param {Object} projectData - Updated project data
   * @returns {Promise<Object>} Updated project data
   */
  async updateProject(id, projectData) {
    return this.patch(`/${id}`, projectData);
  }

  /**
   * Assign a consultant to a project
   * @param {number|string} projectId - Project ID
   * @param {number|string} consultantId - Consultant ID
   * @param {Object} assignmentData - Assignment details (role, allocated_hours, start_date, end_date)
   * @returns {Promise<Object>} Assignment data
   */
  async assignConsultant(projectId, consultantId, assignmentData = {}) {
    return this.post(`/${projectId}/assignments`, {
      consultant_id: consultantId,
      ...assignmentData
    });
  }

  /**
   * Remove a consultant from a project
   * @param {number|string} projectId - Project ID
   * @param {number|string} assignmentId - Assignment ID
   * @returns {Promise<Object>} Response data
   */
  async removeConsultant(projectId, assignmentId) {
    return this.delete(`/${projectId}/assignments/${assignmentId}`);
  }

  /**
   * Update project assignment details
   * @param {number|string} projectId - Project ID
   * @param {number|string} assignmentId - Assignment ID
   * @param {Object} assignmentData - Updated assignment data (allocated_hours, role, etc.)
   * @returns {Promise<Object>} Updated assignment data
   */
  async updateAssignment(projectId, assignmentId, assignmentData) {
    return this.patch(`/${projectId}/assignments/${assignmentId}`, assignmentData);
  }

  /**
   * Get project assignments
   * @param {number|string} projectId - Project ID
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Array>} Project assignments
   */
  async getAssignments(projectId, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getAssignments-${projectId}`);
    return this.get(`/${projectId}/assignments`, { signal });
  }

  /**
   * Archive a project
   * @param {number|string} id - Project ID
   * @returns {Promise<Object>} Response data
   */
  async archiveProject(id) {
    return this.patch(`/${id}/archive`);
  }
}

const projectsService = new ProjectsService();
export default projectsService;
