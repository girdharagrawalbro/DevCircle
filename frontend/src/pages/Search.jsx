import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../services/search.service';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        if (searchInput.trim() !== query) {
          setSearchParams({ q: searchInput.trim(), type });
        }
      } else if (query) {
        setSearchParams({});
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setPosts([]);
      setUsers([]);
      setQuestions([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await searchAPI.search(query, type);
        setPosts(res.data.posts || []);
        setUsers(res.data.users || []);
        setQuestions(res.data.questions || []);
      } catch {
        toast.error('Search failed');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, type]);

  const handleTabChange = (newType) => {
    if (query) {
      setSearchParams({ q: query, type: newType });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim(), type });
    }
  };

  const hasResults = posts.length > 0 || users.length > 0 || questions.length > 0;

  return (
    <div className="flex w-full min-h-screen">
      <main className="flex-1 min-w-0 flex justify-center py-stack-md md:py-stack-lg px-margin-mobile md:px-gutter">
        <div className="w-full max-w-4xl">
          <div className="mb-stack-lg border-b border-outline-variant/20 pb-gutter">
            <h1 className="mb-stack-md text-[24px] font-serif tracking-tight text-on-surface">Search</h1>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-surface-container rounded-xl py-3 pl-12 pr-4 border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface placeholder:text-outline-variant"
                  placeholder="Search posts, users or questions..."
                />
              </div>
            </form>

            <div className="flex gap-2 mt-stack-md overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'posts', label: posts.length > 0 ? `Posts (${posts.length})` : 'Posts' },
                { id: 'users', label: users.length > 0 ? `Users (${users.length})` : 'Users' },
                { id: 'questions', label: questions.length > 0 ? `Questions (${questions.length})` : 'Questions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 font-bold text-label-md rounded-xl transition-all ${type === tab.id
                    ? 'bg-primary text-on-primary-fixed shadow-md'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* search results */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
            </div>
          ) : query ? (
            !hasResults ? (
              <div className="text-center py-16 text-on-surface-variant bg-surface-container/30 rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-40">search_off</span>
                <p className="font-headline-sm text-headline-sm">No matching results found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-stack-lg">

                {/* users */}
                {(type === 'all' || type === 'users') && users.length > 0 && (
                  <section className="space-y-stack-md">
                    {type === 'all' && (
                      <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Users
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                      {users.map((u) => (
                        <Link
                          key={u._id}
                          to={`/profile/${u._id}`}
                          className="flex items-center gap-4 p-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 rounded-xl transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                            {u.avatar ? (
                              <img className="w-full h-full object-cover" src={u.avatar} alt="" />
                            ) : (
                              (u.username?.[0] || u.name?.[0] || '?').toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                              {u.name || u.username}
                            </h3>
                            <p className="text-xs text-on-surface-variant">@{u.username}</p>
                            {u.bio && <p className="text-xs text-on-surface-variant/80 mt-1 line-clamp-1">{u.bio}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* posts */}
                {(type === 'all' || type === 'posts') && posts.length > 0 && (
                  <section className="space-y-stack-md">
                    {type === 'all' && (
                      <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">article</span>
                        Posts
                      </h2>
                    )}
                    <div className="space-y-stack-md">
                      {posts.map((p) => (
                        <div key={p._id} className="bg-surface-container border border-outline-variant/10 rounded-xl overflow-hidden">
                          <PostCard post={p} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* questions */}
                {(type === 'all' || type === 'questions') && questions.length > 0 && (
                  <section className="space-y-stack-md">
                    {type === 'all' && (
                      <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">quiz</span>
                        Questions
                      </h2>
                    )}
                    <div className="space-y-stack-sm">
                      {questions.map((q) => (
                        <Link
                          key={q._id}
                          to={`/questions/${q._id}`}
                          className="block p-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 rounded-xl transition-all group"
                        >
                          <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors text-body-lg">
                            {q.title}
                          </h3>
                          <div className="flex gap-2 mt-2">
                            {q.tags?.map((t) => (
                              <span key={t} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )
          ) : (
            <div className="glass-panel rounded-xl p-gutter text-center py-160 max-w-md mx-auto my-8">
              <span className="material-symbols-outlined text-5xl mb-4 block text-on-surface-variant/40">search</span>
              <p className="text-on-surface font-headline-sm font-bold mb-2">Explore DevCircle</p>
              <p className="text-on-surface-variant font-body-md">Start searching users, posts, and questions.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
