import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFeed, selectFeed, selectPostsLoading, selectPostsPage, selectPostsTotalPages
} from '../features/posts/postsSlice';
import { fetchTrendingTags, selectTrendingTags } from '../features/qa/qaSlice';
import { selectUser } from '../features/auth/authSlice';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import { useNavigate } from 'react-router-dom';

import useScrollToTop from '../hooks/useScrollToTop';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const PostSkeleton = () => (
  <div className="p-stack-md border-b border-outline-variant/10">
    <div className="flex gap-3">
      <Skeleton circle width={40} height={40} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton width={120} height={16} />
          <Skeleton width={60} height={12} />
        </div>
        <Skeleton count={2} className="mb-2" />
        <Skeleton width="60%" className="mb-4" />
        <div className="mt-2 flex justify-between max-w-xs">
          <Skeleton width={40} height={16} />
          <Skeleton width={40} height={16} />
          <Skeleton width={40} height={16} />
        </div>
      </div>
    </div>
  </div>
);

export default function Feed() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const posts = useSelector(selectFeed);
  const loading = useSelector(selectPostsLoading);
  const page = useSelector(selectPostsPage);
  const totalPages = useSelector(selectPostsTotalPages);
  const trendingTags = useSelector(selectTrendingTags);
  const observer = useRef(null);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  useEffect(() => {
    dispatch(fetchFeed(1));
    dispatch(fetchTrendingTags());
  }, [dispatch]);

  const lastPostRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < totalPages) {
        dispatch(fetchFeed(page + 1));
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, page, totalPages, dispatch]);

  return (
    <div className="flex justify-center w-full min-h-screen">

      <main className="w-full max-w-4xl min-w-0 py-stack-md md:py-stack-lg px-margin-mobile md:px-gutter">

        <PostComposer />

        <div className="divide-y divide-outline-variant/10">
          {posts.length === 0 && loading && (
            <SkeletonTheme baseColor="#141414" highlightColor="#222222">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </SkeletonTheme>
          )}

          {posts.length === 0 && !loading && (
            <div className="glass-panel rounded-xl p-gutter text-center py-16 max-w-md mx-auto my-8">
              <span className="material-symbols-outlined text-5xl mb-4 block text-on-surface-variant/40">rss_feed</span>
              <p className="text-on-surface font-headline-sm font-bold mb-2">No posts to display</p>
              <p className="text-on-surface-variant font-body-md">Your feed is empty. Follow developers to see their posts.</p>
            </div>
          )}

          {posts.map((post, idx) => {
            if (idx === posts.length - 1) {
              return <div key={post._id} ref={lastPostRef}><PostCard post={post} /></div>;
            }
            return <PostCard key={post._id} post={post} />;
          })}

          {posts.length > 0 && loading && (
            <SkeletonTheme baseColor="#141414" highlightColor="#222222">
              <PostSkeleton />
            </SkeletonTheme>
          )}
        </div>
      </main>

      <aside className="hidden lg:flex flex-col w-[320px] p-gutter sticky top-0 h-screen overflow-y-auto space-y-gutter border-l border-outline-variant/10">
        <section className="glass-panel rounded-2xl p-4 border border-outline-variant/20">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-primary">trending_up</span>
            Trending Topics
          </h2>
          <div className="space-y-3">
            {trendingTags.length === 0 ? (
              <p className="text-xs text-on-surface-variant/70 italic px-2">No trending topics yet.</p>
            ) : (
              trendingTags.slice(0, 6).map((t) => (
                <div
                  key={t.tag}
                  onClick={() => navigate(`/questions?tag=${t.tag}`)}
                  className="p-3 hover:bg-white/[0.05] transition-all rounded-xl cursor-pointer border border-transparent hover:border-outline-variant/20 group"
                >
                  <p className="font-bold text-on-surface text-body-md group-hover:text-primary transition-colors">#{t.tag}</p>
                  <p className="text-on-surface-variant font-label-sm mt-1">{t.count} {t.count === 1 ? 'question' : 'questions'}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="px-2 text-on-surface-variant/50 font-label-sm flex flex-wrap gap-x-4 gap-y-2">
          <span>© 2026 DevCircle</span>
        </footer>
      </aside>

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
