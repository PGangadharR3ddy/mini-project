import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { DayOfWeek, TimetableSlot } from '../../types';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slotData: Omit<TimetableSlot, 'id'>) => Promise<void>;
  initialSlot?: TimetableSlot | null;
  defaultDay?: DayOfWeek;
  defaultClassroomId?: string;
  defaultFacultyId?: string;
  defaultFacultyName?: string;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSlot,
  defaultDay = 'MON',
  defaultClassroomId = 'cls_cse_3a',
  defaultFacultyId = 'usr_faculty_01',
  defaultFacultyName = 'Dr. Ramesh Sharma',
}) => {
  const [day, setDay] = useState<DayOfWeek>(defaultDay);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [facultyName, setFacultyName] = useState(defaultFacultyName);
  const [facultyId, setFacultyId] = useState(defaultFacultyId);
  const [room, setRoom] = useState('LH-301');
  const [type, setType] = useState<'LECTURE' | 'LAB' | 'TUTORIAL'>('LECTURE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSlot) {
      setDay(initialSlot.day);
      setStartTime(initialSlot.startTime);
      setEndTime(initialSlot.endTime);
      setSubject(initialSlot.subject);
      setSubjectCode(initialSlot.subjectCode || '');
      setFacultyName(initialSlot.facultyName);
      setFacultyId(initialSlot.facultyId);
      setRoom(initialSlot.room);
      setType(initialSlot.type || 'LECTURE');
    } else {
      setDay(defaultDay);
      setStartTime('09:00');
      setEndTime('10:00');
      setSubject('');
      setSubjectCode('');
      setFacultyName(defaultFacultyName);
      setFacultyId(defaultFacultyId);
      setRoom('LH-301');
      setType('LECTURE');
    }
    setError('');
  }, [initialSlot, defaultDay, defaultFacultyName, defaultFacultyId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please enter a subject name');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please select start and end times');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        day,
        startTime,
        endTime,
        subject: subject.trim(),
        subjectCode: subjectCode.trim() || undefined,
        facultyName: facultyName.trim(),
        facultyId: facultyId || defaultFacultyId,
        room: room.trim() || 'LH-301',
        type,
        classroomId: initialSlot?.classroomId || defaultClassroomId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save timetable slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="slot-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={initialSlot ? 'Edit Timetable Slot' : 'Add New Class Slot'}
      subtitle="Configure academic slot timing, subject details, and classroom assignment"
      maxWidth="md"
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
            id="slot-modal-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialSlot ? 'Update Slot' : 'Create Slot'}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d === 'MON' ? 'Monday' : d === 'TUE' ? 'Tuesday' : d === 'WED' ? 'Wednesday' : d === 'THU' ? 'Thursday' : d === 'FRI' ? 'Friday' : 'Saturday'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="LECTURE">Lecture (Standard)</option>
              <option value="LAB">Practical / Lab</option>
              <option value="TUTORIAL">Tutorial / Problem Solving</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. CS501"
              className="w-full text-xs font-mono font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty In-Charge</label>
            <input
              type="text"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Sharma"
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Hall Venue</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. LH-301 or Lab 3"
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
