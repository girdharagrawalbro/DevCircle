import api from '../api/axios';

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (receiverId, content) => api.post('/messages', { receiverId, content }),
};
