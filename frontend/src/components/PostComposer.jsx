import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPost, selectPostCreating } from '../features/posts/postsSlice';
import { selectUser } from '../features/auth/authSlice';
import { aiAPI } from '../services/ai.service';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

export default function PostComposer({ onSuccess }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const creating = useSelector(selectPostCreating);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileRef = useRef(null);

  const handleEmojiClick = (emojiObj) => {
    setContent((prev) => prev + emojiObj.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAiImprove = async () => {
    if (!content.trim() || content.trim().length < 10) {
      return toast.error('Please enter valid input (at least 10 characters) to improve!');
    }
    setAiLoading(true);
    try {
      const res = await aiAPI.improvePost(content);
      setAiSuggestion(res.data.improved);
      setShowAiModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Please enter a valid thought or sentence to enhance.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    setContent(aiSuggestion);
    setShowAiModal(false);
    setAiSuggestion('');
    toast.success('Suggestion applied! Ready to post.');
  };

  const handleSubmit = async () => {
    if (!image && !content.trim()) {
      return toast.error('Post content or an image is required');
    }
    if (content.length > 2000) return toast.error('Post content must be at most 2000 characters');
    const formData = new FormData();
    if (content.trim()) formData.append('content', content.trim());
    if (image) formData.append('image', image);

    const result = await dispatch(createPost(formData));
    if (createPost.fulfilled.match(result)) {
      setContent('');
      setImage(null);
      setPreview('');
      toast.success('Post published!');
      onSuccess?.();
    } else {
      toast.error(result.payload || 'Failed to post');
    }
  };

  const initials = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <section className="p-gutter border-b border-outline-variant/20">
        <div className="flex gap-stack-md">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center font-bold text-on-surface">
            {user?.avatar
              ? <img className="w-full h-full object-cover" src={user.avatar} alt="" />
              : initials
            }
          </div>

          <div className="flex-1">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/50 resize-none h-24 pt-2 outline-none"
              placeholder="What's happening?"
              spellCheck={false}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
            />

            {preview && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-outline-variant/30 max-h-96 bg-[#050505] flex items-center justify-center">
                <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain" />
                <button
                  onClick={() => { setImage(null); setPreview(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors z-10"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-stack-md border-t border-outline-variant/10 pt-stack-md">
              <div className="flex gap-stack-md text-primary">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                  title="Add image"
                >
                  <span className="material-symbols-outlined">image</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                    title="Add emoji"
                  >
                    <span className="material-symbols-outlined">mood</span>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full mt-2 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAiImprove}
                  disabled={aiLoading || !content.trim()}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-40"
                  title="Improve with AI"
                >
                  {aiLoading
                    ? <span className="material-symbols-outlined animate-spin">autorenew</span>
                    : <span className="material-symbols-outlined">auto_awesome</span>
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-label-sm ${content.length > 1900 ? 'text-error' : 'text-on-surface-variant/50'}`}>
                  {content.length}/2000
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={creating || (!image && content.trim().length < 20)}
                  className={`bg-primary text-on-primary-fixed px-stack-md py-stack-sm rounded-xl font-bold transition-all ${(content.trim().length >= 20 || image)
                    ? 'cursor-pointer hover:bg-primary/90 active:scale-95'
                    : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                  {creating ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ai improvement model */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-margin-mobile">
          <div className="w-full max-w-2xl bg-surface rounded-xl shadow-2xl flex flex-col border border-outline-variant overflow-hidden">
            <div className="flex justify-between items-center px-gutter py-stack-md border-b border-outline-variant bg-[#050505]">
              <div className="flex items-center gap-stack-sm">
                <h2 className="font-headline-md text-headline-md font-bold">AI Improvement</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-gutter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-stretch">
                <div className="flex flex-col gap-stack-sm">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Original Draft</label>
                  <div className="flex-1 p-stack-md bg-[#050505]est border border-outline-variant rounded-lg text-on-surface-variant italic min-h-[120px]">
                    "{content}"
                  </div>
                </div>

                <div className="flex flex-col gap-stack-sm relative">
                  <label className="font-label-sm text-label-sm text-primary uppercase tracking-wider flex items-center gap-1">
                    AI Improved
                  </label>
                  <div className="flex-1 p-stack-md ai-glass rounded-lg sparkle-glow min-h-[120px] relative">
                    <p className="text-on-surface leading-relaxed">{aiSuggestion}</p>
                    <div className="absolute -top-3 -right-3 bg-primary text-on-primary-fixed text-[10px] px-2 py-1 rounded-full font-bold shadow-lg">
                      IMPROVED
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-gutter bg-[#050505] flex gap-stack-md justify-end items-center border-t border-outline-variant">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-gutter py-2.5 bg-surface-container-highest border border-outline-variant text-on-surface rounded font-medium hover:bg-surface-variant transition-all"
              >
                Discard
              </button>
              <button
                onClick={applyAiSuggestion}
                className="px-gutter py-2.5 bg-primary text-on-primary-container font-bold rounded hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                Apply
                <span className="material-symbols-outlined text-[18px]">check</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}