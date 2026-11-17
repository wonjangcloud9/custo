// Site-wide layout/console audit — paste into the Playwright MCP `browser_run_code_unsafe` tool
// while `npm run docs:preview -- --port 4173` is running. Reports, per page × {390, 1440}:
//   ox    = horizontal page overflow (px)          → must be 0
//   offs  = unclipped elements sticking out of the viewport
//   spill = buttons/links/list items whose text is wider than their box (review: badges/tooltips/rotated stamps are fine)
// plus every console error / page error. Takes ~3 min (runs in the background).
async (page) => {
  const pages = ['', 'about.html', 'appearances/', 'cutie-land/', 'discography/', 'discography/kawaii-dake.html', 'discography/hello-hello-mirai.html',
    'discography/happy-sekai.html', 'journey/', 'kohaku/', 'korea/', 'likes/', 'live-guide/', 'members/', 'members/risa.html', 'members/aika.html',
    'members/kana.html', 'members/ayano.html', 'members/emiru.html', 'members/miyu.html', 'members/nagisa.html', 'members/haruka.html', 'mv-quiz/',
    'news/', 'schedule/', 'stages/', 'start/', 'units/', 'videos/', 'videos/stats/', 'which-member/', 'world/']
  const browser = page.context().browser()
  const report = {}, errs = []
  for (const w of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
    const p = await ctx.newPage()
    let cur = ''
    p.on('console', (m) => { if (m.type() === 'error') errs.push(`${w} ${cur} ` + m.text().slice(0, 120)) })
    p.on('pageerror', (e) => errs.push(`${w} ${cur} PE ` + String(e).slice(0, 120)))
    for (const u of pages) {
      cur = u || 'home'
      await p.goto('http://localhost:4173/custo/' + u, { waitUntil: 'networkidle' }).catch(() => {})
      await p.waitForTimeout(500)
      await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } scrollTo(0, 0) })
      await p.waitForTimeout(300)
      const r = await p.evaluate(() => {
        const W = innerWidth, name = (el) => (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : el.tagName)
        const offs = [], spill = []
        for (const el of document.querySelectorAll('.VPContent *')) {
          const b = el.getBoundingClientRect()
          if (!b.width || !b.height || (b.right <= W + 2 && b.left >= -2)) continue
          let a = el.parentElement, clipped = false
          while (a && a !== document.body) { if (/(hidden|auto|scroll|clip)/.test(getComputedStyle(a).overflowX)) { clipped = true; break } a = a.parentElement }
          if (!clipped && getComputedStyle(el).position !== 'fixed') offs.push(`${name(el)}(${Math.round(b.left)}..${Math.round(b.right)})`)
        }
        for (const el of document.querySelectorAll('.VPContent button, .VPContent a, .VPContent .chip, .VPContent li')) {
          const cs = getComputedStyle(el)
          if (cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden' || cs.display === 'inline') continue
          if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 3) spill.push(name(el) + ':' + el.textContent.trim().slice(0, 18))
        }
        return { ox: document.documentElement.scrollWidth - W, offs: [...new Set(offs)].slice(0, 5), spill: [...new Set(spill)].slice(0, 5) }
      })
      if (r.ox > 0 || r.offs.length || r.spill.length) report[`${w} ${cur}`] = r
    }
    await ctx.close()
  }
  return { report, errs }
}
