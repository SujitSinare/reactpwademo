import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../../lib/storage';

export type PlatformType = 'ios' | 'android' | 'desktop' | 'other';

export const APP_VERSION = '1.0.0';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaContextType {
  isInstallable: boolean;
  canPromptNativeInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: PlatformType;
  isIos: boolean;
  isAndroid: boolean;
  installApp: () => Promise<void>;
  resetInstallStatus: () => void;
  isInstallGuideOpen: boolean;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
  isOnline: boolean;
  notificationPermission: NotificationPermission;
  isPushSubscribed: boolean;
  pushSubscription: PushSubscription | null;
  requestNotificationPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  sendTestPushNotification: (customTitle?: string, customBody?: string) => Promise<boolean>;
  swRegistration: ServiceWorkerRegistration | null;
  needRefresh: boolean;
  isCheckingUpdate: boolean;
  lastUpdateChecked: Date | null;
  appVersion: string;
  checkForUpdate: (showFeedback?: boolean) => Promise<boolean>;
  updateApp: () => void;
  toastMessage: { id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'alert' } | null;
  showToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'alert') => void;
  clearToast: () => void;
}

// Default VAPID Public Key generated for this demo
const VAPID_PUBLIC_KEY = 'BGubeRBQtuBUbFZlAY6BdjdC0py0ac1T8r519D-x8RZXu8lrPiaQQCxA-yyIXPTOiJQ9vTRQ0Nri6hWRvFsGiVk';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const checkIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

const checkIsInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (checkIsStandalone()) return true;
  try {
    return localStorage.getItem('pwa_installed_on_device') === 'true';
  } catch {
    return false;
  }
};

