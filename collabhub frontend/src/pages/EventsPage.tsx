import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../api/events';
import { AcademicEvent, EventType } from '../types';
import { EventCard } from '../components/events/EventCard';
import { EventCalendarView } from '../components/events/EventCalendarView';
import { EventModal } from '../components/events/EventModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { EVENT_TYPE_CONFIG } from '../utils/badgeColors';
import {
  CalendarCheck2,
  Plus,
  Search,
  LayoutGrid,
  Calendar,
  Filter,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { user, isFaculty, isAdmin, classroomId, classroomName } = useAuth();
  const { success, error: showError } = useToast();

  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [selectedType, setSelectedType] = useState<EventType | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'UPCOMING' | 'WEEK' | 'PAST'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);

  // Delete dialog
  const [eventToDelete, setEventToDelete] = useState<AcademicEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = isFaculty || isAdmin;

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      let from: string | undefined;
      let to: string | undefined;
      const now = new Date();

      if (dateFilter === 'UPCOMING') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        from = startOfDay;
      } else if (dateFilter === 'WEEK') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString();
        from = startOfDay;
        to = nextWeek;
      } else if (dateFilter === 'PAST') {
        to = now.toISOString();
      }

      const data = await getEvents(
        classroomId || 'cls_cse_3a',
        selectedType,
        from,
        to
      );
      setEvents(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load academic events');
    } finally {
      setLoading(false);
    }
  }, [classroomId, selectedType, dateFilter, showError]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Client-side search filtering
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        e.venue.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const handleSaveEvent = async (data: Omit<AcademicEvent, 'id'>) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      success('Academic event updated successfully');
    } else {
      await createEvent(data);
      success('Academic event scheduled');
    }
    await loadEvents();
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      success('Academic event deleted');
      setEventToDelete(null);
      await loadEvents();
    } catch (err: any) {
      showError(err.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="events-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Academic Assessments & Events
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Tests, viva assessments, capstone presentations, and assignment deadlines for {classroomName || 'active classroom'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              id="event-view-list"
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'LIST'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards View
            </button>
            <button
              type="button"
              id="event-view-calendar"
              onClick={() => setViewMode('CALENDAR')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'CALENDAR'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Timeline Strip
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              id="create-event-btn"
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Schedule Event
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedType === 'ALL'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Types
          </button>
          {(['TEST', 'ASSIGNMENT', 'VIVA', 'PRESENTATION', 'OTHER'] as EventType[]).map((t) => {
            const cfg = EVENT_TYPE_CONFIG[t];
            return (
              <button
                key={t}
                type="button"
                id={`filter-event-${t.toLowerCase()}`}
                onClick={() => setSelectedType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === t
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          {/* Date Range Selector */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shrink-0"
          >
            <option value="UPCOMING">Upcoming Events</option>
            <option value="WEEK">Next 7 Days</option>
            <option value="PAST">Past Assessments</option>
            <option value="ALL">All Dates</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title or venue..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Events Body */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarCheck2}
          title="No academic events found"
          description={
            searchQuery
              ? `No tests or events matching "${searchQuery}".`
              : 'There are no upcoming assessments or presentations scheduled under this filter.'
          }
          actionLabel={canManage ? 'Schedule First Event' : undefined}
          onAction={
            canManage
              ? () => {
                  setEditingEvent(null);
                  setIsModalOpen(true);
                }
              : undefined
          }
        />
      ) : viewMode === 'CALENDAR' ? (
        <EventCalendarView
          events={filteredEvents}
          currentUserRole={user?.role}
          currentUserId={user?.userId}
          onEdit={(evt) => {
            setEditingEvent(evt);
            setIsModalOpen(true);
          }}
          onDelete={(evt) => setEventToDelete(evt)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserRole={user?.role}
              currentUserId={user?.userId}
              onEdit={(evt) => {
                setEditingEvent(evt);
                setIsModalOpen(true);
              }}
              onDelete={(evt) => setEventToDelete(evt)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        initialEvent={editingEvent}
        defaultClassroomId={classroomId || 'cls_cse_3a'}
        defaultClassroomName={classroomName || 'CSE - 3rd Year (Section A)'}
        authorId={user?.userId || 'usr_faculty_01'}
        authorName={user?.name || 'Dr. Ramesh Sharma'}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Academic Event"
        message={`Are you sure you want to cancel and delete "${eventToDelete?.title}" (${eventToDelete?.subject})?`}
        confirmLabel="Delete Event"
        isLoading={isDeleting}
      />
    </div>
  );
};
