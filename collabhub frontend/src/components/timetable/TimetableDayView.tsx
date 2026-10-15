import React from 'react';
import { DayOfWeek, TimetableSlot } from '../../types';
import { Clock, MapPin, User, Edit2, Trash2, Calendar } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

interface TimetableDayViewProps {
  day: DayOfWeek;
  slots: TimetableSlot[];
  canManage: boolean;
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slot: TimetableSlot) => void;
  onAddSlot: () => void;
}

export const TimetableDayView: React.FC<TimetableDayViewProps> = ({
  day,
  slots,
  canManage,
  onEditSlot,
  onDeleteSlot,
  onAddSlot,
}) => {
  const sortedSlots = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div id="timetable-day-view" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Schedule for {day === 'MON' ? 'Monday' : day === 'TUE' ? 'Tuesday' : day === 'WED' ? 'Wednesday' : day === 'THU' ? 'Thursday' : day === 'FRI' ? 'Friday' : 'Saturday'}
            </h3>
            <p className="text-xs text-slate-500">{sortedSlots.length} sessions scheduled today</p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onAddSlot}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            + Add Period
          </button>
        )}
      </div>

      {sortedSlots.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm font-medium">No classes scheduled for today.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {sortedSlots.map((slot) => (
            <div key={slot.id} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      <Clock className="w-3 h-3" />
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                      {slot.type || 'LECTURE'}
                    </span>
                    {slot.subjectCode && (
                      <span className="text-xs font-mono font-bold text-slate-600">
                        [{slot.subjectCode}]
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 pt-1">{slot.subject}</h4>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {slot.facultyName}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {slot.room}
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onEditSlot(slot)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                      title="Edit Period"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSlot(slot)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                      title="Delete Period"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
