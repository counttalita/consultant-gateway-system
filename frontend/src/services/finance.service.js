import BaseService from './BaseService';

class FinanceService extends BaseService {
  constructor() {
    super('/finance');
  }

  async getDashboard() {
    return this.get('/dashboard');
  }

  async getRevenue() {
    return this.get('/revenue');
  }

  async getOutstandingInvoices() {
    return this.get('/outstanding_invoices');
  }

  async getUtilization() {
    return this.get('/utilization');
  }

  async getProfitability() {
    return this.get('/profitability');
  }

  async getPaymentAging() {
    return this.get('/payment_aging');
  }

  async exportData(format = 'csv') {
    return this.downloadFile(`/export?format=${format}`);
  }

  async triggerMonthEnd(month, year) {
    return this.post('/month_end', { month, year });
  }

  async generateSimplePayExport(period) {
    return this.downloadFile(`/simplepay_export?period=${period}`);
  }
}

const financeService = new FinanceService();
export default financeService;
