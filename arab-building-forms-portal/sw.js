/*
 * City of Arab Building Department — Online Forms
 * Minimal app-shell service worker. This is here so the prototype is ready
 * to be genuinely installable once it's ported to the live site (Claude's
 * artifact sandbox does not allow service workers to register, so this
 * file simply sits unused while the prototype lives on claude.ai).
 *
 * Strategy: cache the app shell on install, serve it cache-first, and fall
 * back to the network for anything not cached (so CDN scripts, fonts, and
 * any future backend calls still work normally).
 */
var CACHE_NAME = 'arab-permits-shell-v1';
var APP_SHELL = [
  './',
  './index.html',
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
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        // Only cache same-origin, successful responses (leave CDN/opaque responses alone).
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
