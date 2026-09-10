import { Role } from '../types';

export function canManageClassrooms(role?: Role): boolean {
  return role === 'ADMIN';
}

export function canCreateContent(role?: Role): boolean {
  return role === 'ADMIN' || role === 'FACULTY';
}

export function canEditContent(role?: Role, authorName?: string, currentUserName?: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'FACULTY') {
    if (!authorName || !currentUserName) return true;
    return authorName.toLowerCase().trim() === currentUserName.toLowerCase().trim();
  }
  return false;
}

export function canDeleteContent(role?: Role, authorName?: string, currentUserName?: string): boolean {
  return canEditContent(role, authorName, currentUserName);
}
