<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo'
import { CHAPTERS, COUNTRY, HOME, type Chapter } from '../data/world'

// 큐스트 월드맵 — an orthographic globe that "fills in" as the group travels:
// camera slerps between stops (d3.geoInterpolate), great-circle arcs draw themselves,
// pins land with a ripple and countries take on a member colour. Drag to spin.
const SIZE = 600, R = 272
const countries = shallowRef<any[]>([])
const rot = ref<[number, number]>([-128, -28])
const zoom = ref(1) // camera zoom (globe is clipped to a lens of radius R)
const step = ref(CHAPTERS.length - 1) // last chapter revealed
const arcT = ref(1) // progress of the arc into `step`
const fresh = ref(-1) // chapter whose pins just landed (ripple)
const playing = ref(false)
const ready = ref(false)
let reduce = false, raf = 0, dragging = false, lastX = 0, lastY = 0, timer: ReturnType<typeof setTimeout> | undefined, seen = false
const root = ref<HTMLElement | null>(null)
let io: IntersectionObserver | undefined
let onScreen = true, parked = false // idle spin pauses while the globe is scrolled out of view

const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const done = (c: Chapter) => c.iso <= today

const proj = computed(() => geoOrthographic().scale(R * zoom.value).translate([SIZE / 2, SIZE / 2]).rotate([rot.value[0], rot.value[1], 0]).clipAngle(90))
const path = computed(() => geoPath(proj.value))
const center = computed<[number, number]>(() => [-rot.value[0], -rot.value[1]])
const graticule = geoGraticule10()

const shown = computed(() => CHAPTERS.slice(0, step.value + 1))
const fillOf = computed(() => {
  const m: Record<string, string> = {}
  for (const c of shown.value) {
    const k = COUNTRY[c.country]
    if (done(c)) m[k.id] = k.color
    else if (!m[k.id]) m[k.id] = 'url(#upcoming)'
  }
  return m
})
const anchor = (c: Chapter) => c.pins[0].ll
const arcs = computed(() => {
  const out: { d: string; upcoming: boolean; k: number }[] = []
  for (let i = 1; i <= step.value; i++) {
    const a = anchor(CHAPTERS[i - 1]), b = anchor(CHAPTERS[i])
    if (geoDistance(a, b) < 0.02) continue
    const t = i === step.value ? arcT.value : 1
    const interp = geoInterpolate(a, b)
    const pts = Array.from({ length: 48 }, (_, j) => interp((j / 47) * t))
    const d = path.value({ type: 'LineString', coordinates: pts } as any)
    if (d) out.push({ d, upcoming: !done(CHAPTERS[i]), k: i })
  }
  return out
})
const pins = computed(() => {
  const out: { x: number; y: number; name: string; color: string; upcoming: boolean; fresh: boolean; key: string }[] = []
  shown.value.forEach((c, ci) => {
    if (ci === step.value && arcT.value < 1) return
    for (const p of c.pins) {
      if (geoDistance(p.ll, center.value) > Math.PI / 2 - 0.02) continue
      const xy = proj.value(p.ll)
      if (!xy || Math.hypot(xy[0] - SIZE / 2, xy[1] - SIZE / 2) > R - 4) continue
      out.push({ x: xy[0], y: xy[1], name: `${p.name} · ${c.date}`, color: COUNTRY[c.country].color, upcoming: !done(c), fresh: ci === fresh.value, key: c.iso + p.name })
    }
  })
  return out
})
const visitedCountries = computed(() => new Set(shown.value.filter(done).map((c) => c.country)).size)
const visitedCities = computed(() => new Set(shown.value.filter(done).flatMap((c) => c.pins.map((p) => p.name.replace(/ \(.*\)/, ''))) ).size)
const upcomingCount = computed(() => CHAPTERS.filter((c) => !done(c)).length)
const cur = computed(() => CHAPTERS[Math.max(0, step.value)])

