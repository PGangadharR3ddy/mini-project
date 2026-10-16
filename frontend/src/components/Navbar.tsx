import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, LogOut, ChevronDown, UserCheck, Shield, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout, switchDemoRole } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Derive breadcrumbs based on pathname
  const path = location.pathname.replace('/', '') || 'dashboard';
  const pageName = path.charAt(0).toUpperCase() + path.slice(1);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-stone-200/90 z-30 flex items-center justify-between px-8 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <span
          className="hover:text-stone-900 cursor-pointer font-serif italic text-sm text-stone-600"
          onClick={() => navigate('/dashboard')}
        >
          Classroom
        </span>
        <span className="text-stone-300">/</span>
        <span className="text-stone-900 font-medium bg-stone-100 px-2 py-0.5 rounded text-[11px]">
          {pageName}
        </span>
      </div>

      {/* Global Quick Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search schedules, notices, course repository..."
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-1.5 pl-9 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Campus Network Status Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded-full text-[11px] font-medium text-stone-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Campus Active</span>
        </div>

        {/* User Info / Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 rounded-lg px-3 py-1.5 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-xs font-semibold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold leading-tight text-stone-900">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-stone-500 font-normal">
                {user?.department || 'CSE'}
              </div>
            </div>
            <Badge type={role || 'STUDENT'} size="sm" />
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-3.5 border-b border-stone-100 bg-stone-50/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    Active Session
                  </p>
                  <p className="text-xs font-semibold text-stone-900 truncate mt-0.5">{user?.name}</p>
                  <p className="text-[11px] text-stone-500">
                    {user?.department} • Room #{user?.classroomId}
                  </p>
                </div>

                {/* Quick Role Switcher for seamless testing */}
                <div className="p-2.5 border-b border-stone-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 px-1 mb-1.5">
                    Demo Role Preview
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        switchDemoRole('student');
                        setIsDropdownOpen(false);
                      }}
                      className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-medium transition-all ${
                        role === 'STUDENT'
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 mb-0.5" />
                      Student
                    </button>
                    <button
                      onClick={() => {
                        switchDemoRole('faculty');
                        setIsDropdownOpen(false);
                      }}
                      className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-medium transition-all ${
                        role === 'FACULTY'
                          ? 'bg-indigo-900 text-white'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 mb-0.5" />
                      Faculty
                    </button>
                    <button
                      onClick={() => {
                        switchDemoRole('admin');
                        setIsDropdownOpen(false);
                      }}
                      className={`flex flex-col items-center py-2 rounded-lg text-[10px] font-medium transition-all ${
                        role === 'ADMIN'
                          ? 'bg-rose-900 text-white'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 mb-0.5" />
                      Admin
                    </button>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

