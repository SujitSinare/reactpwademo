import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Users,
  FileCheck2,
  Calculator,
  CheckSquare,
  Banknote,
  BarChart3,
  Bell,
  Smartphone,
  Settings,
  ShieldAlert,
  ChevronRight,
  X,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { usePwa } from '../../features/pwa/PwaContext';
import { storage } from '../../lib/storage';
import { cn } from '../../lib/utils';
import { UnityLogo } from './UnityLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { isInstalled, installApp, needRefresh, updateApp } = usePwa();
  const applications = storage.getApplications();

  // Dynamic status badges
  const pendingDocsCount = applications.filter(
    (a) => a.status === 'Document Verification' || a.status === 'Submitted'
  ).length;
  const pendingApprovalsCount = applications.filter((a) => a.status === 'Pending Approval').length;
  const pendingDisbursementCount = applications.filter((a) => a.status === 'Ready for Disbursement').length;
  const unreadNotifsCount = storage.getNotifications().filter((n) => !n.read).length;

  const navItems = [
    { label: 'Executive Dashboard', path: '/', icon: LayoutDashboard },
    {
      label: 'Loan Applications',
      path: '/applications',
      icon: FileSpreadsheet,
      badge: applications.length.toString(),
    },
    { label: 'New Application', path: '/applications/new', icon: PlusCircle, isAction: true },
    { label: 'Customer Directory', path: '/customers', icon: Users },
    {
      label: 'Document Verification',
      path: '/verification',
      icon: FileCheck2,
      badge: pendingDocsCount > 0 ? pendingDocsCount.toString() : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      label: 'Credit Assessment',
      path: '/credit-assessment',
      icon: Calculator,
    },
    {
      label: 'Approval Workflow',
      path: '/approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount.toString() : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      label: 'Disbursement Hub',
      path: '/disbursement',
      icon: Banknote,
      badge: pendingDisbursementCount > 0 ? pendingDisbursementCount.toString() : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount.toString() : undefined,
      badgeColor: 'bg-rose-500/30 text-rose-300 border-rose-500/30',
    },
    { label: 'PWA & Offline Center', path: '/pwa-offline', icon: Smartphone },
    { label: 'Settings & Config', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-72 bg-unity-navy-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] lg:pt-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UnityLogo variant="full" theme="dark" size="sm" />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Disclaimer Strip */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="font-medium tracking-wide">DEMO — SAMPLE DATA ONLY</span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-semibold rounded-full border',
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* PWA Update Ready Banner */}
        {needRefresh && (
          <div className="mx-3 mb-2 p-3 rounded-xl bg-gradient-to-r from-amber-950/70 to-slate-900 border border-amber-500/40 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Update Ready</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              A newer version of Unity LOS has been downloaded.
            </p>
            <button
              type="button"
              onClick={() => updateApp()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload App</span>
            </button>
          </div>
        )}

        {/* Install Mobile App Banner (Strictly restricted when already installed on this device) */}
        {!isInstalled && !needRefresh && (
          <div className="mx-3 mb-2 p-3 rounded-xl bg-gradient-to-r from-teal-950/70 to-slate-900 border border-teal-500/30 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-300 text-xs">
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span>Install Mobile App</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Works offline with standalone home screen launch.
            </p>
            <button
              type="button"
              onClick={() => {
                installApp();
                if (window.innerWidth < 1024) onClose();
              }}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Unity LOS</span>
            </button>
          </div>
        )}

        {/* Active Demo Role Card */}
        <div className="p-3.5 m-3 mb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:mb-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-teal-400/40"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-teal-400 font-medium truncate">{currentUser.role}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.branch}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
