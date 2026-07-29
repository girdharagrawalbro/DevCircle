import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchQuestion, selectCurrentQuestion, selectQALoading,
  addAnswer
} from '../features/qa/qaSlice';
import { selectUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { questionsAPI } from '../services/questions.service';

import useScrollToTop from '../hooks/useScrollToTop';

export default function QuestionDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const q = useSelector(selectCurrentQuestion);
  const loading = useSelector(selectQALoading);
  const user = useSelector(selectUser);

  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  useEffect(() => {
    dispatch(fetchQuestion(id));
  }, [dispatch, id]);

  const handleVote = async (type) => {
    if (!user) return toast.error('Login to vote');
    try {
      if (type === 'upvote') await questionsAPI.upvoteQ(id);
      else await questionsAPI.downvoteQ(id);
      dispatch(fetchQuestion(id));
    } catch {
      toast.error('Failed to vote');
    }
  };

  const handlePostAnswer = async () => {
    if (!answerBody.trim()) return toast.error('Answer cannot be empty');
    if (answerBody.trim().length < 20) {
      return toast.error('Answer must be at least 20 characters long');
    }
    setSubmitting(true);
    try {
      await dispatch(addAnswer({ id: id, body: answerBody })).unwrap();
      setAnswerBody('');
      toast.success('Answer posted');
    } catch (err) {
      toast.error(err || 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !q) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const score = (q.upvotes?.length || 0) - (q.downvotes?.length || 0);
  const isQUpvoted = Boolean(user && q.upvotes?.some((id) => (id._id || id).toString() === user._id.toString()));
  const isQDownvoted = Boolean(user && q.downvotes?.some((id) => (id._id || id).toString() === user._id.toString()));

  return (
    <div className="flex w-full min-h-screen">
      <main className="flex-1 min-w-0">
        <div className="px-margin-mobile md:px-gutter py-stack-lg max-w-4xl mx-auto">
          <article className="mb-stack-lg">
            <div className="flex items-start gap-gutter">
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  onClick={() => handleVote('upvote')}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all group ${isQUpvoted
                    ? 'border-secondary bg-secondary/20'
                    : 'border-outline-variant/30 hover:border-secondary hover:bg-secondary/10'
                    }`}
                  title={isQUpvoted ? 'Remove upvote' : 'Upvote question'}
                >
                  <span className={`material-symbols-outlined transition-colors ${isQUpvoted ? 'text-secondary' : 'text-outline group-hover:text-secondary'}`}>
                    arrow_upward
                  </span>
                </button>
                <span className="font-code-block text-headline-md font-bold text-on-surface">{score}</span>
                <button
                  onClick={() => handleVote('downvote')}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all group ${isQDownvoted
                    ? 'border-error bg-error/20 text-error'
                    : 'border-outline-variant/30 hover:border-error hover:bg-error/10'
                    }`}
                  title={isQDownvoted ? 'Remove downvote' : 'Downvote question'}
                >
                  <span className={`material-symbols-outlined transition-colors ${isQDownvoted ? 'text-error' : 'text-outline group-hover:text-error'}`}>
                    arrow_downward
                  </span>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-stack-sm break-words flex flex-wrap items-center gap-2">
                  <span>{q.title}</span>
                  {q.isAI && (
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0 font-fill-1 opacity-70" title="AI Enhanced Question">
                      auto_awesome
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-label-sm text-outline mb-stack-md">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Asked {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {q.tags?.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-surface-container rounded font-code-block text-[11px] text-primary border border-primary/20">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="prose prose-invert max-w-none space-y-4 text-on-surface-variant font-body-lg whitespace-pre-wrap">
                  {q.body}
                </div>

                <div className="mt-8 flex justify-end">
                  <div className="bg-surface-container-high p-4 rounded-xl border border-outline-variant/20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {q.author?.avatar ? <img className="w-full h-full object-cover" src={q.author.avatar} alt="" /> : q.author?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-label-sm text-outline">Asked by</p>
                      <Link to={`/profile/${q.author?._id}`} className="text-body-md font-bold text-primary hover:underline">
                        {q.author?.username}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="h-px bg-outline-variant/10 w-full mb-stack-lg" />

          <div className="flex items-center justify-between mb-stack-md">
            <h3 className="font-headline-md text-headline-md text-on-surface">{q.answers?.length || 0} Answers</h3>
          </div>

          <div className="space-y-stack-lg mb-stack-lg">
            {q.answers?.map((ans) => {
              const isAccepted = Boolean(ans.isAccepted) || (q.acceptedAnswer?._id || q.acceptedAnswer)?.toString() === ans._id?.toString();
              const ansScore = (ans.upvotes?.length || 0) - (ans.downvotes?.length || 0);
              const isAnsUpvoted = Boolean(user && ans.upvotes?.some((id) => (id._id || id).toString() === user._id.toString()));
              const isAnsDownvoted = Boolean(user && ans.downvotes?.some((id) => (id._id || id).toString() === user._id.toString()));

              const handleAnsVote = async (type) => {
                if (!user) return toast.error('Login to vote');
                try {
                  if (type === 'upvote') await questionsAPI.upvoteA(q._id, ans._id);
                  else await questionsAPI.downvoteA(q._id, ans._id);
                  dispatch(fetchQuestion(id));
                } catch {
                  toast.error('Failed to vote');
                }
              };

              const handleAccept = async () => {
                if (!user || user._id !== q.author._id) return;
                try {
                  await questionsAPI.acceptAnswer(q._id, ans._id);
                  toast.success('Answer marked as accepted!');
                  dispatch(fetchQuestion(id));
                } catch {
                  toast.error('Failed to accept answer');
                }
              };

              return (
                <div key={ans._id} className="relative group">
                  <div className={`glass-panel p-gutter rounded-xl transition-all border question-card-hover hover:bg-white/[0.05] ${isAccepted ? 'border-l-4 border-l-secondary border-outline-variant/30' : 'border-outline-variant/30'
                    }`}>
                    <div className="flex items-start gap-gutter">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => handleAnsVote('upvote')}
                          className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${isAnsUpvoted
                            ? 'border-secondary bg-secondary/20'
                            : 'border-outline-variant/30 hover:border-secondary'
                            }`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isAnsUpvoted ? 'text-secondary' : 'text-outline'}`}>expand_less</span>
                        </button>
                        <span className="font-code-block text-body-lg font-bold">{ansScore}</span>
                        <button
                          onClick={() => handleAnsVote('downvote')}
                          className={`w-8 h-8 flex items-center justify-center rounded border transition-all ${isAnsDownvoted
                            ? 'border-error bg-error/20 text-error'
                            : 'border-outline-variant/30 hover:border-error'
                            }`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isAnsDownvoted ? 'text-error' : 'text-outline'}`}>expand_more</span>
                        </button>

                        {isAccepted && (
                          <div className="mt-4 flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-secondary text-[24px] font-fill-1">check_circle</span>
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Accepted</span>
                          </div>
                        )}
                        {!isAccepted && user?._id === q.author._id && (
                          <button onClick={handleAccept} className="mt-4 opacity-50 hover:opacity-100 hover:text-secondary text-outline" title="Accept Answer">
                            <span className="material-symbols-outlined text-[24px]">check_circle</span>
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-invert max-w-none text-on-surface-variant mb-6 whitespace-pre-wrap break-words">
                          {ans.body}
                        </div>
                        <div className="flex items-center justify-end">
                          <div className="flex items-center gap-3 bg-surface-container-highest/30 px-3 py-2 rounded-lg border border-outline-variant/10">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center overflow-hidden shrink-0">
                              {ans.author?.avatar ? (
                                <img src={ans.author.avatar} alt={ans.author.username} className="w-full h-full object-cover" />
                              ) : (
                                ans.author?.username?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div className="text-[11px]">
                              <p className="text-outline">Answered {formatDistanceToNow(new Date(ans.createdAt), { addSuffix: true })}</p>
                              <Link to={`/profile/${ans.author?._id}`} className={`font-bold ${isAccepted ? 'text-secondary' : 'text-on-surface'}`}>
                                {ans.author?.username}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* post answer */}
          <section className="mt-stack-lg border-t border-outline-variant/20 pt-stack-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Your Answer</h3>
            <div className="bg-surface-container rounded-xl border border-outline-variant/30 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-surface-container-high border-b border-outline-variant/20">
                <span className="text-xs text-on-surface-variant">Markdown supported</span>
                <span className="text-[11px] font-mono text-on-surface-variant/70">
                  {answerBody.length}/20
                </span>
              </div>
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 p-gutter font-body-lg text-on-surface-variant min-h-[200px] resize-y outline-none"
                placeholder="Write your detailed answer here..."
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
              />
            </div>
            <div className="mt-stack-md flex items-center justify-end">
              <button
                onClick={handlePostAnswer}
                disabled={submitting || answerBody.trim().length < 20}
                className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </section>
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
