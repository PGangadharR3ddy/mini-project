import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/common/Badge';
import {
  CalendarDays,
  BellRing,
  FolderArchive,
  CalendarCheck2,
  FolderGit2,
  ShieldAlert,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  Plus,
  School,
  GraduationCap,
  Users,
} from 'lucide-react';
import { getClassroomDayTimetable, getFacultyWeeklyTimetable } from '../api/timetable';
import { getUpcomingEvents } from '../api/events';
import { getAnnouncementsFeed } from '../api/announcements';
import { AcademicEvent, Announcement, DayOfWeek, TimetableSlot } from '../types';
import { formatRelativeTime, formatTime, getDaysUntil } from '../utils/formatters';
import { CardSkeleton } from '../components/common/Skeleton';

export const DashboardPage: React.FC = () => {
  const { user, role, isFaculty, isAdmin, classroomId, department } = useAuth();

  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<AcademicEvent[]>([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current day of week (e.g. MON)
  const currentDay = (new Date()
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase()
    .slice(0, 3) as DayOfWeek) || 'MON';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadDashboardData = async () => {
      try {
        const [slotsData, eventsData, announcementsData] = await Promise.all([
          isFaculty && user?.userId
            ? getFacultyWeeklyTimetable(user.userId).then((slots) =>
                slots.filter((s) => s.day === currentDay)
              )
            : getClassroomDayTimetable(classroomId || 'cls_cse_3a', currentDay),
          getUpcomingEvents(classroomId || 'cls_cse_3a', 3),
          getAnnouncementsFeed(classroomId || undefined, department || undefined).then((anc) =>
            anc.slice(0, 3)
          ),
        ]);

        if (isMounted) {
          setTodaySlots(slotsData);
          setUpcomingEvents(eventsData);
          setLatestAnnouncements(announcementsData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [classroomId, department, isFaculty, user?.userId, currentDay]);

  const quickNavCards = [
    {
      to: '/timetable',
      title: isFaculty ? 'Teaching Timetable' : 'Class Timetable',
      desc: 'View weekly grid & daily sessions',
      icon: CalendarDays,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      to: '/announcements',
      title: 'Announcements',
      desc: 'Important circulars and updates',
      icon: BellRing,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300',
      iconBg: 'bg-amber-600 text-white',
    },
    {
      to: '/resources',
      title: 'Learning Resources',
      desc: 'Slides, notes, lecture handouts',
      icon: FolderArchive,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-600 text-white',
    },
    {
      to: '/events',
      title: 'Academic Events',
      desc: 'Tests, presentations & vivas',
      icon: CalendarCheck2,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      to: '/projects',
      title: 'Collab Projects',
      desc: 'Form teams & cross-dept hubs',
      icon: FolderGit2,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300',
      iconBg: 'bg-indigo-600 text-white',
    },
    {
      to: '/ai-studio',
      title: 'AI Studio',
      desc: 'Veo 3 video & audio transcribe',
      icon: Sparkles,
      color: 'bg-violet-50 text-violet-700 border-violet-200 hover:border-violet-300',
      iconBg: 'bg-violet-600 text-white',
    },
  ];

  if (isAdmin) {
    quickNavCards.push({
      to: '/admin',
      title: 'Classroom Administration',
      desc: 'Manage sections & departments',
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300',
      iconBg: 'bg-rose-600 text-white',
    });
  }

  return (
    <div id="dashboard-page" className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Badge variant="role" role={role || 'STUDENT'} size="md" />
              <span className="text-xs font-semibold text-indigo-200">
                {user?.department || 'Academic Portal'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Classroom Member'} 👋
            </h1>
            <p className="text-sm text-indigo-100/80 max-w-xl leading-relaxed">
              {role === 'STUDENT'
                ? `You are viewing schedule and academic materials for ${user?.classroomName || 'your active section'}.`
                : role === 'FACULTY'
                ? `You have full access to schedule lectures, post announcements, publish learning resources, and organize academic assessments.`
                : `Administrator mode active. Manage all institutional classrooms, timetable slots, circulars, and departmental resources.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/timetable"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              View Today's Classes
            </Link>
            {isFaculty && (
              <Link
                to="/resources"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl border border-indigo-500/40 transition-all"
              >
                <Plus className="w-4 h-4" />
                Upload Resource
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickNavCards.map((nav) => {
            const Icon = nav.icon;
            return (
              <Link
                key={nav.to}
                id={`quick-nav-${nav.title.toLowerCase().replace(/\s+/g, '-')}`}
                to={nav.to}
                className={`p-4 rounded-2xl border transition-all shadow-2xs hover:shadow-xs group flex items-start gap-3.5 bg-white ${nav.color}`}
              >
                <div className={`p-2.5 rounded-xl ${nav.iconBg} shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                    <span>{nav.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-600" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{nav.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3 Core Summary Sections (Today's Timetable, Upcoming Events, Latest Announcements) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Today's Timetable Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Today's Classes</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {currentDay === 'MON' ? 'Monday' : currentDay === 'TUE' ? 'Tuesday' : currentDay === 'WED' ? 'Wednesday' : currentDay === 'THU' ? 'Thursday' : currentDay === 'FRI' ? 'Friday' : 'Saturday'} Schedule
                  </p>
                </div>
              </div>
              <Link
                to="/timetable"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Full Grid &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : todaySlots.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-medium">No sessions scheduled for today</p>
                <Link to="/timetable" className="text-xs text-indigo-600 font-semibold mt-1 inline-block">
                  View full week schedule
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {slot.type || 'LECTURE'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{slot.subject}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="truncate">{slot.facultyName}</span>
                      <span className="font-medium text-slate-600">{slot.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/timetable"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:underline flex items-center justify-center gap-1"
          >
            Manage Timetable & Schedule &rarr;
          </Link>
        </div>

        {/* 2. Upcoming Academic Events (Next 3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Events</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Tests, vivas & deadlines</p>
                </div>
              </div>
              <Link
                to="/events"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                All Events &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-medium">No upcoming events scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt) => {
                  const daysInfo = getDaysUntil(evt.dateTime);
                  return (
                    <div
                      key={evt.id}
                      className="p-3 bg-slate-50 hover:bg-purple-50/30 rounded-xl border border-slate-200/70 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <Badge variant="event" eventType={evt.type} size="sm" dot />
                        <span className="text-[11px] font-bold text-slate-700">
                          {daysInfo.label}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{evt.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span className="text-indigo-600 font-medium">{evt.subject}</span>
                        <span className="text-slate-400">{evt.venue}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/events"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:underline flex items-center justify-center gap-1"
          >
            Explore Academic Calendar &rarr;
          </Link>
        </div>

        {/* 3. Latest Announcements (Latest 3) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Latest Circulars</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Department & section feed</p>
                </div>
              </div>
              <Link
                to="/announcements"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View Feed &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : latestAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-medium">No announcements published</p>
              </div>
            ) : (
              <div className="space-y-3">
                {latestAnnouncements.map((anc) => (
                  <div
                    key={anc.id}
                    className="p-3 bg-slate-50 hover:bg-amber-50/30 rounded-xl border border-slate-200/70 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Badge variant="announcement" announcementType={anc.type} size="sm" />
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(anc.createdAt)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{anc.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {anc.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/announcements"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:underline flex items-center justify-center gap-1"
          >
            Open Announcements Feed &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
