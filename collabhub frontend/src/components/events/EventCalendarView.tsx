import React, { useState } from 'react';
import { AcademicEvent, UserRole } from '../../types';
import { EventCard } from './EventCard';
import { formatDateTime } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { EVENT_TYPE_CONFIG } from '../../utils/badgeColors';

interface EventCalendarViewProps {
  events: AcademicEvent[];
  currentUserRole?: UserRole;
  currentUserId?: string;
  onEdit?: (event: AcademicEvent) => void;
  onDelete?: (event: AcademicEvent) => void;
}

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({
  events,
  currentUserRole,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = events.reduce((acc, event) => {
    try {
      const dateKey = new Date(event.dateTime).toISOString().slice(0, 10);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
    } catch {}
    return acc;
  }, {} as Record<string, AcademicEvent[]>);

  // Generate 14 days centered around selected date or current month
  const getDatesRange = () => {
    const dates = [];
    const base = new Date(selectedDate);
    for (let i = -3; i <= 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const datesRange = getDatesRange();
  const selectedDayEvents = eventsByDate[selectedDate] || [];

  return (
    <div id="event-calendar-view" className="space-y-6">
      {/* Date Carousel / Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Academic Schedule Strip
            </h4>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {datesRange.map((d) => {
            const dateStr = d.toISOString().slice(0, 10);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().slice(0, 10);
            const dayEvents = eventsByDate[dateStr] || [];

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center justify-center min-w-[70px] p-2.5 rounded-xl border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200'
                    : isToday
                    ? 'bg-indigo-50/80 text-indigo-900 border-indigo-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {d.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-base font-bold my-0.5">
                  {d.getDate()}
                </span>
                <div className="flex items-center gap-0.5 h-2">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : EVENT_TYPE_CONFIG[ev.type].dot
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">
            Events for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            <p className="text-sm font-medium">No tests, vival, or assessments scheduled on this date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
