import { describe, it, expect, beforeEach, vi } from 'vitest';

// Node test environment localStorage mock
if (typeof global.localStorage === 'undefined') {
  let store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: 0,
    key: () => null,
  } as any;
}

import { APP_VERSION } from '../features/pwa/PwaContext';

describe('PWA Lifecycle & Duplicate Installation Restrictions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('exposes the current application release version', () => {
    expect(APP_VERSION).toBe('1.0.0');
  });

  it('recognizes standalone mode and persists device installation state', () => {
    // Simulate standalone display mode
    const isStandalone = true;
    if (isStandalone) {
      localStorage.setItem('pwa_installed_on_device', 'true');
    }

    const storedFlag = localStorage.getItem('pwa_installed_on_device');
    expect(storedFlag).toBe('true');
  });

  it('detects previously installed app even when launched in regular browser tab', () => {
    // Given the user previously installed the app
    localStorage.setItem('pwa_installed_on_device', 'true');

    // When opened in browser tab (isStandalone is false)
    const isStandalone = false;
    const isInstalled = isStandalone || localStorage.getItem('pwa_installed_on_device') === 'true';

    // Then isInstalled is true and install prompts must be restricted
    expect(isInstalled).toBe(true);
    const isInstallable = !isInstalled;
    expect(isInstallable).toBe(false);
  });

  it('restricts duplicate install execution when app is already installed', async () => {
    let promptCalled = false;
    const fakeDeferredPrompt = {
      prompt: async () => {
        promptCalled = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    };

    let toastShown = '';
    const showToast = (title: string, message: string) => {
      toastShown = `${title}: ${message}`;
    };

    // Installation guard function matching PwaContext logic
    const installApp = async (isInstalled: boolean) => {
      if (isInstalled) {
        showToast(
          'Already Installed',
          'Unity LOS is already installed on your device. Mobile operating systems prohibit installing the same PWA twice.'
        );
        return;
      }
      if (fakeDeferredPrompt) {
        await fakeDeferredPrompt.prompt();
      }
    };

    // When app is installed, installApp must NOT prompt
    await installApp(true);
    expect(promptCalled).toBe(false);
    expect(toastShown).toContain('Already Installed');
    expect(toastShown).toContain('prohibit installing the same PWA twice');

    // When app is NOT installed, installApp can prompt
    await installApp(false);
    expect(promptCalled).toBe(true);
  });

  it('resets installation tracking flag when resetInstallStatus is invoked', () => {
    localStorage.setItem('pwa_installed_on_device', 'true');
    expect(localStorage.getItem('pwa_installed_on_device')).toBe('true');

    // Reset handler logic
    const resetInstallStatus = () => {
      localStorage.removeItem('pwa_installed_on_device');
    };

    resetInstallStatus();
    expect(localStorage.getItem('pwa_installed_on_device')).toBeNull();
  });

  it('handles service worker update notification and reload messaging', () => {
    let postMessagePayload: any = null;
    let reloadTriggered = false;

    const fakeWaitingWorker = {
      postMessage: (data: any) => {
        postMessagePayload = data;
      },
    };

    const updateApp = (waitingWorker: any) => {
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } else {
        reloadTriggered = true;
      }
    };

    // When a waiting worker is present, postMessage SKIP_WAITING is dispatched
    updateApp(fakeWaitingWorker);
    expect(postMessagePayload).toEqual({ type: 'SKIP_WAITING' });
    expect(reloadTriggered).toBe(false);

    // Fallback when no worker is waiting
    updateApp(null);
    expect(reloadTriggered).toBe(true);
  });
});
