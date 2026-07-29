import express from 'express';
const router = express.Router();
import {
  createQuestion, getQuestions, getQuestion, deleteQuestion,
  addAnswer, acceptAnswer, voteQuestion, voteAnswer, getTrendingTags, getUserQuestions
} from '../controllers/questions.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

router.get('/tags', authenticate, getTrendingTags);
router.post('/', authenticate, createQuestion);
router.get('/', authenticate, getQuestions);
router.get('/user/:userId', authenticate, getUserQuestions);
router.get('/:id', authenticate, getQuestion);
router.delete('/:id', authenticate, deleteQuestion);
router.post('/:id/answers', authenticate, addAnswer);
router.put('/:id/answers/:answerId/accept', authenticate, acceptAnswer);
router.post('/:id/upvote', authenticate, voteQuestion);
router.post('/:id/downvote', authenticate, voteQuestion);
router.post('/:id/answers/:answerId/upvote', authenticate, voteAnswer);
router.post('/:id/answers/:answerId/downvote', authenticate, voteAnswer);

export default router;
