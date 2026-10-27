import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../../lib/storage';

export type PlatformType = 'ios' | 'android' | 'desktop' | 'other';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaContextType {
  isInstallable: boolean;
  canPromptNativeInstall: boolean;
  isInstalled: boolean;
  platform: PlatformType;
  isIos: boolean;
  isAndroid: boolean;
  installApp: () => Promise<void>;
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

const checkIsInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
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
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsInstalled());
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [platform] = useState<PlatformType>(() => detectPlatform());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [toastMessage, setToastMessage] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'alert' } | null>(null);

  const isIos = platform === 'ios';
  const isAndroid = platform === 'android';
  const canPromptNativeInstall = Boolean(deferredPrompt);
  // Installable if not installed and (we have native prompt, or device is iOS/Android/Desktop which can be installed)
  const isInstallable = !isInstalled;

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const id = Date.now().toString();
    setToastMessage({ id, title, message, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

  const clearToast = () => setToastMessage(null);

  // Online / Offline & Standalone Mode Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back Online', 'Reconnected to network. Syncing local drafts...', 'success');
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
        setIsInstalled(true);
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

  // PWA beforeinstallprompt Listener
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallGuideOpen(false);
      showToast('PWA Installed', 'Unity LOS is now installed on your device!', 'success');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Register Service Worker & check push subscriptions
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setSwRegistration(reg);

        // Check active push subscription
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setPushSubscription(sub);
            setIsPushSubscribed(true);
          }
        });
      });
    }
  }, []);

  const openInstallGuide = () => setIsInstallGuideOpen(true);
  const closeInstallGuide = () => setIsInstallGuideOpen(false);

  const installApp = async () => {
    if (isInstalled) {
      showToast('Already Installed', 'Unity LOS is already running in installed mode.', 'info');
      return;
    }

    // If native prompt is primed (e.g. Android Chrome or Chromium desktop)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setIsInstallGuideOpen(false);
        } else {
          showToast('Install Cancelled', 'You can install Unity LOS anytime from the menu.', 'info');
        }
      } catch (err) {
        console.warn('Native prompt error, falling back to guide:', err);
        setIsInstallGuideOpen(true);
      }
    } else {
      // On iOS Safari, or Android Chrome when prompt hasn't fired yet, or Desktop,
      // show the interactive installation guide with exact device instructions!
      setIsInstallGuideOpen(true);
    }
  };

  const updateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
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
        // Backend offline or running in pure client dev mode - that's okay, client subscription is active!
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
    platform,
    isIos,
    isAndroid,
    installApp,
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
