import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  Laptop,
  Apple,
  ExternalLink,
  Sparkles,
  Zap,
  WifiOff,
  X,
} from 'lucide-react';
import { usePwa } from '../../features/pwa/PwaContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const InstallGuideModal: React.FC = () => {
  const {
    isInstallGuideOpen,
    closeInstallGuide,
    platform,
    isInstalled,
    canPromptNativeInstall,
    installApp,
  } = usePwa();

  // Selected guide tab: defaults to user's detected platform
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
    return 'desktop';
  });

  if (!isInstallGuideOpen) return null;

  return (
    <Modal
      isOpen={isInstallGuideOpen}
      onClose={closeInstallGuide}
      title="Install Unity LOS Application"
      description="Access your loan pipeline instantly from your device's home screen"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Already Installed Alert */}
        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">App Already Installed on This Device</p>
              <p className="text-[11px] mt-1 leading-relaxed text-emerald-900 dark:text-emerald-200">
                Unity LOS is already installed on this device. Mobile operating systems (such as Android WebAPK and iOS Safari) prohibit or restrict installing duplicate copies of the same PWA.
              </p>
              <p className="text-[11px] mt-1 font-medium text-emerald-800 dark:text-emerald-300">
                To launch the application, tap the <strong>Unity LOS</strong> icon directly from your device Home Screen or App Drawer.
              </p>
            </div>
          </div>
        ) : (
          /* PWA Perks Banner */
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 text-center">
            <div className="flex flex-col items-center">
              <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Instant Launch</span>
              <span className="text-[10px] text-slate-400">Direct from home screen</span>
            </div>
            <div className="flex flex-col items-center">
              <WifiOff className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Offline Access</span>
              <span className="text-[10px] text-slate-400">Cached loan records</span>
            </div>
            <div className="flex flex-col items-center">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-1" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Full Screen</span>
              <span className="text-[10px] text-slate-400">No browser address bar</span>
            </div>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android (Chrome)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* TAB 1: iOS Safari Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
              <span className="font-bold shrink-0">Note for iOS:</span>
              <span>
                Apple requires installing PWAs via <strong>Safari</strong>. If you are viewing in Chrome on iOS, tap the address bar to copy the link and open it in Safari.
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Tap the Share button
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Look for the square icon with an upward arrow at the bottom toolbar on iPhone or top toolbar on iPad.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-200">
                    <Share className="w-3.5 h-3.5 text-blue-500" />
                    <span>Share Sheet Icon</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Select "Add to Home Screen"
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scroll down the options list until you see <strong>Add to Home Screen</strong> with a plus icon.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-200">
                    <PlusSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>Add to Home Screen</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Tap "Add" in the top-right
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Confirm to add Unity LOS to your Home Screen. It will launch with its own standalone icon!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Android Instructions */}
        {activeTab === 'android' && (
          <div className="space-y-3">
            {canPromptNativeInstall && !isInstalled ? (
              <div className="p-4 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/40 text-center space-y-2">
                <p className="font-bold text-sm text-teal-900 dark:text-teal-200">
                  Ready to Install on this Device
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-300">
                  Your browser has primed the native Android install prompt.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={installApp}
                  className="w-full mt-2 bg-teal-600 hover:bg-teal-700 shadow-md gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Unity LOS Now</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Open Chrome Menu
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tap the three vertical dots (<strong>⋮</strong>) in the top-right corner of Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Tap "Install app" or "Add to Home screen"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chrome will automatically detect the Unity LOS PWA manifest and prompt for installation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Confirm Installation
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tap <strong>Install</strong> to add the Unity LOS icon to your app drawer and home screen.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Desktop Instructions */}
        {activeTab === 'desktop' && (
          <div className="space-y-3">
            {canPromptNativeInstall && !isInstalled ? (
              <div className="p-4 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/40 text-center space-y-2">
                <p className="font-bold text-sm text-teal-900 dark:text-teal-200">
                  Ready to Install on Desktop
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-300">
                  Install Unity LOS as a standalone desktop application in Chrome or Edge.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={installApp}
                  className="w-full mt-2 bg-teal-600 hover:bg-teal-700 shadow-md gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Desktop App</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Look for the Install icon in the Address Bar
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      In Chrome or Edge, click the computer/monitor icon with a down arrow (⊕ or ⤓) on the right side of the URL bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Or use Browser Settings
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click browser menu (<strong>⋮</strong>) → <strong>Save and share</strong> → <strong>Install Unity LOS</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">
            Detected: <strong>{platform === 'ios' ? 'Apple iOS' : platform === 'android' ? 'Android' : 'Desktop / Laptop'}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={closeInstallGuide}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
