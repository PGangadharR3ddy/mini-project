import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Megaphone,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getClassroomDetail } from '../../api/classrooms';
import { getDayTimetable } from '../../api/timetable';
import { getAnnouncementFeed } from '../../api/announcements';
import { getUpcomingEvents } from '../../api/events';
import { ClassroomDetail, TimetableSlot, Announcement, AcademicEvent } from '../../types';
import { Badge } from '../../components/Badge';
import { Spinner } from '../../components/Loader';
import { formatTimeRange, formatRelative, formatShortDate, getTodayDayOfWeek } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, classroomId } = useAuth();

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syllabusProgress, setSyllabusProgress] = useState(75);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const todayDay = getTodayDayOfWeek();
        const currentDay = todayDay === 'SUN' ? 'MON' : todayDay;

        const [clsData, ttData, annData, evData] = await Promise.all([
          getClassroomDetail(classroomId),
          getDayTimetable(classroomId, currentDay),
          getAnnouncementFeed(classroomId, user?.department || 'CSE', 0, 3),
          getUpcomingEvents(classroomId),
        ]);

        setClassroom(clsData);
        if (clsData?.syllabusProgress) {
          setSyllabusProgress(clsData.syllabusProgress);
        }
        setTodaySlots(ttData);
        setAnnouncements(annData.content.slice(0, 3));
        setEvents(evData.slice(0, 2));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [classroomId, user?.department]);

  const handleUpdateSyllabus = () => {
    const nextProgress = Math.min(100, syllabusProgress + 5);
    setSyllabusProgress(nextProgress);
    toast.success(`Syllabus progress updated to ${nextProgress}%`);
  };

  if (loading) {
    return <Spinner label="Loading Academic Dashboard..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP SECTION: Editorial Greeting + Syllabus Progress Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Greeting Card */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-md">
                Term 2024-25 • Session Active
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {classroom?.name || 'CSE - Section A'}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2 leading-tight">
              Good Day, {user?.name || 'Scholar'}
            </h1>
            <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
              {classroom?.department || 'Computer Science & Engineering'} • Semester {classroom?.semester || 3} • Advisor: {classroom?.advisorName || 'Dr. Sarah Müller'}
            </p>
          </div>

          <div className="mt-8 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 bg-stone-50/70 -mx-8 -mb-8 p-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Next Scheduled Session
                </div>
                <div className="text-xs font-semibold text-stone-900 mt-0.5">
                  {todaySlots.length > 0
                    ? `${todaySlots[0].subject} (${todaySlots[0].roomNumber})`
                    : 'No remaining sessions today'}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/timetable')}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm flex items-center gap-2 transition-colors"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Syllabus Progress Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Syllabus Progress
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                {syllabusProgress}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${syllabusProgress}%` }}
              ></div>
            </div>

            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              18 of 24 core curriculum modules completed ahead of midterm milestone.
            </p>

            <div className="space-y-2 text-xs font-medium text-stone-700 bg-stone-50 border border-stone-200/70 rounded-xl p-3.5">
              <div className="flex justify-between">
                <span className="text-stone-400">Academic Term:</span>
                <span className="text-stone-900">Fall 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Enrolled Strength:</span>
                <span className="text-stone-900">{classroom?.studentCount || 114} Scholars</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex gap-2">
            <button
              onClick={handleUpdateSyllabus}
              className="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-lg py-2 text-xs font-medium transition-colors"
            >
              Update Log
            </button>
            <button
              onClick={() => navigate('/resources')}
              className="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-lg py-2 text-xs font-medium transition-colors"
            >
              Resources
            </button>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Today's Schedule & Academic Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule List */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="font-serif text-lg font-semibold text-stone-900">
                Today's Schedule
              </h2>
            </div>
            <span className="text-[11px] font-medium text-stone-500 bg-stone-50 border border-stone-200/80 px-2.5 py-0.5 rounded-full">
              {getTodayDayOfWeek()} Matrix
            </span>
          </div>

          <div className="space-y-3">
            {todaySlots.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 border border-stone-200/60 rounded-xl">
                No lectures or laboratory sessions scheduled for today.
              </div>
            ) : (
              todaySlots.map((slot, index) => (
                <div
                  key={slot.id || index}
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Time Column */}
                    <div className="bg-stone-900 text-white px-3 py-2 rounded-lg text-center shrink-0 min-w-[95px]">
                      <div className="text-[11px] font-semibold tracking-tight">
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">
                        {slot.type || 'Lecture'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-indigo-700">
                          {slot.subjectCode || 'CS-301'}
                        </span>
                        <Badge type={slot.type || 'LECTURE'} size="sm" />
                      </div>
                      <h3 className="font-serif text-sm font-semibold text-stone-900">
                        {slot.subject}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {slot.roomNumber}
                        </span>
                        <span>•</span>
                        <span>{slot.facultyName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => navigate('/timetable')}
                      className="bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 rounded-lg transition-colors"
                    >
                      View Slot
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Stack: Quick Metrics & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-serif font-bold">{todaySlots.length}</div>
              <div className="text-[11px] font-medium text-stone-400 mt-1">
                Sessions Today
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-serif font-bold text-stone-900">42</div>
              <div className="text-[11px] font-medium text-stone-500 mt-1">
                Active Submissions
              </div>
            </div>
          </div>

          {/* Upcoming Events Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif text-sm font-semibold text-stone-900">
                  Key Deadlines
                </h3>
              </div>
              <button
                onClick={() => navigate('/events')}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
              >
                All Events →
              </button>
            </div>

            <div className="space-y-2.5">
              {events.length === 0 ? (
                <p className="text-xs text-stone-500 py-2">No upcoming academic deadlines.</p>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => navigate('/events')}
                    className="p-3 bg-stone-50/70 hover:bg-stone-100/80 border border-stone-200/70 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge type={ev.type} size="sm" />
                      <span className="text-[10px] font-medium text-stone-500">
                        {formatShortDate(ev.eventDateTime)}
                      </span>
                    </div>
                    <div className="font-serif text-xs font-semibold text-stone-900 line-clamp-1">{ev.title}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{ev.venue}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Recent Bulletins & Announcements */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-600" />
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              Classroom & Department Bulletins
            </h2>
          </div>
          <button
            onClick={() => navigate('/announcements')}
            className="bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Notice Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/announcements')}
              className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge type={item.type} size="sm" />
                  <span className="text-[11px] text-stone-400">
                    {formatRelative(item.createdAt)}
                  </span>
                </div>
                <h3 className="font-serif text-sm font-semibold text-stone-900 mb-2 line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 line-clamp-3 mb-4 leading-relaxed">
                  {item.body}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-medium text-stone-700">{item.postedBy || 'Faculty'}</span>
                <span className="text-indigo-600 font-medium">Read Notice →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

