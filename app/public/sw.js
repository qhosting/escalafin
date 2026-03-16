
const CACHE_NAME = 'escalafin-v1';
const urlsToCache = [
  '/',
  '/pwa/client',
  '/pwa/asesor',
  '/pwa/reports',
  '/api/clients',
  '/api/loans',
  '/api/payments/transactions'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requests (Network First Strategy)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if response is valid
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response for cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }

            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }

            return new Response('Content not available offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync' || event.tag === 'payment-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  const db = await openOfflineDB();
  const queue = await getOfflineQueue(db);
  
  for (const item of queue) {
    if (item.synced) continue;

    try {
      let endpoint = '';
      if (item.type === 'payment') endpoint = '/api/payments/sync';
      if (item.type === 'client') endpoint = '/api/clients/sync';
      if (item.type === 'check-in') endpoint = '/api/collections/check-in';

      if (!endpoint) continue;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(item.data || item),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await markItemAsSynced(db, item.id);
        console.log(`Item ${item.id} sincronizado exitosamente`);
      }
    } catch (error) {
      console.error('Error sincronizando item:', error);
    }
  }
}

async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EscalaFin_Offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineQueue(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offline_queue', 'readonly');
    const store = transaction.objectStore('offline_queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function markItemAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('offline_queue', 'readwrite');
    const store = transaction.objectStore('offline_queue');
    const request = store.get(id);
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.synced = true;
        store.put(item);
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Push Notifications
self.addEventListener('push', (event) => {
  let title = 'EscalaFin';
  let body = 'Nueva notificación de EscalaFin';
  let icon = '/icons/icon-192x192.png';
  let url = '/pwa/client';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      icon = payload.icon || icon;
      url = payload.url || url;
      data = payload.data || {};
    } catch (e) {
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: url,
      ...data
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle actions
  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/pwa/client';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// End of Service Worker
