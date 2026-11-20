<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { members } from '../data/members'
import { milestones } from '../data/journey'
import { jaLang } from '../theme/lang'

// Climb log under the 3D story: the same 13 milestones laid out on a real time axis, so the pace shows —
// the fast first steps, the long tour stretch, the sprint to 紅白. Altitude = the 3D story's (index-linear).
// SVG draws the lines (non-scaling strokes); dots/labels are HTML placed in %, so text stays crisp at any width.
const SUMMIT = 3776, N = milestones.length, W = 1000, H = 400, PAD_T = 34, PAD_B = 46
const ymd = (d: string) => Date.parse(d.replace(/\./g, '-') + 'T00:00:00+09:00')
const ts = milestones.map((m) => ymd(m.date))
const t0 = ts[0], t1 = ts[N - 1]
const X = (t: number) => ((t - t0) / (t1 - t0)) * W
const Y = (alt: number) => PAD_T + (1 - alt / SUMMIT) * (H - PAD_T - PAD_B)
const pts = milestones.map((m, i) => ({ m, i, x: X(ts[i]), y: Y((i / (N - 1)) * SUMMIT), alt: Math.round((i / (N - 1)) * SUMMIT), c: members[i % 8].color }))
const line = 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')
const area = `${line}L${W} ${H - PAD_B}L0 ${H - PAD_B}Z`
const years = [2025, 2026].map((y) => ({ y, x: X(Date.parse(`${y}-01-01T00:00:00+09:00`)) }))
const grid = [1000, 2000, 3000].map((a) => ({ a, y: Y(a) }))
const stopsGrad = members.map((m, i) => ({ c: m.color, o: `${(i / 7) * 100}%` }))

const today = ref<{ x: number; y: number; alt: number; days: number; left: number } | null>(null) // client-only
onMounted(() => {
  const now = Math.min(Date.now(), t1)
  let u = 1
  for (let i = 0; i < N - 1; i++) if (now < ts[i + 1]) { u = (i + Math.max(0, (now - ts[i]) / (ts[i + 1] - ts[i]))) / (N - 1); break }
  const alt = Math.round(u * SUMMIT)
  today.value = { x: X(now), y: Y(alt), alt, days: Math.floor((Date.now() - t0) / 864e5), left: Math.max(0, Math.ceil((t1 - Date.now()) / 864e5)) }
})

const gaps = pts.slice(1).map((p, k) => ({ a: pts[k].m.flag, b: p.m.flag, d: Math.round((ts[k + 1] - ts[k]) / 864e5) }))
const fastest = gaps.reduce((a, b) => (b.d < a.d ? b : a))
const longest = gaps.reduce((a, b) => (b.d > a.d ? b : a))
const pace = computed(() => (today.value && today.value.days > 0 ? (today.value.alt / today.value.days).toFixed(1) : null))

