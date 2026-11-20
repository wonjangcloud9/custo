<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { members } from '../data/members'
import { milestones } from '../data/journey'

// Home teaser for /journey/: a tiny Fuji whose 8-colour trail is drawn up to where the group is *today*
// (same date interpolation as JourneyToTop), with a 'you are here' dot and the live altitude / D-day.
const SUMMIT = 3776, N = milestones.length
const ymd = (d: string) => Date.parse(d.replace(/\./g, '-') + 'T00:00:00+09:00')
const u = ref<number | null>(null) // client-only, so SSR markup stays stable
const days = ref<number | null>(null)
const dot = ref<{ x: number; y: number } | null>(null)
const trail = ref<SVGPathElement | null>(null)
const TRAIL = 'M34 157 C90 152 140 146 178 137 C140 130 112 124 118 116 C124 108 176 106 172 96 C168 86 128 86 134 76 C140 66 168 64 160 54 C154 46 150 44 150 36'

onMounted(() => {
  const now = Date.now(), ts = milestones.map((m) => ymd(m.date))
  let v = 1
  for (let i = 0; i < N - 1; i++) if (now < ts[i + 1]) { v = (i + Math.max(0, (now - ts[i]) / (ts[i + 1] - ts[i]))) / (N - 1); break }
  u.value = v
  days.value = Math.ceil((ts[N - 1] - now) / 864e5)
  const p = trail.value
  if (p) { const pt = p.getPointAtLength(p.getTotalLength() * v); dot.value = { x: pt.x, y: pt.y } }
})
const stops = members.map((m, i) => ({ c: m.color, o: `${(i / (members.length - 1)) * 100}%` }))
</script>

<template>
  <span class="jm" aria-hidden="true">
    <svg viewBox="0 0 300 168" class="jm-svg">
      <defs>
        <linearGradient id="jm-mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9b6f5" /><stop offset="0.72" stop-color="#f4cde6" /><stop offset="1" stop-color="#ffd6e8" stop-opacity="0" /></linearGradient>
        <linearGradient id="jm-tr" x1="0" y1="1" x2="0" y2="0"><stop v-for="s in stops" :key="s.o" :offset="s.o" :stop-color="s.c" /></linearGradient>
      </defs>
      <path d="M0 168 L0 160 C40 158 70 152 92 138 C112 118 126 74 138 40 L162 40 C174 74 188 118 208 138 C230 152 260 158 300 160 L300 168Z" fill="url(#jm-mt)" />
      <path d="M138 40 L162 40 L171 63 L161 56 L153 66 L146 56 L136 64 L131 58Z" fill="#fffafd" />
      <path :d="TRAIL" class="jm-road" />
      <path ref="trail" :d="TRAIL" class="jm-done" pathLength="1" :style="{ strokeDashoffset: u === null ? 1 : 1 - u }" />
      <g transform="translate(150 26)" class="jm-star"><path d="M0-11 3.2-3.6 11-3.4 4.9 1.6 7 9.2 0 4.9-7 9.2-4.9 1.6-11-3.4-3.2-3.6Z" /></g>
      <g v-if="dot" :transform="`translate(${dot.x} ${dot.y})`"><circle r="9" class="jm-ping" /><circle r="5" class="jm-dot" /></g>
    </svg>
    <span v-if="u !== null" class="jm-now"><i />지금 {{ Math.round(u * SUMMIT).toLocaleString() }}m<template v-if="days !== null && days > 0"> · 정상까지 D-{{ days }}</template><template v-else> · 登頂</template></span>
  </span>
</template>

<style scoped>
.jm { position: relative; display: block; margin: -6px -6px auto; }
.jm-svg { display: block; width: 100%; height: auto; max-height: 190px; overflow: visible; }
.jm-road { fill: none; stroke: #fff; stroke-width: 6; stroke-linecap: round; stroke-dasharray: 0.5 9; opacity: 0.9; }
.jm-done { fill: none; stroke: url(#jm-tr); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 1 1; transition: stroke-dashoffset 1.6s cubic-bezier(0.2, 0.7, 0.2, 1) 0.3s; }
.jm-star path { fill: #ff4f8b; stroke: #fff; stroke-width: 2; stroke-linejoin: round; }
.jm-dot { fill: #c2185b; stroke: #fff; stroke-width: 2.5; }
.jm-ping { fill: none; stroke: #c2185b; stroke-width: 2; opacity: 0; }
.jm-now { position: absolute; left: 6px; top: 6px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 8px; border-radius: 999px; background: #c2185b; color: #fff; font-size: 12px; font-weight: 800; letter-spacing: 0.01em; box-shadow: 0 6px 14px -6px #c2185b; }
.jm-now i { width: 7px; height: 7px; border-radius: 50%; background: #fff; }
@media (prefers-reduced-motion: no-preference) {
  .jm-ping { animation: jmPing 1.8s ease-out infinite; }
  @keyframes jmPing { 0% { opacity: 0.8; transform: scale(0.6); } 100% { opacity: 0; transform: scale(2); } }
}
@media (prefers-reduced-motion: reduce) { .jm-done { transition: none; } }
</style>
