import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  LogOut,
  ChevronDown,
  Building2,
  BookOpen,
  User,
  GraduationCap,
  Sparkles,
  School,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';
import { useToast } from '../../hooks/useToast';
import { getClassrooms } from '../../api/classrooms';
import { Classroom } from '../../types';
import { GlobalSearchBar } from '../search/GlobalSearchBar';

interface NavbarProps {
  id?: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ id = 'app-navbar', onToggleSidebar }) => {
  const { user, logout, setClassroom, isStudent } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isClassroomMenuOpen, setIsClassroomMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    getClassrooms().then(setClassrooms).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    info('Logged out successfully');
    navigate('/login');
  };

  const currentClassroom = classrooms.find((c) => c.id === user?.classroomId);

  return (
    <header
      id={id}
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xs"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          id="mobile-sidebar-toggle"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Classroom Switcher / Selector */}
        {user?.role !== 'ADMIN' ? (
          <div className="relative">
            <button
              type="button"
              id="classroom-selector-btn"
              onClick={() => setIsClassroomMenuOpen(!isClassroomMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-colors"
            >
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {currentClassroom ? `${currentClassroom.name} (${currentClassroom.section})` : user?.classroomName || 'Select Classroom'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isClassroomMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsClassroomMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100">
                    Switch Active Classroom
                  </div>
                  {classrooms.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClassroom(c.id, `${c.name} (${c.section})`);
                        setIsClassroomMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user?.classroomId === c.id ? 'bg-indigo-50/70 font-semibold text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{c.name} - {c.section}</span>
                      <span className="text-[10px] text-slate-400">{c.department.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Institution Admin Workspace</span>
          </div>
        )}
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar />

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-bold text-slate-800">{user?.name}</span>
          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{user?.department}</span>
        </div>

        <Badge variant="role" role={user?.role} size="md" />

        {/* Profile / Logout Menu */}
        <div className="relative">
          <button
            type="button"
            id="user-profile-menu-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff`
              }
              alt={user?.name || 'User profile'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-300"
            />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{user?.userId}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    id="logout-btn"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
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
