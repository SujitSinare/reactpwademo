import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Download,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { usePwa } from '../../features/pwa/PwaContext';
import { storage } from '../../lib/storage';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, switchUser, switchRole, allUsers, logout } = useAuth();
  const { isOnline, isInstallable, installApp, isInstalled } = usePwa();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.getTheme());

  const searchRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    storage.setTheme(nextTheme);
  };

  const applications = storage.getApplications();
  const customers = storage.getCustomers();
  const notifications = storage.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filter search results
  const filteredApps = searchQuery.trim()
    ? applications.filter(
        (a) =>
          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.applicant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.loanDetails.product.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredCustomers = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  // Breadcrumb generator
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Dashboard';
    if (path === '/applications') return 'Loan Applications';
    if (path === '/applications/new') return 'New Loan Origination';
    if (path.startsWith('/applications/')) return 'Application Detail';
    if (path === '/customers') return 'Customer Management';
    if (path === '/verification') return 'Document Verification';
    if (path === '/credit-assessment') return 'Credit Assessment';
    if (path === '/approvals') return 'Approval Workflow';
    if (path === '/disbursement') return 'Disbursement Hub';
    if (path === '/reports') return 'Reports & Analytics';
    if (path === '/notifications') return 'Notification Center';
    if (path === '/pwa-offline') return 'PWA & Offline Operations';
    if (path === '/settings') return 'Settings & Demo Config';
    return 'Unity LOS';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Unity LOS</span>
              <span className="text-xs text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {getBreadcrumbTitle()}
              </h1>
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium hidden md:block">
              Loan Origination & Credit Operations
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID (e.g. ULOS-2026), applicant name, or product..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in-50 duration-150">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Applications
              </div>
              {filteredApps.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 text-center">No applications found</div>
              ) : (
                filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      navigate(`/applications/${app.id}`);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-teal-600 dark:text-teal-400 mr-2">{app.id}</span>
                      <span className="text-slate-800 dark:text-slate-200">{app.applicant.fullName}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({app.loanDetails.product})</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {app.status}
                    </Badge>
                  </button>
                ))
              )}

              {filteredCustomers.length > 0 && (
                <>
                  <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800 mt-1">
                    Matching Customers
                  </div>
                  {filteredCustomers.map((cust) => (
                    <button
                      key={cust.id}
                      onClick={() => {
                        navigate('/customers');
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{cust.fullName}</span>
                      <span className="text-slate-400 text-[11px]">{cust.city}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline status badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
          </div>

          {/* PWA Install Button (Visible on mobile and desktop whenever not already installed) */}
          {!isInstalled && (
            <Button
              variant="outline"
              size="sm"
              onClick={installApp}
              title="Install Unity LOS app to your device"
              className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 text-xs px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-semibold">Install</span>
              <span className="hidden md:inline font-semibold">App</span>
            </Button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle color theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notification Bell with Badge & Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in-50 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Notifications ({notifications.length})
                  </span>
                  <button
                    onClick={() => {
                      storage.markAllNotificationsAsRead();
                    }}
                    className="text-[11px] text-teal-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        storage.markNotificationAsRead(n.id);
                        if (n.actionUrl) navigate(n.actionUrl);
                        setShowNotifDropdown(false);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                        !n.read ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      navigate('/notifications');
                      setShowNotifDropdown(false);
                    }}
                    className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    View all notifications <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher Dropdown */}
          <div ref={roleRef} className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-teal-500/50"
              />
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-none">
                  {currentUser.role}
                </p>
                <p className="text-[9px] text-teal-600 dark:text-teal-400 font-medium leading-none mt-0.5">
                  Simulated Demo
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {/* Role Selector Popup */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in-50 duration-150">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Switch Demo Account / Role</span>
                </div>
                <div className="mt-2 space-y-1">
                  {allUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUser(user.id);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight truncate">{user.name}</p>
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium leading-tight">
                            {user.role}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight truncate">{user.branch}</p>
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowRoleDropdown(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Sign Out of Session
                    </span>
                    <span className="text-[10px] uppercase font-mono text-slate-400">Exit</span>
                  </button>
                </div>
                <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 text-center">
                  Unity SFB Internal System • Session Encrypted
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
