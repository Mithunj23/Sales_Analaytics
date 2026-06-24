import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getMonthlyRevenue: () => api.get('/revenue/monthly'),
  getRegionalPerformance: () => api.get('/regional/performance'),
  getCustomerSegmentation: () => api.get('/customers/segmentation'),
  getProductPerformance: () => api.get('/products/performance'),
  getDiscountAnalysis: () => api.get('/discounts/analysis'),
  getParetoAnalysis: () => api.get('/pareto/analysis'),
  getTrendDetection: () => api.get('/trends/detection'),
  getAnomalyDetection: () => api.get('/anomalies/detection'),
  getAIInsights: () => api.get('/insights/ai'),
  getDatasetStatus: () => api.get('/dataset/status'),
  uploadCSV: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/dataset/upload', fd)
  },
}

export const reportAPI = {
  downloadRevenueCsv: () => `${API_BASE}/reports/revenue/csv`,
  downloadCustomerCsv: () => `${API_BASE}/reports/customers/csv`,
  downloadProductCsv: () => `${API_BASE}/reports/products/csv`,
  downloadInsightsJson: () => `${API_BASE}/reports/insights/json`,
}

export default api
