import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AcademicEvent, EventType } from '../../types';
import { EVENT_TYPE_CONFIG } from '../../utils/badgeColors';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<AcademicEvent, 'id'>) => Promise<void>;
  initialEvent?: AcademicEvent | null;
  defaultClassroomId: string;
  defaultClassroomName?: string;
  authorId: string;
  authorName: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  defaultClassroomId,
  defaultClassroomName = 'CSE - 3rd Year (Section A)',
  authorId,
  authorName,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('TEST');
  const [subject, setSubject] = useState('Distributed Systems');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [venue, setVenue] = useState('LH-301');
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setDescription(initialEvent.description || '');
      setType(initialEvent.type);
      setSubject(initialEvent.subject);
      // Format to datetime-local input string
      try {
        const d = new Date(initialEvent.dateTime);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDateTime(localIso);
      } catch {
        setDateTime('');
      }
      setDurationMinutes(initialEvent.durationMinutes || 60);
      setVenue(initialEvent.venue || 'LH-301');
      setSyncToCalendar(!!initialEvent.syncToCalendar);
    } else {
      setTitle('');
      setDescription('');
      setType('TEST');
      setSubject('Distributed Systems');
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateTime(localIso);
      setDurationMinutes(60);
      setVenue('LH-301');
      setSyncToCalendar(true);
    }
    setError('');
  }, [initialEvent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an event title');
      return;
    }
    if (!dateTime) {
      setError('Please select event date and time');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        type,
        subject: subject.trim(),
        dateTime: new Date(dateTime).toISOString(),
        durationMinutes: Number(durationMinutes) || 0,
        venue: venue.trim() || 'Online / Class Venue',
        classroomId: defaultClassroomId,
        classroomName: defaultClassroomName,
        createdById: initialEvent?.createdById || authorId,
        createdByName: initialEvent?.createdByName || authorName,
        syncToCalendar,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="event-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={initialEvent ? 'Edit Academic Event' : 'Create Academic Event'}
      subtitle="Schedule tests, viva assessments, project presentations, and assignment deadlines"
      maxWidth="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="event-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialEvent ? 'Update Event' : 'Schedule Event'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(['TEST', 'ASSIGNMENT', 'VIVA', 'PRESENTATION', 'OTHER'] as EventType[]).map((t) => {
              const cfg = EVENT_TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                    type === t
                      ? `${cfg.bg} ring-2 ring-indigo-400 font-bold`
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Systems Mid-Term Quiz & Theory Exam"
            required
            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Distributed Systems"
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. LH-301 or Lab 2"
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
            <input
              type="number"
              min="0"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              placeholder="60"
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Syllabus Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Specify chapters, allowable calculators, or submission instructions..."
            className="w-full text-xs font-normal bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="sync-calendar-toggle"
            checked={syncToCalendar}
            onChange={(e) => setSyncToCalendar(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="sync-calendar-toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
            Sync this assessment to Student Academic Calendar notifications
          </label>
        </div>
      </form>
    </Modal>
  );
};
