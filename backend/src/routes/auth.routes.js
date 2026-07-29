import express from 'express';
const router = express.Router();
import { register, login, logout, refreshToken, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateRegister, validateLogin } from '../middlewares/validateAuth.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many authentication attempts, please try again later.' });

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);

export default router;