// ── camera ─────────────────────────────────────────────
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
function flyTo(ll: [number, number], ms: number, onT?: (t: number) => void, z = 1) {
  return new Promise<void>((res) => {
    cancelAnimationFrame(raf)
    const from = center.value, to: [number, number] = [ll[0], Math.max(-50, Math.min(50, ll[1] - 2 / z))]
    if (reduce || ms === 0) { rot.value = [-to[0], -to[1]]; zoom.value = z; onT?.(1); res(); return }
    const interp = geoInterpolate(from, to), t0 = performance.now(), z0 = zoom.value
    const far = Math.min(1, geoDistance(from, to) / 0.9) // long hops pull the camera back mid-flight
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms), e = ease(t), p = interp(e)
      rot.value = [-p[0], -p[1]]; onT?.(e)
      zoom.value = (z0 + (z - z0) * e) * (1 - 0.55 * far * Math.sin(Math.PI * e))
      if (t < 1) raf = requestAnimationFrame(tick); else { idle(); res() }
    }
    raf = requestAnimationFrame(tick)
  })
}
function idle() {
  if (reduce) return
  cancelAnimationFrame(raf)
  parked = false
  const spin = () => {
    if (!onScreen) { parked = true; return } // the observer restarts it when the globe comes back
    if (!dragging && !playing.value) rot.value = [rot.value[0] + 0.06 / zoom.value, rot.value[1]]
    raf = requestAnimationFrame(spin)
  }
  raf = requestAnimationFrame(spin)
}
const wait = (ms: number) => new Promise<void>((r) => { timer = setTimeout(r, reduce ? 0 : ms) })

async function goTo(i: number, animate = true) {
  step.value = i; arcT.value = animate && i > 0 ? 0 : 1; fresh.value = -1
  const c = CHAPTERS[i], z = c.country === 'US' ? 1.25 : c.pins.length > 3 ? 2.6 : 3.2 // East Asia stops zoom in like a lens
  await flyTo(anchor(c), animate ? 1700 : 0, (t) => { if (animate && i > 0) arcT.value = t }, z)
  arcT.value = 1; fresh.value = i
}
async function play() {
  if (playing.value) { playing.value = false; return }
  playing.value = true
  const start = step.value >= CHAPTERS.length - 1 ? 0 : step.value + 1
  if (start === 0) { step.value = -1; await flyTo(HOME, 900, undefined, 1.4) }
  for (let i = start; i < CHAPTERS.length && playing.value; i++) {
    await goTo(i)
    await wait(1300)
  }
  playing.value = false
  idle()
}
function jump(i: number) { playing.value = false; goTo(i) }

// ── drag to spin ───────────────────────────────────────
function down(e: PointerEvent) { dragging = true; playing.value = false; lastX = e.clientX; lastY = e.clientY; (e.target as Element).setPointerCapture?.(e.pointerId) }
function move(e: PointerEvent) {
  if (!dragging) return
  const k = 0.32 / zoom.value
  rot.value = [rot.value[0] + (e.clientX - lastX) * k, Math.max(-60, Math.min(60, rot.value[1] - (e.clientY - lastY) * k))]
  lastX = e.clientX; lastY = e.clientY
}
function up() { dragging = false }

onMounted(async () => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [{ feature }, topo] = await Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')])
  const t: any = (topo as any).default ?? topo
  countries.value = (feature(t, t.objects.countries) as any).features
  ready.value = true
  idle()
  io = new IntersectionObserver((es) => {
    const e = es[0]
    onScreen = e.isIntersecting
    if (onScreen && parked) idle()
    if (e.intersectionRatio >= 0.45 && !seen && !reduce) { seen = true; play() }
  }, { threshold: [0, 0.45] })
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); clearTimeout(timer); io?.disconnect(); playing.value = false })
</script>

