import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { postsAPI } from '../../services/posts.service';

export const fetchFeed = createAsyncThunk('posts/feed', async (page = 1, { rejectWithValue }) => {
  try {
    const res = await postsAPI.getFeed(page);
    return { ...res.data, page };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load feed');
  }
});

export const fetchTrending = createAsyncThunk('posts/trending', async (_, { rejectWithValue }) => {
  try {
    const res = await postsAPI.getTrending();
    return res.data.posts;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createPost = createAsyncThunk('posts/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await postsAPI.create(formData);
    return res.data.post;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create post');
  }
});

export const updatePost = createAsyncThunk('posts/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await postsAPI.updatePost(id, data);
    return res.data.post;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update post');
  }
});

export const deletePost = createAsyncThunk('posts/delete', async (id, { rejectWithValue }) => {
  try {
    await postsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const likePost = createAsyncThunk('posts/like', async (id, { rejectWithValue }) => {
  try {
    const res = await postsAPI.like(id);
    return { id, likes: res.data.likes };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const unlikePost = createAsyncThunk('posts/unlike', async (id, { rejectWithValue }) => {
  try {
    const res = await postsAPI.unlike(id);
    return { id, likes: res.data.likes };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    feed: [],
    trending: [],
    page: 1,
    totalPages: 1,
    loading: false,
    trendingLoading: false,
    error: null,
    creating: false,
  },
  reducers: {
    clearPosts: (state) => { state.feed = []; state.page = 1; },
    addComment: (state, action) => {
      const { postId, comment } = action.payload;
      const post = state.feed.find((p) => p._id === postId);
      if (post) post.comments.push(comment);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        
        if (action.payload.page === 1) {
          state.feed = action.payload.posts;
        } else {
          state.feed = [...state.feed, ...action.payload.posts];
        }
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })

      .addCase(fetchTrending.pending, (state) => { state.trendingLoading = true; })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trendingLoading = false; state.trending = action.payload;
      })
      .addCase(fetchTrending.rejected, (state) => { state.trendingLoading = false; })

      .addCase(createPost.pending, (state) => { state.creating = true; })
      .addCase(createPost.fulfilled, (state, action) => {
        state.creating = false;
        state.feed.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.creating = false; state.error = action.payload;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.feed.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.feed[index] = action.payload;
        const trendIndex = state.trending.findIndex((p) => p._id === action.payload._id);
        if (trendIndex !== -1) state.trending[trendIndex] = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.feed = state.feed.filter((p) => p._id !== action.payload);
      })

      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.feed.find((p) => p._id === action.payload.id);
        if (post) {
          post.likes = action.payload.likes;
          post.likeCount = action.payload.likes.length;
        }
      })
      .addCase(unlikePost.fulfilled, (state, action) => {
        const post = state.feed.find((p) => p._id === action.payload.id);
        if (post) {
          post.likes = action.payload.likes;
          post.likeCount = action.payload.likes.length;
        }
      });
  },
});

export const { clearPosts, addComment } = postsSlice.actions;
export const selectFeed = (state) => state.posts.feed;
export const selectTrending = (state) => state.posts.trending;
export const selectPostsLoading = (state) => state.posts.loading;
export const selectPostsPage = (state) => state.posts.page;
export const selectPostsTotalPages = (state) => state.posts.totalPages;
export const selectPostCreating = (state) => state.posts.creating;

export default postsSlice.reducer;
