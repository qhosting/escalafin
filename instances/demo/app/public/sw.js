
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
  if (event.tag === 'payment-sync') {
    event.waitUntil(syncPayments());
  }
  if (event.tag === 'client-sync') {
    event.waitUntil(syncClients());
  }
});

async function syncPayments() {
  // Sync offline payments when connection is restored
  const payments = await getOfflinePayments();
  for (const payment of payments) {
    try {
      await fetch('/api/payments/sync', {
        method: 'POST',
        body: JSON.stringify(payment),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await removeOfflinePayment(payment.id);
    } catch (error) {
      console.error('Error syncing payment:', error);
    }
  }
}

async function syncClients() {
  // Sync offline client updates
  const clients = await getOfflineClients();
  for (const client of clients) {
    try {
      await fetch('/api/clients/sync', {
        method: 'POST',
        body: JSON.stringify(client),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await removeOfflineClient(client.id);
    } catch (error) {
      console.error('Error syncing client:', error);
    }
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de EscalaFin',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
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
    self.registration.showNotification('EscalaFin', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/pwa/client')
    );
  }
});

// Helper functions for offline storage
async function getOfflinePayments() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflinePayment(id) {
  // Implementation would use IndexedDB
  return true;
}

async function getOfflineClients() {
  // Implementation would use IndexedDB
  return [];
}

async function removeOfflineClient(id) {
  // Implementation would use IndexedDB
  return true;
}
