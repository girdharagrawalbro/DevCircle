import express from 'express';
const router = express.Router();
import {
  getProfile, updateProfile, followUser, unfollowUser, getFollowers, getFollowing, checkUsername
} from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { uploadAvatar } from '../middlewares/upload.js';

router.get('/check-username', checkUsername);
router.get('/:id', authenticate, getProfile);
router.put('/profile', authenticate, uploadAvatar.single('avatar'), updateProfile);
router.post('/:id/follow', authenticate, followUser);
router.post('/:id/unfollow', authenticate, unfollowUser);
router.get('/:id/followers', authenticate, getFollowers);
router.get('/:id/following', authenticate, getFollowing);

export default router;
