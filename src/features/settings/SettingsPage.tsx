import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Sun,
  Moon,
  Key,
  Database,
  ShieldCheck,
  Building2,
  User,
  CheckCircle2,
  Smartphone,
  Download,
  HelpCircle,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const SettingsPage: React.FC = () => {
  const { currentUser, switchUser, allUsers } = useAuth();
  const {
    isInstalled,
    canPromptNativeInstall,
    platform,
    installApp,
    openInstallGuide,
    showToast,
  } = usePwa();

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [showResetModal, setShowResetModal] = useState(false);
  const [apiMode, setApiMode] = useState<'demo' | 'remote'>('demo');

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    storage.setTheme(newTheme);
    showToast('Theme Updated', `Theme set to ${newTheme} mode.`, 'info');
  };

  const handleResetDatabase = () => {
    storage.initIfEmpty(true);
    setShowResetModal(false);
    showToast('Database Reset', 'Reset all pipeline applications and customers to original seed data.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Settings & Demonstration Environment
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure simulated user profiles, appearance, mock data reset, and VAPID credentials
        </p>
      </div>

      {/* Active User Account & Role Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-sm">Active Simulated User Profile</CardTitle>
          </div>
          <Badge variant="primary">{currentUser.role}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-teal-500"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</h3>
              <p className="text-slate-500">{currentUser.email}</p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                <span>Employee Code: {currentUser.employeeCode}</span>
                <span>•</span>
                <span>Assigned Branch: {currentUser.branch}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">
              Switch Test Account / Persona
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    showToast('Role Switched', `Now logged in as ${user.name} (${user.role}).`, 'info');
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    user.id === currentUser.id
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{user.role}</p>
                  </div>
                  {user.id === currentUser.id && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme & Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance & Visual Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-slate-500">Select application visual display mode:</p>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              onClick={() => toggleTheme('light')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                theme === 'light'
                  ? 'border-teal-500 bg-teal-50/50 text-teal-900 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode (Default)</span>
            </button>

            <button
              onClick={() => toggleTheme('dark')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                theme === 'dark'
                  ? 'border-teal-500 bg-slate-800 text-white font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* PWA & Standalone App Installation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-sm">PWA & Standalone Application</CardTitle>
          </div>
          {isInstalled ? (
            <Badge variant="success">Standalone App Active</Badge>
          ) : (
            <Badge variant="outline">
              Platform: {platform === 'ios' ? 'Apple iOS' : platform === 'android' ? 'Android' : 'Desktop'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {isInstalled
                  ? 'Unity LOS is running as an installed standalone app.'
                  : 'Install Unity LOS directly to your home screen or desktop.'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isInstalled
                  ? 'Browser navigation chrome and URL bars are disabled for optimal screen space and native performance.'
                  : platform === 'ios'
                  ? 'On iOS Safari, tap the Share button (□↑) and choose "Add to Home Screen".'
                  : canPromptNativeInstall
                  ? 'Android Chrome native install prompt is ready to trigger.'
                  : 'Click below to launch the step-by-step installation guide.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={openInstallGuide}
                className="text-xs gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Instructions</span>
              </Button>
              {!isInstalled && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={installApp}
                  className="text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{canPromptNativeInstall ? 'Install App' : 'Add to Home'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persistence Architecture & Data Reset */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-sm">Persistence Architecture & Mock Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Current Storage Mode</span>
              <Badge variant="primary">IndexedDB & LocalStorage Engine</Badge>
            </div>
            <p className="text-slate-500 leading-relaxed">
              All loan applications, status transitions, newly originated files, and audit events are persisted in local browser storage. You can freely modify, approve, or disburse files and your changes will remain intact across refreshes.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Restore Clean Demo Seed Data</p>
              <p className="text-slate-400 text-[11px]">
                Re-seeds the store with all 25+ original applications, customers, and notifications.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetModal(true)}
              className="text-xs text-rose-600 hover:text-rose-700 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* VAPID & Push Credentials Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-teal-600" />
            <CardTitle className="text-sm">VAPID Push Notification Credentials</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">VAPID Public Key</span>
            <code className="p-2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-teal-600 dark:text-teal-400 break-all block mt-1">
              BGubeRBQtuBUbFZlAY6BdjdC0py0ac1T8r519D-x8RZXu8lrPiaQQCxA-yyIXPTOiJQ9vTRQ0Nri6hWRvFsGiVk
            </code>
          </div>
          <p className="text-[11px] text-slate-400">
            Server-side VAPID private key is safeguarded exclusively in serverless backend environment variables and is never transmitted to client code.
          </p>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Pipeline Database"
        description="Are you sure you want to reset all mock applications and customers?"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            This action will restore the initial synthetic database containing 25+ loan files across Personal, Business, LAP, and Gold loan categories. Any custom mock files created will be overwritten.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleResetDatabase}>
              Yes, Reset to Seed Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
