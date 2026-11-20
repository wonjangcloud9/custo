// build mwoo0pn4
// CUTIE STREET fan hub — offline support (#234). Arena venues often have no signal: pages you have opened
// once (and the live guide, schedule, album and member pages, saved on first visit) still open offline.
//   pages:  network first, 4 s patience, then the saved copy, then a small offline page
//   assets: hashed build files (immutable) → cache first; other site files → saved copy, refreshed in the background
//   fonts:  Google Fonts CSS/subsets → saved copy, refreshed in the background
// To retire it: replace this file with one that calls self.registration.unregister() and clears caches.
const V = 'v1'
const PAGES = 'cs-pages-v2', ASSETS = `cs-assets-${V}`, FONTS = `cs-fonts-${V}` // pages v2: keys without the trailing slash (#235)
const BASE = new URL('./', self.location).pathname // '/custo/'
const PRECACHE = ['', 'live-guide/', 'schedule/', 'cutie-land/', 'members/'].map((p) => BASE + p)
const LABELS = { '': '홈', 'live-guide/': '라이브 가이드', 'schedule/': '스케줄', 'cutie-land/': 'CUTIE LAND', 'members/': '멤버', 'kohaku/': '紅白', 'korea/': '한국 공연', 'videos/': '영상', 'start/': '입문 가이드', 'appearances/': '출연 아카이브', 'discography/': '디스코그래피', 'news/': '뉴스', 'about': '소개' }

// one key per page whichever way it was typed: /x, /x/, /x.html, /x/index.html (OfflineReady.vue uses the same rule)
const pageKey = (url) => { const u = new URL(url); return u.origin + u.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '') }

async function trim(name, max) {
  const c = await caches.open(name); const keys = await c.keys()
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k)
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const pages = await caches.open(PAGES), assets = await caches.open(ASSETS)
    for (const url of PRECACHE) {
      try {
        const res = await fetch(url, { cache: 'no-cache' })
        if (!res.ok) continue
        const html = await res.clone().text()
        await pages.put(pageKey(new URL(url, self.location).href), res)
        // the page's own build files (scripts, styles, preloads) so it also hydrates offline
        const files = [...html.matchAll(/(?:href|src)="([^"]+\/assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1])
        await Promise.all(files.map((f) => assets.match(f).then((hit) => hit || assets.add(f)).catch(() => {})))
      } catch { /* offline during install: nothing saved yet, try again next time */ }
    }
    // the components those pages load on demand (listed at build time by config.ts buildEnd)
    try {
      const list = await (await fetch(BASE + 'sw-precache.json', { cache: 'no-cache' })).json()
      await Promise.all(list.map((f) => assets.match(BASE + f).then((hit) => hit || assets.add(BASE + f)).catch(() => {})))
    } catch { /* list missing: those chunks are saved on first use instead */ }
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('cs-') && ![PAGES, ASSETS, FONTS].includes(k)) await caches.delete(k)
    await self.clients.claim()
  })())
})

function offlinePage(saved) {
  const links = saved.map((p) => `<li><a href="${BASE}${p}">${LABELS[p] ?? LABELS[p + '/'] ?? p}</a></li>`).join('')
  return new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오프라인 · CUTIE STREET 팬허브</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:linear-gradient(160deg,#fff8f0,#fff0f6 40%,#f8f0ff);color:#2a1030;word-break:keep-all}
main{max-width:420px;padding:32px 24px;text-align:center}h1{font-size:22px;margin:12px 0 6px}p{color:#5a4060;line-height:1.6;margin:0 0 18px}
ul{list-style:none;padding:0;margin:0 0 20px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}a{display:inline-block;padding:9px 14px;border-radius:999px;background:#fff;color:#a33366;font-weight:700;text-decoration:none;box-shadow:inset 0 0 0 1.5px #f3c4d8}
button{padding:11px 20px;border:0;border-radius:999px;background:#3a2340;color:#fff;font-weight:800;font-size:15px}.b{font-size:44px}</style></head>
<body><main><div class="b" aria-hidden="true">📴</div><h1>지금은 오프라인이에요</h1><p>이 페이지는 아직 저장되지 않았어요.${saved.length ? ' 저장해 둔 페이지는 지금도 열 수 있어요.' : ''}</p>${saved.length ? `<ul>${links}</ul>` : ''}<button onclick="location.reload()">다시 시도</button></main></body></html>`,
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

async function navigate(event) {
  const req = event.request, key = pageKey(req.url)
  const cache = await caches.open(PAGES)
  const net = fetch(req).then(async (res) => {
    if (res.ok && res.type === 'basic') await cache.put(key, res.clone())
    return res
  })
  event.waitUntil(net.catch(() => {}))
  const timeout = new Promise((r) => setTimeout(r, 4000, 'slow'))
  try {
    const first = await Promise.race([net, timeout])
    if (first !== 'slow') return first
    const saved = await cache.match(key)
    return saved || (await net)
  } catch {
    const saved = await cache.match(key)
    if (saved) return saved
    const keys = (await cache.keys()).map((k) => new URL(k.url).pathname.slice(BASE.length)).filter((p) => !p.startsWith('/'))
    return offlinePage(keys)
  }
}

async function cacheFirst(req, name, max) {
  const cache = await caches.open(name)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) { await cache.put(req, res.clone()); trim(name, max) }
  return res
}

async function staleWhileRevalidate(event, name, max) {
  const cache = await caches.open(name)
  const hit = await cache.match(event.request)
  const net = fetch(event.request).then(async (res) => {
    // the Google Fonts stylesheet is a no-cors request (opaque) — keep it too, it's a single small entry
    if (res.ok || (name === FONTS && res.type === 'opaque')) { await cache.put(event.request, res.clone()); trim(name, max) }
    return res
  })
  event.waitUntil(net.catch(() => {}))
  return hit || net
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || req.headers.has('range')) return
  const url = new URL(req.url)
  if (url.origin === self.location.origin) {
    if (!url.pathname.startsWith(BASE) || url.pathname === BASE + 'sw.js') return
    if (req.mode === 'navigate') return event.respondWith(navigate(event))
    if (url.pathname.startsWith(BASE + 'assets/')) return event.respondWith(cacheFirst(req, ASSETS, 600))
    return event.respondWith(staleWhileRevalidate(event, ASSETS, 600))
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return event.respondWith(staleWhileRevalidate(event, FONTS, 120))
})
