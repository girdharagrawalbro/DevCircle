import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsAPI } from '../../services/notifications.service';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (page = 1, { rejectWithValue }) => {
  try {
    const res = await notificationsAPI.getAll(page);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markRead = createAsyncThunk('notifications/markRead', async (id) => {
  await notificationsAPI.markRead(id);
  return id;
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationsAPI.markAllRead();
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    page: 1,
    totalPages: 1,
  },
  reducers: {
    pushNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.unreadCount = action.payload.unreadCount;
        if (action.payload.page === 1) {
          state.items = action.payload.notifications;
        } else {
          state.items = [...state.items, ...action.payload.notifications];
        }
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false; })

      .addCase(markRead.fulfilled, (state, action) => {
        const n = state.items.find((i) => i._id === action.payload);
        if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })

      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.read = true; });
        state.unreadCount = 0;
      });
  },
});

export const { pushNotification } = notificationsSlice.actions;
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsPage = (state) => state.notifications.page;
export const selectNotificationsTotalPages = (state) => state.notifications.totalPages;
export const selectNotificationsLoading = (state) => state.notifications.loading;

export default notificationsSlice.reducer;
