<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { milestones } from '../data/journey'
import { events, catMeta, startMs, type CsEvent } from '../data/events'
import { jaLang } from '../theme/lang'

// Summit push: the stages left before 紅白 as camps on the last switchbacks of Fuji. Each camp's altitude uses the
// same date→altitude rule as the 3D story and the climb log (index-linear between milestones), so 'today' here
// matches the beacon up the page. Client-only — the camps depend on the visitor's date.
const SUMMIT = 3776, N = milestones.length
const ymd = (d: string) => Date.parse(d.replace(/\./g, '-') + 'T00:00:00+09:00')
const ts = milestones.map((m) => ymd(m.date))
const TOP = ts[N - 1], TOP_ISO = milestones[N - 1].date.replace(/\./g, '-')
function altAt(t: number) {
  if (t >= TOP) return SUMMIT
  for (let i = 0; i < N - 1; i++) if (t < ts[i + 1]) return Math.round(((i + Math.max(0, (t - ts[i]) / (ts[i + 1] - ts[i]))) / (N - 1)) * SUMMIT)
  return SUMMIT
}
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const dow = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] }
const label = (e: CsEvent) => (e.short ?? e.ko).split(/ · | \(/)[0]

interface Camp { e: CsEvent; alt: number; md: string; dow: string; name: string; ico: string; color: string }
const camps = ref<Camp[]>([])
const now = ref<{ alt: number; left: number } | null>(null)

// geometry: rows of fixed height, summit on top, today at the foot; the mountain widens toward the base like Fuji
const ROW = ref(66)
const half = (y: number) => 7 + 41 * Math.pow(y, 1.9) // half-width (% of the mountain column) at depth y∈[0,1]
const rows = ref<{ x: number; y: number }[]>([])
const trail = ref(''), mountain = ref(''), snow = ref(''), H = ref(0)

onMounted(() => {
  const t = Date.now(), today = new Date(t + 9 * 3600e3).toISOString().slice(0, 10)
  if (t >= TOP + 864e5) return
  const seen = new Set<string>()
  camps.value = events
    .filter((e) => (e.time ? startMs(e) > t : e.date > today) && e.date < TOP_ISO && (e.cat === 'live' || e.cat === 'event' || e.cat === 'release'))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
    .filter((e) => { const k = e.ja.replace(/\s*DAY\s*-?\d+\s*$/i, ''); if (seen.has(k)) return false; seen.add(k); return true })
    .map((e) => ({ e, alt: altAt(ymd(e.date)), md: e.date.slice(5).replace('-', '.'), dow: dow(e.date), name: label(e), ico: e.icon ?? catMeta[e.cat].ico, color: catMeta[e.cat].color }))
    .reverse() // top-down: the nearest camp sits just above today
  now.value = { alt: altAt(t), left: Math.max(0, Math.ceil((TOP - t) / 864e5)) }

  ROW.value = window.matchMedia('(max-width: 640px)').matches ? 82 : 66
  const n = camps.value.length + 2 // summit + camps + today
  H.value = n * ROW.value
  const pts = Array.from({ length: n }, (_, k) => {
    const y = (k * ROW.value + ROW.value / 2) / H.value
    const side = k === 0 ? 0 : k % 2 ? -1 : 1
    return { x: 50 + side * half(y) * 0.52, y: y * H.value }
  })
  rows.value = pts
  // trail from the foot (today) up to the summit, so a stroke-dashoffset draw climbs
  trail.value = 'M' + pts.slice().reverse().map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(1)}`).join('L')
  const side = (dir: number) => Array.from({ length: 25 }, (_, j) => { const y = j / 24; return `${(50 + dir * half(y)).toFixed(2)} ${(y * H.value).toFixed(1)}` })
  const r = side(1), l = side(-1).reverse()
  mountain.value = `M${l[l.length - 1]}L${r.join('L')}L${l.join('L')}Z`
  // snow cap: down to ~1.6 rows, with a jagged hem
  const sy = Math.min(0.42, (ROW.value * 1.7) / H.value), teeth = 9
  const hem = Array.from({ length: teeth + 1 }, (_, j) => {
    const f = j / teeth, x = 50 - half(sy) + f * 2 * half(sy), y = (sy + (j % 2 ? 0.035 : -0.01) * (1 - Math.abs(f - 0.5))) * H.value
    return `${x.toFixed(2)} ${y.toFixed(1)}`
  })
  snow.value = `M${(50 - half(0)).toFixed(2)} 0L${(50 + half(0)).toFixed(2)} 0L${hem.reverse().join('L')}Z`
})
</script>

<template>
  <section v-if="camps.length && now" class="js" aria-labelledby="js-h">
    <header class="js-head">
      <p class="js-eye">SUMMIT PUSH · 정상 공격</p>
      <h2 id="js-h"><Ico n="flag" duo size="0.95em" /> 紅白까지 남은 캠프 {{ camps.length }}곳</h2>
      <p class="js-sub">오늘 <b>{{ now.alt.toLocaleString() }}m</b>에서 정상 3,776m까지 남은 <b>{{ (SUMMIT - now.alt).toLocaleString() }}m</b> — 홍백 전 무대들을 같은 고도 계산으로 등산로 위에 놓았어요.</p>
    </header>

    <div class="js-mt" :style="{ height: H + 'px', '--row': ROW + 'px' }">
      <svg class="js-svg" :viewBox="`0 0 100 ${H}`" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="js-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9b6f5" /><stop offset="0.55" stop-color="#f1c9e0" /><stop offset="1" stop-color="#ffe3ef" stop-opacity="0.2" /></linearGradient>
          <linearGradient id="js-trail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8fb8" /><stop offset="1" stop-color="#8a55c0" /></linearGradient>
        </defs>
        <path :d="mountain" fill="url(#js-rock)" class="rock" />
        <path :d="snow" class="snow" />
        <path :d="trail" class="trail-bg" />
      </svg>
      <svg class="js-svg js-walk" :viewBox="`0 0 100 ${H}`" preserveAspectRatio="none" aria-hidden="true"><path :d="trail" class="trail" /></svg>

      <ol class="js-rows">
        <li class="row top" :style="{ '--x': rows[0].x, top: rows[0].y + 'px' }">
          <span class="ld" /><span class="mk"><Ico n="torii" duo :size="18" /></span>
          <a class="lab" :href="withBase('/kohaku/')">
            <span class="alt">▲ 3,776m</span>
            <b><span lang="ja">紅白</span> · 정상</b>
            <small>{{ TOP_ISO.slice(5).replace('-', '.') }} ({{ dow(TOP_ISO) }}) · D-{{ now.left }}</small>
          </a>
        </li>
        <li v-for="(c, k) in camps" :key="c.e.date + c.e.ja" class="row" :style="{ '--x': rows[k + 1].x, top: rows[k + 1].y + 'px', '--cc': c.color, '--k': camps.length - k }">
          <span class="ld" /><span class="mk"><Ico :n="c.ico" :size="15" /></span>
          <a class="lab" :href="c.e.url" target="_blank" rel="noopener">
            <span class="alt">{{ c.alt.toLocaleString() }}m</span>
            <b>{{ c.name }}</b>
            <small>{{ c.md }} ({{ c.dow }})<template v-if="c.e.venue"> · <span :lang="jaLang(c.e.venue)">{{ c.e.venue.replace("CUTIE STREET ", "") }}</span></template></small>
          </a>
        </li>
        <li class="row base" :style="{ '--x': rows[rows.length - 1].x, top: rows[rows.length - 1].y + 'px' }">
          <span class="ld" /><span class="mk"><i /></span>
          <span class="lab">
            <span class="alt">{{ now.alt.toLocaleString() }}m</span>
            <b>지금 여기</b>
            <small>오늘의 큐스트 위치</small>
          </span>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.js { max-width: 860px; margin: 0 auto; padding: 8px 24px 96px; color: #3a2340; }
.js-head { text-align: center; margin-bottom: 22px; }
.js-eye { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; color: #a0507a; }
.js-head h2 { margin: 6px 0; padding: 0; border: 0; font-size: clamp(24px, 3vw, 30px); display: inline-flex; align-items: center; gap: 8px; letter-spacing: -0.01em; }
.js-head h2 :deep(svg) { color: #c2185b; }
.js-sub { margin: 0 auto; max-width: 560px; font-size: 14px; color: #6b4a5e; text-wrap: balance; }
.js-sub b { color: #c2185b; }

/* the mountain lives in the left column; labels hang to its right */
.js-mt { --mw: min(46%, 360px); position: relative; }
.js-svg { position: absolute; left: 0; top: 0; width: var(--mw); height: 100%; overflow: visible; }
.rock { filter: drop-shadow(0 18px 24px rgba(120, 60, 140, 0.18)); }
.snow { fill: #fff; opacity: 0.92; }
.trail-bg, .trail { fill: none; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.trail-bg { stroke: rgba(255, 255, 255, 0.85); stroke-width: 7; }
.trail { stroke: url(#js-trail); stroke-width: 3; }
.js-walk { pointer-events: none; }

.js-rows { list-style: none; margin: 0; padding: 0; }
.row { position: absolute; left: 0; right: 0; height: 0; display: block; }
.mk { position: absolute; left: calc(var(--mw) * var(--x) / 100); top: 0; translate: -50% -50%; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: #fff; color: var(--cc, #c2185b); border: 2px solid var(--cc, #c2185b); box-shadow: 0 4px 10px -4px rgba(90, 30, 70, 0.45); z-index: 1; }
/* the label: dotted leader from the mountain edge, then the card */
.lab { position: absolute; left: calc(var(--mw) + 14px); right: 0; top: 0; translate: 0 -50%; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: baseline; padding: 6px 12px; border-radius: 14px; color: inherit; text-decoration: none; transition: background 0.2s, translate 0.35s var(--spring, ease); }
.ld { position: absolute; top: 0; left: calc(var(--mw) * var(--x) / 100 + 16px); width: calc(var(--mw) * (1 - var(--x) / 100) - 6px); border-top: 1.5px dotted color-mix(in oklab, var(--cc, #c2185b) 60%, #fff); }
a.lab:hover { background: rgba(255, 255, 255, 0.75); translate: 4px -50%; }
a.lab:focus-visible { outline: 2px solid #c2185b; outline-offset: 2px; }
.alt { grid-row: 1 / 3; align-self: center; min-width: 62px; font-size: 12px; font-weight: 900; color: var(--cc, #c2185b); font-variant-numeric: tabular-nums; }
.lab b { font-size: 15px; font-weight: 800; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lab small { grid-column: 2; font-size: 12px; color: #7a5a6e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.top .mk { width: 40px; height: 40px; background: linear-gradient(135deg, #ff6f9f, #c2185b); color: #fff; border-color: #fff; box-shadow: 0 8px 18px -6px #c2185b; }
.top .lab b { font-size: 17px; color: #c2185b; }
.top .alt { color: #c2185b; }
.base .mk { --cc: #c2185b; }
.base .mk i { width: 10px; height: 10px; border-radius: 50%; background: #c2185b; }
.base .lab b { color: #c2185b; }

@media (max-width: 640px) {
  .js { padding: 0 16px 72px; }
  .js-mt { --mw: 40%; }
  .lab { padding: 4px 6px; column-gap: 0; grid-template-columns: 1fr; }
  .alt { grid-row: auto; min-width: 0; font-size: 11px; }
  .lab small { grid-column: 1; font-size: 11px; }
  .lab b { font-size: 13.5px; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.25; }
  .top .lab b { font-size: 15px; }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .js-walk { animation: jsDraw linear both; animation-timeline: view(); animation-range: entry 15% cover 75%; }
    .row:not(.top):not(.base) .mk { animation: jsPop linear both; animation-timeline: view(); animation-range: entry 30% entry 90%; }
    @keyframes jsDraw { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0 0 0 0); } }
    @keyframes jsPop { from { scale: 0.3; opacity: 0; } to { scale: 1; opacity: 1; } }
  }
}
@media (prefers-reduced-motion: no-preference) {
  .base .mk::after { content: ''; position: absolute; inset: -2px; border-radius: 50%; border: 2px solid #c2185b; animation: jsPing 2.2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite; }
  @keyframes jsPing { from { opacity: 0.8; scale: 1; } to { opacity: 0; scale: 2; } }
}
</style>
