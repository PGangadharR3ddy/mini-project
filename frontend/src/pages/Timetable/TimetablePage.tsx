import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getWeeklyTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
} from '../../api/timetable';
import { TimetableSlot, DayOfWeek } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Spinner, EmptyState } from '../../components/Loader';
import { canCreateContent, canEditContent } from '../../utils/roleGuard';
import { formatTime, formatTimeRange, getTodayDayOfWeek } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const TimetablePage: React.FC = () => {
  const { role, user, classroomId } = useAuth();

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => {
    const today = getTodayDayOfWeek();
    return today === 'SUN' ? 'MON' : today;
  });
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    day: 'MON' as DayOfWeek,
    startTime: '09:00:00',
    endTime: '10:30:00',
    subject: '',
    subjectCode: 'CS-301',
    facultyName: user?.name || 'Dr. Sarah Müller',
    facultyId: 101,
    roomNumber: 'Hall C',
    type: 'LECTURE' as 'LECTURE' | 'LAB' | 'SEMINAR',
  });

  const canEdit = canCreateContent(role || undefined);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const data = await getWeeklyTimetable(classroomId);
      setSlots(data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [classroomId]);

  const handleOpenAdd = () => {
    setEditingSlot(null);
    setFormData({
      day: activeDay,
      startTime: '09:00:00',
      endTime: '10:30:00',
      subject: '',
      subjectCode: 'CS-301',
      facultyName: user?.name || 'Dr. Sarah Müller',
      facultyId: 101,
      roomNumber: 'Hall C',
      type: 'LECTURE',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormData({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subject: slot.subject,
      subjectCode: slot.subjectCode || 'CS-301',
      facultyName: slot.facultyName,
      facultyId: slot.facultyId,
      roomNumber: slot.roomNumber,
      type: (slot.type as any) || 'LECTURE',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSlot) {
        await updateTimetableSlot(editingSlot.id, {
          ...formData,
          classroomId,
        });
        toast.success('Timetable slot updated');
      } else {
        await createTimetableSlot({
          ...formData,
          classroomId,
        });
        toast.success('Timetable slot added');
      }
      setIsAddModalOpen(false);
      fetchTimetable();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save timetable slot');
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;
    try {
      await deleteTimetableSlot(slotToDelete.id);
      toast.success('Slot removed from schedule');
      setSlotToDelete(null);
      fetchTimetable();
    } catch (err) {
      toast.error('Failed to delete slot');
    }
  };

  const filteredSlots =
    viewMode === 'daily'
      ? slots.filter((s) => s.day === activeDay)
      : slots;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
              Instructional Matrix
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Semester 3 • Hall C & Lab Wing
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Academic Schedule
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Day View
            </button>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="grid grid-cols-6 gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = activeDay === day;
          const daySlotsCount = slots.filter((s) => s.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div className="font-serif text-sm font-semibold">{day}</div>
              <div className="text-[11px] opacity-75 mt-0.5 font-normal">
                {daySlotsCount} {daySlotsCount === 1 ? 'Class' : 'Classes'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Timetable Display Area */}
      {loading ? (
        <Spinner label="Rendering Schedule Matrix..." />
      ) : viewMode === 'weekly' ? (
        /* WEEKLY GRID VIEW */
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-[700px]">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = slots.filter((s) => s.day === day);
              return (
                <div
                  key={day}
                  className={`border rounded-xl p-4 flex flex-col justify-between ${
                    activeDay === day
                      ? 'bg-stone-50/70 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                    <span className="font-serif text-sm font-semibold text-stone-900">
                      {day}
                    </span>
                    <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      {daySlots.length} Classes
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {daySlots.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
                        No sessions scheduled
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-white border border-stone-200 hover:border-stone-300 rounded-lg p-3 shadow-xs relative group transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {formatTimeRange(slot.startTime, slot.endTime)}
                            </span>
                            <Badge type={slot.type || 'LECTURE'} size="sm" />
                          </div>

                          <h4 className="font-serif text-xs font-semibold text-stone-900 leading-tight mb-1">
                            {slot.subject}
                          </h4>

                          <div className="text-[11px] text-stone-500 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              <span>{slot.roomNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{slot.facultyName}</span>
                            </div>
                          </div>

                          {/* Quick Edit/Delete on hover for faculty/admin */}
                          {canEdit && (
                            <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(slot)}
                                className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-900 transition-colors"
                                title="Edit Slot"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setSlotToDelete(slot)}
                                className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-700 transition-colors"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* DAILY VIEW */
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                {activeDay} Schedule
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {filteredSlots.length} academic sessions allocated for this day
              </p>
            </div>
            {canEdit && (
              <button
                onClick={handleOpenAdd}
                className="bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-1.5 text-xs font-medium rounded-lg shadow-sm flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slot</span>
              </button>
            )}
          </div>

          {filteredSlots.length === 0 ? (
            <EmptyState
              title={`No classes on ${activeDay}`}
              description="No regular classes or laboratory sessions have been scheduled for this day."
              actionText={canEdit ? 'Add First Slot' : undefined}
              onAction={canEdit ? handleOpenAdd : undefined}
            />
          ) : (
            <div className="space-y-3">
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-stone-900 text-white p-3 rounded-lg text-center min-w-[110px] shrink-0">
                      <div className="text-xs font-semibold tracking-tight">
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </div>
                      <div className="text-[10px] font-medium text-stone-300 mt-0.5">
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
                      <h3 className="font-serif text-base font-semibold text-stone-900">
                        {slot.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-stone-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {slot.roomNumber}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          {slot.facultyName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleOpenEdit(slot)}
                        className="bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setSlotToDelete(slot)}
                        className="bg-stone-50 hover:bg-rose-50 border border-stone-200 text-rose-700 px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Timetable Slot Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
        subtitle="Manage regular weekly instructional schedule"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Day of Week
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Slot Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              >
                <option value="LECTURE">Lecture</option>
                <option value="LAB">Laboratory</option>
                <option value="SEMINAR">Seminar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Start Time
              </label>
              <input
                type="text"
                placeholder="09:00:00"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                End Time
              </label>
              <input
                type="text"
                placeholder="10:30:00"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Course / Subject Title
              </label>
              <input
                type="text"
                placeholder="e.g. Data Structures & Algorithms"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Code
              </label>
              <input
                type="text"
                placeholder="CS-301"
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Faculty Instructor Name
              </label>
              <input
                type="text"
                value={formData.facultyName}
                onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Room / Venue Number
              </label>
              <input
                type="text"
                placeholder="e.g. Hall C or Lab 4"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              {editingSlot ? 'Update Slot' : 'Save Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Slot Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={handleDeleteSlot}
        title="Remove Timetable Slot"
        message={`Are you sure you want to remove ${slotToDelete?.subject} scheduled on ${slotToDelete?.day} at ${slotToDelete?.startTime}?`}
        confirmText="Remove Slot"
      />
    </div>
  );
};

