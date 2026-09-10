import { jwtDecode as decode } from 'jwt-decode';
import { UserPayload } from '../types';

export function decodeToken(token: string): UserPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const decoded = decode<UserPayload>(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    try {
      // Manual base64 fallback
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
