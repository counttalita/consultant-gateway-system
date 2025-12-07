import BaseService from './BaseService';

/**
 * Finance Service
 * Handles all finance-related API calls including revenue tracking,
 * invoicing, and financial reporting
 */
class FinanceService extends BaseService {
  constructor() {
    super('/finance');
  }

  /**
   * Get finance dashboard metrics
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboard(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getDashboard');
    return this.get('/dashboard', { signal });
  }

  /**
   * Get revenue metrics
   * @param {Object} params - Query parameters (period, etc.)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Revenue data
   */
  async getRevenue(params = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getRevenue');
    return this.get('/revenue', { params, signal });
  }

  /**
   * Get outstanding invoices
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Array>} Outstanding invoices
   */
  async getOutstandingInvoices(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getOutstandingInvoices');
    return this.get('/outstanding_invoices', { signal });
  }

  /**
   * Get consultant utilization metrics
   * @param {Object} params - Query parameters (period, etc.)
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Array>} Utilization data
   */
  async getUtilization(params = {}, options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getUtilization');
    return this.get('/utilization', { params, signal });
  }

  /**
   * Get project profitability metrics
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Array>} Profitability data
   */
  async getProfitability(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getProfitability');
    return this.get('/profitability', { signal });
  }

  /**
   * Get payment aging report
   * @param {Object} options - Request options including signal for cancellation
   * @returns {Promise<Object>} Payment aging data
   */
  async getPaymentAging(options = {}) {
    const { signal } = options.cancelToken || this.createCancelToken('getPaymentAging');
    return this.get('/payment_aging', { signal });
  }

  /**
   * Export financial data
   * @param {string} format - Export format (csv, excel)
   * @param {Object} params - Query parameters (period, etc.)
   * @returns {Promise<Blob>} File blob
   */
  async exportData(format = 'csv', params = {}) {
    return this.downloadFile('/export', { 
      params: { format, ...params }
    });
  }

  /**
   * Trigger month-end processing
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year
   * @returns {Promise<Object>} Processing results
   */
  async triggerMonthEnd(month, year) {
    return this.post('/month_end', { month, year });
  }

  /**
   * Generate SimplePay export file
   * @param {string} period - Period in YYYY-MM format
   * @returns {Promise<Blob>} CSV file blob
   */
  async generateSimplePayExport(period) {
    return this.downloadFile('/simplepay_export', { 
      params: { period }
    });
  }
}

const financeService = new FinanceService();
export default financeService;
