import api from '../api/axios';

export const postsAPI = {
  create: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  getFeed: (page = 1) => api.get(`/posts/feed?page=${page}`),
  getTrending: () => api.get('/posts/trending'),
  getUserPosts: (userId, page = 1) => api.get(`/posts/user/${userId}?page=${page}`),
  getPost: (id) => api.get(`/posts/${id}`),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  unlike: (id) => api.post(`/posts/${id}/unlike`),
  repost: (id) => api.post(`/posts/${id}/repost`),
  addComment: (id, content) => api.post(`/posts/${id}/comment`, { content }),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comment/${commentId}`),
  report: (id) => api.post(`/posts/${id}/report`),
};
