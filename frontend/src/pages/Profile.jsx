import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import useLogout from '../hooks/useLogout';
import useScrollToTop from '../hooks/useScrollToTop';
import { usersAPI } from '../services/users.service';
import EditProfileModal from '../components/EditProfileModal';
import { postsAPI } from '../services/posts.service';
import { questionsAPI } from '../services/questions.service';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

function ActivityHeatmap({ activityMap = {} }) {
  const cells = [];
  const today = new Date();

  for (let i = 119; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = activityMap[dateStr] || 0;

    let opacity = 0.1;
    if (count > 0 && count <= 2) opacity = 0.3;
    else if (count > 2 && count <= 5) opacity = 0.6;
    else if (count > 5) opacity = 0.9;

    cells.push(
      <div key={dateStr} className="heatmap-cell" title={`${count} activities on ${dateStr}`} style={{ backgroundColor: `rgba(78, 222, 163, ${opacity})` }} />
    );
  }
  return cells;
}

function UserListModal({ title, users, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant/30 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-outline-variant/20">
          <h3 className="text-headline-sm font-bold text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3">
          {users.length === 0 ? (
            <div className="text-center text-on-surface-variant py-8">No {title} found.</div>
          ) : (
            users.map((u) => (
              <Link key={u._id} to={`/profile/${u._id}`} onClick={onClose} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors">
                <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-primary">{u.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-on-surface">{u.name || u.username}</div>
                  <div className="text-sm text-on-surface-variant">@{u.username}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const currentUser = useSelector(selectUser);
  const [profile, setProfile] = useState(null);
  const logout = useLogout();
  const [activityMap, setActivityMap] = useState({});
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tab, setTab] = useState('posts');
  const [modalType, setModalType] = useState(null);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes, questionsRes] = await Promise.all([
          usersAPI.getProfile(id),
          postsAPI.getUserPosts(id),
          questionsAPI.getUserQuestions(id)
        ]);
        setProfile(profileRes.data.user);
        setIsFollowing(profileRes.data.isFollowing);
        setActivityMap(profileRes.data.activityMap || {});
        setPosts(postsRes.data.posts);
        setQuestions(questionsRes.data.questions || []);
      } catch {
        toast.error('Profile not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error('Login to follow');
    try {
      if (isFollowing) {
        await usersAPI.unfollow(id);
        setIsFollowing(false);
        setProfile((p) => ({ ...p, followers: p.followers.filter((f) => f._id !== currentUser._id) }));
      } else {
        await usersAPI.follow(id);
        setIsFollowing(true);
        setProfile((p) => ({
          ...p,
          followers: [...p.followers, {
            _id: currentUser._id,
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar
          }]
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex w-full min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex w-full min-h-screen">
        <div className="flex-1 text-center py-20 text-on-surface-variant">User not found</div>
      </div>
    );
  }

  const isOwn = currentUser?._id === profile._id;
  const skills = profile.skills || [];



  return (
    <div className="flex justify-center w-full min-h-screen">
      <main className="w-full max-w-6xl min-w-0 px-margin-mobile md:px-gutter py-stack-sm md:py-stack-lg relative">

        <header className="relative mb-stack-lg">
          <div className="h-48 w-full rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
          </div>

          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16 px-6 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl border-4 border-surface bg-surface overflow-hidden shadow-xl">
                {profile.avatar ? (
                  <img className="w-full h-full object-cover" src={profile.avatar} alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-primary bg-primary/10">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-4 mb-1">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">{profile.name || profile.username}</h2>
                  {profile.name && <p className="text-on-surface-variant font-body-md text-body-md mt-0.5">@{profile.username}</p>}
                </div>
                {profile.skills?.length > 0 && (
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary border border-secondary/20 uppercase tracking-wider">
                    {profile.skills[0]}
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant max-w-xl mb-2">
                {profile.bio || 'No bio yet.'}
              </p>
              {profile.githubLink && (
                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-label-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  {profile.githubLink.replace('https://', '').replace('http://', '').replace('www.', '')}
                </a>
              )}
            </div>

            <div className="flex items-center gap-stack-sm pb-2">
              {isOwn ? (
                <>
                  <button onClick={() => setShowEditModal(true)} className="px-6 py-2 bg-surface-container border border-outline-variant text-on-surface font-bold rounded-xl hover:border-primary/50 active:scale-95 transition-all shrink-0">
                    Edit Profile
                  </button>
                  <button onClick={logout} className="px-6 py-2 bg-surface-container border border-error/30 text-error font-bold rounded-xl hover:bg-error/10 hover:border-error/50 active:scale-95 transition-all shrink-0">
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all ${isFollowing
                    ? 'bg-surface-container border border-outline-variant text-on-surface'
                    : 'bg-primary text-on-primary'
                    }`}
                  title={isFollowing ? 'Following' : 'Follow'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-stack-md mb-stack-lg p-6 bg-surface-container rounded-xl border border-outline-variant/10">
          <div className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setModalType('followers')}>
            <div className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">Followers</div>
            <div className="font-headline-md text-headline-md text-on-surface">{profile.followers?.length || 0}</div>
          </div>
          <div className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setModalType('following')}>
            <div className="text-on-surface-variant font-label-sm uppercase tracking-wider mb-1">Following</div>
            <div className="font-headline-md text-headline-md text-on-surface">{profile.following?.length || 0}</div>
          </div>
          <div className="hidden md:block col-span-3 text-right flex flex-col justify-center">
            <div className="text-on-surface-variant font-body-md italic opacity-60">
              "The code is the easy part. The systems are the challenge."
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

          <div className="lg:col-span-8 space-y-stack-md">
            <div className="flex border-b border-outline-variant/20">
              {['posts', 'questions', 'answers'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-8 py-4 transition-colors ${tab === t
                    ? 'font-bold text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'posts' && (
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onUpdate={(updatedPost) => setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p))}
                      onDelete={(deletedId) => setPosts(posts.filter(p => p._id !== deletedId))}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 text-on-surface-variant bg-surface-container rounded-xl">
                    <span className="material-symbols-outlined text-5xl block mb-2 text-outline">history_edu</span>
                    <p>No posts yet</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'questions' && (
              <div className="space-y-4">
                {questions.length > 0 ? (
                  questions.map((q) => (
                    <div key={q._id} className="bg-surface-container rounded-xl p-gutter border border-outline-variant/30 hover:border-primary/50 transition-all group">
                      <div className="flex flex-col md:flex-row gap-gutter">
                        <div className="flex md:flex-col items-center md:items-end gap-4 shrink-0 text-on-surface-variant">
                          <div className="flex flex-col items-end">
                            <span className="font-headline-sm text-headline-sm text-on-surface">{q.upvotes?.length - q.downvotes?.length || 0}</span>
                            <span className="text-label-sm font-label-sm uppercase tracking-wider">votes</span>
                          </div>
                          <div className={`flex flex-col items-end ${q.acceptedAnswer ? 'text-primary' : (q.answers?.length > 0 ? 'text-secondary' : '')}`}>
                            <span className="font-headline-sm text-headline-sm">{q.answers?.length || 0}</span>
                            <span className="text-label-sm font-label-sm uppercase tracking-wider">answers</span>
                          </div>
                          <div className="flex flex-col items-end opacity-60">
                            <span className="font-headline-sm text-headline-sm">{q.views || 0}</span>
                            <span className="text-label-sm font-label-sm uppercase tracking-wider">views</span>
                          </div>
                        </div>

                        <div className="flex-grow min-w-0">
                          <Link to={`/questions/${q._id}`} className="block">
                            <h2 className="font-headline-md text-headline-md text-on-surface mb-2 hover:text-primary transition-colors truncate">
                              {q.title}
                            </h2>
                            <p className="text-on-surface-variant font-body-md line-clamp-2 mb-4">
                              {q.body?.slice(0, 180)}{q.body?.length > 180 ? '...' : ''}
                            </p>
                          </Link>
                          <div className="flex flex-wrap items-center justify-between gap-stack-md">
                            <div className="flex gap-2 flex-wrap">
                              {q.tags?.slice(0, 4).map((tag) => (
                                <span key={tag} className="bg-surface-container-highest px-3 py-1 rounded text-label-sm font-label-sm text-on-surface-variant border border-outline-variant/30">
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
                              <span className="text-label-sm font-label-sm text-outline-variant truncate max-w-[150px]">
                                <span className="text-on-surface">@{q.author?.username}</span>{' '}
                                {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-on-surface-variant bg-surface-container rounded-xl">
                    <span className="material-symbols-outlined text-5xl block mb-2 text-outline">quiz</span>
                    <p>No questions yet</p>
                  </div>
                )}
              </div>
            )}

            {tab !== 'posts' && tab !== 'questions' && (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl block mb-2 text-outline">quiz</span>
                <p>No {tab} yet</p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-stack-md">

            <section className="bg-surface-container-high p-6 rounded-xl">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-4">Top Skills</h4>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-surface-container rounded-lg text-on-surface border border-outline-variant/30 text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm italic">No skills added yet.</p>
              )}
            </section>

            <section className="bg-surface-container p-6 rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-headline-md text-headline-md text-on-surface">Activity Heatmap</h4>
                <span className="text-xs text-on-surface-variant">Past 6 months</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <ActivityHeatmap activityMap={activityMap} />
              </div>
              <div className="mt-4 flex justify-between items-center text-[10px] text-on-surface-variant uppercase tracking-tighter">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="heatmap-cell bg-secondary/10" />
                  <div className="heatmap-cell bg-secondary/30" />
                  <div className="heatmap-cell bg-secondary/60" />
                  <div className="heatmap-cell bg-secondary/90" />
                </div>
                <span>More</span>
              </div>
            </section>

            <section className="glass-panel p-6 rounded-xl border-primary/30 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/20 blur-3xl group-hover:bg-primary/40 transition-all" />
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span className="font-label-sm uppercase tracking-widest">AI Insights</span>
              </div>
              <p className="text-body-md text-on-surface relative z-10 leading-relaxed">
                {skills.length === 0 ? (
                  <>{profile.username} hasn't added any skills yet. Adding skills helps others discover you!</>
                ) : skills.length === 1 ? (
                  <>{profile.username} specializes in <span className="text-secondary">{skills[0]}</span> and is building a strong foundation in it.</>
                ) : (
                  <>{profile.username} has skills in <span className="text-secondary">{skills[0]}</span>. Based on their profile, they may be exploring advanced <span className="text-primary">{skills[1]}</span> concepts.</>
                )}
              </p>
            </section>
          </aside>
        </div>
      </main>

      {modalType === 'followers' && (
        <UserListModal title="Followers" users={profile.followers || []} onClose={() => setModalType(null)} />
      )}
      {modalType === 'following' && (
        <UserListModal title="Following" users={profile.following || []} onClose={() => setModalType(null)} />
      )}
      {showEditModal && <EditProfileModal onClose={(updatedUser) => {
        if (updatedUser) setProfile(updatedUser);
        setShowEditModal(false);
      }} />}

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
