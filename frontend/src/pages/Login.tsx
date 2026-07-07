import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Eye, EyeOff, Lock, Mail, Scissors, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if first-time admin setup is completed
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/auth/setup-status');
        if (res.data.success && !res.data.isInitialized) {
          navigate('/setup');
        }
      } catch (err) {
        console.error('Setup status check failed', err);
      }
    };
    checkStatus();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4 font-sans relative overflow-hidden">
      {/* Decorative Brand Accent Background Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#000000]/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 relative z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex p-3 bg-[#D4AF37]/15 rounded-full text-[#D4AF37] mb-3">
            <Scissors className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-lg font-black tracking-wider uppercase text-slate-800 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Super Hair Art Salon
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Enterprise Salon Management & POS ERP
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Shirajsalmani7866@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#C5A880] text-white font-extrabold rounded-2xl py-3 text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/15 disabled:opacity-50 uppercase"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Login;
