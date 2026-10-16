import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { UserPayload, Role } from '../types';
import { decodeToken } from '../utils/jwtDecode';

export const DEFAULT_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlRlc3QgQWRtaW4iLCJyb2xlIjoiQURNSU4iLCJkZXBhcnRtZW50IjoiQ1NFIiwiY2xhc3Nyb29tSWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.VQxZNwlIWUaxSE2YdydT2ssH6cDNCNVXMbCOB3Q8bpw';

export const DEMO_TOKENS = {
  admin: DEFAULT_ADMIN_TOKEN,
  faculty:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDEiLCJuYW1lIjoiRHIuIFNhcmFoIE3DvGxsZXIiLCJyb2xlIjoiRkFDVUxUWSIsImRlcGFydG1lbnQiOiJDU0UiLCJjbGFzc3Jvb21JZCI6MSwiZXhwIjo5OTk5OTk5OTk5fQ.demoFacultySignature',
  student:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMDEiLCJuYW1lIjoiQWxleCBNZXJjZXIiLCJyb2xlIjoiU1RVREVOVCIsImRlcGFydG1lbnQiOiJDU0UiLCJjbGFzc3Jvb21JZCI6MSwiZXhwIjo5OTk5OTk5OTk5fQ.demoStudentSignature',
};

interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
  role: Role | null;
  classroomId: number;
  isAuthenticated: boolean;
  login: (token?: string) => void;
  logout: () => void;
  switchDemoRole: (role: 'student' | 'faculty' | 'admin') => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || DEFAULT_ADMIN_TOKEN;
  });

  const [user, setUser] = useState<UserPayload | null>(() => {
    const initialToken = localStorage.getItem('token') || DEFAULT_ADMIN_TOKEN;
    return decodeToken(initialToken);
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const decoded = decodeToken(token);
      setUser(decoded);
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (newToken?: string) => {
    const t = newToken || DEFAULT_ADMIN_TOKEN;
    setToken(t);
  };

  const logout = () => {
    setToken(null);
  };

  const switchDemoRole = (roleType: 'student' | 'faculty' | 'admin') => {
    const selectedToken = DEMO_TOKENS[roleType];
    setToken(selectedToken);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || null,
        classroomId: user?.classroomId || 1,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
