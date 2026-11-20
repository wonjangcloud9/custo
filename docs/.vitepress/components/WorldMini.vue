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
function arcPath(a: [number, number], b: [number, number]) {
  const w = angle(a, b), u = vec(a), v = vec(b), pts: string[] = []
  for (let j = 0; j <= 24; j++) {
    const t = j / 24, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w)
    const q = proj(toLL([u[0] * s1 + v[0] * s2, u[1] * s1 + v[1] * s2, u[2] * s1 + v[2] * s2]))
    // lift the middle of the arc off the surface a little, like a flight path
    const lift = 1 + 0.08 * Math.sin(Math.PI * t) * Math.min(1, w / 0.5)
    pts.push(`${(100 + (q.x - 100) * lift).toFixed(1)} ${(100 + (q.y - 100) * lift).toFixed(1)}`)
  }
  return 'M' + pts.join('L')
}

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
</script>

<template>
  <span class="wmn" aria-hidden="true">
    <span class="wmn-globe">
      <img :src="withBase('/art/world-mini.svg')" alt="" width="200" height="200" loading="lazy" decoding="async" />
      <svg viewBox="0 0 200 200">
        <path v-for="a in arcs" :key="a.i" :d="a.d" pathLength="1" class="wmn-arc" :class="{ up: a.up }" :style="{ '--i': a.i }" />
        <circle v-for="p in pins" :key="p.k" :cx="p.x" :cy="p.y" r="2.6" :fill="p.up ? '#fff' : p.color" :stroke="p.up ? p.color : '#fff'" stroke-width="1.1" />
      </svg>
    </span>
    <span v-if="stats" class="wmn-chip">{{ stats.countries }}개 나라 · {{ stats.cities }}도시 · {{ stats.km.toLocaleString('ko-KR') }}km</span>
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
/* routes draw themselves as the tile scrolls into view (where scroll-driven animations exist) */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .wmn-arc:not(.up) { animation: wmnDraw linear both; animation-timeline: view(); animation-range: entry calc(10% + var(--i) * 4%) cover calc(38% + var(--i) * 4%); }
    @keyframes wmnDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  }
}
</style>
