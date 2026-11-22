// Japanese-without-lang sweep (#201) — run with the Playwright MCP `browser_run_code_unsafe` tool (filename:
// loop/lang.js) while `bash loop/preview.sh` serves. The site is lang=ko; Japanese text needs lang="ja" on an
// ancestor so screen readers switch voice and line breaking treats it as Japanese (keep-all is exempted for
// :lang(ja), see style.css). Flags visible text nodes containing kana (hiragana/katakana — unambiguous Japanese;
// kanji-only strings are skipped) with no lang=ja ancestor. Reports per page: count and the components (nearest
// element class) they sit in. Width 1440. Expect {} back.
async (page) => {
  const pages = ['', 'about.html', 'appearances/', 'cutie-land/', 'discography/', 'discography/kawaii-dake.html', 'journey/', 'kohaku/', 'korea/',
    'likes/', 'live-guide/', 'members/', 'members/aika.html', 'mv-quiz/', 'news/', 'schedule/', 'stages/', 'start/', 'units/', 'videos/',
    'videos/stats/', 'which-member/', 'world/']
  const browser = page.context().browser()
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', timezoneId: 'Asia/Seoul' })
  const p = await c.newPage()
  const out = {}
  for (const u of pages) {
    await p.goto('http://localhost:4173/' + u, { waitUntil: 'networkidle' }).catch(() => {})
    await p.waitForTimeout(600)
    const r = await p.evaluate(() => {
      const kana = /[ぁ-ゖァ-ヺー]/
      const root = document.querySelector('.VPContent') || document.body
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const where = {}
      let n = 0
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        const s = t.textContent.trim(); if (!s || !kana.test(s)) continue
        const el = t.parentElement; if (!el || !el.getClientRects().length) continue
        if (el.closest('[lang^="ja"], [aria-hidden="true"], script, style')) continue
        n++
        let a = el; while (a && !(typeof a.className === 'string' && a.className.trim())) a = a.parentElement
        const k = a ? '.' + a.className.trim().split(/\s+/)[0] : el.tagName
        where[k] = where[k] || s.slice(0, 18)
      }
      return { n, where }
    })
    if (r.n) out[u || 'home'] = { n: r.n, where: Object.entries(r.where).slice(0, 10).map(([k, v]) => `${k} "${v}"`) }
  }
  await c.close()
  return out
}
