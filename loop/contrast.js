// Contrast of text over GRADIENT backgrounds, measured on the glyph pixels (#192/#233).
// Run with the Playwright MCP `browser_run_code_unsafe` tool (filename: loop/contrast.js) while `bash loop/preview.sh`
// serves. For every text element whose nearest painted ancestor has a gradient, the element is shot twice — text
// transparent (background) and pure green (glyph mask) — and the contrast is taken at the glyph pixels only
// (10th percentile). Phone width: navigate the MCP tab to about:blank#w=390 first. Solid backgrounds are covered by the earlier sweeps (#115/#116/#145). Expect {} back.
async (page) => {
  const browser = page.context().browser()
  const pages = ['', 'about.html', 'schedule/', 'members/', 'members/risa.html', 'korea/', 'appearances/', 'videos/', 'mv-quiz/', 'units/', 'world/',
    'live-guide/', 'likes/', 'discography/', 'cutie-land/', 'kohaku/', 'journey/', 'start/', 'which-member/']
  // about:blank#w=390&set=members → the eight member pages instead (each has its own colour, #199)
  if (/set=members/.test(page.url())) pages.splice(0, pages.length, ...['risa', 'aika', 'kana', 'ayano', 'emiru', 'miyu', 'nagisa', 'haruka'].map((m) => `members/${m}.html`))
  const out = {}
  const c = await browser.newContext({ viewport: { width: +(page.url().match(/#w=(\d+)/)?.[1] || 1440), height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', timezoneId: 'Asia/Seoul' })
  const p = await c.newPage()
  for (const u of pages) {
    await p.goto('http://localhost:4173/' + u, { waitUntil: 'networkidle' })
    await p.waitForTimeout(900)
    const cands = await p.evaluate(() => {
      const toRgb = (s) => { const n = s.match(/[\d.]+/g)?.map(Number); if (!n) return null; return s.startsWith('color(') ? { c: n.slice(0, 3).map((x) => x * 255), a: n[3] ?? 1 } : { c: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 } }
      const list = []; let k = 0
      for (const el of document.querySelectorAll('.VPContent *')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue
        if (!el.getClientRects().length || el.closest('[aria-hidden="true"]')) continue
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue
        let a = el, grad = false
        while (a && a !== document.body) { const s = getComputedStyle(a); if (s.backgroundImage.includes('gradient')) { grad = true; break } if (!/rgba\(0, 0, 0, 0\)/.test(s.backgroundColor) && !s.backgroundColor.endsWith(', 0)')) break; a = a.parentElement }
        if (!grad) continue
        const fg = toRgb(cs.color); if (!fg || fg.a < 0.6) continue
        el.setAttribute('data-cc', ++k)
        const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 600
        list.push({ k, fg: fg.c, need: size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5, label: `${typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : el.tagName}(${Math.round(size)}px) "${el.textContent.trim().slice(0, 16)}"` })
      }
      return list.slice(0, 45)
    })
    const bad = []
    for (const cd of cands) {
      const loc = p.locator(`[data-cc="${cd.k}"]`)
      try {
        if (!(await loc.count())) continue
        await loc.scrollIntoViewIfNeeded({ timeout: 1500 })
        // descendants stay transparent in both shots, so only this element's own glyphs form the mask
        // (text-fill-color inherits: without this, a child pill's text was measured against the pill — #193)
        const set = (col) => loc.evaluate((el, col) => {
          for (const e of [el, ...el.querySelectorAll('*')]) { const own = e === el ? col : 'transparent'; e.style.setProperty('color', own, 'important'); e.style.setProperty('-webkit-text-fill-color', own, 'important'); e.style.setProperty('text-shadow', 'none', 'important') }
        }, col)
        await set('transparent'); const A = await loc.screenshot({ timeout: 2500 })
        await set('rgb(0, 255, 0)'); const B = await loc.screenshot({ timeout: 2500 })
        await loc.evaluate((el) => { for (const e of [el, ...el.querySelectorAll('*')]) for (const k of ['color', 'text-shadow', '-webkit-text-fill-color']) e.style.removeProperty(k) })
        const v = await p.evaluate(async ({ a, b, fg }) => {
          const load = async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, cv.width, cv.height).data }
          const da = await load(a), db = await load(b)
          const lin = (x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
          const L = (r, g, bb) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(bb / 255)
          const Lf = L(...fg), crs = []
          for (let i = 0; i < da.length; i += 4) if (db[i] < 80 && db[i + 1] > 200 && db[i + 2] < 80) { const lb = L(da[i], da[i + 1], da[i + 2]); crs.push((Math.max(Lf, lb) + 0.05) / (Math.min(Lf, lb) + 0.05)) }
          if (!crs.length) return null
          crs.sort((x, y) => x - y); return +crs[Math.floor(crs.length * 0.1)].toFixed(2)
        }, { a: A.toString('base64'), b: B.toString('base64'), fg: cd.fg })
        if (v !== null && v < cd.need) bad.push(`${cd.label} ${v}<${cd.need}`)
      } catch { /* element re-rendered or off-page */ }
    }
    if (bad.length) out[u || 'home'] = bad.slice(0, 10)
  }
  await c.close()
  return out
}
