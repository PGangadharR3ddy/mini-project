import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { DEMO_USERS } from '../utils/jwt';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  School,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      showError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      success(`Welcome back! Logged in successfully.`);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = async (demoUser: typeof DEMO_USERS[0], index: number) => {
    setSelectedDemoIndex(index);
    setEmail(demoUser.email);
    setPassword('demo-password-123');
    setIsLoading(true);
    try {
      await login({ email: demoUser.email, password: 'demo-password-123' });
      success(`Logged in as ${demoUser.name} (${demoUser.role})`);
      navigate(from, { replace: true });
    } catch (err: any) {
      showError('Failed to login with demo credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-600/30 mb-4 ring-4 ring-indigo-950">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Smart Classroom Portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Unified Academic Management & Classroom Communication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 z-10 space-y-6">
        {/* Quick One-Click Demo Role Cards */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Quick 1-Click Role Login
            </span>
            <span className="text-[11px] text-slate-400">Instant Demo Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DEMO_USERS.map((demo, idx) => {
              const Icon = demo.role === 'ADMIN' ? ShieldCheck : demo.role === 'FACULTY' ? UserCheck : GraduationCap;
              const roleBg =
                demo.role === 'ADMIN'
                  ? 'hover:border-purple-500/80 hover:bg-purple-950/30'
                  : demo.role === 'FACULTY'
                  ? 'hover:border-blue-500/80 hover:bg-blue-950/30'
                  : 'hover:border-emerald-500/80 hover:bg-emerald-950/30';

              return (
                <button
                  key={demo.email}
                  type="button"
                  id={`demo-login-${demo.role.toLowerCase()}`}
                  onClick={() => handleQuickDemoSelect(demo, idx)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl border border-slate-700 bg-slate-900/60 text-left transition-all flex flex-col justify-between gap-2 group ${roleBg} disabled:opacity-50`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <Badge variant="role" role={demo.role} size="sm" />
                    </div>
                    <p className="text-xs font-bold text-white truncate">{demo.name}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{demo.email}</p>
                  </div>

                  <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Sign in as {demo.role} &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu or prof@college.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Any password for demo</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-slate-400" />
              Connected to Classroom Service
            </span>
            <span className="font-mono text-[11px]">JWT Auth Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
