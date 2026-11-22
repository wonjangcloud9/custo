import { defineConfig } from 'vitepress'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { members } from './data/members'
import { songs } from './data/songs'

// Hosting: Vercel, at the domain root (moved from GitHub Pages' /custo/ on 2026-11-22 — gh-pages-redirect/ forwards
// old links). The address is the project's production domain, which Vercel provides while it builds; SITE_HOST pins
// another one; the last value is for builds made anywhere else. vercel.json holds the rest (clean URLs, caching).
const ON_VERCEL = !!process.env.VERCEL // Web Analytics only exists there (theme/index.ts)
const SITE = `https://${process.env.SITE_HOST || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'custo-xi.vercel.app'}/`

// Structured data (schema.org JSON-LD) — only facts already verified in data/members.ts and the official links.
const OFFICIAL = 'https://cutiestreet.asobisystem.com/'
const SAME_AS = ['https://x.com/CUTIE_STREET_', 'https://www.instagram.com/cutie_street_/', 'https://www.youtube.com/@CUTIE_STREET']
const group = {
  '@type': 'MusicGroup', name: 'CUTIE STREET', alternateName: ['きゅーすと', 'キューティーストリート', '큐티스트리트', '큐스트', '큐스토'], url: OFFICIAL, sameAs: SAME_AS, genre: 'J-pop',
  member: members.map((m) => ({ '@type': 'Person', name: m.ja, alternateName: [m.ko, m.en] })),
}
function jsonLd(path: string, title: string): object | null {
  if (path === '') return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Custo · 큐티스트리트(CUTIE STREET) 팬허브', alternateName: ['Custo', '큐티스트리트 팬사이트', 'CUTIE STREET Fan Hub'], url: SITE, inLanguage: ['ko', 'ja'], about: group }
  if (path === 'about') return { '@context': 'https://schema.org', ...group }
  const m = members.find((x) => path === `members/${x.id}`)
  if (m) return {
    '@context': 'https://schema.org', '@type': 'ProfilePage', name: title, url: SITE + path,
    mainEntity: { '@type': 'Person', name: m.ja, alternateName: [m.ko, m.en, m.nickname], birthDate: m.birthday, birthPlace: { '@type': 'Place', name: m.birthplace }, height: { '@type': 'QuantitativeValue', value: m.height, unitCode: 'CMT' }, memberOf: { '@type': 'MusicGroup', name: 'CUTIE STREET', url: OFFICIAL } },
  }
  return null
}

