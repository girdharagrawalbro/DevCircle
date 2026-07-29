import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchQuestions, selectQuestions, selectQALoading,
  fetchTrendingTags, selectTrendingTags,
} from '../features/qa/qaSlice';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { selectUser } from '../features/auth/authSlice';
import { formatDistanceToNow } from 'date-fns';
import useScrollToTop from '../hooks/useScrollToTop';

export default function Questions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag') || '';
  const questions = useSelector(selectQuestions);
  const loading = useSelector(selectQALoading);
  const trendingTags = useSelector(selectTrendingTags);
  const [sort, setSort] = useState('newest');
  const { showScrollTop, scrollToTop } = useScrollToTop();

  const setActiveTag = (tag) => {
    if (tag) setSearchParams({ tag });
    else setSearchParams({});
  };

  useEffect(() => {
    dispatch(fetchTrendingTags());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchQuestions({ sort, tag: activeTag }));
  }, [dispatch, sort, activeTag]);

  const sortedTags = [...trendingTags].sort((a, b) => b.count - a.count);
  return (
    <div className="flex justify-center w-full min-h-screen">
      <main className="w-full max-w-4xl min-w-0 px-margin-mobile md:px-gutter py-stack-md md:py-stack-lg">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md mb-stack-lg">
          <div>
            <h1 className="mb-stack-md text-[24px] font-serif tracking-tight text-on-surface">Explore Questions</h1>
            <p className="text-on-surface-variant font-body-md mt-1">Discover technical solutions from the community.</p>
          </div>
          <Link
            to="/questions/ask"
            className="bg-primary text-on-primary-fixed py-stack-sm px-stack-lg rounded-lg font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:opacity-90"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Ask Question
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-stack-md mb-gutter md:border-b border-outline-variant/20 pb-0 md:pb-4">
          <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/30">
            {['newest', 'active', 'unanswered'].map((opt) => (
              <button
                key={opt}
                onClick={() => setSort(opt)}
                className={`px-4 py-1.5 rounded-md text-body-md transition-all capitalize ${sort === opt ? 'bg-[#6366F1] text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-label-sm font-label-sm text-outline-variant uppercase tracking-wider">
            {questions.length} Questions found
          </div>
        </div>

        {sortedTags.length > 0 && (
          <div className="mb-gutter">
            <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-outline-variant mb-2">Filter by Trending Topic</h3>
            <div className="flex flex-nowrap lg:flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveTag('')}
                className={`px-3 py-1 rounded text-label-sm font-label-sm border border-outline-variant/30 transition-colors shrink-0 ${!activeTag ? 'bg-[#6366F1] text-white border-transparent' : 'bg-surface-container-highest text-on-surface-variant hover:text-primary'
                  }`}
              >
                All
              </button>
              {sortedTags.slice(0, 8).map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setActiveTag(activeTag === t.tag ? '' : t.tag)}
                  className={`px-3 py-1 rounded text-label-sm font-label-sm border border-outline-variant/30 transition-colors shrink-0 ${activeTag === t.tag ? 'bg-[#6366F1] text-white border-transparent' : 'bg-surface-container-highest text-on-surface-variant hover:text-primary'
                    }`}
                >
                  #{t.tag} <span className="opacity-75 ml-1">({t.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="glass-panel rounded-xl p-gutter text-center py-16 border border-outline-variant/20 max-w-md mx-auto my-8">
            <span className="material-symbols-outlined text-5xl mb-4 block text-on-surface-variant/40">quiz</span>
            <p className="text-on-surface font-headline-sm font-bold mb-2">No questions found</p>
            <p className="text-on-surface-variant font-body-md">Be the first to ask the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const score = (q.upvotes?.length || 0) - (q.downvotes?.length || 0);
              const answerCount = q.answerCount ?? q.answers?.length ?? 0;
              const hasAccepted = !!q.acceptedAnswer;
              const isAI = !!q.isAI;

              return (
                <div
                  key={q._id}
                  onClick={() => navigate(`/questions/${q._id}`)}
                  className={`glass-panel p-gutter rounded-xl transition-all cursor-pointer relative overflow-hidden border border-outline-variant/30 question-card-hover hover:bg-white/[0.05] ${hasAccepted ? 'border-l-4 border-l-secondary' : ''
                    }`}
                >
                  {isAI && (
                    <div className="absolute top-3 right-3" title="AI Enhanced Question">
                      <span className="material-symbols-outlined text-primary text-xl font-fill-1 opacity-70">auto_awesome</span>
                    </div>
                  )}
                  <div className="flex gap-gutter">
                    <div className="hidden sm:flex flex-col items-center gap-4 text-center min-w-[64px]">
                      <div className="flex flex-col">
                        <span className="font-headline-md text-on-surface">{score}</span>
                        <span className="text-label-sm text-outline-variant">votes</span>
                      </div>
                      <div className={`flex flex-col ${hasAccepted ? 'text-secondary bg-secondary/5 rounded-lg p-1' : 'text-outline-variant'}`}>
                        <span className="font-headline-md">{answerCount}</span>
                        <span className="text-label-sm">answers</span>
                        {hasAccepted && (
                          <span className="material-symbols-outlined text-sm mt-1 font-fill-1">check_circle</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h2 className="font-headline-md text-headline-md text-on-surface mb-2 hover:text-primary transition-colors">
                        {q.title}
                      </h2>
                      <p className="text-on-surface-variant font-body-md line-clamp-2 mb-4">
                        {q.body?.slice(0, 180)}{q.body?.length > 180 ? '...' : ''}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-stack-md">
                        <div className="flex gap-2 flex-wrap">
                          {q.tags?.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="bg-surface-container-highest px-3 py-1 rounded text-label-sm font-label-sm text-on-surface-variant hover:text-primary cursor-pointer border border-outline-variant/30 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg overflow-hidden border border-primary/20 bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {q.author?.avatar ? (
                              <img src={q.author.avatar} alt={q.author.username} className="w-full h-full object-cover" />
                            ) : (
                              q.author?.username?.[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="text-label-sm font-label-sm text-outline-variant">
                            Asked by{' '}
                            <span className="text-on-surface">{q.author?.username}</span>{' '}
                            {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                  onClick={() => setActiveTag(t.tag)}
                  className={`p-3 transition-all rounded-xl cursor-pointer border group ${activeTag.toLowerCase() === t.tag.toLowerCase()
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-transparent hover:border-outline-variant/20 hover:bg-white/[0.05]'
                    }`}
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
