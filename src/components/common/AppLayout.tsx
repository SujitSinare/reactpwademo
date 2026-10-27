import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../ui/Toast';
import { InstallGuideModal } from './InstallGuideModal';
import { usePwa } from '../../features/pwa/PwaContext';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { needRefresh, updateApp } = usePwa();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* New Version PWA Banner */}
        {needRefresh && (
          <div className="bg-teal-600 text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>A new version of Unity LOS is available. Update now to load the latest features.</span>
            </div>
            <Button
              variant="navy"
              size="sm"
              onClick={updateApp}
              className="text-xs bg-slate-900 text-white hover:bg-slate-800 border-none py-1"
            >
              Update & Reload
            </Button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Unity Small Finance Bank</span>
              <span>—</span>
              <span>Loan Origination System (LOS) Demo</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Demonstration project with synthetic mock data. Not affiliated with real banking credentials.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Toast Alerts */}
      <Toast />

      {/* Responsive PWA Installation Guide Modal */}
      <InstallGuideModal />
    </div>
  );
};
