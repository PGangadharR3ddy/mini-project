import React from 'react';
import { DayOfWeek, TimetableSlot } from '../../types';
import { Clock, MapPin, User, Edit2, Trash2, Plus, Sparkles } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

interface TimetableGridProps {
  slots: TimetableSlot[];
  canManage: boolean;
  onAddSlot: (day?: DayOfWeek) => void;
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slot: TimetableSlot) => void;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  canManage,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
}) => {
  // Group slots by day and sort by startTime
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<DayOfWeek, TimetableSlot[]>);

  const getSlotTypeStyle = (type?: string) => {
    switch (type) {
      case 'LAB':
        return 'border-l-4 border-l-emerald-500 bg-emerald-50/50 hover:bg-emerald-50/80';
      case 'TUTORIAL':
        return 'border-l-4 border-l-purple-500 bg-purple-50/50 hover:bg-purple-50/80';
      default:
        return 'border-l-4 border-l-indigo-500 bg-indigo-50/50 hover:bg-indigo-50/80';
    }
  };

  const getSlotBadge = (type?: string) => {
    switch (type) {
      case 'LAB':
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">LAB</span>;
      case 'TUTORIAL':
        return <span className="text-[10px] font-bold text-purple-700 bg-purple-100/90 px-1.5 py-0.5 rounded">TUTORIAL</span>;
      default:
        return <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-1.5 py-0.5 rounded">LECTURE</span>;
    }
  };

  return (
    <div id="timetable-weekly-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {DAYS.map((day) => {
        const daySlots = slotsByDay[day] || [];
        const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3) === day;

        return (
          <div
            key={day}
            id={`day-column-${day.toLowerCase()}`}
            className={`flex flex-col bg-white rounded-2xl border ${
              isToday ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm' : 'border-slate-200 shadow-2xs'
            } overflow-hidden`}
          >
            {/* Day Header */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                isToday ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50/80 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">{DAY_LABELS[day]}</span>
                {isToday && (
                  <span className="text-[10px] bg-white/20 text-white font-semibold px-1.5 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
              {canManage && (
                <button
                  type="button"
                  id={`add-slot-${day.toLowerCase()}-btn`}
                  onClick={() => onAddSlot(day)}
                  className={`p-1 rounded-lg transition-colors ${
                    isToday ? 'hover:bg-indigo-500 text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                  title={`Add slot to ${DAY_LABELS[day]}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Slots List */}
            <div className="p-3 flex-1 flex flex-col gap-2.5 min-h-[220px]">
              {daySlots.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <p className="text-xs font-medium">No classes scheduled</p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onAddSlot(day)}
                      className="mt-2 text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Slot
                    </button>
                  )}
                </div>
              ) : (
                daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    id={`slot-card-${slot.id}`}
                    className={`p-3 rounded-xl border border-slate-200/80 shadow-2xs transition-all relative group flex flex-col justify-between gap-2 ${getSlotTypeStyle(
                      slot.type
                    )}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                        </div>
                        {getSlotBadge(slot.type)}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {slot.subject}
                      </h4>
                      {slot.subjectCode && (
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">
                          {slot.subjectCode}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{slot.facultyName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-500 font-medium">{slot.room}</span>
                      </div>
                    </div>

                    {/* Action buttons for Faculty / Admin on hover */}
                    {canManage && (
                      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button
                          type="button"
                          id={`edit-slot-${slot.id}`}
                          onClick={() => onEditSlot(slot)}
                          className="p-1 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100"
                          title="Edit Slot"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          id={`delete-slot-${slot.id}`}
                          onClick={() => onDeleteSlot(slot)}
                          className="p-1 text-slate-600 hover:text-rose-600 rounded hover:bg-slate-100"
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
  );
};
