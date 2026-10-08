/*
 * The old forms site at this address has been retired; everything now lives at /apply/.
 * This replacement service worker removes itself and its caches from any browser
 * that installed the old site, then sends open tabs to /apply/.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    tabs.forEach(c => { if (!new URL(c.url).pathname.startsWith('/apply/')) c.navigate('/apply/'); });
  })());
});