export default defineConfig({
  title: 'Custo',
  titleTemplate: ':title | 큐티스트리트 팬허브 Custo',
  description: 'CUTIE STREET(큐티스트리트) 비공식 팬허브 — 멤버 프로필, 레전드 컷, 공식 영상 아카이브, 스케줄, 정상까지의 여정, 한국 팬 소식.',
  cleanUrls: true,
  lang: 'ko',
  appearance: false,
  srcExclude: ['superpowers/**'],
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'manifest', href: '/manifest.webmanifest' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'Custo' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    // body text uses the system's own Korean/Japanese fonts; only the rounded display face is a web font (#212: Noto KR+JP
    // were ~1.4 MB of woff2 subsets on the home page)
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap', rel: 'stylesheet' }],
    ['meta', { name: 'keywords', content: '큐티스트리트, 큐티 스트리트, 큐스트, 큐스토, CUTIE STREET, キューティーストリート, きゅーすと, KAWAII LAB, 팬사이트, 팬페이지, 멤버 프로필, 스케줄, MV, 직캠, 紅白, 홍백, 큐티스트리트 한국' }],
    ['meta', { name: 'theme-color', content: '#FF6B9D' }],
    // light-only design (appearance: false): ask browsers not to auto-darken it (Chrome/Samsung forced dark) — 'only' opts out
    ['meta', { name: 'color-scheme', content: 'only light' }],
    ['meta', { name: 'author', content: 'Custo' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Custo · CUTIE STREET Fan Hub' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:locale', content: 'ko_KR' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  sitemap: { hostname: SITE },
  // heading anchors: VitePress labels them 'Permalink to "…"' for screen readers; same markup, Korean label (#200)
  markdown: {
    anchor: {
      permalink: (slug: string, _opts: unknown, state: any, idx: number) => {
        const title = state.tokens[idx + 1].content
        const space = Object.assign(new state.Token('text', '', 0), { content: ' ' })
        const open = Object.assign(new state.Token('link_open', 'a', 1), { attrs: [['class', 'header-anchor'], ['href', `#${slug}`], ['aria-label', `‘${title}’ 제목으로 바로 가는 링크`]] })
        const zw = Object.assign(new state.Token('html_inline', '', 0), { content: '&ZeroWidthSpace;' })
        state.tokens[idx + 1].children.push(space, open, zw, new state.Token('link_close', 'a', -1))
      },
    },
  },
  // the build's own clock, identical on the server render and before the page mounts — lets 'what's next' lists
  // render into the HTML instead of popping in after hydration (#196, layout shift)
  vite: { define: { __BUILD_TIME__: JSON.stringify(Date.now()), __VERCEL_ANALYTICS__: JSON.stringify(ON_VERCEL) } },
  // offline support (#234): list the lazy component chunks the always-saved pages need (and what they import),
  // so the service worker can save them on install; and stamp sw.js so each deploy refreshes the saved copies
  buildEnd(site) {
    const chunkDir = join(site.outDir, 'assets/chunks')
    const files = readdirSync(chunkDir)
    const skip = /^(three\.module|countries-110m|WorldMap|JourneyToTop)\./
    const want = new Set<string>()
    const add = (f: string) => {
      if (want.has(f) || skip.test(f) || !files.includes(f)) return
      want.add(f)
      // static imports only — following import() from the theme chunk would pull in every page's components
      for (const m of readFileSync(join(chunkDir, f), 'utf8').matchAll(/(?:from|import)\s*["'`]\.\/([\w.-]+\.js)["'`]/g)) add(m[1])
    }
    for (const md of ['index.md', 'live-guide/index.md', 'schedule/index.md', 'cutie-land/index.md', 'members/index.md']) {
      for (const m of readFileSync(join(site.srcDir, md), 'utf8').matchAll(/<([A-Z][A-Za-z0-9]+)/g)) {
        const f = files.find((x) => x.startsWith(`${m[1]}.`))
        if (f) add(f)
      }
    }
    writeFileSync(join(site.outDir, 'sw-precache.json'), JSON.stringify([...want].map((f) => `assets/chunks/${f}`)))
    const sw = join(site.outDir, 'sw.js')
    writeFileSync(sw, `// build ${Date.now().toString(36)}\n` + readFileSync(sw, 'utf8'))
    // search engines: everything may be crawled; point them at the sitemap of whichever address this build is for
    writeFileSync(join(site.outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`)
  },
  // search engines: each page's <title>/<meta description> names the group the way Korean and Japanese fans search for it
  // (큐티스트리트 · CUTIE STREET · キューティーストリート), and member pages get their own profile title + description
  transformPageData(pageData) {
    const PREF_KO: Record<string, string> = { 北海道: '홋카이도', 千葉県: '지바현', 愛知県: '아이치현', 東京都: '도쿄', 熊本県: '구마모토현', 神奈川県: '가나가와현' }
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const m = members.find((x) => path === `members/${x.id}`)
    if (m) {
      const [y, mo, d] = m.birthday.split('-')
      pageData.title = `${m.ko} (${m.ja}) 프로필`
      pageData.description = `큐티스트리트(CUTIE STREET) ${m.ko}(${m.ja}·${m.kana.replace(' ', '')}·${m.en}) 프로필 — ${y}년 ${+mo}월 ${+d}일생, 키 ${m.height}cm, ${PREF_KO[m.birthplace] ?? m.birthplace}(${m.birthplace}) 출신, 멤버 컬러 ${m.colorName}, 애칭 ${m.nicknameKo}. 공식 영상·직캠·SNS·일정 모음.`
      return
    }
    const desc = pageData.frontmatter.description as string | undefined
    if (desc && !desc.includes('큐티스트리트')) pageData.description = desc.replace(/^CUTIE STREET/, '큐티스트리트(CUTIE STREET)').replace(/^(?!큐티스트리트)/, '큐티스트리트 · ')
  },
  transformHead({ pageData, siteData }) {
    const title = pageData.frontmatter.titleTemplate
      ? `${pageData.title} | ${pageData.frontmatter.titleTemplate}`
      : pageData.title ? `${pageData.title} | 큐티스트리트 팬허브 Custo` : siteData.title
    const desc = pageData.description || pageData.frontmatter.description || siteData.description
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = `${SITE}${path}`
    // member pages share a card in that member's colour (rendered from loop/og-member.html)
    const mem = path.match(/^members\/(risa|aika|kana|ayano|emiru|miyu|nagisa|haruka)$/)?.[1]
    // section hubs share their own card too (loop/og-section.html)
    const sec = path.match(/^(appearances|cutie-land|kohaku|world|korea|schedule|videos|discography|stages|mv-quiz)\/$/)?.[1] ?? (path.startsWith('discography/') ? 'discography' : undefined)
    const img = `${SITE}${mem ? `og/${mem}.png` : sec ? `og/sec-${sec}.png` : 'og.png'}`
    const alt = mem ? `${pageData.title} — CUTIE STREET 멤버 카드` : sec ? `${pageData.title} — CUTIE STREET 팬허브` : 'CUTIE STREET 팬허브 — 귀여움으로 세계까지'
    const ld = jsonLd(path, title)
    return [
      ...(ld ? [['script', { type: 'application/ld+json' }, JSON.stringify(ld)] as [string, Record<string, string>, string]] : []),
      ['meta', { property: 'og:image', content: img }],
      ['meta', { property: 'og:image:alt', content: alt }],
      ['meta', { name: 'twitter:image', content: img }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: desc }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: desc }],
      ['link', { rel: 'canonical', href: url }],
    ]
  },
  themeConfig: {
    nav: [
      { text: '홈', link: '/' },
      { text: '소개', link: '/about' },
      { text: '여정', items: [{ text: '정상까지의 여정 (3D)', link: '/journey/' }, { text: '큐스트 월드맵', link: '/world/' }] },
      { text: '紅白', link: '/kohaku/' },
      { text: '멤버', link: '/members/' },
      { text: '디스코그래피', link: '/discography/' },
      { text: '영상', items: [ { text: '영상 아카이브 (공식 채널)', link: '/videos/' }, { text: '출연 아카이브 (다른 채널)', link: '/appearances/' }, { text: 'MV 장면 퀴즈', link: '/mv-quiz/' } ] },
      { text: '레전드 무대', link: '/stages/' },
      {
        text: '스케줄',
        items: [
          { text: '스케줄 · 카운트다운', link: '/schedule/' },
          { text: '공식 소식 (한국어 요약)', link: '/news/' },
          { text: '라이브 가이드 · 펜라이트', link: '/live-guide/' },
          { text: '큐스트 in KOREA', link: '/korea/' },
        ],
      },
    ],
    sidebar: {
      '/members/': [
        {
          text: '멤버',
          items: [
            { text: '전체 멤버', link: '/members/' },
            { text: '후루사와 (古澤)', link: '/members/risa' },
            { text: '사노 (佐野)', link: '/members/aika' },
            { text: '이타쿠라 (板倉)', link: '/members/kana' },
            { text: '마스다 (増田)', link: '/members/ayano' },
            { text: '카와모토 (川本)', link: '/members/emiru' },
            { text: '우메다 (梅田)', link: '/members/miyu' },
            { text: '마나베 (真鍋)', link: '/members/nagisa' },
            { text: '사쿠라바 (桜庭)', link: '/members/haruka' },
            { text: '💞 유닛 & 케미', link: '/units/' },
            { text: '🔮 나와 닮은 멤버', link: '/which-member/' },
            { text: '♡ 나의 앨범', link: '/likes/' },
          ],
        },
      ],
      '/discography/': [
        {
          text: '디스코그래피',
          items: [
            { text: '전체 목록', link: '/discography/' },
            { text: '💿 CUTIE LAND 특집', link: '/cutie-land/' },
          ],
        },
        {
          // song spotlight pages grouped by release year (newest year open; the year holding the
          // current page opens itself), oldest release first inside a year — generated from data/songs.ts
          text: '📖 곡 이야기',
          items: [...new Set(songs.map((x) => x.facts[0].v.slice(0, 4)))].sort().reverse().map((y, i) => ({
            text: `${y}년`,
            collapsed: i > 0,
            items: songs.filter((x) => x.facts[0].v.startsWith(y)).sort((a, b) => a.facts[0].v.localeCompare(b.facts[0].v)).map((x) => ({ text: x.title, link: `/discography/${x.id}` })),
          })),
        },
      ],
    },
    socialLinks: [
      { icon: 'x', link: 'https://x.com/CUTIE_STREET_', ariaLabel: 'CUTIE STREET 공식 X' },
      { icon: 'instagram', link: 'https://www.instagram.com/cutie_street_/', ariaLabel: 'CUTIE STREET 공식 인스타그램' },
      { icon: 'youtube', link: 'https://www.youtube.com/@CUTIE_STREET', ariaLabel: 'CUTIE STREET 공식 유튜브' },
    ],
    footer: {
      message: '귀여움으로 세계까지 — CUTIE STREET 비공식 팬허브 · 영상·이미지 저작권은 각 권리자(ASOBISYSTEM / KAWAII LAB.)에 있습니다',
      copyright: 'Fan-made project. CUTIE STREET is managed by ASOBISYSTEM / KAWAII LAB.',
    },
    docFooter: {
      prev: '이전 페이지',
      next: '다음 페이지',
    },
    // VitePress' own UI strings were still English on phones ('Menu', 'On this page', 'Return to top') — #199
    outline: { label: '이 페이지 목차' },
    sidebarMenuLabel: '메뉴',
    returnToTopLabel: '맨 위로',
    skipToContentLabel: '본문으로 건너뛰기',
  },
})
