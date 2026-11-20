<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { CHAPTERS, COUNTRY, type Chapter } from '../data/world'

// Home teaser for /world/: a pre-rendered globe (loop/worldmini.mjs → /art/world-mini.svg) with the route,
// pins and live stats drawn on top. Projection = orthographic, centre [168E, 26N], scale 115 through a 51.5° lens (rim r 90) in a 200 box — keep in
// sync with loop/worldmini.mjs. No d3 here, so the home stays light.
const L0 = (168 * Math.PI) / 180, P0 = (26 * Math.PI) / 180, R = 115, COS_LENS = Math.cos((51.5 * Math.PI) / 180), rad = Math.PI / 180
const vec = ([lon, lat]: [number, number]) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)]
const toLL = ([x, y, z]: number[]): [number, number] => [Math.atan2(y, x) / rad, Math.asin(Math.max(-1, Math.min(1, z))) / rad]
function proj([lon, lat]: [number, number]) {
  const l = lon * rad - L0, p = lat * rad
  const vis = Math.sin(P0) * Math.sin(p) + Math.cos(P0) * Math.cos(p) * Math.cos(l)
  return { x: 100 + R * Math.cos(p) * Math.sin(l), y: 100 - R * (Math.cos(P0) * Math.sin(p) - Math.sin(P0) * Math.cos(p) * Math.cos(l)), vis: vis > COS_LENS }
}
const angle = (a: [number, number], b: [number, number]) => { const u = vec(a), v = vec(b); return Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]))) }
function arcPts(a: [number, number], b: [number, number], n = 24) {
  const w = angle(a, b), u = vec(a), v = vec(b), pts: [number, number][] = []
  for (let j = 0; j <= n; j++) {
    const t = j / n, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w)
    const q = proj(toLL([u[0] * s1 + v[0] * s2, u[1] * s1 + v[1] * s2, u[2] * s1 + v[2] * s2]))
    // lift the middle of the arc off the surface a little, like a flight path
    const lift = 1 + 0.08 * Math.sin(Math.PI * t) * Math.min(1, w / 0.5)
    pts.push([100 + (q.x - 100) * lift, 100 + (q.y - 100) * lift])
  }
  return pts
}
const arcPath = (a: [number, number], b: [number, number]) => 'M' + arcPts(a, b).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')

const today = ref('') // client-only: done/upcoming and the stats follow the visitor's date, not the build date
onMounted(() => { today.value = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) })
const done = (c: Chapter) => !!today.value && c.iso <= today.value
const anchor = (c: Chapter) => c.pins[0].ll

const arcs = computed(() => CHAPTERS.slice(1).map((c, i) => ({ d: angle(anchor(CHAPTERS[i]), anchor(c)) > 0.02 ? arcPath(anchor(CHAPTERS[i]), anchor(c)) : '', up: !done(c), i })).filter((a) => a.d))
const pins = computed(() => CHAPTERS.flatMap((c) => c.pins.map((p) => ({ ...proj(p.ll), color: COUNTRY[c.country].color, up: !done(c), k: c.iso + p.name }))).filter((p) => p.vis))
const stats = computed(() => {
  if (!today.value) return null
  const d = CHAPTERS.filter(done)
  let km = 0
  for (let i = 1; i < CHAPTERS.length; i++) if (done(CHAPTERS[i])) km += angle(anchor(CHAPTERS[i - 1]), anchor(CHAPTERS[i])) * 6371
  return { countries: new Set(d.map((c) => c.country)).size, cities: new Set(d.flatMap((c) => c.pins.map((p) => p.name.replace(/ \(.*\)/, '')))).size, km: Math.round(km) }
})

// the leg the group is on right now: from the last stop played to the next one, the plane placed by today's
// share of the gap (same rule as the boarding passes on /world/), a pulse where they are, a D-day chip
const ms = (iso: string) => Date.parse(iso + 'T00:00:00+09:00')
const leg = computed(() => {
  if (!today.value) return null
  const i = CHAPTERS.findIndex((c) => !done(c))
  if (i < 1) return null
  const prev = CHAPTERS[i - 1], next = CHAPTERS[i], from = prev.pins[prev.pins.length - 1].ll, to = anchor(next)
  const here = proj(from)
  const days = Math.round((ms(next.iso) - ms(today.value)) / 864e5)
  const t = Math.max(0.08, Math.min(0.92, (Date.now() - ms(prev.iso)) / (ms(next.iso) - ms(prev.iso))))
  let plane = null as null | { x: number; y: number; a: number }, d = ''
  if (angle(from, to) > 0.004) {
    const pts = arcPts(from, to, 40), k = Math.min(39, Math.floor(t * 40)), f = t * 40 - k
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]
    plane = { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, a: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + 90 }
    d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')
  }
  return { here: here.vis ? here : null, plane, d, days, city: next.pins[0].name.replace(/ \(.*\)/, ''), color: COUNTRY[next.country].color }
})
const PLANE = 'M12 2.5c.9 0 1.5.9 1.5 2v5l7 4v2l-7-2v4.2l2.2 1.6V21L12 20l-3.7 1v-1.7l2.2-1.6V14l-7 2v-2l7-4V4.5c0-1.1.6-2 1.5-2Z'
</script>

