import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { User, Lock, LogIn, AlertCircle, Store } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { settings, profiles, cashiers, loginAsOwner, loginAsCashier } = useStore();
  const userProfiles = profiles || cashiers;

  const [userIdInput, setUserIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = userIdInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanId || !cleanPin) {
      setErrorMsg('Please enter both User ID and PIN.');
      return;
    }

    const upperId = cleanId.toUpperCase();

    // 1. Check direct Owner keyword login
    if (upperId === 'OWNER' || upperId === 'ADMIN' || upperId === 'OWNER-001' || upperId === 'OWNER-1') {
      const success = loginAsOwner(cleanPin);
      if (success) return;
      setErrorMsg('Invalid PIN for Store Owner.');
      return;
    }

    // 2. Check matching profile by ID, Employee ID, Name, or Email
    const matchedProfile = userProfiles.find(
      p =>
        p.employeeId.toLowerCase() === cleanId.toLowerCase() ||
        p.id.toLowerCase() === cleanId.toLowerCase() ||
        p.name.toLowerCase() === cleanId.toLowerCase() ||
        p.email.toLowerCase() === cleanId.toLowerCase()
    );

    if (matchedProfile) {
      if (matchedProfile.role === 'OWNER') {
        const success = loginAsOwner(cleanPin);
        if (success) return;
        setErrorMsg(`Invalid PIN for ${matchedProfile.name}.`);
        return;
      }
      const success = loginAsCashier(matchedProfile.id, cleanPin);
      if (success) return;
      setErrorMsg(`Invalid PIN for ${matchedProfile.name}.`);
      return;
    }

    setErrorMsg('Invalid User ID or PIN. Access denied.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            ) : (
              <Store className="w-7 h-7" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {settings.storeName || 'Store POS System'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access terminal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* User ID Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              User ID / Employee ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. OWNER or EMP-001"
                value={userIdInput}
                onChange={e => setUserIdInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                maxLength={6}
                placeholder="••••"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm font-mono tracking-widest focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="text-xs font-medium text-rose-400 flex items-center gap-1.5 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
