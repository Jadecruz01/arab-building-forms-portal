/* City of Arab Applications & Fees: service worker (v2.27.0).
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
