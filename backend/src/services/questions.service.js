import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Notification from '../models/Notification.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

const PAGE_SIZE = 10;

export const createQuestion = async (authorId, title, body, tags, isAI = false) => {
  const parsedTags = Array.isArray(tags) ? tags : (tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  const question = await Question.create({
    author: authorId,
    title,
    body,
    tags: parsedTags,
    isAI: !!isAI,
  });

  await question.populate('author', 'name username avatar');
  return question;
};

export const getQuestions = async (page, tag, sort, search) => {
  const filter = {};
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };

  let sortOption = { createdAt: -1 };
  if (sort === 'votes') sortOption = { 'upvotes.length': -1 };
  if (sort === 'unanswered') filter.answers = { $size: 0 };

  const questions = await Question.find(filter)
    .sort(sortOption)
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('author', 'name username avatar')
    .select('-body');

  const total = await Question.countDocuments(filter);
  return { questions, page, totalPages: Math.ceil(total / PAGE_SIZE), total };
};

export const getQuestion = async (questionId) => {
  const question = await Question.findByIdAndUpdate(
    questionId,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('author', 'name username avatar')
    .populate({
      path: 'answers',
      populate: { path: 'author', select: 'name username avatar' },
      options: { sort: { isAccepted: -1, createdAt: -1 } },
    })
    .populate('acceptedAnswer');

  if (!question) throwError(404, 'Question not found');
  return question;
};

export const deleteQuestion = async (questionId, user) => {
  const question = await Question.findById(questionId);
  if (!question) throwError(404, 'Question not found');

  if (question.author.toString() !== user._id.toString() && user.role !== 'admin') {
    throwError(403, 'Not authorized');
  }

  await Answer.deleteMany({ question: question._id });
  await question.deleteOne();
};

export const addAnswer = async (questionId, userId, username, body, io) => {
  const question = await Question.findById(questionId);
  if (!question) throwError(404, 'Question not found');

  const answer = await Answer.create({
    question: question._id,
    author: userId,
    body: body,
  });

  question.answers.push(answer._id);
  await question.save();

  await answer.populate('author', 'name username avatar');

  if (question.author.toString() !== userId.toString()) {
    await Notification.create({
      recipient: question.author,
      sender: userId,
      type: 'answer',
      referenceId: question._id,
      referenceModel: 'Question',
    });
    io?.to(question.author.toString()).emit('notification', { type: 'answer', sender: username });
  }

  return answer;
};

export const acceptAnswer = async (questionId, answerId, userId, username, io) => {
  const question = await Question.findById(questionId);
  if (!question) throwError(404, 'Question not found');

  if (question.author.toString() !== userId.toString()) {
    throwError(403, 'Only question author can accept answers');
  }

  if (question.acceptedAnswer) {
    await Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false });
  }

  await Answer.findByIdAndUpdate(answerId, { isAccepted: true });
  question.acceptedAnswer = answerId;
  await question.save();

  const answer = await Answer.findById(answerId);
  
  if (answer.author.toString() !== userId.toString()) {
    await Notification.create({
      recipient: answer.author,
      sender: userId,
      type: 'accept_answer',
      referenceId: question._id,
      referenceModel: 'Question',
    });
    io?.to(answer.author.toString()).emit('notification', { type: 'accept_answer', sender: username });
  }
};

const vote = async (Model, id, userId, direction) => {
  const doc = await Model.findById(id);
  if (!doc) throwError(404, 'Not found');

  const uIdStr = userId.toString();
  const upvoted = doc.upvotes.some((i) => i.toString() === uIdStr);
  const downvoted = doc.downvotes.some((i) => i.toString() === uIdStr);

  if (direction === 'up') {
    if (upvoted) {
      doc.upvotes = doc.upvotes.filter((i) => i.toString() !== uIdStr);
    } else {
      doc.upvotes.push(userId);
      doc.downvotes = doc.downvotes.filter((i) => i.toString() !== uIdStr);
    }
  } else {
    if (downvoted) {
      doc.downvotes = doc.downvotes.filter((i) => i.toString() !== uIdStr);
    } else {
      doc.downvotes.push(userId);
      doc.upvotes = doc.upvotes.filter((i) => i.toString() !== uIdStr);
    }
  }

  await doc.save();
  return { upvotes: doc.upvotes.length, downvotes: doc.downvotes.length, score: doc.upvotes.length - doc.downvotes.length };
};

export const voteQuestion = async (questionId, userId, direction) => {
  return vote(Question, questionId, userId, direction);
};

export const voteAnswer = async (answerId, userId, direction) => {
  return vote(Answer, answerId, userId, direction);
};

export const getTrendingTags = async () => {
  const tags = await Question.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 },
    { $project: { tag: '$_id', count: 1, _id: 0 } },
  ]);
  return tags;
};

export const getUserQuestions = async (userId, page = 1) => {
  const questions = await Question.find({ author: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('author', 'name username avatar')
    .select('-body');

  const total = await Question.countDocuments({ author: userId });
  return { questions, page, totalPages: Math.ceil(total / PAGE_SIZE), total };
};