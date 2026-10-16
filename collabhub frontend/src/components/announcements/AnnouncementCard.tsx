import React from 'react';
import { Announcement, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { Pin, Edit2, Trash2, User, Building, School } from 'lucide-react';

interface AnnouncementCardProps {
  announcement: Announcement;
  currentUserRole?: UserRole;
  currentUserId?: string;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  currentUserRole,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const isAuthor = currentUserId === announcement.authorId;
  const isAdmin = currentUserRole === 'ADMIN';
  const isFaculty = currentUserRole === 'FACULTY';
  const canModify = isAdmin || (isFaculty && isAuthor) || isAuthor;

  return (
    <div
      id={`announcement-card-${announcement.id}`}
      className={`bg-white rounded-2xl border ${
        announcement.pinned
          ? 'border-indigo-300 ring-1 ring-indigo-100 shadow-xs'
          : 'border-slate-200/90 shadow-2xs'
      } p-5 md:p-6 transition-all hover:border-slate-300 flex flex-col justify-between gap-4`}
    >
      <div>
        {/* Card Header: Type Badge, Scope, Pin, Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="announcement" announcementType={announcement.type} size="md" />

            {announcement.type === 'SECTION' && announcement.classroomName && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <School className="w-3 h-3 text-slate-400" />
                {announcement.classroomName}
              </span>
            )}

            {announcement.type === 'DEPARTMENT' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <Building className="w-3 h-3 text-slate-400" />
                {announcement.department}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {announcement.pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                <Pin className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                Pinned
              </span>
            )}

            {canModify && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    id={`edit-announcement-${announcement.id}`}
                    onClick={() => onEdit(announcement)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Announcement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    id={`delete-announcement-${announcement.id}`}
                    onClick={() => onDelete(announcement)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug mb-2">
          {announcement.title}
        </h3>

        {/* Body text */}
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {announcement.body}
        </p>
      </div>

      {/* Author and Date Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
            {announcement.authorName.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-slate-800">{announcement.authorName}</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-[11px]">{announcement.authorRole}</span>
          </div>
        </div>

        <span className="text-slate-400" title={formatDateTime(announcement.createdAt)}>
          {formatRelativeTime(announcement.createdAt)}
        </span>
      </div>
    </div>
  );
};
