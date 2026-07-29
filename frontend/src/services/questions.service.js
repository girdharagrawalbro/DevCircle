import api from '../api/axios';

export const questionsAPI = {
  create: (data) => api.post('/questions', data),
  getAll: (params) => api.get('/questions', { params }),
  getOne: (id) => api.get(`/questions/${id}`),
  delete: (id) => api.delete(`/questions/${id}`),
  addAnswer: (id, body) => api.post(`/questions/${id}/answers`, { body }),
  acceptAnswer: (qId, aId) => api.put(`/questions/${qId}/answers/${aId}/accept`),
  upvoteQ: (id) => api.post(`/questions/${id}/upvote`),
  downvoteQ: (id) => api.post(`/questions/${id}/downvote`),
  upvoteA: (qId, aId) => api.post(`/questions/${qId}/answers/${aId}/upvote`),
  downvoteA: (qId, aId) => api.post(`/questions/${qId}/answers/${aId}/downvote`),
  getTrendingTags: () => api.get('/questions/tags'),
  getUserQuestions: (userId, page = 1) => api.get(`/questions/user/${userId}?page=${page}`),
};
