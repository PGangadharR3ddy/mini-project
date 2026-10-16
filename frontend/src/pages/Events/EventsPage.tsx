import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../api/events';
import { AcademicEvent, EventType } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CardSkeleton, EmptyState } from '../../components/Loader';
import { canCreateContent, canEditContent } from '../../utils/roleGuard';
import {
  formatDateTime,
  formatShortDate,
} from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const EVENT_TYPES: { label: string; value: string }[] = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Tests / Exams', value: 'TEST' },
  { label: 'Assignments', value: 'ASSIGNMENT' },
  { label: 'Presentations', value: 'PRESENTATION' },
  { label: 'Viva Voce', value: 'VIVA' },
  { label: 'Other Activities', value: 'OTHER' },
];

export const EventsPage: React.FC = () => {
  const { role, user, classroomId } = useAuth();

  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<AcademicEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TEST' as EventType,
    subject: 'PHY-301 • Advanced Physics',
    eventDateTime: '2026-08-28T10:00:00',
    durationMinutes: 90,
    venue: 'Hall B',
    syncToCalendar: true,
  });

  const canCreate = canCreateContent(role || undefined);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const pageResult = await getEvents({
        classroomId,
        type: selectedType,
      });
      setEvents(pageResult.content);
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [classroomId, selectedType]);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      type: 'TEST',
      subject: 'PHY-301 • Advanced Physics',
      eventDateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      durationMinutes: 90,
      venue: 'Hall B',
      syncToCalendar: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (ev: AcademicEvent) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description,
      type: ev.type,
      subject: ev.subject,
      eventDateTime: ev.eventDateTime ? ev.eventDateTime.slice(0, 16) : '',
      durationMinutes: ev.durationMinutes || 60,
      venue: ev.venue,
      syncToCalendar: !!ev.syncToCalendar,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          ...formData,
          classroomId,
        });
        toast.success('Event updated');
      } else {
        await createEvent({
          ...formData,
          classroomId,
        });
        toast.success('Academic event scheduled');
      }

      setIsCreateModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete.id);
      toast.success('Event cancelled & removed');
      setEventToDelete(null);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const urgentEvents = filteredEvents.filter((e) => e.isUrgent);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md">
              Academic Calendar
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Exams, Submissions & Viva Defense
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Academic Events & Milestones
          </h1>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Total Events</div>
            <div className="font-serif text-2xl font-semibold text-stone-900 mt-1">{events.length} Scheduled</div>
          </div>
          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-700">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Examinations</div>
            <div className="font-serif text-2xl font-semibold text-rose-700 mt-1">
              {events.filter((e) => e.type === 'TEST').length} Tests
            </div>
          </div>
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500">Project Submissions</div>
            <div className="font-serif text-2xl font-semibold text-amber-700 mt-1">
              {events.filter((e) => e.type === 'ASSIGNMENT').length} Deadlines
            </div>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedType === t.value
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 pl-8 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
        </div>
      </div>

      {/* Immediate Action Priority Section */}
      {urgentEvents.length > 0 && selectedType === 'ALL' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-pulse"></span>
            <h2 className="font-serif text-sm font-semibold text-rose-700">
              Immediate Action & Urgent Deadlines
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge type={ev.type} size="sm" />
                    <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Due Today
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-semibold text-stone-900 mb-1 leading-tight">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>{ev.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>{formatDateTime(ev.eventDateTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chronological List */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-900 pb-4 mb-6 border-b border-stone-100">
          Upcoming Academic Timeline
        </h2>

        {loading ? (
          <CardSkeleton count={3} />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No events found"
            description="There are currently no events matching your criteria."
            actionText={canCreate ? 'Schedule First Event' : undefined}
            onAction={canCreate ? handleOpenCreate : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((ev) => {
              const isUserAuthor = canEditContent(role || undefined);

              return (
                <div
                  key={ev.id}
                  className="bg-stone-50/70 border border-stone-200 hover:border-stone-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="bg-white border border-stone-200 rounded-xl p-3 text-center min-w-[100px] shrink-0 shadow-xs">
                      <div className="text-[11px] font-semibold text-indigo-700">
                        {formatShortDate(ev.eventDateTime)}
                      </div>
                      <div className="text-xs font-medium text-stone-900 mt-0.5">
                        {ev.eventDateTime ? ev.eventDateTime.slice(11, 16) : 'TBD'}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        {ev.durationMinutes ? `${ev.durationMinutes}m` : 'All Day'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{ev.subject}</span>
                        <Badge type={ev.type} size="sm" />
                      </div>
                      <h3 className="font-serif text-base font-semibold text-stone-900 leading-snug">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 max-w-2xl leading-relaxed">
                        {ev.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {ev.venue}
                        </span>
                        {ev.syncToCalendar && (
                          <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                            Synced to Calendar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUserAuthor && (
                    <div className="flex items-center gap-1 self-end md:self-center">
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="p-2 hover:bg-stone-200/70 rounded-lg text-stone-500 hover:text-stone-900 transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEventToDelete(ev)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-stone-400 hover:text-rose-700 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule / Edit Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingEvent ? 'Edit Academic Event' : 'Schedule Academic Event'}
        subtitle="Publish test schedules, presentation dates, or viva examinations"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Event Category
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              >
                <option value="TEST">TEST (Written / Lab Exam)</option>
                <option value="ASSIGNMENT">ASSIGNMENT (Submission Deadline)</option>
                <option value="PRESENTATION">PRESENTATION (Group Seminar)</option>
                <option value="VIVA">VIVA (Oral Examination)</option>
                <option value="OTHER">OTHER (Keynote / Review)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Subject / Course Code
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              placeholder="e.g. Midterm Examination: Quantum Mechanics"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Instructions & Syllabus Coverage
            </label>
            <textarea
              rows={3}
              placeholder="Detail units covered, allowed materials (calculators/notes), or submission link..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.eventDateTime}
                onChange={(e) => setFormData({ ...formData, eventDateTime: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Duration (Min)
              </label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Venue / Room / Online URL
            </label>
            <input
              type="text"
              placeholder="e.g. Hall B or Online Submission Portal"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.syncToCalendar}
                onChange={(e) => setFormData({ ...formData, syncToCalendar: e.target.checked })}
                className="w-4 h-4 accent-stone-900 rounded"
              />
              <span className="text-xs font-medium text-stone-800">
                Synchronize to student calendars & generate automated alerts
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              {editingEvent ? 'Update Event' : 'Publish Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDeleteEvent}
        title="Cancel Academic Event"
        message={`Are you sure you want to cancel "${eventToDelete?.title}"?`}
        confirmText="Cancel Event"
      />
    </div>
  );
};

