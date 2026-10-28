/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Handle skip waiting when instructed by the client/user reload prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
clientsClaim();

// Precache static assets compiled by Vite
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache strategy for runtime navigation / offline fallback
self.addEventListener('fetch', (event) => {
  // Pass-through for default navigation handled by Workbox precache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open('unity-los-offline-fallback');
        const cachedResponse = await cache.match('/index.html');
        return cachedResponse || new Response('Offline - Unity LOS Demo Shell Loaded', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
  }
});

// ==========================================
// Web Push Notification Event Handler
// ==========================================
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Unity Small Finance Bank - LOS',
    body: 'You have a new update in the loan pipeline.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: '/',
      applicationId: '',
    },
    tag: 'unity-los-alert',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = {
        ...notificationData,
        ...parsed,
        data: {
          ...notificationData.data,
          ...(parsed.data || {}),
        },
      };
    } catch {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options: any = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// ==========================================
// Notification Click Handler
// ==========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Or open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
