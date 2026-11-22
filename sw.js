// The site moved to https://custo-xi.vercel.app. This replaces the old offline worker that browsers may still have
// for /custo/: it drops the copies that worker saved, removes itself, and reloads open tabs so they follow the move.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('cs-')) await caches.delete(k)
    await self.registration.unregister()
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url)
  })())
})
