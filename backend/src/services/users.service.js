import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Post from '../models/Post.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Comment from '../models/Comment.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

export const getProfile = async (targetId, currentUserId) => {
  const user = await User.findById(targetId)
    .select('-passwordHash -refreshToken')
    .populate('followers', 'name username avatar')
    .populate('following', 'name username avatar');

  if (!user) throwError(404, 'User not found');

  const isFollowing = currentUserId
    ? user.followers.some((f) => f._id.toString() === currentUserId.toString())
    : false;

  const past120Days = new Date();
  past120Days.setDate(past120Days.getDate() - 120);

  const targetObjectId = user._id;

  const [postsActivity, questionsActivity, answersActivity, commentsActivity] = await Promise.all([
    Post.aggregate([
      { $match: { author: targetObjectId, createdAt: { $gte: past120Days } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
    ]),
    Question.aggregate([
      { $match: { author: targetObjectId, createdAt: { $gte: past120Days } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
    ]),
    Answer.aggregate([
      { $match: { author: targetObjectId, createdAt: { $gte: past120Days } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
    ]),
    Comment.aggregate([
      { $match: { author: targetObjectId, createdAt: { $gte: past120Days } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
    ]),
  ]);

  const activityMap = {};
  const mergeActivity = (activityArray) => {
    activityArray.forEach((item) => {
      activityMap[item._id] = (activityMap[item._id] || 0) + item.count;
    });
  };

  mergeActivity(postsActivity);
  mergeActivity(questionsActivity);
  mergeActivity(answersActivity);
  mergeActivity(commentsActivity);

  return { user, isFollowing, activityMap };
};

export const updateProfile = async (userId, currentUsername, body, file) => {
  const { name, username, bio, skills, githubLink } = body;
  const updates = {};

  if (name !== undefined) updates.name = name;

  if (username && username !== currentUsername) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throwError(409, 'Username is already taken');
    }
    updates.username = username;
  }

  if (bio !== undefined) updates.bio = bio;
  if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim()).filter(Boolean);
  if (githubLink !== undefined) {
    let formattedGithub = githubLink.trim();
    if (formattedGithub && !formattedGithub.startsWith('http://') && !formattedGithub.startsWith('https://')) {
      formattedGithub = `https://${formattedGithub}`;
    }
    updates.githubLink = formattedGithub;
  }
  if (file) {
    updates.avatar = file.path;
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select('-passwordHash -refreshToken');

  return user;
};

export const followUser = async (targetId, currentId, currentUsername, io) => {
  if (targetId === currentId.toString()) {
    throwError(400, "You can't follow yourself");
  }

  const target = await User.findById(targetId);
  if (!target) throwError(404, 'User not found');

  const alreadyFollowing = target.followers.includes(currentId);
  if (alreadyFollowing) {
    throwError(400, 'Already following this user');
  }

  await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentId } });
  await User.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } });

  await Notification.create({
    recipient: targetId,
    sender: currentId,
    type: 'follow',
  });

  io?.to(targetId).emit('notification', { type: 'follow', sender: currentUsername });
};

export const unfollowUser = async (targetId, currentId) => {
  await User.findByIdAndUpdate(targetId, { $pull: { followers: currentId } });
  await User.findByIdAndUpdate(currentId, { $pull: { following: targetId } });
};

export const getFollowers = async (userId) => {
  const user = await User.findById(userId)
    .select('followers')
    .populate('followers', 'name username avatar bio');
  if (!user) throwError(404, 'User not found');
  return user.followers;
};

export const getFollowing = async (userId) => {
  const user = await User.findById(userId)
    .select('following')
    .populate('following', 'name username avatar bio');
  if (!user) throwError(404, 'User not found');
  return user.following;
};

export const checkUsername = async (username, currentUserId) => {
  if (!username) throwError(400, 'Username required');

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    if (currentUserId && existingUser._id.toString() === currentUserId.toString()) {
      return true;
    }
    return false;
  }
  return true;
};
