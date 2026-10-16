import React from 'react';
import {
  ANNOUNCEMENT_TYPE_CONFIG,
  EVENT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  REQUEST_STATUS_CONFIG,
  RESOURCE_TYPE_CONFIG,
  ROLE_CONFIG,
} from '../../utils/badgeColors';
import {
  AnnouncementType,
  EventType,
  JoinRequestStatus,
  ProjectStatus,
  ResourceType,
  UserRole,
} from '../../types';

interface BadgeProps {
  id?: string;
  variant?: 'role' | 'event' | 'resource' | 'announcement' | 'project' | 'request' | 'custom';
  role?: UserRole;
  eventType?: EventType;
  resourceType?: ResourceType;
  announcementType?: AnnouncementType;
  projectStatus?: ProjectStatus;
  requestStatus?: JoinRequestStatus;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  id,
  variant = 'custom',
  role,
  eventType,
  resourceType,
  announcementType,
  projectStatus,
  requestStatus,
  label,
  className = '',
  size = 'md',
  dot = false,
}) => {
  let displayLabel = label;
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (variant === 'role' && role) {
    const config = ROLE_CONFIG[role];
    displayLabel = displayLabel || config.label;
    colorClasses = config.badge;
  } else if (variant === 'event' && eventType) {
    const config = EVENT_TYPE_CONFIG[eventType];
    displayLabel = displayLabel || config.label;
    colorClasses = config.bg;
    dotColor = config.dot;
  } else if (variant === 'resource' && resourceType) {
    const config = RESOURCE_TYPE_CONFIG[resourceType];
    displayLabel = displayLabel || config.label;
    colorClasses = config.bg;
  } else if (variant === 'announcement' && announcementType) {
    const config = ANNOUNCEMENT_TYPE_CONFIG[announcementType];
    displayLabel = displayLabel || config.label;
    colorClasses = config.bg;
  } else if (variant === 'project' && projectStatus) {
    const config = PROJECT_STATUS_CONFIG[projectStatus] || {
      label: projectStatus,
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };
    displayLabel = displayLabel || config.label;
    colorClasses = config.bg;
    dotColor = config.dot;
  } else if (variant === 'request' && requestStatus) {
    const config = REQUEST_STATUS_CONFIG[requestStatus] || {
      label: requestStatus,
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    displayLabel = displayLabel || config.label;
    colorClasses = config.bg;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap tracking-wide select-none ${sizeClasses} ${colorClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {displayLabel}
    </span>
  );
};
