export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  // If in HH:MM format
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
  }
  return timeStr;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function getDaysUntil(dateString: string): { label: string; isPast: boolean; days: number } {
  try {
    const target = new Date(dateString);
    const now = new Date();
    // Normalize to date start
    const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffMs = targetDateOnly.getTime() - nowDateOnly.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (days === 0) return { label: 'Today', isPast: false, days: 0 };
    if (days === 1) return { label: 'Tomorrow', isPast: false, days: 1 };
    if (days > 1 && days <= 7) return { label: `In ${days} days`, isPast: false, days };
    if (days > 7) return { label: formatDate(dateString), isPast: false, days };
    if (days === -1) return { label: 'Yesterday', isPast: true, days: -1 };
    return { label: `${Math.abs(days)}d ago`, isPast: true, days };
  } catch {
    return { label: dateString, isPast: false, days: 0 };
  }
}
