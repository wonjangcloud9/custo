// Touch-target sweep (WCAG 2.2 SC 2.5.8, #197) — run with the Playwright MCP `browser_run_code_unsafe` tool
// (filename: loop/targets.js) while `bash loop/preview.sh` serves. Phone width 390. Flags buttons, links,
// inputs and [role=button] that are visible, not inline text links inside a sentence, and smaller than
// 24×24 CSS px *unless* a 24 px circle centred on them stays clear of every other target (the SC's spacing
// exception). Expect {} back.
async (page) => {
  const pages = ['', 'about.html', 'appearances/', 'cutie-land/', 'discography/', 'discography/kawaii-dake.html', 'journey/', 'kohaku/', 'korea/',
    'likes/', 'live-guide/', 'members/', 'members/aika.html', 'mv-quiz/', 'news/', 'schedule/', 'stages/', 'start/', 'units/', 'videos/',
    'videos/stats/', 'which-member/', 'world/']
  const browser = page.context().browser()
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', timezoneId: 'Asia/Seoul', hasTouch: true, isMobile: true })
  const p = await c.newPage()
  const out = {}
  for (const u of pages) {
    await p.goto('http://localhost:4173/' + u, { waitUntil: 'networkidle' }).catch(() => {})
    await p.waitForTimeout(800)
    const r = await p.evaluate(() => {
      const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex="-1"])'
      const els = [...document.querySelectorAll(sel)].filter((e) => {
        if (e.closest('[aria-hidden="true"], .VPNav, .VPNavScreen, .VPLocalNav, .VPSidebar, .VPFooter, .VPDocFooter')) return false
        const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false
        return e.getClientRects().length > 0
      })
      // an input wrapped in (or tied to) a label is tapped through the label too — measure the label's box
      const rect = (e) => (e.tagName === 'INPUT' && e.labels?.[0] ? e.labels[0] : e).getBoundingClientRect()
      // inline text links inside running text are exempt (SC 2.5.8 'inline' exception)
      const inline = (e) => e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.parentElement && /\S/.test([...e.parentElement.childNodes].filter((n) => n !== e && n.nodeType === 3).map((n) => n.textContent).join(''))
      const boxes = els.map((e) => ({ e, b: rect(e) }))
      const bad = []
      for (const { e, b } of boxes) {
        if (b.width >= 24 && b.height >= 24) continue
        if (inline(e)) continue
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2
        // spacing exception: a 24px-diameter circle around this target's centre doesn't touch any other target's box
        const crowded = boxes.some((o) => {
          if (o.e === e || o.e.contains(e) || e.contains(o.e)) return false
          const nx = Math.max(o.b.left, Math.min(cx, o.b.right)), ny = Math.max(o.b.top, Math.min(cy, o.b.bottom))
          return Math.hypot(nx - cx, ny - cy) < 12
        })
        if (!crowded) continue
        const name = (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : e.tagName.toLowerCase())
        bad.push(`${name} ${Math.round(b.width)}×${Math.round(b.height)} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 14)}"`)
      }
      return [...new Set(bad)]
    })
    if (r.length) out[u || 'home'] = r.slice(0, 8).concat(r.length > 8 ? [`+${r.length - 8} more`] : [])
  }
  await c.close()
  return out
}
