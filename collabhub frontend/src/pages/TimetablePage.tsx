import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getClassroomWeeklyTimetable,
  getClassroomDayTimetable,
  getFacultyWeeklyTimetable,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
} from '../api/timetable';
import { DayOfWeek, TimetableSlot } from '../types';
import { TimetableGrid } from '../components/timetable/TimetableGrid';
import { TimetableDayView } from '../components/timetable/TimetableDayView';
import { SlotModal } from '../components/timetable/SlotModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  CalendarDays,
  LayoutGrid,
  ListFilter,
  Plus,
  UserCheck,
  Building,
  School,
  Clock,
} from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const { user, isFaculty, isAdmin, classroomId, classroomName } = useAuth();
  const { success, error: showError } = useToast();

  const [viewMode, setViewMode] = useState<'WEEKLY' | 'DAILY'>('WEEKLY');
  const [facultyScheduleMode, setFacultyScheduleMode] = useState<boolean>(isFaculty);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected day for daily view
  const currentDay = (new Date()
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase()
    .slice(0, 3) as DayOfWeek) || 'MON';
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDay);

  // Modal states
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [defaultModalDay, setDefaultModalDay] = useState<DayOfWeek>('MON');

  // Delete confirmation dialog
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = isFaculty || isAdmin;

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      if (facultyScheduleMode && isFaculty && user?.userId) {
        const data = await getFacultyWeeklyTimetable(user.userId);
        setSlots(data);
      } else {
        const activeClassId = classroomId || 'cls_cse_3a';
        const data = await getClassroomWeeklyTimetable(activeClassId);
        setSlots(data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [facultyScheduleMode, isFaculty, user?.userId, classroomId, showError]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const handleOpenAddSlot = (day?: DayOfWeek) => {
    setEditingSlot(null);
    setDefaultModalDay(day || selectedDay || 'MON');
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async (slotData: Omit<TimetableSlot, 'id'>) => {
    if (editingSlot) {
      await updateTimetableSlot(editingSlot.id, slotData);
      success('Timetable slot updated successfully');
    } else {
      await createTimetableSlot(slotData);
      success('New class slot added to schedule');
    }
    await loadTimetable();
  };

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTimetableSlot(slotToDelete.id);
      success('Timetable slot deleted');
      setSlotToDelete(null);
      await loadTimetable();
    } catch (err: any) {
      showError(err.message || 'Failed to delete slot');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="timetable-page" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              {facultyScheduleMode ? 'Personal Teaching Schedule' : 'Classroom Timetable'}
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {facultyScheduleMode
              ? `Assigned weekly lectures and laboratory sessions for ${user?.name}`
              : `Weekly session distribution for ${classroomName || 'active classroom'}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Faculty Schedule Mode Toggle */}
          {isFaculty && (
            <button
              type="button"
              id="toggle-faculty-mode-btn"
              onClick={() => setFacultyScheduleMode(!facultyScheduleMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                facultyScheduleMode
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {facultyScheduleMode ? 'My Teaching Schedule' : 'Section Timetable'}
            </button>
          )}

          {/* View Mode Toggle (Weekly Grid vs Daily View) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              id="view-weekly-toggle"
              onClick={() => setViewMode('WEEKLY')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'WEEKLY'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Weekly Grid
            </button>
            <button
              type="button"
              id="view-daily-toggle"
              onClick={() => setViewMode('DAILY')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'DAILY'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Daily View
            </button>
          </div>

          {/* Add Slot Button (Faculty/Admin) */}
          {canManage && (
            <button
              type="button"
              id="add-timetable-slot-btn"
              onClick={() => handleOpenAddSlot()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Class Slot
            </button>
          )}
        </div>
      </div>

      {/* Daily View Day Selector Tabs (if Daily View active) */}
      {viewMode === 'DAILY' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as DayOfWeek[]).map((day) => {
            const isSelected = selectedDay === day;
            const isToday = currentDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : isToday
                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {day === 'MON' ? 'Monday' : day === 'TUE' ? 'Tuesday' : day === 'WED' ? 'Wednesday' : day === 'THU' ? 'Thursday' : day === 'FRI' ? 'Friday' : 'Saturday'}
                {isToday && <span className="ml-1.5 text-[10px] opacity-80">(Today)</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Timetable Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : viewMode === 'WEEKLY' ? (
        <TimetableGrid
          slots={slots}
          canManage={canManage}
          onAddSlot={handleOpenAddSlot}
          onEditSlot={handleOpenEditSlot}
          onDeleteSlot={(slot) => setSlotToDelete(slot)}
        />
      ) : (
        <TimetableDayView
          day={selectedDay}
          slots={slots.filter((s) => s.day === selectedDay)}
          canManage={canManage}
          onAddSlot={() => handleOpenAddSlot(selectedDay)}
          onEditSlot={handleOpenEditSlot}
          onDeleteSlot={(slot) => setSlotToDelete(slot)}
        />
      )}

      {/* Slot Modal (Add / Edit) */}
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        onSave={handleSaveSlot}
        initialSlot={editingSlot}
        defaultDay={defaultModalDay}
        defaultClassroomId={classroomId || 'cls_cse_3a'}
        defaultFacultyId={user?.userId || 'usr_faculty_01'}
        defaultFacultyName={user?.name || 'Dr. Ramesh Sharma'}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Timetable Slot"
        message={`Are you sure you want to delete "${slotToDelete?.subject}" (${slotToDelete?.day} ${slotToDelete?.startTime} - ${slotToDelete?.endTime}) from the timetable?`}
        confirmLabel="Delete Slot"
        isLoading={isDeleting}
      />
    </div>
  );
};
