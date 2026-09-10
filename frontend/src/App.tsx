import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedLayout } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { TimetablePage } from './pages/Timetable/TimetablePage';
import { AnnouncementsPage } from './pages/Announcements/AnnouncementsPage';
import { ResourcesPage } from './pages/Resources/ResourcesPage';
import { EventsPage } from './pages/Events/EventsPage';
import { AdminPage } from './pages/Admin/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes Hierarchy */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Bauhaus-Styled Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#faf9f4',
              color: '#1b1c19',
              border: '2px solid #1b1c19',
              borderRadius: '0px',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              fontWeight: '700',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#1b1c19',
              },
            },
            error: {
              iconTheme: {
                primary: '#ba1a1a',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
