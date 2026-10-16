import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  return dayjs(isoString).format('MMM D, YYYY • h:mm A');
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  return dayjs(isoString).format('MMM D, YYYY');
}

export function formatShortDate(isoString?: string): string {
  if (!isoString) return '—';
  return dayjs(isoString).format('MMM D');
}

export function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    return dayjs(timeStr).format('HH:mm');
  }
  // If format is "09:00:00" -> "09:00"
  return timeStr.slice(0, 5);
}

export function formatTimeRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatRelative(isoString?: string): string {
  if (!isoString) return '';
  return dayjs(isoString).fromNow();
}

export function formatEventDayHeader(isoString?: string): string {
  if (!isoString) return '';
  const d = dayjs(isoString);
  if (d.isToday()) return `Today • ${d.format('MMM D, YYYY')}`;
  if (d.isTomorrow()) return `Tomorrow • ${d.format('MMM D, YYYY')}`;
  return `${d.format('dddd • MMM D, YYYY')}`;
}

export function getTodayDayOfWeek(): 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN' {
  const dayIndex = dayjs().day(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const days: ('SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT')[] = [
    'SUN',
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
  ];
  return days[dayIndex];
}
