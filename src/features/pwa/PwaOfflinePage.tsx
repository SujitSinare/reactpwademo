import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Database,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Send,
  HelpCircle,
  Apple,
  Laptop,
} from 'lucide-react';
import { usePwa } from './PwaContext';
import { storage, PendingSyncAction } from '../../lib/storage';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDateTimeIndian } from '../../lib/utils';

export const PwaOfflinePage: React.FC = () => {
  const {
    isOnline,
    isInstalled,
    isInstallable,
    canPromptNativeInstall,
    platform,
    installApp,
    openInstallGuide,
    swRegistration,
    showToast,
  } = usePwa();

  const [pendingSync, setPendingSync] = useState<PendingSyncAction[]>(() => storage.getPendingSyncActions());
  const [localDraft, setLocalDraft] = useState<any>(() => {
    const raw = localStorage.getItem('unity_los_wizard_draft_v1');
    return raw ? JSON.parse(raw) : null;
  });

  const [cacheSizeEst, setCacheSizeEst] = useState<string>('~14.2 MB');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return storage.subscribe(() => {
      setPendingSync(storage.getPendingSyncActions());
      const raw = localStorage.getItem('unity_los_wizard_draft_v1');
      setLocalDraft(raw ? JSON.parse(raw) : null);
    });
  }, []);

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      storage.clearPendingSyncActions();
      setIsSyncing(false);
      showToast('Sync Completed', 'All local offline actions reconciled with the central pipeline.', 'success');
    }, 1200);
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
      showToast('Cache Cleared', 'Workbox asset cache flushed. Reloading fresh files on next request.', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          PWA & Offline Operations Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Inspect Service Worker lifecycle, offline local persistence, background synchronization, and cache manifests
        </p>
      </div>

      {/* Grid: 3 Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Network State */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Network Status</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {isOnline ? 'Connected (Online)' : 'Disconnected (Offline)'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isOnline ? 'Live bidirectional syncing' : 'Local storage offline fallback active'}
          </p>
        </Card>

        {/* PWA State */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>App Installation</span>
            <Smartphone className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {isInstalled ? 'Installed as App' : 'Browser Session'}
          </p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {isInstalled ? (
              <Badge variant="success" className="w-fit text-[10px]">
                Standalone Mode Active
              </Badge>
            ) : (
              <>
                <p className="text-[11px] text-slate-400">
                  {platform === 'ios'
                    ? 'iOS Safari Add-to-Home available'
                    : canPromptNativeInstall
                    ? 'Native install prompt ready'
                    : 'Installable on mobile & desktop'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={installApp}
                  className="text-[11px] py-1 h-7 w-fit"
                >
                  <Download className="w-3 h-3 mr-1" />
                  <span>{canPromptNativeInstall ? 'Install Standalone PWA' : 'Install / Add to Home'}</span>
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Service Worker State */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Service Worker</span>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {swRegistration ? 'Active (Workbox)' : 'Registering...'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Precached shell & Web Push enabled</p>
        </Card>
      </div>

      {/* Offline Storage & Sync Queue */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-sm">Pending Offline Sync Queue</CardTitle>
            <p className="text-xs text-slate-400">
              Actions recorded while offline awaiting network synchronization
            </p>
          </div>

          {pendingSync.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isSyncing}
              onClick={handleSimulateSync}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync All Pending Actions</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingSync.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Sync Queue Clear</p>
              <p>All originations, document verifications, and approvals are fully synced.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingSync.map((action) => (
                <div key={action.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-teal-600 dark:text-teal-400 mr-2">{action.type}</span>
                    <span className="text-slate-800 dark:text-slate-200">{action.applicationId}</span>
                    <span className="text-slate-400 text-[10px] ml-2 block">
                      Logged: {formatDateTimeIndian(action.timestamp)}
                    </span>
                  </div>
                  <Badge variant="warning">Queued</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Application Drafts Inspection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Local Origination Draft</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-3">
          {localDraft ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {localDraft.fullName || 'Unnamed Draft'} ({localDraft.product || 'Personal Loan'})
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Requested: ₹ {localDraft.requestedAmount?.toLocaleString('en-IN') || '10,00,000'} • Mobile:{' '}
                  {localDraft.mobile || '—'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('unity_los_wizard_draft_v1');
                  setLocalDraft(null);
                  showToast('Draft Cleared', 'Local wizard draft deleted.', 'info');
                }}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                Discard Draft
              </Button>
            </div>
          ) : (
            <p className="p-4 text-slate-400 text-center">No active unfinished form draft saved in storage.</p>
          )}
        </CardContent>
      </Card>

      {/* Cache & Diagnostics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">PWA Cache Diagnostics & Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Workbox Precache Storage</p>
              <p className="text-[11px] text-slate-400">Application shell, scripts, CSS stylesheets, and icons</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClearCache} className="text-xs">
                Flush Asset Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile & Desktop PWA Installation Guide Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-sm">Mobile & Desktop PWA Installation Guide</CardTitle>
          </div>
          {isInstalled ? (
            <Badge variant="success">Standalone Mode Active</Badge>
          ) : (
            <Badge variant="outline">
              Platform: {platform === 'ios' ? 'Apple iOS' : platform === 'android' ? 'Android' : 'Desktop'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Unity LOS is engineered as a progressive web application conforming to modern mobile and desktop installation standards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Apple className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>iPhone & iPad (Safari)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                iOS does not support automatic prompts. Tap the <strong>Share</strong> button (□↑) in Safari, then tap <strong>Add to Home Screen</strong> (+).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Smartphone className="w-4 h-4 text-teal-600" />
                <span>Android (Chrome)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chrome captures the native install prompt. If not primed automatically, open Chrome menu (⋮) and tap <strong>Install app</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Laptop className="w-4 h-4 text-blue-500" />
                <span>Desktop (Chrome / Edge)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click the install icon (⤓) in the browser address bar, or use browser menu → <strong>Save and share</strong> → <strong>Install Unity LOS</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500">
              {isInstalled
                ? 'App is currently running in standalone display mode.'
                : 'Need help installing? View detailed step-by-step visual instructions.'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openInstallGuide}
                className="text-xs gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                <span>Visual Instructions</span>
              </Button>
              {!isInstalled && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={installApp}
                  className="text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{canPromptNativeInstall ? 'Install App' : 'Add to Home Screen'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
