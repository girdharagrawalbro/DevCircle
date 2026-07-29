import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';

const throwError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

const PAGE_SIZE = 10;

export const createPost = async (authorId, content, file, isAI = false) => {
  let image = '';
  if (file) {
    image = file.path;
  }

  if (!content && !image) {
    throwError(400, 'Post must have content or an image');
  }

  const post = await Post.create({ author: authorId, content, image, isAI: !!isAI });
  await post.populate('author', 'name username avatar');
  return post;
};

export const updatePost = async (postId, authorId, content, file) => {
  const post = await Post.findById(postId);
  if (!post) throwError(404, 'Post not found');
  if (post.author.toString() !== authorId.toString()) {
    throwError(403, 'Unauthorized to edit this post');
  }

  if (content !== undefined) post.content = content;
  if (file) {
    post.image = file.path;
  }

  await post.save();
  await post.populate('author', 'name username avatar');
  return post;
};

export const getFeed = async (page, user) => {
  const following = user?.following || [];
  const userIds = user?._id ? [...following, user._id] : following;

  const query = { isReported: false };

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('author', 'name username avatar')
    .populate({ path: 'originalPost', populate: { path: 'author', select: 'name username avatar' } });

  // prioritize followed users / self posts while maintaining reverse-chronological order
  const followedSet = new Set(userIds.map(id => id.toString()));
  posts.sort((a, b) => {
    const aFollowed = a.author && followedSet.has(a.author._id?.toString() || a.author.toString());
    const bFollowed = b.author && followedSet.has(b.author._id?.toString() || b.author.toString());

    if (aFollowed && !bFollowed) return -1;
    if (!aFollowed && bFollowed) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return { posts, page, totalPages: Math.ceil(total / PAGE_SIZE), total };
};

export const getTrending = async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const posts = await Post.aggregate([
    { $match: { createdAt: { $gte: since }, isReported: false } },
    { $addFields: { likeCount: { $size: '$likes' }, commentCount: { $size: '$comments' } } },
    { $sort: { likeCount: -1, commentCount: -1, createdAt: -1 } },
    { $limit: 20 },
  ]);

  await Post.populate(posts, { path: 'author', select: 'name username avatar' });
  return posts;
};

export const getUserPosts = async (userId, page) => {
  const query = {
    $or: [
      { author: userId },
      { reposts: userId }
    ]
  };

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate('author', 'name username avatar')
    .populate({ path: 'originalPost', populate: { path: 'author', select: 'name username avatar' } });

  const total = await Post.countDocuments(query);
  return { posts, page, totalPages: Math.ceil(total / PAGE_SIZE), total };
};

export const getPost = async (postId) => {
  const post = await Post.findById(postId)
    .populate('author', 'name username avatar')
    .populate({ path: 'comments', populate: { path: 'author', select: 'name username avatar' } })
    .populate({ path: 'originalPost', populate: { path: 'author', select: 'name username avatar' } });

  if (!post) throwError(404, 'Post not found');
  return post;
};

export const deletePost = async (postId, user) => {
  const post = await Post.findById(postId);
  if (!post) throwError(404, 'Post not found');

  if (post.author.toString() !== user._id.toString() && user.role !== 'admin') {
    throwError(403, 'Not authorized');
  }

  if (post.isRepost && post.originalPost) {
    await Post.findByIdAndUpdate(post.originalPost, {
      $pull: { reposts: post.author }
    });
  }

  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
};

export const likePost = async (postId, user, io) => {
  const post = await Post.findById(postId);
  if (!post) throwError(404, 'Post not found');

  const alreadyLiked = post.likes.includes(user._id);
  if (alreadyLiked) {
    throwError(400, 'Already liked');
  }

  post.likes.push(user._id);
  await post.save();

  if (post.author.toString() !== user._id.toString()) {
    await Notification.create({
      recipient: post.author,
      sender: user._id,
      type: 'like',
      referenceId: post._id,
      referenceModel: 'Post',
    });
    io?.to(post.author.toString()).emit('notification', { type: 'like', sender: user.username });
  }

  return post.likes;
};

export const unlikePost = async (postId, userId) => {
  const post = await Post.findByIdAndUpdate(
    postId,
    { $pull: { likes: userId } },
    { new: true }
  );
  if (!post) throwError(404, 'Post not found');
  return post.likes;
};

export const repost = async (postId, userId) => {
  const original = await Post.findById(postId);
  if (!original) throwError(404, 'Post not found');

  const alreadyReposted = original.reposts.includes(userId);
  if (alreadyReposted) {
    throwError(400, 'Already reposted');
  }

  original.reposts.push(userId);
  await original.save();

  const newPost = await Post.create({
    author: userId,
    content: original.content,
    image: original.image,
    isRepost: true,
    originalPost: original._id,
  });

  await newPost.populate('author', 'name username avatar');
  return newPost;
};

export const addComment = async (postId, userId, username, content, io) => {
  const post = await Post.findById(postId);
  if (!post) throwError(404, 'Post not found');

  const comment = await Comment.create({ post: post._id, author: userId, content });
  post.comments.push(comment._id);
  await post.save();

  await comment.populate('author', 'name username avatar');

  if (post.author.toString() !== userId.toString()) {
    await Notification.create({
      recipient: post.author,
      sender: userId,
      type: 'comment',
      referenceId: post._id,
      referenceModel: 'Post',
    });
    io?.to(post.author.toString()).emit('notification', { type: 'comment', sender: username });
  }

  return comment;
};

export const deleteComment = async (postId, commentId, user) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throwError(404, 'Comment not found');

  if (comment.author.toString() !== user._id.toString() && user.role !== 'admin') {
    throwError(403, 'Not authorized');
  }

  await Post.findByIdAndUpdate(postId, { $pull: { comments: comment._id } });
  await comment.deleteOne();
};

export const reportPost = async (postId) => {
  await Post.findByIdAndUpdate(postId, { $inc: { reportCount: 1 }, isReported: true });
};
