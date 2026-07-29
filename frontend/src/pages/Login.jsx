import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthLoading, selectUser, clearError } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
    dispatch(clearError());
  }, [user, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.identifier.trim()) {
      return toast.error('Please enter your email or username');
    }
    if (!formData.password) {
      return toast.error('Password is required');
    }

    const resultAction = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Welcome back!');
    } else {
      toast.error(resultAction.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-6 text-[#f4f3ef] select-none">
      <div className="w-full max-w-[360px] flex flex-col space-y-12">

        <div className="flex flex-col space-y-3">
          <Link to="/" className="text-[22px] font-serif tracking-tight text-[#f4f3ef] hover:opacity-80 transition-opacity w-fit">
            DevCircle
          </Link>
          <p className="text-[13px] text-[#969490] font-sans leading-relaxed">
            Welcome back, Developer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-sans tracking-widest text-[#969490] uppercase">Email or Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-[14px] text-[#f4f3ef] focus:border-[#404040] outline-none transition-all placeholder:text-[#525252]"
              placeholder="name@domain.com or username"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
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
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>

        <div className="text-[13px] text-[#969490] font-sans">
          New here?{' '}
          <Link to="/register" className="text-[#f4f3ef] underline-offset-4 hover:opacity-80 transition-opacity">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
}
