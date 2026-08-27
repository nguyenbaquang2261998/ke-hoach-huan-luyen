const CACHE_NAME = 'army-tech-cache-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/calendar.html',
  '/students.html',
  '/exam.html',
  '/tasks.html',
  '/ai.html',
  '/admin.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/icon.svg',
  '/img/logo-removebg-preview.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching offline pages & assets');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[Service Worker] Some assets failed to precache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Bỏ qua các request không phải GET (POST/PUT/DELETE)
  if (request.method !== 'GET') return;

  // Với API request: Network First (ưu tiên mạng để lấy dữ liệu SQL Server mới nhất)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Với Static Assets & HTML: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(err => {
        // Nếu offline và là điều hướng trang, trả về trang tương ứng hoặc index.html trong cache
        if (request.mode === 'navigate') {
          return caches.match(request).then(page => page || caches.match('/index.html'));
        }
        throw err;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
