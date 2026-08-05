import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, selectUser, selectInitialized } from './features/auth/authSlice';
import { fetchNotifications } from './features/notifications/notificationsSlice';
import { initSocket, disconnectSocket } from './socket/socketClient';
import Sidebar from './components/Sidebar';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import AskQuestion from './pages/AskQuestion';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import toast, { Toaster } from 'react-hot-toast';

const AUTH_ROUTES = ['/login', '/register'];

function ProtectedRoute({ children }) {
  const user = useSelector(selectUser);
  const initialized = useSelector(selectInitialized);
  if (!initialized) return <div className="spinner spinner-lg spinner-center" />;
  return user ? children : <Navigate to="/login" />;
}

function AppLayout({ children }) {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  if (isAuthPage) return <>{children}</>;

  const isChatOpenOnMobile = location.pathname.startsWith('/messages/') && location.pathname !== '/messages';

  return (
    <div className="flex min-h-screen max-w-xxl mx-auto">
      <Sidebar />
      <div className={`flex-1 min-w-0 relative ${isChatOpenOnMobile ? '' : 'pt-14 pb-16 md:pt-0 md:pb-0'}`}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const initialized = useSelector(selectInitialized);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchMe());
    else dispatch({ type: 'auth/me/rejected' }); // mark initialized
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    const socket = initSocket(user._id);
    dispatch(fetchNotifications());

    socket.on('notification', (data) => {
      dispatch(fetchNotifications());

      const { type, sender } = data;
      if (type === 'message') return;

      let msg = 'New notification';
      if (type === 'like') msg = `${sender} liked your post!`;
      if (type === 'comment') msg = `${sender} commented on your post!`;
      if (type === 'answer') msg = `${sender} answered your question!`;
      if (type === 'accept_answer') msg = `${sender} accepted your answer! 🎉`;
      if (type === 'follow') msg = `${sender} started following you!`;

      toast(msg, { icon: '🔔' });
    });

    socket.on('new_message', (msg) => {
      const activeChatId = window.location.pathname.split('/messages/')[1];
      if (activeChatId === msg.sender._id.toString()) return;
      toast(`New message from ${msg.sender.username}`, { icon: '💬' });
    });

    return () => {
      socket.off('notification');
      socket.off('new_message');
      disconnectSocket();
    };
  }, [user, dispatch]);

  if (!initialized && localStorage.getItem('accessToken')) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050505' }}>
        <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#121212',
            color: '#f4f3ef',
            border: '1px solid #262626',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'sans-serif',
          },
          success: { iconTheme: { primary: '#8ea687', secondary: '#121212' } },
          error: { iconTheme: { primary: '#c97b7b', secondary: '#121212' } },
        }}
      />
      <AppLayout>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
          <Route path="/questions/ask" element={<ProtectedRoute><AskQuestion /></ProtectedRoute>} />
          <Route path="/questions/:id" element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </>
  );
}
