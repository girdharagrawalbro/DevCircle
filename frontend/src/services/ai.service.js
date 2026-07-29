import api from '../api/axios';

export const aiAPI = {
  improvePost: (content) => api.post('/ai/improve-post', { content }),
  improveQuestion: (title, body) => api.post('/ai/improve-question', { title, body }),
  suggestTags: (content) => api.post('/ai/suggest-tags', { content }),
  validateQuestion: (title, body) => api.post('/ai/validate-question', { title, body }),
};
