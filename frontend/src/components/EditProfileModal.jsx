import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, updateUser } from '../features/auth/authSlice';
import { usersAPI } from '../services/users.service';
import toast from 'react-hot-toast';

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'Ruby', 'PHP', 'HTML', 'CSS', 'Tailwind CSS', 'MongoDB', 'PostgreSQL', 'MySQL', 'Docker',
  'Kubernetes', 'AWS', 'Azure', 'GCP', 'GraphQL', 'REST API', 'Express.js', 'Next.js', 'Vue.js',
  'Angular', 'Svelte', 'React Native', 'Flutter', 'Swift', 'Kotlin', 'Spring Boot', 'Django'
];

export default function EditProfileModal({ onClose }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    skills: '',
    githubLink: '',
  });
  const [usernameStatus, setUsernameStatus] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        githubLink: user.githubLink || '',
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    const parts = formData.skills.split(',');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.length > 0) {
      const lower = lastPart.toLowerCase();
      const matches = COMMON_SKILLS.filter(s => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower);
      setFilteredSkills(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [formData.skills]);

  const handleSkillSelect = (skill) => {
    const parts = formData.skills.split(',');
    parts.pop();
    const newSkills = parts.length > 0 ? parts.join(', ') + ', ' + skill + ', ' : skill + ', ';
    setFormData({ ...formData, skills: newSkills });
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (!formData.username || formData.username === user?.username) {
      setUsernameStatus('');
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await usersAPI.checkUsername(formData.username);
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('');
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.username, user?.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    if (formData.username && formData.username !== user?.username) {
      if (usernameStatus === 'taken') return toast.error('Username is taken');
      data.append('username', formData.username);
    }
    data.append('bio', formData.bio);
    data.append('skills', formData.skills);
    data.append('githubLink', formData.githubLink);
    if (avatar) data.append('avatar', avatar);

    try {
      const res = await usersAPI.updateProfile(data);
      dispatch(updateUser(res.data.user));
      toast.success('Profile updated!');
      onClose(res.data.user);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000aa] backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface-container rounded-lg max-h-[90vh] overflow-y-auto relative p-stack-md border border-outline-variant/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-full transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-stack-md pb-2">
          <h1 className="font-headline-lg text-headline-md font-bold text-on-surface">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-stack-md">
          <div className="bg-surface rounded-xl p-gutter border border-outline-variant/10">
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl border-2 border-primary/20 bg-surface-container-high overflow-hidden flex items-center justify-center font-bold text-primary text-3xl">
                {avatar ? (
                  <img className="w-full h-full object-cover" src={URL.createObjectURL(avatar)} alt="Preview" />
                ) : user?.avatar ? (
                  <img className="w-full h-full object-cover" src={user.avatar} alt="Current" />
                ) : (
                  user?.username?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                />
                <p className="text-[10px] text-on-surface-variant mt-2">JPG, PNG, GIF or WEBP. Max size of 5MB</p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-gutter border border-outline-variant/10 space-y-stack-md">
            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-[#050505] border ${usernameStatus === 'taken' ? 'border-error' : 'border-outline-variant/30'} rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant pr-10`}
                  placeholder="username"
                />
                <div className="absolute right-3 top-3">
                  {usernameStatus === 'checking' && <span className="material-symbols-outlined animate-spin text-on-surface-variant">autorenew</span>}
                  {usernameStatus === 'available' && <span className="material-symbols-outlined text-secondary">check_circle</span>}
                  {usernameStatus === 'taken' && <span className="material-symbols-outlined text-error">cancel</span>}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-error text-label-sm mt-1">This username is already taken.</p>}
            </div>

            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[80px] placeholder:text-outline-variant"
                placeholder="Tell the community about yourself..."
              />
            </div>

            <div className="relative">
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Skills (comma separated)</label>
              <input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                onFocus={() => {
                  const parts = formData.skills.split(',');
                  if (parts[parts.length - 1].trim().length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
                placeholder="React, Node.js, Python"
                autoComplete="off"
              />
              {showSuggestions && filteredSkills.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSkills.map(skill => (
                    <div
                      key={skill}
                      className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md text-on-surface"
                      onClick={() => handleSkillSelect(skill)}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">GitHub URL</label>
              <input
                name="githubLink"
                value={formData.githubLink}
                onChange={handleChange}
                className="w-full bg-[#050505] border border-outline-variant/30 rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-on-primary-fixed px-8 py-2.5 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}