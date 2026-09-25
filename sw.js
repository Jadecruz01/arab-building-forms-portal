/*
 * City of Arab Building Department — Online Forms
 * App-shell service worker for the installed PWA.
 *
 * Strategy (v2 — fixes a stale-content bug): HTML page loads are network-
 * first, so a browser with this service worker already installed always
 * gets the latest deployed index.html instead of an indefinitely cached
 * copy; the last successful page load is still cached as an offline
 * fallback. Static shell assets (manifest, icons) stay cache-first, since
 * they rarely change. CACHE_NAME is bumped to v2 so every existing
 * install immediately drops its old (stale) cache on first update.
 */
var CACHE_NAME = 'arab-permits-shell-v2';
var APP_SHELL = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isNavigation) {
    // Network-first: always try to get the latest deployed page first.
    event.respondWith(
      fetch(event.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Everything else (CSS/JS/images/fonts): cache-first, fall back to network.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        if (res && res.ok && new URL(event.request.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () {
        return cached;
      });
    })
  );
});
