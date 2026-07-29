import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import useLogout from '../hooks/useLogout';
import { selectUnreadCount } from '../features/notifications/notificationsSlice';

const navItems = [
  { path: '/', icon: 'rss_feed', label: 'Feed' },
  { path: '/search', icon: 'search', label: 'Search' },
  { path: '/questions', icon: 'quiz', label: 'Q&A' },
  { path: '/messages', icon: 'chat', label: 'Messages' },
  { path: '/notifications', icon: 'notifications', label: 'Notifications' },
  { path: '/profile', icon: 'person', label: 'Profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const user = useSelector(selectUser);
  const unreadCount = useSelector(selectUnreadCount);

  const profilePath = user ? `/profile/${user._id}` : '/login';
  const isProfileActive = location.pathname.startsWith('/profile');
  const isChatOpenOnMobile = location.pathname.startsWith('/messages/') && location.pathname !== '/messages';

  const logout = useLogout();

  return (
    <>
      {/* for mobile header */}
      {!isChatOpenOnMobile && (
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-outline-variant/10 flex items-center justify-between px-4 z-40">
          <Link to="/" className="text-lg font-serif tracking-tight text-on-surface">
            DevCircle
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/search" className="p-1 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </Link>
            <Link to="/notifications" className="relative p-1 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-error rounded-full border border-surface" />
              )}
            </Link>
          </div>
        </header>
      )}

      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-surface-container border-r border-outline-variant/20 px-4 py-6 select-none">
        <div className="px-4 mb-stack-lg">
          <Link to="/" className="text-[20px] font-serif tracking-tight text-on-surface">
            DevCircle
          </Link>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const href = item.path === '/profile' ? profilePath : item.path;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors relative group ${isActive
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-highest'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
              >
                <span
                  className="material-symbols-outlined group-hover:scale-110 transition-transform"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-body-md text-body-md">{item.label}</span>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-outline-variant/20 pt-stack-md">
          <Link
            to={user ? '/questions/ask' : '/login'}
            className="w-full bg-primary text-on-primary-fixed py-stack-sm px-stack-lg rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 hover:opacity-90"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Ask Question
          </Link>
          <div className="space-y-1">
            {user && (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-stack-sm px-stack-lg bg-error/10 border border-error/20 text-[#c97b7b] rounded-xl font-bold hover:bg-error/20 hover:border-error/30 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-[#c97b7b]">exit_to_app</span>
                <span className="font-body-md text-body-md">Logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {!isChatOpenOnMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container border-t border-outline-variant/20 flex items-center justify-around px-margin-mobile z-50">
          <Link to="/" className={`flex flex-col items-center ${location.pathname === '/' ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={location.pathname === '/' ? { fontVariationSettings: "'FILL' 1" } : {}}>rss_feed</span>
          </Link>
          <Link to="/questions" className={`flex flex-col items-center ${location.pathname.startsWith('/questions') ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={location.pathname.startsWith('/questions') ? { fontVariationSettings: "'FILL' 1" } : {}}>quiz</span>
          </Link>
          <Link to={user ? '/questions/ask' : '/login'} className="w-12 h-12 bg-primary rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-on-primary-fixed">add</span>
          </Link>
          <Link to="/messages" className={`flex flex-col items-center ${location.pathname.startsWith('/messages') ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={location.pathname.startsWith('/messages') ? { fontVariationSettings: "'FILL' 1" } : {}}>chat</span>
          </Link>
          <Link to={profilePath} className={`flex flex-col items-center ${isProfileActive ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={isProfileActive ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          </Link>
        </nav>
      )}
    </>
  );
}