<template>
  <section ref="root" class="wm" aria-labelledby="wm-h">
    <div class="globe-wrap">
      <div class="glow" aria-hidden="true" />
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="globe" role="img" :aria-label="`큐티스트리트 활동 지도: ${visitedCountries}개 나라, ${visitedCities}개 도시`"
        @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
        <defs>
          <radialGradient id="ocean" cx="38%" cy="32%" r="75%"><stop offset="0%" stop-color="#fff" /><stop offset="55%" stop-color="#fbeef6" /><stop offset="100%" stop-color="#ecd9f3" /></radialGradient>
          <pattern id="upcoming" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#efe4fb" /><line x1="0" y1="0" x2="0" y2="8" stroke="#a06cd5" stroke-width="3" /></pattern>
          <clipPath id="lens"><circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" /></clipPath>
          <radialGradient id="shade" cx="35%" cy="30%" r="80%"><stop offset="60%" stop-color="#2a1030" stop-opacity="0" /><stop offset="100%" stop-color="#2a1030" stop-opacity="0.18" /></radialGradient>
        </defs>
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" fill="url(#ocean)" />
        <g clip-path="url(#lens)">
          <path :d="path({ type: 'Sphere' } as any) || ''" fill="url(#ocean)" />
          <path :d="path(graticule) || ''" class="grat" />
          <template v-if="ready">
            <path v-for="(c, i) in countries" :key="i" :d="path(c) || ''" class="land" :class="{ hit: fillOf[c.id] }" :style="fillOf[c.id] ? { fill: fillOf[c.id] } : undefined" />
          </template>
          <path v-for="a in arcs" :key="a.k" :d="a.d" class="arc" :class="{ up: a.upcoming }" />
        </g>
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" fill="url(#shade)" class="nohit" />
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" class="rim" />
        <g v-for="p in pins" :key="p.key" :transform="`translate(${p.x},${p.y})`" class="pin" :class="{ up: p.upcoming, fresh: p.fresh }">
          <title>{{ p.name }}{{ p.upcoming ? ' (예정)' : '' }}</title>
          <circle v-if="p.fresh" r="6" class="ping" :style="{ stroke: p.color }" />
          <circle r="5.5" :fill="p.upcoming ? '#fff' : p.color" :stroke="p.upcoming ? p.color : '#fff'" stroke-width="2.2" />
        </g>
      </svg>
      <p class="drag-hint" aria-hidden="true">🖐 드래그해서 돌려 보세요</p>
    </div>

    <div class="panel">
      <p class="eyebrow">귀여움으로 세계까지 · WORLD MAP</p>
      <h1 id="wm-h">큐스트 월드맵 🌏</h1>
      <div class="stats">
        <div><b>{{ visitedCountries }}</b><span>나라</span></div>
        <div><b>{{ visitedCities }}</b><span>도시</span></div>
        <div class="up"><b>{{ upcomingCount }}</b><span>예정</span></div>
      </div>
      <Transition name="swap" mode="out-in">
        <article :key="cur.iso + cur.title" class="now" :style="{ '--cc': COUNTRY[cur.country].color }">
          <p class="now-top"><span class="flag" aria-hidden="true">{{ COUNTRY[cur.country].flag }}</span>{{ cur.date }} · {{ COUNTRY[cur.country].ko }}<em v-if="!done(cur)">예정</em></p>
          <h2>{{ cur.title }}</h2>
          <p class="now-sub">{{ cur.sub }}</p>
          <p class="now-links">
            <a v-if="cur.video" :href="`https://www.youtube.com/watch?v=${cur.video}`" target="_blank" rel="noopener">▶ 영상</a>
            <a v-if="cur.link" :href="withBase(cur.link)">자세히 →</a>
          </p>
        </article>
      </Transition>
      <div class="ctrl">
        <button type="button" class="play" :aria-pressed="playing" @click="play">{{ playing ? '❚❚ 멈춤' : step >= CHAPTERS.length - 1 ? '▶ 처음부터 재생' : '▶ 이어서 재생' }}</button>
      </div>
      <ol class="steps" aria-label="여정 단계">
        <li v-for="(c, i) in CHAPTERS" :key="c.iso + c.title">
          <button type="button" :class="{ on: i === step, past: i < step, up: !done(c) }" :style="{ '--cc': COUNTRY[c.country].color }" :aria-current="i === step ? 'step' : undefined" @click="jump(i)">
            <span class="dot" aria-hidden="true" /><span class="sd">{{ c.date }}</span><span class="st">{{ COUNTRY[c.country].flag }} {{ c.title }}</span>
          </button>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.wm { --ink: #2f1a35; --spring: cubic-bezier(.34, 1.56, .64, 1); display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 28px; align-items: start; color: var(--ink); padding: 18px 0 30px; }
.globe-wrap { position: sticky; top: calc(var(--vp-nav-height, 64px) + 16px); }
.glow { position: absolute; inset: 6%; border-radius: 50%; background: radial-gradient(circle, rgba(255, 140, 190, 0.45), rgba(160, 108, 213, 0.25) 55%, transparent 72%); filter: blur(30px); }
.globe { position: relative; width: 100%; height: auto; touch-action: none; cursor: grab; filter: drop-shadow(0 30px 40px rgba(90, 30, 70, 0.25)); }
.globe:active { cursor: grabbing; }
.grat { fill: none; stroke: #e6cfe0; stroke-width: 0.6; vector-effect: non-scaling-stroke; }
.rim { fill: none; stroke: #fff; stroke-width: 3; opacity: 0.8; pointer-events: none; }
.land { fill: #f1e2ec; stroke: #fff; stroke-width: 0.5; transition: fill 0.9s ease; }
.land.hit { stroke: #fff; stroke-width: 1.2; filter: drop-shadow(0 0 6px rgba(255, 107, 157, 0.45)); }
.nohit { pointer-events: none; }
.arc { fill: none; stroke: #c92f69; stroke-width: 2.4; stroke-linecap: round; filter: drop-shadow(0 0 3px rgba(255, 107, 157, 0.7)); }
.arc.up { stroke: #a06cd5; stroke-dasharray: 2 6; }
.pin circle { transition: r 0.3s; }
.pin.fresh > circle:last-of-type { animation: land 0.7s var(--spring); }
@keyframes land { 0% { r: 0; } 60% { r: 9; } 100% { r: 5.5; } }
.ping { fill: none; stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: ping 1.4s ease-out 2; }
@keyframes ping { from { transform: scale(1); opacity: 0.9; } to { transform: scale(5); opacity: 0; } }
.drag-hint { margin: 4px 0 0 !important; text-align: center; font-size: 12px; color: #735779; }
/* panel */
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #c92f69; }
.panel h1 { margin: 4px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(30px, 4vw, 46px) !important; line-height: 1.15; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
.stats div { padding: 12px 14px; border-radius: 18px; background: #fff; border: 1.5px solid #f3d6e4; display: flex; align-items: baseline; gap: 6px; }
.stats b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 30px; color: #c92f69; font-variant-numeric: tabular-nums; }
.stats .up b { color: #7d4fb0; }
.stats span { font-size: 13px; font-weight: 700; color: #5a4060; }
.now { margin-top: 14px; padding: 18px 20px; border-radius: 24px; color: #fff; background: linear-gradient(135deg, color-mix(in srgb, var(--cc) min(62%, var(--ink-mix, 100%)), #2a1030), #2a1030); box-shadow: 0 20px 40px -28px rgba(42, 16, 48, 0.8); }
.now-top { margin: 0 !important; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #ffe4f0; }
.now-top em { font-style: normal; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.2); }
.flag { font-size: 20px; }
.now h2 { margin: 6px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px !important; line-height: 1.3; color: #fff; }
.now-sub { margin: 4px 0 0 !important; font-size: 14px; color: #f4e6f8; }
.now-links { display: flex; gap: 14px; margin: 10px 0 0 !important; font-size: 13px; font-weight: 800; }
.now-links a { color: #fff !important; }
.swap-enter-active, .swap-leave-active { transition: opacity 0.25s, transform 0.4s var(--spring); }
.swap-enter-from { opacity: 0; transform: translateY(10px) scale(0.98); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); }
.ctrl { margin-top: 12px; }
.play { padding: 11px 20px; border-radius: 999px; font-size: 14px; font-weight: 800; color: #fff; background: #c92f69; transition: transform 0.4s var(--spring); }
.play:hover { transform: translateY(-2px); }
.play[aria-pressed='true'] { background: #2f1a35; }
.steps { list-style: none; margin: 16px 0 0 !important; padding: 0 !important; display: grid; gap: 4px; }
.steps li { margin: 0 !important; }
.steps button { width: 100%; display: grid; grid-template-columns: 14px 92px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 12px; border-radius: 14px; text-align: left; color: #5a4060; background: none; transition: background 0.2s; }
.steps button:hover { background: #fdf0f6; }
.steps .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--cc); background: #fff; transition: background 0.3s; }
.steps .past .dot, .steps .on .dot { background: var(--cc); }
.steps .up .dot { border-style: dashed; }
.steps .sd { font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
.steps .st { font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.steps .on { background: #fde8f1; color: var(--ink); }
@media (max-width: 900px) {
  .wm { grid-template-columns: 1fr; }
  .globe-wrap { position: relative; top: 0; max-width: 520px; margin: 0 auto; width: 100%; }
}
@media (prefers-reduced-motion: reduce) { .land, .pin circle { transition: none; } .ping, .pin.fresh > circle:last-of-type { animation: none; } .swap-enter-active, .swap-leave-active { transition: none; } }
</style>
