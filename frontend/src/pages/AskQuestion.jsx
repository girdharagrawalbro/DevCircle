import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuestion, selectQALoading } from '../features/qa/qaSlice';
import { aiAPI } from '../services/ai.service';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const COMMON_TAGS = [
  'javascript', 'typescript', 'react', 'node.js', 'python', 'java', 'c++', 'c#', 'go', 'rust',
  'ruby', 'php', 'html', 'css', 'tailwind', 'mongodb', 'postgresql', 'mysql', 'docker',
  'kubernetes', 'aws', 'azure', 'gcp', 'graphql', 'rest api', 'express', 'next.js', 'vue',
  'angular', 'svelte', 'react native', 'flutter', 'swift', 'kotlin', 'spring boot', 'django'
];

export default function AskQuestion() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectQALoading);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [isAI, setIsAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState({ title: '', body: '', tags: [] });
  const [showAiModal, setShowAiModal] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const [recommendedTags, setRecommendedTags] = useState([]);
  const [hasAutoSuggested, setHasAutoSuggested] = useState(false);

  useEffect(() => {
    const parts = tags.split(',');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.length > 0) {
      const lower = lastPart.toLowerCase();
      const matches = COMMON_TAGS.filter(s => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower);
      setFilteredTags(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [tags]);

  const handleTagSelect = (tag) => {
    const parts = tags.split(',');
    parts.pop();
    const newTags = parts.length > 0 ? parts.join(', ') + ', ' + tag + ', ' : tag + ', ';
    setTags(newTags);
    setShowSuggestions(false);
  };

  const handleAiImprove = async () => {
    if (body.trim().length < 30) return toast.error('Write at least 30 characters in the body first!');
    setAiLoading(true);
    try {
      const res = await aiAPI.improveQuestion(title, body);
      const improvedData = res.data.improved;
      if (improvedData && typeof improvedData === 'object') {
        setAiSuggestion({
          title: improvedData.title || title,
          body: typeof improvedData.body === 'string' ? improvedData.body : (improvedData.body ? JSON.stringify(improvedData.body) : body),
          tags: Array.isArray(improvedData.tags) ? improvedData.tags : []
        });
      } else if (typeof improvedData === 'string') {
        setAiSuggestion({ title, body: improvedData, tags: [] });
      }
      setShowAiModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI improvement failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestTags = async (isAuto = false) => {
    if (isAuto && (hasAutoSuggested || tags.trim() !== '' || tagLoading || (!title.trim() && !body.trim()))) return;
    if (!isAuto && !title.trim() && !body.trim()) return toast.error('Write something first!');
    if (isAuto) setHasAutoSuggested(true);
    setTagLoading(true);
    try {
      const res = await aiAPI.suggestTags(title + '\n' + body);
      if (res.data.tags && res.data.tags.length > 0) {
        setRecommendedTags(res.data.tags);
        if (tags.trim() === '' || !isAuto) {
          setTags(res.data.tags.join(', '));
          setIsAI(true);
          if (!isAuto) toast.success('Tags suggested!');
          else toast.success('Tags automatically recommended based on your topic!');
        }
      } else if (!isAuto) {
        toast.error('No tags could be suggested');
      }
    } catch {
      if (!isAuto) toast.error('Failed to suggest tags');
    } finally {
      setTagLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion.title) setTitle(aiSuggestion.title);
    if (aiSuggestion.body) setBody(aiSuggestion.body);
    if (aiSuggestion.tags && aiSuggestion.tags.length > 0) {
      setTags(aiSuggestion.tags.join(', '));
    }
    setIsAI(true);
    setShowAiModal(false);
    setAiSuggestion({ title: '', body: '', tags: [] });
    toast.success('AI improvements & tags applied!');
  };

  const postQuestion = async () => {
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const result = await dispatch(createQuestion({ title, body, tags: tagsArray, isAI })).unwrap();
      toast.success('Question posted!');
      navigate(`/questions/${result._id}`);
    } catch {
      toast.error('Failed to post question');
    }
  };

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    if (!title.trim() || !body.trim()) return toast.error('Title and body are required');
    if (title.trim().length > 150) return toast.error('Title must be at most 150 characters');

    if (!force) {
      setIsValidating(true);
      try {
        const res = await aiAPI.validateQuestion(title, body);
        if (res.data.isVague) {
          setValidationWarning(res.data.warning || 'Your question is too vague.');
          setShowWarningModal(true);
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsValidating(false);
      }
    }

    setShowWarningModal(false);
    await postQuestion();
  };

  return (
    <div className="min-h-screen bg-background text-on-surface py-stack-md md:py-stack-lg px-margin-mobile md:px-gutter flex justify-center items-start">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-4 mb-stack-md">
          <Link to="/questions" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-[24px] font-serif tracking-tight text-on-surface">Ask a Question</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-stack-md">
          <div className="bg-surface-container rounded-xl p-gutter border border-outline-variant/30">
            <div className="flex justify-between items-end mb-2">
              <label className="block font-headline-md text-headline-md text-on-surface">Title</label>
              <span className={`text-label-sm font-mono transition-colors ${title.length < 15 ? 'text-on-surface-variant/60' : title.length > 140 ? 'text-error' : 'text-on-surface'}`}>
                {title.length}/150 {title.length < 15 ? '(min 15)' : ''}
              </span>
            </div>
            <p className="text-on-surface-variant text-xs mb-4">Keep it clear, specific, and concise.</p>
            <input
              className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
              placeholder="e.g. How to implement JWT authentication in Node.js?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div className="bg-surface-container rounded-xl p-gutter border border-outline-variant/30 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <label className="block font-headline-md text-headline-md text-on-surface">Body</label>
                <p className="text-on-surface-variant text-xs mt-1">Provide all details to help others answer.</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <span className={`text-label-sm font-mono transition-colors ${body.length < 30 ? 'text-on-surface-variant/60' : body.length > 4500 ? 'text-error' : 'text-on-surface'}`}>
                  {body.length}/5000 {body.length < 30 ? '(min 30)' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleAiImprove}
                  disabled={aiLoading || body.trim().length < 30}
                  className="flex items-center gap-2 bg-surface-container-highest border border-primary/30 text-primary px-3 py-1.5 rounded-lg text-label-sm font-bold hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  )}
                  Improve with AI
                </button>
              </div>
            </div>
            <textarea
              className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-lg font-mono min-h-[240px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
              placeholder="Write your question details here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              maxLength={5000}
            />
          </div>

          <div className="bg-surface-container rounded-xl p-gutter border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <label className="block font-headline-md text-headline-md text-on-surface">Tags</label>
                <p className="text-on-surface-variant text-xs mt-1">Add up to 5 tags, separated by commas.</p>
              </div>
              <button
                type="button"
                onClick={handleSuggestTags}
                disabled={tagLoading || (!title.trim() && !body.trim())}
                className="flex items-center gap-2 bg-surface-container-highest border border-primary/30 text-primary px-3 py-1.5 rounded-lg text-label-sm font-bold hover:bg-primary/10 transition-colors disabled:opacity-50 self-start sm:self-auto shrink-0 mt-2 sm:mt-0"
              >
                {tagLoading ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">label</span>
                )}
                Suggest Tags
              </button>
            </div>
            <div className="relative">
              <input
                className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
                placeholder="e.g. node.js, react, api"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                onFocus={() => {
                  if ((title.trim().length >= 10 || body.trim().length >= 20) && !hasAutoSuggested && tags.trim() === '') {
                    handleSuggestTags(true);
                  }
                  const parts = tags.split(',');
                  if (parts[parts.length - 1].trim().length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
              />
              {showSuggestions && filteredTags.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredTags.map(tag => (
                    <div
                      key={tag}
                      className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md text-on-surface"
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {recommendedTags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                  Recommended for your topic:
                </span>
                {recommendedTags.map(t => {
                  const isAdded = tags.toLowerCase().includes(t.toLowerCase());
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const currentTags = tags.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
                        if (!currentTags.includes(t.toLowerCase())) {
                          setTags(tags.trim() ? `${tags.replace(/,\s*$/, '')}, ${t}` : t);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${isAdded
                        ? 'bg-primary/20 border-primary text-primary cursor-default'
                        : 'bg-surface-container-highest border-outline-variant/40 text-on-surface hover:border-primary hover:text-primary cursor-pointer'
                        }`}
                      title={isAdded ? 'Tag already included' : `Add ${t} tag`}
                    >
                      #{t} {isAdded && '✓'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-stack-lg">
            <Link to="/questions" className="px-6 py-2.5 rounded-lg font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || isValidating || title.trim().length < 15 || body.trim().length < 30}
              className="bg-primary text-on-primary-fixed px-8 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading || isValidating ? 'Validating & Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>

      {/* ai improvement model */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-margin-mobile">
          <div className="w-full max-w-4xl bg-surface rounded-xl shadow-2xl flex flex-col border border-outline-variant overflow-hidden max-h-[90vh]">
            <div className="flex justify-between items-center px-gutter py-stack-md border-b border-outline-variant bg-[#050505]">
              <div className="flex items-center gap-stack-sm">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h2 className="font-headline-md text-headline-md">AI Question Improvement</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-gutter bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-stretch">

                <div className="flex flex-col gap-stack-sm">
                  <label className="font-label-sm text-outline uppercase tracking-wider">Original Draft</label>
                  <div className="flex-1 p-stack-md bg-[#050505] border border-outline-variant rounded-lg space-y-3">
                    <div>
                      <span className="text-xs text-outline-variant font-bold uppercase block mb-1">Title</span>
                      <p className="font-bold text-on-surface text-sm">{title || '(No title provided)'}</p>
                    </div>
                    <div className="border-t border-outline-variant/20 pt-2">
                      <span className="text-xs text-outline-variant font-bold uppercase block mb-1">Body</span>
                      <p className="text-on-surface-variant whitespace-pre-wrap font-mono text-sm">{body}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-stack-sm relative">
                  <label className="font-label-sm text-primary uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    AI Improved
                  </label>
                  <div className="flex-1 p-stack-md ai-glass rounded-lg sparkle-glow relative space-y-3 text-on-surface border border-primary/30">
                    <div>
                      <span className="text-xs text-primary font-bold uppercase block mb-1">Improved Title</span>
                      <p className="font-bold text-on-surface text-sm">{aiSuggestion.title || title}</p>
                    </div>
                    <div className="border-t border-primary/20 pt-2">
                      <span className="text-xs text-primary font-bold uppercase block mb-1">Improved Body</span>
                      <p className="whitespace-pre-wrap font-mono text-sm">{aiSuggestion.body}</p>
                    </div>
                    {aiSuggestion.tags && aiSuggestion.tags.length > 0 && (
                      <div className="border-t border-primary/20 pt-2">
                        <span className="text-xs text-primary font-bold uppercase block mb-1">Suggested Tags</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {aiSuggestion.tags.map((t) => (
                            <span
                              key={t}
                              onClick={() => {
                                const currentTags = tags.split(',').map(s => s.trim()).filter(Boolean);
                                if (!currentTags.includes(t)) {
                                  const updated = [...currentTags, t].join(', ');
                                  setTags(updated);
                                  setIsAI(true);
                                  toast.success(`Tag "${t}" added!`);
                                } else {
                                  toast.error(`Tag "${t}" is already added`);
                                }
                              }}
                              className="text-[11px] bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-2 py-0.5 rounded font-mono cursor-pointer transition-colors flex items-center gap-1"
                              title="Click to add tag to form"
                            >
                              #{t} <span className="text-xs font-bold">+</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="absolute -top-3 -right-3 bg-primary text-on-primary-fixed text-[10px] px-2 py-1 rounded-full font-bold shadow-lg">
                      IMPROVED
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-gutter bg-[#050505] flex justify-end gap-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2.5 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={applyAiSuggestion}
                className="px-6 py-2.5 bg-primary text-on-primary-fixed rounded-lg font-bold shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Apply Changes
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-margin-mobile">
          <div className="bg-surface border border-error/30 rounded-2xl p-gutter max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-error">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Question Needs Improvement</h3>
            </div>

            <p className="text-on-surface-variant mb-4">
              Our AI assistant noticed that your question might be difficult for others to answer. Here is the feedback:
            </p>

            <div className="p-4 bg-error/10 border border-error/20 rounded-xl mb-6 text-on-surface whitespace-pre-wrap font-body-md">
              {validationWarning}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-6 py-2 rounded-lg font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                Let me fix it
              </button>
              <button
                onClick={(e) => handleSubmit(e, true)}
                className="bg-error text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Post Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
