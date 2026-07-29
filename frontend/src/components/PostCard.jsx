import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { likePost, unlikePost, deletePost, updatePost, fetchFeed } from '../features/posts/postsSlice';
import { selectUser } from '../features/auth/authSlice';
import { postsAPI } from '../services/posts.service';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [updating, setUpdating] = useState(false);
  const [liking, setLiking] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [postLikes, setPostLikes] = useState(post.likes || []);
  const [postReposts, setPostReposts] = useState(post.reposts || []);

  const isLiked = Boolean(currentUser?._id && postLikes.includes(currentUser._id));
  const isReposted = Boolean(currentUser?._id && postReposts.includes(currentUser._id));
  const isOwn = post.author?._id === currentUser?._id;

  const handleLike = async () => {
    if (!currentUser) return toast.error('Login to like posts');
    if (liking) return;

    const previousLikes = postLikes;
    const newLikes = isLiked
      ? postLikes.filter((id) => id !== currentUser._id)
      : [...postLikes, currentUser._id];

    setPostLikes(newLikes);
    setLiking(true);

    try {
      let res;
      if (isLiked) {
        res = await dispatch(unlikePost(post._id)).unwrap();
      } else {
        res = await dispatch(likePost(post._id)).unwrap();
      }
      if (res && res.likes) {
        setPostLikes(res.likes);
      }
    } catch {
      setPostLikes(previousLikes);
      toast.error('Failed to update like status');
    } finally {
      setLiking(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments && comments.length > 0 && typeof comments[0] === 'string') {
      setLoadingComments(true);
      try {
        const res = await postsAPI.getPost(post._id);
        setComments(res.data.post.comments);
      } catch (err) {
        toast.error('Failed to load comments');
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    await dispatch(deletePost(post._id));
    toast.success('Post deleted');
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim() && !post.image) return toast.error('Post cannot be empty');
    if (editContent.length > 2000) return toast.error('Post content must be at most 2000 characters');
    setUpdating(true);
    const result = await dispatch(updatePost({ id: post._id, data: { content: editContent.trim() } }));
    setUpdating(false);
    if (updatePost.fulfilled.match(result)) {
      setIsEditing(false);
      toast.success('Post updated');
    } else {
      toast.error(result.payload || 'Failed to update post');
    }
  };

  const handleRepost = async () => {
    if (!currentUser) return toast.error('Login to repost');
    if (isReposted) return toast.error('You already reposted this post');
    if (reposting) return;

    const previousReposts = postReposts;
    setPostReposts([...postReposts, currentUser._id]);
    setReposting(true);

    try {
      await postsAPI.repost(post._id);
      toast.success('Reposted!');
      dispatch(fetchFeed(1));
    } catch (err) {
      setPostReposts(previousReposts);
      toast.error(err.response?.data?.message || 'Repost failed');
    } finally {
      setReposting(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const res = await postsAPI.addComment(post._id, comment.trim());
      setComments((prev) => [...prev, res.data.comment]);
      setComment('');
    } catch {
      toast.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const initials = post.author?.username?.[0]?.toUpperCase() || '?';

  return (
    <article className="p-gutter hover:bg-white/[0.05] transition-all cursor-pointer group rounded-xl border border-transparent hover:border-outline-variant/20 mb-2">
      {post.isRepost && (
        <p className="text-on-surface-variant font-label-sm mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">repeat</span>
          Reposted
        </p>
      )}

      <div className="flex gap-stack-md">
        <div className="w-12 h-12 rounded-xl bg-surface-variant overflow-hidden shrink-0">
          {post.author?.avatar ? (
            <img className="w-full h-full object-cover" src={post.author.avatar} alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-on-surface text-lg">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
              <Link to={`/profile/${post.author?._id}`} className="font-bold text-on-surface hover:underline truncate block">
                {post.author?.name || `@${post.author?.username}`}
              </Link>
              <div className="flex flex-wrap items-center gap-x-1.5 text-on-surface-variant font-label-sm">
                {post.author?.name && <span>@{post.author?.username}</span>}
                <span className="hidden sm:inline">·</span>
                <span className="text-xs shrink-0">{timeAgo}</span>
              </div>
            </div>
            {isOwn ? (
              <div className="flex gap-2 shrink-0 ml-2">
                <button onClick={() => setIsEditing(!isEditing)} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onClick={handleDelete} className="text-on-surface-variant hover:text-error transition-colors p-1">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ) : (
              <div className="shrink-0 ml-2">
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">more_horiz</span>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-stack-sm">
              <textarea
                className="w-full bg-surface-container rounded-lg p-2 border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary resize-none"
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-label-sm ${editContent.length > 1900 ? 'text-error' : 'text-on-surface-variant/50'}`}>
                  {editContent.length}/2000
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-label-sm px-3 py-1 text-on-surface-variant hover:bg-surface-variant rounded">Cancel</button>
                  <button onClick={handleEditSubmit} disabled={updating} className="text-label-sm px-3 py-1 bg-primary text-on-primary-fixed rounded font-bold hover:opacity-90">{updating ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          ) : (
            post.content && (
              <p className="mt-stack-sm font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            )
          )}

          {post.image && (
            <div className="mt-stack-md rounded-xl overflow-hidden border border-outline-variant/30 max-h-[500px] bg-[#050505] flex items-center justify-center">
              <img src={post.image} alt="Post" className="w-full h-auto max-h-[500px] object-contain rounded-xl" />
            </div>
          )}

          <div className="flex justify-between mt-stack-md max-w-sm text-on-surface-variant">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 transition-colors group/icon disabled:opacity-50 ${isLiked ? 'text-error' : 'hover:text-error'}`}
            >
              <span
                className="material-symbols-outlined group-hover/icon:bg-error/10 rounded-full p-2"
                style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
              <span className="text-label-sm">{postLikes.length}</span>
            </button>

            <button
              onClick={handleToggleComments}
              className={`flex items-center gap-2 hover:text-primary transition-colors group/icon ${loadingComments ? 'animate-pulse' : ''}`}
            >
              <span className="material-symbols-outlined group-hover/icon:bg-primary/10 rounded-full p-2">chat_bubble</span>
              <span className="text-label-sm">{comments.length}</span>
            </button>

            <button
              onClick={handleRepost}
              disabled={reposting}
              className={`flex items-center gap-2 transition-colors group/icon disabled:opacity-50 ${isReposted ? 'text-secondary' : 'hover:text-secondary'}`}
            >
              <span className="material-symbols-outlined group-hover/icon:bg-secondary/10 rounded-full p-2">repeat</span>
              <span className="text-label-sm">{postReposts.length}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-stack-md border-t border-outline-variant/10 pt-stack-md space-y-3">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {c.author?.avatar ? (
                      <img src={c.author.avatar} alt={c.author.username} className="w-full h-full object-cover" />
                    ) : (
                      c.author?.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 bg-surface-container-high rounded-lg px-3 py-2">
                    <span className="text-primary font-bold text-xs">@{c.author?.username} </span>
                    <span className="font-body-md text-on-surface-variant">{c.content}</span>
                  </div>
                </div>
              ))}
              {currentUser && (
                <form onSubmit={handleComment} className="flex gap-2 mt-2">
                  <input
                    className="flex-1 bg-[#050505] border border-outline-variant/30 rounded-lg px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary transition-colors placeholder:text-outline"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !comment.trim()}
                    className="bg-primary text-on-primary-fixed px-4 py-2 rounded-lg font-bold text-label-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
