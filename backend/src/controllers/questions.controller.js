import * as questionsService from '../services/questions.service.js';

const createQuestion = async (req, res, next) => {
  try {
    const question = await questionsService.createQuestion(req.user._id, req.body.title, req.body.body, req.body.tags, req.body.isAI);
    res.status(201).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { tag, sort = 'newest', search } = req.query;

    const result = await questionsService.getQuestions(page, tag, sort, search);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getUserQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await questionsService.getUserQuestions(req.params.userId, page);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const question = await questionsService.getQuestion(req.params.id);
    res.json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    await questionsService.deleteQuestion(req.params.id, req.user);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

const addAnswer = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const answer = await questionsService.addAnswer(req.params.id, req.user._id, req.user.username, req.body.body, io);
    res.status(201).json({ success: true, answer });
  } catch (error) {
    next(error);
  }
};

const acceptAnswer = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    await questionsService.acceptAnswer(req.params.id, req.params.answerId, req.user._id, req.user.username, io);
    res.json({ success: true, message: 'Answer accepted' });
  } catch (error) {
    next(error);
  }
};

const voteQuestion = async (req, res, next) => {
  try {
    const direction = req.originalUrl.includes('upvote') ? 'up' : 'down';
    const result = await questionsService.voteQuestion(req.params.id, req.user._id, direction);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const voteAnswer = async (req, res, next) => {
  try {
    const direction = req.originalUrl.includes('upvote') ? 'up' : 'down';
    const result = await questionsService.voteAnswer(req.params.answerId, req.user._id, direction);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getTrendingTags = async (req, res, next) => {
  try {
    const tags = await questionsService.getTrendingTags();
    res.json({ success: true, tags });
  } catch (error) {
    next(error);
  }
};

export {
  createQuestion, getQuestions, getQuestion, deleteQuestion,
  addAnswer, acceptAnswer, voteQuestion, voteAnswer, getTrendingTags,
  getUserQuestions,
};
