import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const getKPIs            = (period)       => api.get('/api/energy/kpis', { params: { period } }).then(r => r.data);
export const getLatest          = ()             => api.get('/api/energy/latest').then(r => r.data);
export const getMonthlyKPIs     = ()             => api.get('/api/energy/monthly').then(r => r.data);
export const getAnomalies       = ()             => api.get('/api/energy/anomalies').then(r => r.data);
export const getAnomaliesHistory= ()             => api.get('/api/energy/anomalies/history').then(r => r.data);
export const getMonthlyReport   = (month)        => api.get('/api/energy/reports', { params: { month } }).then(r => r.data);
export const getZonesDetail     = ()             => api.get('/api/energy/zones').then(r => r.data);
export const getPredictions     = ()             => api.get('/api/energy/predictions').then(r => r.data);
export const getSimulatorStatus = ()             => api.get('/api/simulate/status').then(r => r.data);
export const startSimulator     = ()             => api.post('/api/simulate/start').then(r => r.data);
export const stopSimulator      = ()             => api.post('/api/simulate/stop').then(r => r.data);
export const getActiveTariff     = ()             => api.get('/api/energy/tariffs').then(r => r.data);
export const updateTariff        = (data)         => api.put('/api/energy/tariffs', data).then(r => r.data);

