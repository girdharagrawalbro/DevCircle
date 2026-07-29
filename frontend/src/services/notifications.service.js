import api from '../api/axios';

export const notificationsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/notifications?page=${page}&limit=${limit}`),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
