import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Megaphone,
  FolderOpen,
  CalendarDays,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/timetable',
      label: 'Timetable',
      icon: Calendar,
    },
    {
      to: '/announcements',
      label: 'Announcements',
      icon: Megaphone,
    },
    {
      to: '/resources',
      label: 'Resources',
      icon: FolderOpen,
    },
    {
      to: '/events',
      label: 'Events & Dates',
      icon: CalendarDays,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-stone-200/90 z-40 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Editorial Journal Masthead */}
        <div className="p-6 border-b border-stone-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
              S
            </div>
            <div>
              <span className="font-serif text-lg font-semibold tracking-tight text-stone-900 block leading-tight">
                Smart Classroom
              </span>
              <span className="text-[11px] font-medium text-stone-400 tracking-wide block mt-0.5">
                Academic Management
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors text-xs font-medium ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Admin Section */}
          <div className="pt-4 mt-4 border-t border-stone-200/60">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              System
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors text-xs font-medium ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 text-stone-500" />
                <span>Administration</span>
              </div>
              {!isAdmin && (
                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                  Admin
                </span>
              )}
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-stone-200/80 bg-stone-50/70 text-stone-500 text-xs flex items-center justify-between">
        <span className="font-serif italic text-stone-600">Vol. XXIV • Term I</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          Live
        </span>
      </div>
    </aside>
  );
};

