import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { JwtPayload, User, UserRole } from '../types';
import { decodeJwt, DEMO_USERS, createMockJwt } from '../utils/jwt';
import { loginApi, LoginCredentials } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  userId: string | null;
  role: UserRole | null;
  name: string | null;
  classroomId: string | null;
  classroomName: string | null;
  department: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isStudent: boolean;
  isFaculty: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchDemoUser: (userIndex: number) => void;
  setClassroom: (classroomId: string, classroomName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth from token
  const processToken = useCallback((rawToken: string | null): User | null => {
    if (!rawToken) return null;
    const decoded = decodeJwt(rawToken);
    if (!decoded) return null;

    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('jwt_token');
      return null;
    }

    const userData: User = {
      userId: decoded.userId,
      name: decoded.name || 'Classroom User',
      email: decoded.email || '',
      role: decoded.role || 'STUDENT',
      classroomId: decoded.classroomId || 'cls_cse_3a',
      classroomName: decoded.classroomName || (decoded.classroomId === 'cls_cse_3a' ? 'CSE - 3rd Year (Section A)' : undefined),
      department: decoded.department || 'Computer Science & Engineering',
    };

    return userData;
  }, []);

  useEffect(() => {
    const existingToken = localStorage.getItem('jwt_token');
    if (existingToken) {
      const parsedUser = processToken(existingToken);
      if (parsedUser) {
        setUser(parsedUser);
        setToken(existingToken);
      } else {
        setToken(null);
        setUser(null);
      }
    } else {
      // Default to student demo user for great immediate preview out-of-the-box
      const defaultUser = DEMO_USERS[0];
      const initialToken = createMockJwt({
        userId: defaultUser.userId,
        role: defaultUser.role,
        name: defaultUser.name,
        email: defaultUser.email,
        classroomId: defaultUser.classroomId,
        classroomName: defaultUser.classroomName,
        department: defaultUser.department,
      });
      localStorage.setItem('jwt_token', initialToken);
      setToken(initialToken);
      setUser(defaultUser);
    }
    setIsLoading(false);
  }, [processToken]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      localStorage.setItem('jwt_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoUser = (index: number) => {
    const demo = DEMO_USERS[index % DEMO_USERS.length];
    const newToken = createMockJwt({
      userId: demo.userId,
      role: demo.role,
      name: demo.name,
      email: demo.email,
      classroomId: demo.classroomId,
      classroomName: demo.classroomName,
      department: demo.department,
    });
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
    setUser(demo);
  };

  const setClassroom = (classroomId: string, classroomName?: string) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      classroomId,
      classroomName: classroomName || user.classroomName,
    };
    const newToken = createMockJwt({
      userId: updatedUser.userId,
      role: updatedUser.role,
      name: updatedUser.name,
      email: updatedUser.email,
      classroomId: updatedUser.classroomId,
      classroomName: updatedUser.classroomName,
      department: updatedUser.department,
    });
    localStorage.setItem('jwt_token', newToken);
    setToken(newToken);
    setUser(updatedUser);
  };

  const isAuthenticated = !!token && !!user;
  const isStudent = user?.role === 'STUDENT';
  const isFaculty = user?.role === 'FACULTY';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userId: user?.userId || null,
        role: user?.role || null,
        name: user?.name || null,
        classroomId: user?.classroomId || 'cls_cse_3a',
        classroomName: user?.classroomName || null,
        department: user?.department || null,
        email: user?.email || null,
        isAuthenticated,
        isStudent,
        isFaculty,
        isAdmin,
        isLoading,
        login,
        logout,
        switchDemoUser,
        setClassroom,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
