import React from 'react';
import { AcademicEvent, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { formatDateTime, getDaysUntil } from '../../utils/formatters';
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Edit2,
  Trash2,
  CalendarCheck,
} from 'lucide-react';

interface EventCardProps {
  event: AcademicEvent;
  currentUserRole?: UserRole;
  currentUserId?: string;
  onEdit?: (event: AcademicEvent) => void;
  onDelete?: (event: AcademicEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  currentUserRole,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const isAuthor = currentUserId === event.createdById;
  const isAdmin = currentUserRole === 'ADMIN';
  const isFaculty = currentUserRole === 'FACULTY';
  const canModify = isAdmin || (isFaculty && isAuthor) || isAuthor;

  const daysInfo = getDaysUntil(event.dateTime);
  const isTodayOrSoon = !daysInfo.isPast && daysInfo.days <= 2;

  return (
    <div
      id={`event-card-${event.id}`}
      className={`bg-white rounded-2xl border ${
        isTodayOrSoon
          ? 'border-indigo-300 ring-2 ring-indigo-50 shadow-xs'
          : 'border-slate-200/90 shadow-2xs'
      } p-5 md:p-6 transition-all hover:border-slate-300 flex flex-col justify-between gap-4`}
    >
      <div>
        {/* Header: Badges & Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="event" eventType={event.type} size="md" dot />

            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                daysInfo.isPast
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : daysInfo.days === 0
                  ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                  : daysInfo.days === 1
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {daysInfo.label}
            </span>

            {event.syncToCalendar && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CalendarCheck className="w-3 h-3" />
                Synced
              </span>
            )}
          </div>

          {canModify && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  id={`edit-event-${event.id}`}
                  onClick={() => onEdit(event)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Edit Event"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  id={`delete-event-${event.id}`}
                  onClick={() => onDelete(event)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5">
          {event.title}
        </h3>

        {/* Subject */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-2.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{event.subject}</span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
            {event.description}
          </p>
        )}
      </div>

      {/* Meta Pills: Date/Time, Duration, Venue */}
      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{formatDateTime(event.dateTime)}</span>
          </div>

          {event.durationMinutes > 0 && (
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{event.durationMinutes} mins</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>
      </div>
    </div>
  );
};
