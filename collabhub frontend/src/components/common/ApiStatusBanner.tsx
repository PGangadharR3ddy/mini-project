import React, { useState } from 'react';
import { Server, UserCheck, ShieldCheck, GraduationCap, Settings2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { resetMockData } from '../../api/client';

export const ApiStatusBanner: React.FC = () => {
  const { user, switchDemoUser } = useAuth();
  const { success } = useToast();
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('custom_api_url') || 'http://localhost:8082');

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('custom_api_url', customUrl.trim());
    setShowConfig(false);
    success(`Backend URL updated to ${customUrl.trim()}`);
  };

  const handleResetData = () => {
    resetMockData();
    success('Interactive demo dataset reset to original default state');
    window.location.reload();
  };

  return (
    <div
      id="api-status-banner"
      className="bg-slate-900 text-slate-200 px-4 py-2 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-800/80 text-emerald-400 px-2.5 py-1 rounded-md font-mono text-[11px] border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span>API: {customUrl}</span>
        </div>

        {/* Quick Role Switcher for instant testing */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium hidden sm:inline">Role Switcher:</span>
          <button
            type="button"
            id="switch-student-btn"
            onClick={() => {
              switchDemoUser(0);
              success('Switched to Student view (Alex Rivera)');
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'STUDENT'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            Student
          </button>
          <button
            type="button"
            id="switch-faculty-btn"
            onClick={() => {
              switchDemoUser(1);
              success('Switched to Faculty view (Dr. Ramesh Sharma)');
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'FACULTY'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            Faculty
          </button>
          <button
            type="button"
            id="switch-admin-btn"
            onClick={() => {
              switchDemoUser(2);
              success('Switched to Admin view (Elena Rostova)');
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'ADMIN'
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Admin
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          id="config-api-btn"
          onClick={() => setShowConfig(!showConfig)}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline"
          title="Configure backend URL"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">API Config</span>
        </button>

        <button
          type="button"
          id="reset-demo-data-btn"
          onClick={handleResetData}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline"
          title="Reset seeded mock data"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden md:inline">Reset Seed Data</span>
        </button>
      </div>

      {showConfig && (
        <div className="w-full pt-2 border-t border-slate-800 flex items-center gap-2">
          <form onSubmit={handleSaveUrl} className="flex items-center gap-2 w-full max-w-md">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:8082"
              className="bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2 py-1 rounded w-full focus:outline-hidden focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded text-xs shrink-0"
            >
              Save Base URL
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
