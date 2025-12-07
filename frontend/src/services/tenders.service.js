import BaseService from './BaseService';

/**
 * Tenders Service
 * Handles all API calls related to tender/opportunity management
 * including bid decisions and tender tracking
 */
class TendersService extends BaseService {
  constructor() {
    super('/tenders');
  }

  /**
   * Get all tenders with optional filters
   * @param {Object} filters - Filter parameters (status, search, bid_decision, etc.)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Tenders data with pagination
   */
  async getTenders(filters = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getTenders');
    return this.get('', { params: filters, signal });
  }

  /**
   * Get a single tender by ID
   * @param {string|number} id - Tender ID
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Tender data with bid score and details
   */
  async getTender(id, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken(`getTender-${id}`);
    return this.get(`/${id}`, { signal });
  }

  /**
   * Create a new tender
   * @param {Object} tenderData - Tender data
   * @returns {Promise<Object>} Created tender data
   */
  async createTender(tenderData) {
    return this.post('', tenderData);
  }

  /**
   * Update tender details
   * @param {string|number} id - Tender ID
   * @param {Object} tenderData - Updated tender data
   * @returns {Promise<Object>} Updated tender data
   */
  async updateTender(id, tenderData) {
    return this.patch(`/${id}`, tenderData);
  }

  /**
   * Update tender bid decision
   * @param {string|number} id - Tender ID
   * @param {string} decision - Bid decision (pursue, decline, pending)
   * @param {string} rationale - Rationale for the decision
   * @returns {Promise<Object>} Updated tender data
   */
  async updateBidDecision(id, decision, rationale) {
    return this.patch(`/${id}`, {
      bid_decision: decision,
      bid_rationale: rationale
    });
  }

  /**
   * Get bid score for a tender
   * @param {string|number} id - Tender ID
   * @returns {Promise<Object>} Bid score data with breakdown
   */
  async getBidScore(id) {
    return this.get(`/${id}/bid_score`);
  }

  /**
   * Archive a tender
   * @param {string|number} id - Tender ID
   * @returns {Promise<Object>} Response data
   */
  async archiveTender(id) {
    return this.delete(`/${id}`);
  }

  /**
   * Unarchive a tender
   * @param {string|number} id - Tender ID
   * @returns {Promise<Object>} Response data
   */
  async unarchiveTender(id) {
    return this.patch(`/${id}/unarchive`);
  }
}

const tendersService = new TendersService();
export default tendersService;
