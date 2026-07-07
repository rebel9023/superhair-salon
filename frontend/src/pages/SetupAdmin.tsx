import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Key, Check, X, AlertCircle } from 'lucide-react';

export const SetupAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [salonName, setSalonName] = useState('Super Hair Art Unisex Salon');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('Shirajsalmani7866@gmail.com');
  const [phone, setPhone] = useState('9723290486');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password Validations State
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNumber = /\d/.test(password);
  const passSpecial = /[@$!%*?&#]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';

  const isPasswordValid = passLength && passUpper && passLower && passNumber && passSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adminName.trim()) {
      setErrorMsg('Please specify the administrator name.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Please ensure password meets all security rules.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Confirm password does not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/setup-admin', {
        salonName,
        name: adminName,
        email,
        password,
        phone
      });

      if (res.data.success) {
        alert('Super Admin account created successfully! Please login with your new credentials.');
        navigate('/login');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Setup registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl p-6 md:p-8 space-y-6">
        {/* Brand logo header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#D4AF37]/15 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Super Hair Art Setup
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              First-Time Administrator Initialization
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Salon Name</label>
            <input
              type="text"
              required
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Admin Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Shiraj Salmani"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Password fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Create Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-extrabold uppercase mb-1">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Realtime validator guides */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[10px] space-y-1 text-slate-500 font-bold">
            <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Password Strength Checklist</span>
            
            <div className="flex items-center gap-1.5">
              {passLength ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
              <span>At least 8 characters</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {passUpper ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
              <span>One uppercase letter</span>
            </div>

            <div className="flex items-center gap-1.5">
              {passLower ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
              <span>One lowercase letter</span>
            </div>

            <div className="flex items-center gap-1.5">
              {passNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
              <span>One digit number</span>
            </div>

            <div className="flex items-center gap-1.5">
              {passSpecial ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
              <span>One special symbol (@, $, !, %, *, ?, &, #)</span>
            </div>

            <div className="flex items-center gap-1.5 border-t border-slate-200 pt-1.5 mt-1.5">
              {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
              <span>Passwords match</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
            className="w-full bg-[#D4AF37] hover:bg-[#C5A880] text-white font-extrabold rounded-2xl py-3 text-xs tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/15 disabled:opacity-50 uppercase"
          >
            <Key className="w-4 h-4" />
            {loading ? 'Initializing Setup...' : 'Register Administrator'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default SetupAdmin;