const hover = ref<number | null>(null)
function go(i: number) {
  const sec = document.querySelectorAll<HTMLElement>('.jr .step')[i + 1]
  if (!sec) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + sec.offsetHeight / 2 - window.innerHeight / 2, behavior: reduce ? 'auto' : 'smooth' })
}
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`
</script>

<template>
  <section class="jp" aria-labelledby="jp-h">
    <header class="jp-head">
      <p class="jp-eye">CLIMB LOG · 등반 기록</p>
      <h2 id="jp-h"><Ico n="chart" duo size="0.95em" /> 날짜로 펼친 고도표</h2>
      <p class="jp-sub">13개의 이정표를 실제 날짜 위에 놓았어요. 점을 누르면 그 장면으로 올라가요.</p>
    </header>

    <div class="jp-chart" @pointerleave="hover = null">
      <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="jp-svg" aria-hidden="true">
        <defs>
          <linearGradient id="jp-line" x1="0" y1="0" x2="1" y2="0"><stop v-for="s in stopsGrad" :key="s.o" :offset="s.o" :stop-color="s.c" /></linearGradient>
          <linearGradient id="jp-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fb8" stop-opacity="0.32" /><stop offset="1" stop-color="#c9b6f5" stop-opacity="0" /></linearGradient>
          <clipPath id="jp-past"><rect x="0" y="0" :width="today ? today.x : 0" :height="H" /></clipPath>
        </defs>
        <line v-for="g in grid" :key="g.a" x1="0" :x2="W" :y1="g.y" :y2="g.y" class="g" />
        <line v-for="y in years" :key="y.y" :x1="y.x" :x2="y.x" :y1="PAD_T - 14" :y2="H - PAD_B" class="g yr" />
        <line x1="0" :x2="W" :y1="H - PAD_B" :y2="H - PAD_B" class="base" />
        <path :d="area" fill="url(#jp-area)" clip-path="url(#jp-past)" class="area" />
        <path :d="line" class="ln future" />
        <path :d="line" class="ln past" pathLength="1" clip-path="url(#jp-past)" />
        <line v-if="today" :x1="today.x" :x2="today.x" :y1="today.y" :y2="H - PAD_B" class="now-ln" />
      </svg>

      <span v-for="g in grid" :key="'g' + g.a" class="ax-y" :style="{ top: pct(g.y, H) }">{{ g.a.toLocaleString() }}m</span>
      <span v-for="y in years" :key="'y' + y.y" class="ax-x" :style="{ left: pct(y.x, W) }">{{ y.y }}</span>
      <span class="ax-x edge l" style="left: 0">2024.07</span>
      <span class="ax-x edge r" style="left: 100%">12.31</span>

      <button v-for="p in pts" :key="p.m.date" type="button" class="dot" :class="{ fut: today && ts[p.i] > Date.now(), on: hover === p.i, top: p.i === N - 1 }"
        :style="{ left: pct(p.x, W), top: pct(p.y, H), '--c': p.c, '--k': p.i }" :aria-label="`${p.m.date} ${p.m.flag} · ${p.alt.toLocaleString()}m — 3D 장면으로`"
        @pointerenter="hover = p.i" @focus="hover = p.i" @blur="hover = null" @click="go(p.i)">
        <i />
      </button>
      <Transition name="tip">
        <span v-if="hover !== null" :key="hover" class="tip" :class="{ flip: pts[hover].x > W * 0.72, lo: pts[hover].y < H * 0.3 }" :style="{ left: pct(pts[hover].x, W), top: pct(pts[hover].y, H), '--c': pts[hover].c }" aria-hidden="true">
          <small>{{ pts[hover].m.date }} · ▲ {{ pts[hover].alt.toLocaleString() }}m</small>
          <b :lang="jaLang(pts[hover].m.flag)">{{ pts[hover].m.flag }}</b>
        </span>
      </Transition>
      <span v-if="today && today.left > 0" class="now-chip" :class="{ side: today.x > W * 0.7 }" :style="{ left: pct(today.x, W), top: pct(today.y, H) }"><i />오늘 {{ today.alt.toLocaleString() }}m</span>
    </div>

    <ul class="jp-stats">
      <li><Ico n="calendar" duo /><span><small>오른 날</small><b>{{ today ? today.days.toLocaleString() : '—' }}<em>일째</em></b></span></li>
      <li><Ico n="mountain" duo /><span><small>하루 평균</small><b>{{ pace ?? '—' }}<em>m</em></b></span></li>
      <li><Ico n="next" duo /><span><small>가장 빠른 한 걸음</small><b class="sm">{{ fastest.a }} → {{ fastest.b }}<em>{{ fastest.d }}일</em></b></span></li>
      <li><Ico n="clock" duo /><span><small>가장 긴 오르막</small><b class="sm">{{ longest.a }} → {{ longest.b }}<em>{{ longest.d }}일</em></b></span></li>
    </ul>
  </section>
</template>

<style scoped>
.jp { max-width: 1080px; margin: 0 auto; padding: 72px 24px 88px; color: #3a2340; }
.jp-head { text-align: center; margin-bottom: 26px; }
.jp-eye { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; color: #a0507a; }
.jp-head h2 { margin: 6px 0 6px; padding: 0; border: 0; font-size: clamp(24px, 3vw, 30px); display: inline-flex; align-items: center; gap: 8px; letter-spacing: -0.01em; }
.jp-head h2 :deep(svg) { color: #c2185b; }
.jp-sub { margin: 0; font-size: 14px; color: #6b4a5e; text-wrap: balance; }

.jp-chart { position: relative; height: 340px; margin: 0 8px 0 52px; }
.jp-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.g { stroke: #ead6e3; stroke-width: 1; stroke-dasharray: 3 5; vector-effect: non-scaling-stroke; }
.g.yr { stroke: #dcc3d6; stroke-dasharray: none; }
.base { stroke: #d9bfd0; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.ln { fill: none; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ln.future { stroke: #b99ad8; stroke-width: 2; stroke-dasharray: 2 7; }
.ln.past { stroke: url(#jp-line); stroke-width: 4; }
.now-ln { stroke: #c2185b; stroke-width: 1.5; stroke-dasharray: 2 4; vector-effect: non-scaling-stroke; }
.ax-y { position: absolute; right: calc(100% + 10px); transform: translateY(-50%); font-size: 11px; font-weight: 700; color: #9b7f92; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ax-x { position: absolute; bottom: 14px; transform: translateX(-50%); font-size: 12px; font-weight: 800; color: #8a6a80; letter-spacing: 0.04em; }
.ax-x.edge { font-weight: 600; color: #a891a0; font-size: 11px; }
.ax-x.l { transform: none; }
.ax-x.r { transform: translateX(-100%); }

.dot { all: unset; position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; display: grid; place-items: center; cursor: pointer; border-radius: 50%; z-index: 2; -webkit-tap-highlight-color: transparent; }
.dot i { width: 13px; height: 13px; border-radius: 50%; background: var(--c); border: 2.5px solid #fff; box-shadow: 0 2px 8px -2px color-mix(in oklab, var(--c) 70%, #000); transition: scale 0.35s cubic-bezier(0.3, 1.6, 0.5, 1); }
.dot.fut i { background: #fff; border-color: var(--c); box-shadow: none; }
.dot.top i { width: 17px; height: 17px; }
.dot:hover i, .dot.on i { scale: 1.45; }
.dot:focus-visible { outline: 2.5px solid #c2185b; outline-offset: -2px; }
.tip { position: absolute; z-index: 3; pointer-events: none; display: flex; flex-direction: column; gap: 1px; padding: 7px 12px 8px; margin: -66px 0 0 -14px; background: #fff; border-radius: 12px 12px 12px 3px; border: 1.5px solid var(--c); box-shadow: 0 10px 22px -12px rgba(90, 30, 70, 0.5); white-space: nowrap; }
.tip.flip { transform: translateX(calc(-100% + 28px)); border-radius: 12px 12px 3px 12px; }
.tip.lo { margin-top: 18px; border-radius: 3px 12px 12px 12px; }
.tip.lo.flip { border-radius: 12px 3px 12px 12px; }
.tip small { font-size: 11px; font-weight: 700; color: #8a6a80; font-variant-numeric: tabular-nums; }
.tip b { font-size: 14px; font-weight: 900; color: #3a2340; }
.tip-enter-active { transition: opacity 0.18s, translate 0.3s cubic-bezier(0.3, 1.5, 0.5, 1); }
.tip-enter-from { opacity: 0; translate: 0 6px; }
.now-chip { position: absolute; z-index: 1; transform: translate(-50%, 16px); display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px 3px 7px; border-radius: 999px; background: #c2185b; color: #fff; font-size: 11.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 6px 14px -6px #c2185b; }
.now-chip.side { transform: translate(calc(-100% - 12px), -50%); }
.now-chip i { width: 6px; height: 6px; border-radius: 50%; background: #fff; }

.jp-stats { list-style: none; margin: 30px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.jp-stats li { margin: 0; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; background: rgba(255, 255, 255, 0.78); border: 1.5px solid #f3dbe8; box-shadow: 0 12px 26px -22px rgba(90, 30, 70, 0.5); }
.jp-stats li > :deep(svg) { flex: none; width: 26px; height: 26px; color: #c2185b; }
.jp-stats span { display: flex; flex-direction: column; min-width: 0; }
.jp-stats small { font-size: 11.5px; font-weight: 700; color: #8a6a80; }
.jp-stats b { font-size: 22px; font-weight: 900; line-height: 1.2; font-variant-numeric: tabular-nums; }
.jp-stats b.sm { font-size: 14.5px; line-height: 1.35; }
.jp-stats em { font-style: normal; font-size: 12px; font-weight: 700; color: #c2185b; margin-left: 4px; }

@media (max-width: 760px) {
  .jp { padding: 52px 16px 64px; }
  .jp-chart { height: 250px; margin-left: 44px; margin-right: 4px; }
  .ax-y { font-size: 10px; right: calc(100% + 6px); }
  .ax-x.edge { display: none; }
  .dot { width: 26px; height: 26px; margin: -13px 0 0 -13px; }
  .dot i { width: 11px; height: 11px; border-width: 2px; }
  .jp-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
  .jp-stats li { padding: 12px; gap: 10px; }
  .jp-stats b { font-size: 19px; }
  .jp-stats b.sm { font-size: 13px; }
}

/* the line draws itself and the dots pop in as the chart scrolls into view */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .ln.past { stroke-dasharray: 1 1; animation: jpDraw linear both; animation-timeline: view(); animation-range: entry 20% cover 45%; }
    @keyframes jpDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
    .dot i { animation: jpPop linear both; animation-timeline: view(); animation-range: entry calc(18% + var(--k) * 2%) cover calc(30% + var(--k) * 2%); }
    @keyframes jpPop { from { transform: scale(0); } 70% { transform: scale(1.25); } to { transform: scale(1); } }
  }
}
@media (prefers-reduced-motion: reduce) { .dot i { transition: none; } }
</style>
