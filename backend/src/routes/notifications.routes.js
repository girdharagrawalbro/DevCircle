import express from 'express';
const router = express.Router();
import { getNotifications, markRead, markAllRead } from '../controllers/notifications.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

router.get('/', authenticate, getNotifications);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);

export default router;
