const CACHE_NAME = 'lc-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['/leavingcertificate/', '/leavingcertificate/index.html'])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.match('/leavingcertificate/index.html').then(r => r || fetch(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (!response || response.status !== 200) return response;
      const clone = response.clone();
      caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      return response;
    }).catch(() => caches.match('/leavingcertificate/index.html'));
  }));
});
