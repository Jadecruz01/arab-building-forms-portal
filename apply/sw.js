/* City of Arab Applications & Fees: service worker (v2.27.0; push added v2.31.0).
   Makes the site installable ("Add to home screen"). Pages always come from the network so every update shows
   right away; the last copy of the page is kept only so the app opens with a message when there is no signal.
   Nothing else is stored, and calls to the permit database are never touched. */
const CACHE = 'apps-fees-offline-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.open(CACHE).then(c => c.match('./')).then(m => m || new Response(
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Apps & Fees · City of Arab</title><body style="font-family:system-ui;padding:32px;color:#212c46"><h1>No internet connection</h1><p>Connect to the internet and try again.</p></body>',
    { headers:{ 'Content-Type':'text/html; charset=utf-8' } }))));
});

/* v2.31.0: My permits notifications (Web Push). The message comes encrypted from the City's sender and is shown here.
   Tapping it opens the app (or the site) on My permits, where the applicant can see the update or upload documents. */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'City of Arab · Apps & Fees', {
    body: d.body || 'There is an update on your permit.', icon: d.icon || '/apply/icon-192.png', badge: '/apply/icon-192.png',
    tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '/apply/#account' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/apply/#account', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.location.origin + '/apply/') && 'focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
