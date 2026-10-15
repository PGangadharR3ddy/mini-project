import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ApiStatusBanner } from '../common/ApiStatusBanner';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div id="app-root-layout" className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Top persistent dev/backend banner */}
      <ApiStatusBanner />

      <div className="flex-1 flex min-h-0 relative items-stretch">
        {/* Desktop Sidebar: full-stretch background with sticky viewport pinned navigation */}
        <div className="hidden lg:block shrink-0 w-64 bg-slate-900 self-stretch border-r border-slate-800">
          <Sidebar />
        </div>

        {/* Mobile Drawer Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 h-full max-h-screen overflow-hidden animate-in slide-in-from-left duration-200">
              <button
                type="button"
                id="close-mobile-sidebar"
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 z-30 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar onItemClick={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Navbar onToggleSidebar={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
