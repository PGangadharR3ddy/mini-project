import React from 'react';
import { AnnouncementType, ResourceType, EventType, Role } from '../types';

interface BadgeProps {
  type?: AnnouncementType | ResourceType | EventType | Role | 'URGENT' | 'UPCOMING' | 'ACADEMIC' | 'CONFLICT' | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type = '', label, className = '', size = 'sm' }) => {
  const normalized = (type || label || '').toUpperCase();
  const text = label || type;

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200'; // default neutral

  switch (normalized) {
    case 'SECTION':
    case 'NOTES':
    case 'PRESENTATION':
    case 'FACULTY':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      break;

    case 'DEPARTMENT':
    case 'RECORDED_LECTURE':
    case 'RECORDED LECTURE':
    case 'VIVA':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200/80';
      break;

    case 'GENERAL':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;

    case 'TEST':
    case 'URGENT':
    case 'ADMIN':
    case 'CONFLICT':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;

    case 'ASSIGNMENT':
    case 'UPCOMING':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
      break;

    case 'PPT':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200/80';
      break;

    case 'REFERENCE':
    case 'OTHER':
    case 'STUDENT':
      colorClasses = 'bg-stone-100 text-stone-700 border-stone-200/90';
      break;

    default:
      colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-medium tracking-normal rounded-md'
      : 'px-2.5 py-1 text-xs font-medium tracking-normal rounded-md';

  return (
    <span
      className={`inline-flex items-center justify-center border ${colorClasses} ${sizeClasses} ${className}`}
    >
      {text}
    </span>
  );
};

