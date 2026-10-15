import { axiosInstance, executeApi } from './client';
import { ApiResponse, User } from '../types';
import { createMockJwt, DEMO_USERS } from '../utils/jwt';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponseData> {
  return executeApi<AuthResponseData>(
    () => axiosInstance.post<ApiResponse<AuthResponseData>>('/api/auth/login', credentials),
    () => {
      // Find matching demo user or generate realistic account
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === credentials.email.trim().toLowerCase()
      );

      let user: User;
      if (matched) {
        user = matched;
      } else {
        const isFaculty = credentials.email.includes('faculty') || credentials.email.includes('prof');
        const isAdmin = credentials.email.includes('admin');
        const role = isAdmin ? 'ADMIN' : isFaculty ? 'FACULTY' : 'STUDENT';
        const nameParts = credentials.email.split('@')[0].split('.');
        const capitalizedName = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

        user = {
          userId: `usr_${Date.now()}`,
          name: capitalizedName || 'Classroom Member',
          email: credentials.email,
          role,
          classroomId: role !== 'ADMIN' ? 'cls_cse_3a' : undefined,
          classroomName: role !== 'ADMIN' ? 'CSE - 3rd Year (Section A)' : undefined,
          department: 'Computer Science & Engineering',
        };
      }

      const token = createMockJwt({
        userId: user.userId,
        role: user.role,
        name: user.name,
        email: user.email,
        classroomId: user.classroomId,
        classroomName: user.classroomName,
        department: user.department,
      });

      return { token, user };
    }
  );
}
