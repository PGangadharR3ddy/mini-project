import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DEMO_TOKENS } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('admin.cse@bauhaus.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [customToken, setCustomToken] = useState('');
  const [showCustomToken, setShowCustomToken] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'admin'>('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (showCustomToken && customToken.trim()) {
      login(customToken.trim());
      toast.success('Authenticated with custom JWT token');
      navigate('/dashboard');
      return;
    }

    const token = DEMO_TOKENS[selectedRole];
    login(token);
    toast.success(`Signed in as ${selectedRole.toUpperCase()}`);
    navigate('/dashboard');
  };

  const selectPreset = (role: 'student' | 'faculty' | 'admin') => {
    setSelectedRole(role);
    if (role === 'student') {
      setIdentifier('alex.mercer@bauhaus.edu');
    } else if (role === 'faculty') {
      setIdentifier('s.muller@bauhaus.edu');
    } else {
      setIdentifier('admin.cse@bauhaus.edu');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 flex flex-col justify-between p-6 md:p-12 relative select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center font-serif text-lg font-bold shadow-sm">
            SC
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold tracking-tight text-stone-900 leading-none">
              Smart Classroom
            </h1>
            <span className="text-[11px] text-stone-500 font-medium block mt-1">
              Academic Management Portal
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-stone-100 border border-stone-200/80 rounded-full px-3 py-1 text-xs font-medium text-stone-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>SYS.AUTH v2.4</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="my-auto z-10 max-w-md w-full mx-auto py-8">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md inline-block mb-2">
              Authentication Portal
            </span>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
              Sign In
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Enter your credentials or choose a demonstration role profile.
            </p>
          </div>

          {/* Role Preset Selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-stone-700 mb-2">
              Select Profile Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectPreset('student')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  selectedRole === 'student'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="font-medium text-xs">Student</div>
                <div className="text-[10px] opacity-75 mt-0.5">Read Only</div>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('faculty')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  selectedRole === 'faculty'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="font-medium text-xs">Faculty</div>
                <div className="text-[10px] opacity-75 mt-0.5">Instructor</div>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('admin')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="font-medium text-xs">Admin</div>
                <div className="text-[10px] opacity-75 mt-0.5">Full Access</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {!showCustomToken ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Academic Email / ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 pl-9 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
                    />
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Access Key / Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 pl-9 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
                    />
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Direct JWT Bearer Token
                </label>
                <textarea
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  rows={4}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-[11px] font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-lg py-2.5 px-4 font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Authenticate & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowCustomToken(!showCustomToken)}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 underline underline-offset-2"
              >
                {showCustomToken ? '← Use Standard Login Form' : 'Paste Custom JWT Token →'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full z-10 text-center text-xs text-stone-500">
        <span>Smart Classroom Management System</span> • <span>Classroom Service API</span>
      </footer>
    </div>
  );
};