<template>
  <span class="wmn" aria-hidden="true">
    <span class="wmn-globe">
      <img :src="withBase('/art/world-mini.svg')" alt="" width="200" height="200" loading="lazy" decoding="async" />
      <svg viewBox="0 0 200 200">
        <path v-for="a in arcs" :key="a.i" :d="a.d" pathLength="1" class="wmn-arc" :class="{ up: a.up }" :style="{ '--i': a.i }" />
        <path v-if="leg?.d" :d="leg.d" class="wmn-leg" />
        <circle v-for="p in pins" :key="p.k" :cx="p.x" :cy="p.y" r="2.6" :fill="p.up ? '#fff' : p.color" :stroke="p.up ? p.color : '#fff'" stroke-width="1.1" />
        <g v-if="leg?.here" class="wmn-here" :transform="`translate(${leg.here.x.toFixed(1)} ${leg.here.y.toFixed(1)})`">
          <circle class="wmn-pulse" r="4" />
          <circle class="wmn-pulse b" r="4" />
          <circle r="3.1" class="wmn-dot" />
        </g>
        <g v-if="leg?.plane" class="wmn-plane" :transform="`translate(${leg.plane.x.toFixed(1)} ${leg.plane.y.toFixed(1)}) rotate(${leg.plane.a.toFixed(0)}) scale(0.56) translate(-12 -12)`">
          <path :d="PLANE" />
        </g>
      </svg>
    </span>
    <span v-if="stats" class="wmn-chip">{{ stats.countries }}개 나라 · {{ stats.cities }}도시 · {{ stats.km.toLocaleString('ko-KR') }}km</span>
    <span v-if="leg" class="wmn-next" :style="{ '--nc': leg.color }"><Ico n="plane" :size="13" /><span>다음 목적지 <b>{{ leg.city }}</b></span><em>D-{{ leg.days }}</em></span>
  </span>
</template>

<style scoped>
.wmn { position: relative; display: block; margin: -4px 0 auto; }
.wmn-globe { position: relative; display: block; width: min(100%, 230px); aspect-ratio: 1; margin-left: auto; filter: drop-shadow(0 14px 18px rgba(90, 30, 70, 0.16)); transition: transform 0.7s var(--spring, ease); }
.wmn-globe img, .wmn-globe svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.wmn-globe svg { overflow: visible; }
.wmn-arc { fill: none; stroke: #e0457f; stroke-width: 1.6; stroke-linecap: round; stroke-dasharray: 1 1; stroke-dashoffset: 0; }
.wmn-arc.up { stroke: #a06cd5; stroke-dasharray: 0.02 0.03; stroke-width: 1.4; }
.wmn-chip { position: absolute; left: 0; top: 4px; padding: 4px 10px; border-radius: 999px; background: #fff; border: 1.5px solid #f3cfe0; color: #8a2a55; font-size: 12px; font-weight: 800; white-space: nowrap; box-shadow: 0 6px 14px -8px rgba(90, 30, 70, 0.4); }
.wmn-leg { fill: none; stroke: #ff6fa5; stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: 2.4 2.6; filter: drop-shadow(0 0 2px rgba(255, 111, 165, 0.7)); }
.wmn-dot { fill: #e0457f; stroke: #fff; stroke-width: 1.4; }
.wmn-pulse { fill: rgba(224, 69, 127, 0.12); stroke: #e0457f; stroke-width: 1.4; opacity: 0; transform-box: fill-box; transform-origin: center; }
.wmn-plane path { fill: #fff; stroke: #c2185b; stroke-width: 2.6; stroke-linejoin: round; paint-order: stroke; }
.wmn-plane { filter: drop-shadow(0 1.5px 1.5px rgba(90, 30, 70, 0.35)); }
.wmn-next { position: absolute; left: 0; bottom: 6px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 9px; border-radius: 999px; background: linear-gradient(135deg, #fff, #fff4f9); border: 1.5px solid color-mix(in oklab, var(--nc) 30%, #fff); color: #6b2a4a; font-size: 11.5px; font-weight: 700; white-space: nowrap; box-shadow: 0 6px 14px -8px rgba(90, 30, 70, 0.4); }
.wmn-next > :first-child { color: var(--nc); }
.wmn-next b { font-weight: 900; color: #3a0a2a; }
.wmn-next em { font-style: normal; font-weight: 900; font-size: 11px; color: #fff; background: var(--nc); padding: 1px 7px; border-radius: 999px; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: no-preference) {
  .wmn-leg { animation: wmnFlow 1.6s linear infinite; }
  .wmn-pulse { animation: wmnPulse 2.4s cubic-bezier(0.2, 0.7, 0.3, 1) infinite; }
  .wmn-pulse.b { animation-delay: 1.2s; }
  .wmn-plane path { animation: wmnBob 3.2s ease-in-out infinite; }
  @keyframes wmnFlow { to { stroke-dashoffset: -10; } }
  @keyframes wmnPulse { 0% { opacity: 0.85; transform: scale(0.7); } 100% { opacity: 0; transform: scale(2.6); } }
  @keyframes wmnBob { 50% { transform: translateY(-1.6px); } }
}
/* routes draw themselves as the tile scrolls into view (where scroll-driven animations exist) */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .wmn-arc:not(.up) { animation: wmnDraw linear both; animation-timeline: view(); animation-range: entry calc(10% + var(--i) * 4%) cover calc(38% + var(--i) * 4%); }
    @keyframes wmnDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  }
}
</style>
