import { useEffect, useCallback, useRef } from 'react';
import useScrollToTop from '../hooks/useScrollToTop';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications, markRead, markAllRead, selectNotifications,
  selectNotificationsPage, selectNotificationsTotalPages, selectNotificationsLoading
} from '../features/notifications/notificationsSlice';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const page = useSelector(selectNotificationsPage);
  const totalPages = useSelector(selectNotificationsTotalPages);
  const loading = useSelector(selectNotificationsLoading);
  const observer = useRef(null);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  useEffect(() => {
    dispatch(fetchNotifications(1));
  }, [dispatch]);

  const lastNotificationRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < totalPages) {
        dispatch(fetchNotifications(page + 1));
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, page, totalPages, dispatch]);

  const handleRead = (id) => {
    dispatch(markRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <span className="material-symbols-outlined text-error font-fill-1 text-sm">favorite</span>;
      case 'comment':
        return <span className="material-symbols-outlined text-primary font-fill-1 text-sm">chat_bubble</span>;
      case 'follow':
        return <span className="material-symbols-outlined text-secondary font-fill-1 text-sm">person_add</span>;
      case 'repost':
        return <span className="material-symbols-outlined text-secondary font-fill-1 text-sm">repeat</span>;
      case 'answer':
        return <span className="material-symbols-outlined text-primary font-fill-1 text-sm">quiz</span>;
      case 'accept_answer':
        return <span className="material-symbols-outlined text-secondary font-fill-1 text-sm">check_circle</span>;
      default:
        return <span className="material-symbols-outlined text-outline text-sm">notifications</span>;
    }
  };

  const getNotificationText = (n) => {
    const senderName = n.sender?.name || n.sender?.username || 'Someone';
    switch (n.type) {
      case 'like':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> liked your post
          </span>
        );
      case 'comment':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> commented on your post
          </span>
        );
      case 'follow':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> started following you
          </span>
        );
      case 'repost':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> reposted your post
          </span>
        );
      case 'answer':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> answered your question
          </span>
        );
      case 'accept_answer':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> accepted your answer 🎉
          </span>
        );
      case 'mention':
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> mentioned you
          </span>
        );
      default:
        return (
          <span>
            <strong className="text-on-surface font-bold">{senderName}</strong> interacted with you
          </span>
        );
    }
  };

  const getTargetLink = (n) => {
    if (n.type === 'follow' && n.sender?._id) {
      return `/profile/${n.sender._id}`;
    }
    if ((n.type === 'answer' || n.type === 'accept_answer') && n.referenceId) {
      return `/questions/${n.referenceId}`;
    }
    if (n.referenceId && (n.type === 'like' || n.type === 'comment' || n.type === 'repost')) {
      return `/posts/${n.referenceId}`;
    }
    return n.sender?._id ? `/profile/${n.sender._id}` : '#';
  };

  return (
    <div className="flex w-full min-h-screen">
      <main className="flex-1 flex justify-center py-stack-md md:py-stack-lg px-margin-mobile md:px-gutter">
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-stack-lg border-b border-outline-variant/20 pb-4">
            <h1 className="text-[24px] font-serif tracking-tight text-on-surface">Notifications</h1>
            <button
              onClick={handleMarkAllRead}
              className="text-primary hover:underline flex items-center gap-1.5 p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="Mark all as read"
            >
              <span className="material-symbols-outlined text-[22px]">done_all</span>
              <span className="hidden sm:inline text-label-sm font-bold uppercase tracking-wider">Mark all as read</span>
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="glass-panel rounded-xl p-gutter text-center py-16 border border-outline-variant/20 max-w-md mx-auto my-8">
              <span className="material-symbols-outlined text-5xl mb-4 block text-on-surface-variant/40">notifications_off</span>
              <p className="text-on-surface font-headline-sm font-bold mb-2">Clean slate!</p>
              <p className="text-on-surface-variant font-body-md">No notifications yet. We'll alert you when there is activity.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, idx) => {
                const targetLink = getTargetLink(n);
                const isLast = idx === notifications.length - 1;

                return (
                  <Link
                    key={n._id}
                    ref={isLast ? lastNotificationRef : null}
                    to={targetLink}
                    onClick={() => !n.read && handleRead(n._id)}
                    className={`p-gutter rounded-xl flex items-center gap-4 transition-all border border-outline-variant/30 question-card-hover hover:bg-white/[0.05] block ${n.read ? 'glass-panel opacity-70 hover:opacity-100' : 'glass-panel'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center font-bold text-primary text-lg border border-outline-variant/20">
                        {n.sender?.avatar ? (
                          <img src={n.sender.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (n.sender?.username?.[0] || n.sender?.name?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                        {getIcon(n.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-body-md text-on-surface-variant">{getNotificationText(n)}</p>
                      <span className="text-label-sm text-on-surface-variant/60 mt-0.5 block">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {!n.read && <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0" />}
                  </Link>
                );
              })}

              {loading && (
                <div className="flex justify-center p-gutter">
                  <div className="w-6 h-6 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 w-10 h-10 md:w-12 md:h-12 bg-primary text-on-primary-fixed rounded-full shadow-2xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all border border-primary/30"
          title="Go to top"
        >
          <span className="material-symbols-outlined text-[20px] md:text-2xl font-bold">arrow_upward</span>
        </button>
      )}
    </div>
  );
}
