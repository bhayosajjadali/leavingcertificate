const CACHE_NAME = 'lc-v3';

// Use relative paths — they resolve against the service worker's scope automatically
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache the current page and critical assets using relative URLs
      return cache.addAll([
        './',
        './index.html',
        './assets/index-BpjtXOFW.css',
        './assets/index-DNWve8w0.js',
        './manifest.json',
        './favicon.ico',
        './sindh-logo.png',
        './placeholder.svg'
      ]).catch(err => {
        // If pre-caching fails, don't block install — we'll cache on fetch instead
        console.warn('SW pre-cache failed, will use network-first fallback:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // For navigation requests, try cache first, then network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put('./index.html', clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For static assets (CSS, JS, fonts, images) — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If network fails and we have a cached version, use it
        return cached;
      });

      return cached || networkFetch;
    })
  );
});
