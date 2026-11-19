// Basic accessibility sweep — run with the Playwright MCP `browser_run_code_unsafe` tool (filename: loop/a11y.js)
// while `bash loop/preview.sh` is serving. Checks, per page × {390, 1440}, at a busy moment (11/26 19:20 KST:
// Aika's birthday, a NOW bar, live states): buttons/links with no accessible name, <img> without alt,
// inputs without a label, duplicate ids, and focusable elements inside aria-hidden. Expect {} back.
// Proven to catch planted cases (#183). Written in-house: injecting third-party scripts is not allowed here.
async (page) => {
  const browser = page.context().browser()
  const pages = ['', 'about.html', 'schedule/', 'members/', 'members/aika.html', 'cutie-land/', 'kohaku/', 'korea/', 'appearances/', 'videos/',
    'which-member/', 'mv-quiz/', 'news/', 'stages/', 'units/', 'world/', 'live-guide/', 'start/', 'likes/', 'discography/', 'discography/kyuutai.html', 'journey/']
  const out = {}
  for (const w of [390, 1440]) {
    const c = await browser.newContext({ viewport: { width: w, height: 900 }, timezoneId: 'Asia/Seoul' })
    await c.clock.install({ time: new Date('2026-11-26T19:20:00+09:00') })
    const p = await c.newPage()
    for (const u of pages) {
      await p.goto('http://localhost:4173/custo/' + u, { waitUntil: 'networkidle' })
      await p.waitForTimeout(500)
      const r = await p.evaluate(() => {
        const vis = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0 }
        const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) || el.textContent || [...el.querySelectorAll('img[alt], svg[aria-label]')].map((i) => i.getAttribute('alt') || i.getAttribute('aria-label')).join('')).trim()
        const tag = (el) => (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase())
        const root = document.querySelector('.VPContent') || document.body
        const noName = [...root.querySelectorAll('a[href], button, [role="button"], [role="link"]')].filter((e) => vis(e) && !name(e)).map(tag)
        const noAlt = [...root.querySelectorAll('img')].filter((i) => vis(i) && !i.hasAttribute('alt')).map((i) => i.src.split('/').pop().slice(0, 20))
        const inputs = [...root.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((i) => vis(i) && !(i.labels?.length) && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby') && !i.getAttribute('title')).map(tag)
        const ids = {}; for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] || 0) + 1
        const dupIds = Object.entries(ids).filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`)
        const hiddenFocusable = [...root.querySelectorAll('[aria-hidden="true"] a[href], [aria-hidden="true"] button, [aria-hidden="true"] input, [aria-hidden="true"] [tabindex]:not([tabindex="-1"])')].filter(vis).map(tag)
        return { noName: [...new Set(noName)].slice(0, 5), noAlt: noAlt.slice(0, 4), inputs: [...new Set(inputs)], dupIds: dupIds.slice(0, 5), hiddenFocusable: [...new Set(hiddenFocusable)].slice(0, 5) }
      })
      const bad = Object.fromEntries(Object.entries(r).filter(([, v]) => v.length))
      if (Object.keys(bad).length) out[`${w} ${u || 'home'}`] = bad
    }
    await c.close()
  }
  return out
}
