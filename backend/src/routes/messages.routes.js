import express from 'express';
const router = express.Router();
import { sendMessage, getMessages, getConversations } from '../controllers/messages.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

export default router;
