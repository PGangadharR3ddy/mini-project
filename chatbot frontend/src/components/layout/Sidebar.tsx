import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BellRing,
  FolderArchive,
  CalendarCheck2,
  FolderGit2,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  BookOpen,
  BookOpenCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';

interface SidebarProps {
  id?: string;
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ id = 'app-sidebar', onItemClick }) => {
  const { user, isAdmin, isFaculty } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      to: '/timetable',
      label: isFaculty ? 'Teaching Schedule' : 'Class Timetable',
      icon: CalendarDays,
      badge: 'Weekly',
    },
    {
      to: '/announcements',
      label: 'Announcements',
      icon: BellRing,
      badge: undefined,
    },
    {
      to: '/resources',
      label: 'Learning Resources',
      icon: FolderArchive,
      badge: undefined,
    },
    {
      to: '/events',
      label: 'Academic Events',
      icon: CalendarCheck2,
      badge: undefined,
    },
    {
      to: '/projects',
      label: 'Collab Projects',
      icon: FolderGit2,
      badge: 'Hub',
    },
    {
      to: '/study',
      label: 'Study Assistant',
      icon: BookOpenCheck,
      badge: 'PDF AI',
    },
    {
      to: '/ai-studio',
      label: 'AI Studio',
      icon: Sparkles,
      badge: 'New',
    },
  ];

  if (isAdmin) {
    navItems.push({
      to: '/admin',
      label: 'Admin Panel',
      icon: ShieldAlert,
      badge: 'Admin',
    });
  }

  return (
    <aside
      id={id}
      className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 h-screen max-h-screen sticky top-0 z-20 select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
            Smart Classroom
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Academic Portal</p>
        </div>
      </div>

      {/* Classroom Info Pill */}
      {user?.classroomName && (
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Active Classroom</p>
              <p className="text-xs font-medium text-slate-200 truncate">{user.classroomName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="px-3 py-4 flex-1 space-y-1 overflow-y-auto min-h-0">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              to={item.to}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wider ${
                        isActive
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Mini Profile in Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0 mt-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff`
              }
              alt={user?.name || 'User avatar'}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <div className="mt-0.5">
              <Badge variant="role" role={user?.role} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
