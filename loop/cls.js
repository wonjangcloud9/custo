// Layout-shift (CLS) sweep — run with the Playwright MCP `browser_run_code_unsafe` tool (filename: loop/cls.js) while
// `bash loop/preview.sh` serves (#196). Every page × {390, 1440}, fresh load, service worker blocked (so a saved copy
// can't hide a shift), 2.5 s settle, no input. Reports pages over 0.05 with the three biggest shifts and what moved.
// Target: nothing over 0.1, aim for under 0.05. Takes ~2 min (moves to the background).
async (page) => {
  const pages = ['', 'about.html', 'appearances/', 'cutie-land/', 'discography/', 'discography/kawaii-dake.html', 'journey/', 'kohaku/', 'korea/',
    'likes/', 'live-guide/', 'members/', 'members/risa.html', 'members/aika.html', 'mv-quiz/', 'news/', 'schedule/', 'stages/', 'start/', 'units/',
    'videos/', 'videos/stats/', 'which-member/', 'world/']
  const browser = page.context().browser()
  const out = {}
  for (const w of [390, 1440]) {
    const c = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', timezoneId: 'Asia/Seoul' })
    const p = await c.newPage()
    await p.addInitScript(() => {
      window.__ls = []
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue
          window.__ls.push({ v: e.value, t: Math.round(e.startTime), src: e.sources.slice(0, 2).map((s) => { const n = s.node; const nm = !n ? '?' : n.nodeType === 3 ? '#text' : (typeof n.className === 'string' && n.className ? '.' + n.className.split(' ')[0] : n.nodeName); return `${nm} y${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}` }) })
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    for (const u of pages) {
      await p.goto('http://localhost:4173/' + u, { waitUntil: 'networkidle' }).catch(() => {})
      await p.waitForTimeout(2500)
      const ls = await p.evaluate(() => window.__ls)
      const total = ls.reduce((a, e) => a + e.v, 0)
      if (total > 0.05) out[`${w} ${u || 'home'}`] = { cls: +total.toFixed(3), top: ls.sort((a, b) => b.v - a.v).slice(0, 3).map((e) => `${e.v.toFixed(3)} @${e.t}ms ${e.src.join(' | ')}`) }
    }
    await c.close()
  }
  return out
}