const detectPlatform = (): PlatformType => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent.toLowerCase();
  const isIosDevice =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIosDevice) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
};

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsInstalled());
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [platform] = useState<PlatformType>(() => detectPlatform());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [lastUpdateChecked, setLastUpdateChecked] = useState<Date | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [toastMessage, setToastMessage] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'alert' } | null>(null);

  const isIos = platform === 'ios';
  const isAndroid = platform === 'android';
  const canPromptNativeInstall = Boolean(deferredPrompt);
  // Installable ONLY if not already installed on this device
  const isInstallable = !isInstalled;

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const id = Date.now().toString();
    setToastMessage({ id, title, message, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

  const clearToast = () => setToastMessage(null);

  // Synchronize standalone mode and initial installation flag
  useEffect(() => {
    if (checkIsStandalone()) {
      setIsStandalone(true);
      setIsInstalled(true);
      try {
        localStorage.setItem('pwa_installed_on_device', 'true');
      } catch {}
    }
  }, []);

  // Check via modern standard getInstalledRelatedApps() API if supported (Chromium Android & Desktop)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps()
        .then((relatedApps: any[]) => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem('pwa_installed_on_device', 'true');
            } catch {}
          }
        })
        .catch((err: any) => {
          console.debug('getInstalledRelatedApps query skipped or unavailable:', err);
        });
    }
  }, []);

  // Online / Offline & Standalone Mode Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back Online', 'Reconnected to network. Syncing local drafts...', 'success');
      // Silently check for service worker update when network reconnects
      checkForUpdate(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode Active', 'Operating on local cached data and storage.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Watch for standalone display mode changes
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleMql = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        try {
          localStorage.setItem('pwa_installed_on_device', 'true');
        } catch {}
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleMql);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMql);
      }
    };
  }, []);

  // PWA beforeinstallprompt & appinstalled Listeners
  useEffect(() => {
    const handler = (e: Event) => {
      // If already installed on this device, reject and prevent prompt
      if (isInstalled) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      try {
        localStorage.setItem('pwa_installed_on_device', 'true');
      } catch {}
      setDeferredPrompt(null);
      setIsInstallGuideOpen(false);
      showToast('PWA Installed', 'Unity LOS is now installed on your device!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  // Register Service Worker & check push subscriptions & detect updatefound lifecycle
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setSwRegistration(reg);

        // Check if there is already a waiting service worker
        if (reg.waiting) {
          setNeedRefresh(true);
        }

        // Listen for new service worker being installed
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // A new version was installed and is waiting for user reload!
                setNeedRefresh(true);
                showToast(
                  'Update Ready',
                  'A new version of Unity LOS is available. Tap Reload to update.',
                  'info'
                );
              }
            });
          }
        });

        // Check active push subscription
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setPushSubscription(sub);
            setIsPushSubscribed(true);
          }
        });
      });

      // Reload smoothly when the new service worker takes over control
      const handleControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  // Automatically check for service worker update when mobile device resumes app from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Silently query for updates on app resume
        checkForUpdate(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [swRegistration]);

  const openInstallGuide = () => {
    if (isInstalled) {
      showToast(
        'Already Installed',
        'Unity LOS is already installed on your device. Check your home screen or app drawer.',
        'info'
      );
      return;
    }
    setIsInstallGuideOpen(true);
  };

  const closeInstallGuide = () => setIsInstallGuideOpen(false);

  // Guarded install action: explicitly restricts duplicate installation
  const installApp = async () => {
    if (isInstalled) {
      showToast(
        'Already Installed',
        'Unity LOS is already installed on your device. Mobile operating systems prohibit installing the same PWA twice.',
        'info'
      );
      return;
    }

    // If native prompt is primed (e.g. Android Chrome or Chromium desktop)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('pwa_installed_on_device', 'true');
          } catch {}
          setDeferredPrompt(null);
          setIsInstallGuideOpen(false);
          showToast('Install Started', 'Unity LOS is being installed to your device.', 'success');
        } else {
          showToast('Install Cancelled', 'You can install Unity LOS anytime from the menu.', 'info');
        }
      } catch (err) {
        console.warn('Native prompt error, falling back to guide:', err);
        setIsInstallGuideOpen(true);
      }
    } else {
      // On iOS Safari, or Android Chrome when prompt hasn't fired yet, show guide
      setIsInstallGuideOpen(true);
    }
  };

  // Reset installation status (intended for testing and development)
  const resetInstallStatus = () => {
    try {
      localStorage.removeItem('pwa_installed_on_device');
    } catch {}
    const standalone = checkIsStandalone();
    setIsStandalone(standalone);
    setIsInstalled(standalone);
    showToast('Install Status Cleared', 'Device install flag has been reset for testing.', 'info');
  };

  // Check for updates manually or programmatically
  const checkForUpdate = async (showFeedback = true): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      if (showFeedback) {
        showToast('Updates Not Supported', 'Service worker is not supported in this browser.', 'warning');
      }
      return false;
    }

    setIsCheckingUpdate(true);
    try {
      const reg = swRegistration || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        await reg.update();
        setLastUpdateChecked(new Date());

        if (reg.waiting) {
          setNeedRefresh(true);
          if (showFeedback) {
            showToast('Update Available', 'A newer version is ready. Click Update & Reload to apply.', 'info');
          }
          return true;
        } else {
          if (showFeedback) {
            showToast('App Up to Date', `You are running the latest version of Unity LOS (v${APP_VERSION}).`, 'success');
          }
          return false;
        }
      }
      return false;
    } catch (err: any) {
      console.warn('Update check failed:', err);
      if (showFeedback) {
        showToast('Check Failed', 'Could not check for updates. You might be offline.', 'warning');
      }
      return false;
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Trigger skip waiting and reload the application
  const updateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      showToast('Notifications Not Supported', 'Your browser does not support Web Notifications.', 'alert');
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        showToast('Notifications Enabled', 'You will receive real-time loan origination alerts.', 'success');
        return true;
      } else {
        showToast('Permission Denied', 'Notification permission was denied in your browser.', 'warning');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const subscribeToPush = async (): Promise<boolean> => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showToast('Push API Not Supported', 'This browser does not support Web Push API.', 'warning');
        return false;
      }

      const granted = await requestNotificationPermission();
      if (!granted) return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as any,
        });
      }

      setPushSubscription(sub);
      setIsPushSubscribed(true);

      // Attempt to register with demo backend API if reachable
      try {
        await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub }),
        });
      } catch {
        // Backend offline or running in pure client dev mode
      }

      showToast('Push Subscribed', 'Push subscription registered with VAPID credentials.', 'success');
      return true;
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      showToast('Push Subscription Error', err.message || 'Could not register push subscription.', 'alert');
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        setPushSubscription(null);
        setIsPushSubscribed(false);
        showToast('Unsubscribed', 'Web Push notifications deactivated.', 'info');
        return true;
      }
      return false;
    } catch (err: any) {
      showToast('Unsubscribe Error', err.message, 'alert');
      return false;
    }
  };

  const sendTestPushNotification = async (
    customTitle = 'Loan Sanction Alert: ULOS-2026-0002',
    customBody = 'Business Loan for ₹ 40,00,000 has been sanctioned by Western Regional Office.'
  ): Promise<boolean> => {
    let sentViaServer = false;
    if (pushSubscription) {
      try {
        const res = await fetch('/api/push-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: pushSubscription,
            notification: {
              title: customTitle,
              body: customBody,
              icon: '/icons/icon-192x192.png',
              data: {
                url: '/applications/ULOS-2026-0002',
                applicationId: 'ULOS-2026-0002',
              },
            },
          }),
        });
        if (res.ok) {
          sentViaServer = true;
          showToast('Web Push Sent via Server', 'VAPID Web Push notification delivered to service worker.', 'success');
        }
      } catch (err) {
        console.warn('Server push endpoint unavailable; falling back to service worker display:', err);
      }
    }

    if (!sentViaServer) {
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(customTitle, {
          body: customBody,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          data: {
            url: '/applications/ULOS-2026-0002',
            applicationId: 'ULOS-2026-0002',
          },
          vibrate: [200, 100, 200],
        } as any);
        showToast('Notification Dispatched', 'Dispatched through active Service Worker registration.', 'info');
      } else {
        showToast(customTitle, customBody, 'info');
      }
    }

    storage.addNotification({
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      title: customTitle,
      message: customBody,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info',
      applicationId: 'ULOS-2026-0002',
      actionUrl: '/applications/ULOS-2026-0002',
    });

    return true;
  };

  const value: PwaContextType = {
    isInstallable,
    canPromptNativeInstall,
    isInstalled,
    isStandalone,
    platform,
    isIos,
    isAndroid,
    installApp,
    resetInstallStatus,
    isInstallGuideOpen,
    openInstallGuide,
    closeInstallGuide,
    isOnline,
    notificationPermission,
    isPushSubscribed,
    pushSubscription,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestPushNotification,
    swRegistration,
    needRefresh,
    isCheckingUpdate,
    lastUpdateChecked,
    appVersion: APP_VERSION,
    checkForUpdate,
    updateApp,
    toastMessage,
    showToast,
    clearToast,
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
};

export const usePwa = () => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};
