import { AnnouncementType, EventType, ResourceType, UserRole } from '../types';

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; bg: string; text: string; border: string; dot: string; darkBg: string }
> = {
  TEST: {
    label: 'Test / Exam',
    bg: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    darkBg: 'bg-red-600',
  },
  ASSIGNMENT: {
    label: 'Assignment',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    darkBg: 'bg-amber-600',
  },
  VIVA: {
    label: 'Viva / Oral',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    darkBg: 'bg-purple-600',
  },
  PRESENTATION: {
    label: 'Presentation',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    darkBg: 'bg-blue-600',
  },
  OTHER: {
    label: 'Event / Activity',
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
    darkBg: 'bg-slate-600',
  },
};

export const ANNOUNCEMENT_TYPE_CONFIG: Record<
  AnnouncementType,
  { label: string; bg: string; text: string; border: string; iconColor: string }
> = {
  SECTION: {
    label: 'Section Only',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    text: 'text-sky-700',
    border: 'border-sky-200',
    iconColor: 'text-sky-500',
  },
  DEPARTMENT: {
    label: 'Department',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    text: 'text-teal-700',
    border: 'border-teal-200',
    iconColor: 'text-teal-500',
  },
  GENERAL: {
    label: 'General Notice',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-500',
  },
};

export const RESOURCE_TYPE_CONFIG: Record<
  ResourceType,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  NOTES: {
    label: 'Lecture Notes',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'FileText',
  },
  PPT: {
    label: 'Slide Deck',
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'Presentation',
  },
  ASSIGNMENT: {
    label: 'Assignment Doc',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'ClipboardList',
  },
  REFERENCE: {
    label: 'Reference Material',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'BookOpen',
  },
  RECORDED_LECTURE: {
    label: 'Recorded Lecture',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'Video',
  },
};

export const ROLE_CONFIG: Record<UserRole, { label: string; badge: string }> = {
  STUDENT: {
    label: 'Student',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  FACULTY: {
    label: 'Faculty',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ADMIN: {
    label: 'Administrator',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};

export const PROJECT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  OPEN: {
    label: 'Open',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

export const REQUEST_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: 'Pending Review',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  REJECTED: {
    label: 'Declined',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

