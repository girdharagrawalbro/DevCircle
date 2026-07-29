import express from 'express';
const router = express.Router();
import {
  createPost, updatePost, getFeed, getTrending, getPost, getUserPosts, deletePost,
  likePost, unlikePost, repost, addComment, deleteComment, reportPost,
} from '../controllers/posts.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { uploadPostImage } from '../middlewares/upload.js';

router.post('/', authenticate, uploadPostImage.single('image'), createPost);
router.put('/:id', authenticate, uploadPostImage.single('image'), updatePost);
router.get('/feed', authenticate, getFeed);
router.get('/trending', authenticate, getTrending);
router.get('/user/:userId', authenticate, getUserPosts);
router.get('/:id', authenticate, getPost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/unlike', authenticate, unlikePost);
router.post('/:id/repost', authenticate, repost);
router.post('/:id/comment', authenticate, addComment);
router.delete('/:id/comment/:commentId', authenticate, deleteComment);
router.post('/:id/report', authenticate, reportPost);

export default router;
