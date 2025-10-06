// service-worker.js
const CACHE_NAME = 'maskani-cache-v3';
const DATA_CACHE_NAME = 'maskani-data-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/maskani-icon-192x192.png',
  '/maskani-icon-512x512.png',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

const dataUrls = [
  '/api/properties',
  '/api/favorites',
  '/api/users'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (isDataRequest(request.url)) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(request)
          .then(response => {
            // If the request is successful, cache the response
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(error => {
            console.log('[ServiceWorker] Network request failed, serving from cache:', request.url);
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle static resources with cache-first strategy
  if (isStaticResource(request.url)) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Helper functions
function isDataRequest(url) {
  return dataUrls.some(dataUrl => url.includes(dataUrl)) ||
         url.includes('/api/') ||
         url.includes('supabase.co');
}

function isStaticResource(url) {
  return url.includes('/static/') ||
         url.includes('/assets/') ||
         url.endsWith('.js') ||
         url.endsWith('.css') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.svg') ||
         url.endsWith('.ico');
}

async function syncOfflineActions() {
  try {
    // Get offline actions from localStorage
    const offlineActionsStr = localStorage.getItem('maskani_offline_actions');
    if (!offlineActionsStr) return;
    
    const offlineActions = JSON.parse(offlineActionsStr);
    
    for (const action of offlineActions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.type === 'CREATE' ? 'POST' : 
                  action.type === 'UPDATE' ? 'PUT' : 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: action.type !== 'DELETE' ? JSON.stringify(action.data) : undefined,
        });

        if (response.ok) {
          console.log('[ServiceWorker] Synced action:', action.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}
