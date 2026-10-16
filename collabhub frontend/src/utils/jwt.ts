import { JwtPayload, UserRole } from '../types';

/**
 * Decodes a JWT token safely from base64 payload.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    
    const payload = parts[1];
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Generates a mock JWT token for testing/demo credentials.
 */
export function createMockJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const iat = Math.floor(Date.now() / 1000);
  
  const fullPayload: JwtPayload = {
    ...payload,
    exp,
    iat,
  };

  const base64UrlEncode = (obj: object) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(fullPayload);
  const signatureEncoded = btoa('mock_signature_key').replace(/=+$/, '');

  return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}

export const DEMO_USERS = [
  {
    email: 'alex.student@college.edu',
    name: 'Alex Rivera',
    role: 'STUDENT' as UserRole,
    userId: 'usr_student_01',
    classroomId: 'cls_cse_3a',
    classroomName: 'CSE - 3rd Year (Section A)',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: '3rd Year Student • Section A',
  },
  {
    email: 'prof.sharma@college.edu',
    name: 'Dr. Ramesh Sharma',
    role: 'FACULTY' as UserRole,
    userId: 'usr_faculty_01',
    classroomId: 'cls_cse_3a',
    classroomName: 'CSE - 3rd Year (Section A)',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: 'Associate Professor • Distributed Systems & AI',
  },
  {
    email: 'admin@college.edu',
    name: 'Elena Rostova',
    role: 'ADMIN' as UserRole,
    userId: 'usr_admin_01',
    department: 'Academic Administration',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    description: 'Dean of Academic Affairs • System Administrator',
  },
];
