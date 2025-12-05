import api from './api';

const financeService = {
  async getDashboard() {
    const response = await api.get('/finance/dashboard');
    return response.data;
  },

  async getRevenue() {
    const response = await api.get('/finance/revenue');
    return response.data;
  },

  async getOutstandingInvoices() {
    const response = await api.get('/finance/outstanding_invoices');
    return response.data;
  },

  async getUtilization() {
    const response = await api.get('/finance/utilization');
    return response.data;
  },

  async getProfitability() {
    const response = await api.get('/finance/profitability');
    return response.data;
  },

  async getPaymentAging() {
    const response = await api.get('/finance/payment_aging');
    return response.data;
  },

  async exportData(format = 'csv') {
    const response = await api.get(`/finance/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default financeService;
