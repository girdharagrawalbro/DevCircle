import * as postsService from '../services/posts.service.js';

const createPost = async (req, res, next) => {
  try {
    const isAI = req.body.isAI === 'true' || req.body.isAI === true;
    const post = await postsService.createPost(req.user._id, req.body.content, req.file, isAI);
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await postsService.updatePost(req.params.id, req.user._id, req.body.content, req.file);
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await postsService.getFeed(page, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getTrending = async (req, res, next) => {
  try {
    const posts = await postsService.getTrending();
    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await postsService.getUserPosts(req.params.userId, page);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const post = await postsService.getPost(req.params.id);
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await postsService.deletePost(req.params.id, req.user);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const likes = await postsService.likePost(req.params.id, req.user, io);
    res.json({ success: true, likes });
  } catch (error) {
    next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const likes = await postsService.unlikePost(req.params.id, req.user._id);
    res.json({ success: true, likes });
  } catch (error) {
    next(error);
  }
};

const repost = async (req, res, next) => {
  try {
    const post = await postsService.repost(req.params.id, req.user._id);
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const comment = await postsService.addComment(req.params.id, req.user._id, req.user.username, req.body.content, io);
    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await postsService.deleteComment(req.params.id, req.params.commentId, req.user);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

const reportPost = async (req, res, next) => {
  try {
    await postsService.reportPost(req.params.id);
    res.json({ success: true, message: 'Post reported' });
  } catch (error) {
    next(error);
  }
};

export {
  createPost, updatePost, getFeed, getTrending, getPost, getUserPosts, deletePost,
  likePost, unlikePost, repost, addComment, deleteComment, reportPost,
};
