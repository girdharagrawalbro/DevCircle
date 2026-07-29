import api from '../api/axios';

export const searchAPI = {
  search: (q, type = 'all') => api.get(`/search?q=${encodeURIComponent(q)}&type=${type}`),
};
