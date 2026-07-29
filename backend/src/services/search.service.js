import User from '../models/User.js';
import Post from '../models/Post.js';
import Question from '../models/Question.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

export const globalSearch = async (q, type) => {
  if (!q || q.trim().length < 2) {
    throwError(400, 'Search query must be at least 2 characters');
  }

  const regex = new RegExp(q.trim(), 'i');
  const results = {};

  if (type === 'all' || type === 'users') {
    results.users = await User.find({
      $or: [{ name: regex }, { username: regex }, { bio: regex }, { skills: { $in: [regex] } }],
    })
      .select('name username avatar bio skills')
      .limit(10);
  }

  if (type === 'all' || type === 'posts') {
    results.posts = await Post.find({ content: regex, isReported: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'name username avatar');
  }

  if (type === 'all' || type === 'questions') {
    results.questions = await Question.find({
      $or: [{ title: regex }, { tags: { $in: [regex] } }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('author', 'name username avatar')
      .select('-body');
  }

  return results;
};
