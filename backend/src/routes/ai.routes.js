import express from 'express';
const router = express.Router();
import { improvePost, improveQuestion, suggestTags, validateQuestion } from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

router.post('/improve-post', authenticate, improvePost);
router.post('/improve-question', authenticate, improveQuestion);
router.post('/suggest-tags', authenticate, suggestTags);
router.post('/validate-question', authenticate, validateQuestion);

export default router;
