import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuthLoading, selectUser, clearError } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usersAPI } from '../services/users.service';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [usernameStatus, setUsernameStatus] = useState(''); // 'checking', 'available', 'taken'
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashStep, setSplashStep] = useState(0);

  useEffect(() => {
    if (user && !showSplash) navigate('/');
    dispatch(clearError());
  }, [user, navigate, dispatch, showSplash]);

  useEffect(() => {
    if (!showSplash) return;

    const step1 = setTimeout(() => setSplashStep(1), 1000);
    const step2 = setTimeout(() => setSplashStep(2), 2000);
    const done = setTimeout(() => navigate('/'), 3000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(done);
    };
  }, [showSplash, navigate]);

  useEffect(() => {
    if (!formData.username) {
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
  }, [formData.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.name && (formData.name.trim().length < 2 || formData.name.trim().length > 30)) {
      return toast.error('Name must be between 2 and 30 characters long');
    }

    if (!formData.username) {
      return toast.error('Username is required');
    }
    if (formData.username.length < 3 || formData.username.length > 30) {
      return toast.error('Username must be between 3 and 30 characters');
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      return toast.error('Username can only contain letters, numbers, and underscores');
    }
    if (usernameStatus === 'taken') {
      return toast.error('Username is already taken');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error('Please enter a valid email address');
    }

    if (!formData.password) {
      return toast.error('Password is required');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    const resultAction = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(resultAction)) {
      setShowSplash(true);
      toast.success('Registration successful!');
    } else {
      toast.error(resultAction.payload || 'Registration failed');
    }
  };

  if (showSplash) {
    const steps = [
      "Creating your developer profile...",
      "Configuring workspace settings...",
      "Preparing your dashboard feed..."
    ];
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-6 text-[#f4f3ef] select-none">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center space-y-8 fade-in">

          <div className="w-16 h-[2px] bg-[#262626] overflow-hidden relative rounded">
            <div
              className="h-full bg-[#f4f3ef] absolute left-0 top-0 transition-all duration-1000 ease-out"
              style={{ width: `${((splashStep + 1) / 3) * 100}%` }}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <h3 className="text-[14px] font-serif text-[#f4f3ef] tracking-wide transition-all duration-300">
              {steps[splashStep]}
            </h3>
            <p className="text-[12px] text-[#969490]">Setting up your DevCircle space</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-6 text-[#f4f3ef] select-none">
      <div className="w-full max-w-[360px] flex flex-col space-y-12">

        <div className="flex flex-col space-y-3">
          <Link to="/" className="text-[22px] font-serif tracking-tight text-[#f4f3ef] hover:opacity-80 transition-opacity w-fit">
            DevCircle
          </Link>
          <p className="text-[13px] text-[#969490] font-sans leading-relaxed">
            Built for developers to ask questions, share knowledge, and collaborate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-sans tracking-widest text-[#969490] uppercase">Name (Optional)</label>
            <input
              type="text"
              className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-[14px] text-[#f4f3ef] focus:border-[#404040] outline-none transition-all placeholder:text-[#525252]"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-sans tracking-widest text-[#969490] uppercase">Username</label>
              {usernameStatus === 'checking' && <span className="text-[11px] text-[#969490] italic">checking...</span>}
              {usernameStatus === 'available' && <span className="text-[11px] text-[#8ea687]">available</span>}
              {usernameStatus === 'taken' && <span className="text-[11px] text-[#c97b7b]">taken</span>}
            </div>
            <input
              type="text"
              required
              className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-[14px] text-[#f4f3ef] focus:border-[#404040] outline-none transition-all placeholder:text-[#525252]"
              placeholder="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-sans tracking-widest text-[#969490] uppercase">Email address</label>
            <input
              type="email"
              required
              className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-[14px] text-[#f4f3ef] focus:border-[#404040] outline-none transition-all placeholder:text-[#525252]"
              placeholder="name@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-sans tracking-widest text-[#969490] uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-[#121212] border border-[#262626] rounded-xl pl-4 pr-12 py-3 text-[14px] text-[#f4f3ef] focus:border-[#404040] outline-none transition-all placeholder:text-[#525252]"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#969490] hover:text-[#f4f3ef] transition-colors focus:outline-none flex items-center"
              >
                <span className="material-symbols-outlined text-[18px] select-none">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f4f3ef] text-[#050505] py-3 rounded-xl text-[13px] font-bold hover:bg-[#e6e2db] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="text-[13px] text-[#969490] font-sans">
          Already have an account?{' '}
          <Link to="/login" className="text-[#f4f3ef] underline-offset-4 hover:opacity-80 transition-opacity">
            Log in
          </Link>
        </div>

      </div>
    </div>
  );
}
