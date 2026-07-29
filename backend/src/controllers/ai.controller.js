import * as aiService from '../services/ai.service.js';

const improvePost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const improved = await aiService.improvePost(content);
    res.json({ success: true, improved });
  } catch (error) {
    next(error);
  }
};

const improveQuestion = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!body) return res.status(400).json({ success: false, message: 'Body is required' });

    const improved = await aiService.improveQuestion(title || '', body);
    res.json({ success: true, improved });
  } catch (error) {
    next(error);
  }
};

const suggestTags = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const tags = await aiService.suggestTags(content);
    res.json({ success: true, tags });
  } catch (error) {
    next(error);
  }
};

const validateQuestion = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'Title and body are required' });

    const result = await aiService.validateQuestion(title, body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export { improvePost, improveQuestion, suggestTags, validateQuestion };
