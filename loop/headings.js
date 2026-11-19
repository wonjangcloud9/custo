// Heading-outline sweep (#204) — run with the Playwright MCP `browser_run_code_unsafe` tool (filename:
// loop/headings.js) while `bash loop/preview.sh` serves. Screen-reader users move through a page by headings, so per
// page (width 1440, visible headings in .VPContent, aria-hidden excluded) it reports: h1 count ≠ 1, skipped levels
// (e.g. h2 → h4), a first heading that isn't the h1, empty headings, and headings whose text is a lone symbol. Expect {} back.
async (page) => {
  const pages = ['', 'about.html', 'appearances/', 'cutie-land/', 'discography/', 'discography/kawaii-dake.html', 'journey/', 'kohaku/', 'korea/',
    'likes/', 'live-guide/', 'members/', 'members/aika.html', 'mv-quiz/', 'news/', 'schedule/', 'stages/', 'start/', 'units/', 'videos/',
    'videos/stats/', 'which-member/', 'world/']
  const browser = page.context().browser()
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', timezoneId: 'Asia/Seoul' })
  const p = await c.newPage()
  const out = {}
  for (const u of pages) {
    await p.goto('http://localhost:4173/custo/' + u, { waitUntil: 'networkidle' }).catch(() => {})
    await p.waitForTimeout(600)
    const r = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('.VPContent h1, .VPContent h2, .VPContent h3, .VPContent h4, .VPContent h5, .VPContent h6, .VPContent [role="heading"]')]
        .filter((h) => (h.getClientRects().length || h.classList.contains('sr-only')) && !h.closest('[aria-hidden="true"], .aside')) // VitePress' aside outline title is its own region
      const lvl = (h) => +(h.getAttribute('aria-level') || h.tagName.slice(1))
      const txt = (h) => (h.getAttribute('aria-label') || h.textContent || '').replace(/\s+/g, ' ').trim()
      const issues = []
      const h1 = hs.filter((h) => lvl(h) === 1).length
      if (h1 !== 1) issues.push(`h1×${h1}`)
      if (hs.length && lvl(hs[0]) !== 1) issues.push(`first heading is h${lvl(hs[0])} "${txt(hs[0]).slice(0, 20)}" (h1 should come first)`)
      let prev = 0
      for (const h of hs) {
        const l = lvl(h), t = txt(h)
        if (prev && l > prev + 1) issues.push(`skip h${prev}→h${l} "${t.slice(0, 20)}"`)
        if (!t) issues.push(`empty h${l}`)
        else if (!/[\p{L}\p{N}]/u.test(t)) issues.push(`symbol-only h${l} "${t}"`)
        prev = l
      }
      return [...new Set(issues)]
    })
    if (r.length) out[u || 'home'] = r.slice(0, 8)
  }
  await c.close()
  return out
}
