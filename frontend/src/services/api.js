import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const addTransaction = async (data) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get('/transactions');
  return response.data;
};

export const analyzeScam = async (message) => {
  const response = await api.post('/analyze-scam', { message });
  return response.data;
};

export const getAnalytics = async (history) => {
  const response = await api.post('/analytics', { history });
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

export const deleteAllTransactions = async () => {
  const response = await api.delete('/transactions');
  return response.data;
};

export const decryptImage = async (file, passkey) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('passkey', passkey);
  const response = await api.post('/decrypt-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
