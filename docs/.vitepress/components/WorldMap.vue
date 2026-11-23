<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Ico from './Ico.vue'
import { withBase } from 'vitepress'
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance, geoCircle } from 'd3-geo'
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

// ── day / night: the real terminator for "now", refreshed every minute (client-only) ──
const nowMs = ref(0)
const sun = computed<[number, number] | null>(() => {
  if (!nowMs.value) return null
  const d = new Date(nowMs.value)
  const doy = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (doy + 10))
  const h = d.getUTCHours() + d.getUTCMinutes() / 60
  const lon = ((((12 - h) * 15 + 540) % 360) - 180)
  return [lon, decl]
})
const antiSun = computed<[number, number] | null>(() => sun.value && [sun.value[0] > 0 ? sun.value[0] - 180 : sun.value[0] + 180, -sun.value[1]])
// the night hemisphere around the anti-solar point (89.5°: an exact 90° cap is ambiguous for d3's clipper and filled the whole lens); an SVG blur gives the twilight edge
const night = computed(() => {
  if (!antiSun.value) return []
  return [path.value(geoCircle().center(antiSun.value!).radius(89.5)() as any) || ''].filter(Boolean)
})
const isNight = (ll: [number, number]) => !!antiSun.value && geoDistance(ll, antiSun.value) < Math.PI / 2
const kst = computed(() => {
  if (!nowMs.value) return null
  const d = new Date(nowMs.value + 9 * 3600e3)
  const hh = d.getUTCHours(), mm = String(d.getUTCMinutes()).padStart(2, '0')
  // within ~6° of the terminator = civil twilight → 새벽 / 저녁 instead of a flat day/night
  const dz = antiSun.value ? (geoDistance([139.69, 35.69], antiSun.value) * 180) / Math.PI - 90 : 90
  const word = Math.abs(dz) < 6 ? (hh < 12 ? '새벽' : '저녁') : dz < 0 ? '밤' : '낮'
  return { time: `${hh}:${mm}`, night: dz < 0, word }
})
let clock: ReturnType<typeof setInterval> | undefined

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
  const out: { x: number; y: number; name: string; color: string; upcoming: boolean; fresh: boolean; night: boolean; key: string; ci: number; on: boolean }[] = []
  shown.value.forEach((c, ci) => {
    if (ci === step.value && arcT.value < 1) return
    for (const p of c.pins) {
      if (geoDistance(p.ll, center.value) > Math.PI / 2 - 0.02) continue
      const xy = proj.value(p.ll)
      if (!xy || Math.hypot(xy[0] - SIZE / 2, xy[1] - SIZE / 2) > R - 4) continue
      out.push({ x: xy[0], y: xy[1], name: `${p.name} · ${c.date}`, color: COUNTRY[c.country].color, upcoming: !done(c), fresh: ci === fresh.value, night: !done(c) ? false : isNight(p.ll), key: c.iso + p.name, ci, on: ci === step.value })
    }
  })
  return out
})
const visitedCountries = computed(() => new Set(shown.value.filter(done).map((c) => c.country)).size)
const visitedCities = computed(() => new Set(shown.value.filter(done).flatMap((c) => c.pins.map((p) => p.name.replace(/ \(.*\)/, ''))) ).size)
const upcomingCount = computed(() => CHAPTERS.filter((c) => !done(c)).length)

// odometer: great-circle km along the drawn route, rolling live with the plane (arcT)
const EARTH_KM = 6371, LAP_KM = 40075
const legKm = CHAPTERS.map((c, i) => (i ? geoDistance(anchor(CHAPTERS[i - 1]), anchor(c)) * EARTH_KM : 0))
const odo = computed(() => {
  let flown = 0, planned = 0
  for (let i = 1; i <= step.value; i++) {
    const km = legKm[i] * (i === step.value ? arcT.value : 1)
    if (done(CHAPTERS[i])) flown += km; else planned += km
  }
  return { flown: Math.round(flown), planned: Math.round(planned), laps: flown / LAP_KM }
})
const fmtKm = (n: number) => n.toLocaleString('ko-KR')

// the plane at the head of the arc that is being drawn, nose along the route
const plane = computed(() => {
  if (step.value < 1 || arcT.value >= 1) return null
  const a = anchor(CHAPTERS[step.value - 1]), b = anchor(CHAPTERS[step.value])
  if (geoDistance(a, b) < 0.02) return null
  const interp = geoInterpolate(a, b), t = arcT.value
  const p = interp(t)
  if (geoDistance(p, center.value) > Math.PI / 2 - 0.05) return null
  const xy = proj.value(p), back = proj.value(interp(Math.max(0, t - 0.03)))
  if (!xy || !back) return null
  const ang = (Math.atan2(xy[1] - back[1], xy[0] - back[0]) * 180) / Math.PI
  return { x: xy[0], y: xy[1], ang, up: !done(CHAPTERS[step.value]) }
})
// a speech-bubble label on the stop we just landed at (multi-city tours: first city + count)
const label = computed(() => {
  if (!ready.value || step.value < 0 || arcT.value < 1) return null // client-only: keeps SSR markup identical at hydration
  const c = CHAPTERS[step.value], p0 = c.pins[0]
  if (geoDistance(p0.ll, center.value) > Math.PI / 2 - 0.05) return null
  const xy = proj.value(p0.ll)
  if (!xy) return null
  const text = c.pins.length > 1 ? `${p0.name} 외 ${c.pins.length - 1}곳` : p0.name
  const w = 18 + [...text].reduce((n, ch) => n + (/[\x00-\x7f]/.test(ch) ? 7.2 : 12.6), 0)
  return { x: xy[0], y: xy[1], text, w, color: COUNTRY[c.country].color, below: xy[1] < 90 }
})
// arrival: the country flashes in its colour once
const flash = computed(() => {
  if (fresh.value < 0 || !countries.value.length) return null
  const c = CHAPTERS[fresh.value]
  const f = countries.value.find((x) => x.id === COUNTRY[c.country].id)
  const d = f && path.value(f)
  return d ? { d, color: COUNTRY[c.country].color, k: fresh.value } : null
})

// stat numbers roll to their new value
const shownStats = ref({ countries: visitedCountries.value, cities: visitedCities.value })
const bump = ref(0)
let statRaf = 0
watch([visitedCountries, visitedCities], ([c2, m2], [c1, m1]) => {
  if (c2 === c1 && m2 === m1) return
  bump.value++
  cancelAnimationFrame(statRaf)
  if (reduce) { shownStats.value = { countries: c2, cities: m2 }; return }
  const t0 = performance.now(), from = { ...shownStats.value }
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - k, 3)
    shownStats.value = { countries: Math.round(from.countries + (c2 - from.countries) * e), cities: Math.round(from.cities + (m2 - from.cities) * e) }
    if (k < 1) statRaf = requestAnimationFrame(tick)
  }
  statRaf = requestAnimationFrame(tick)
})
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
// the passport stamps below the globe (WorldStamps) ask for a stop by index
const onStamp = (e: Event) => { const i = (e as CustomEvent<number>).detail; if (Number.isInteger(i) && CHAPTERS[i]) { seen = true; jump(i) } }

// mobile: the step list is a horizontal chip rail — keep the current chip centred
const stepsEl = ref<HTMLElement | null>(null)
watch(step, async (i) => {
  await nextTick()
  const el = stepsEl.value
  if (!el || el.scrollWidth <= el.clientWidth + 1 || i < 0) return
  const b = el.children[i] as HTMLElement | undefined
  if (b) el.scrollTo({ left: b.offsetLeft - (el.clientWidth - b.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' })
})

// ── drag to spin ───────────────────────────────────────
let downX = 0, downY = 0
// a pin click jumps to that chapter — but not at the end of a drag
function pinClick(ci: number) { if (Math.hypot(lastX - downX, lastY - downY) < 6 && ci !== step.value) jump(ci) }
function down(e: PointerEvent) { downX = e.clientX; downY = e.clientY; dragging = true; playing.value = false; lastX = e.clientX; lastY = e.clientY; (e.target as Element).setPointerCapture?.(e.pointerId) }
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
  nowMs.value = Date.now()
  clock = setInterval(() => { nowMs.value = Date.now() }, 60e3)
  idle()
  io = new IntersectionObserver((es) => {
    const e = es[0]
    onScreen = e.isIntersecting
    if (onScreen && parked) idle()
    if (e.intersectionRatio >= 0.45 && !seen && !reduce) { seen = true; play() }
  }, { threshold: [0, 0.45] })
  if (root.value) io.observe(root.value)
  window.addEventListener('wm:jump', onStamp)
})
onBeforeUnmount(() => { window.removeEventListener('wm:jump', onStamp); clearInterval(clock); cancelAnimationFrame(raf); cancelAnimationFrame(statRaf); clearTimeout(timer); io?.disconnect(); playing.value = false })
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
          <radialGradient id="atmo" cx="50%" cy="50%" r="50%"><stop :offset="R / (R + 26)" stop-color="#ff9cc4" stop-opacity="0.55" /><stop :offset="(R + 8) / (R + 26)" stop-color="#d9b8ff" stop-opacity="0.28" /><stop offset="1" stop-color="#d9b8ff" stop-opacity="0" /></radialGradient>
          <radialGradient id="spec" cx="34%" cy="26%" r="42%"><stop offset="0" stop-color="#fff" stop-opacity="0.75" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
          <filter id="dusk" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="14" /></filter>
          <radialGradient id="drop"><stop :offset="(R - 36) / (R + 24)" stop-color="#5a1e46" stop-opacity="0.26" /><stop offset="1" stop-color="#5a1e46" stop-opacity="0" /></radialGradient>
          <radialGradient id="planeGlow"><stop offset="0" stop-color="#fff" stop-opacity="1" /><stop offset="0.4" stop-color="#ff8fb8" stop-opacity="0.6" /><stop offset="1" stop-color="#ff8fb8" stop-opacity="0" /></radialGradient>
          <radialGradient id="shade" cx="35%" cy="30%" r="80%"><stop offset="60%" stop-color="#2a1030" stop-opacity="0" /><stop offset="100%" stop-color="#2a1030" stop-opacity="0.18" /></radialGradient>
        </defs>
        <ellipse :cx="SIZE / 2" :cy="SIZE / 2 + 20" :rx="R + 24" :ry="R + 4" fill="url(#drop)" class="nohit" /><!-- stays inside the 600 viewBox (no clipped edge) -->
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R + 26" fill="url(#atmo)" class="nohit atmo" />
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" fill="url(#ocean)" />
        <g clip-path="url(#lens)">
          <path :d="path({ type: 'Sphere' } as any) || ''" fill="url(#ocean)" />
          <path :d="path(graticule) || ''" class="grat" />
          <template v-if="ready">
            <path v-for="(c, i) in countries" :key="i" :d="path(c) || ''" class="land" :class="{ hit: fillOf[c.id] }" :style="fillOf[c.id] ? { fill: fillOf[c.id] } : undefined" />
          </template>
          <path v-if="flash" :key="'fl' + flash.k" :d="flash.d" class="flash" :style="{ fill: flash.color }" />
          <g class="night nohit" filter="url(#dusk)" aria-hidden="true"><path v-for="(d, i) in night" :key="i" :d="d" /></g>
          <path v-for="a in arcs" :key="a.k" :d="a.d" class="arc" :class="{ up: a.upcoming }" />
        </g>
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" fill="url(#spec)" class="nohit" />
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" fill="url(#shade)" class="nohit" />
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="R" class="rim" />
        <g v-for="p in pins" :key="p.key" :transform="`translate(${p.x},${p.y})`" class="pin" :class="{ up: p.upcoming, fresh: p.fresh, lit: p.night, on: p.on }" @click="pinClick(p.ci)">
          <title>{{ p.name }}{{ p.upcoming ? ' (예정)' : '' }}</title>
          <circle v-if="p.night" r="11" class="city-light" />
          <circle v-if="p.fresh" r="6" class="ping" :style="{ stroke: p.color }" />
          <circle r="14" class="pin-hit" />
          <circle r="5.5" class="pin-dot" :fill="p.upcoming ? '#fff' : p.color" :stroke="p.upcoming ? p.color : '#fff'" stroke-width="2.2" />
        </g>
        <g v-if="plane" class="plane" :class="{ up: plane.up }" :transform="`translate(${plane.x},${plane.y})`" aria-hidden="true">
          <circle r="26" fill="url(#planeGlow)" />
          <circle r="15" class="plane-disc" />
          <g :transform="`rotate(${plane.ang + 90}) translate(-10,-10)`"><Ico n="plane" duo size="20" /></g>
        </g>
        <g v-if="label" class="lbl" :transform="`translate(${label.x},${label.y})`" aria-hidden="true">
          <g :transform="label.below ? 'translate(0,16)' : 'translate(0,-46)'">
            <!-- inner group carries the CSS pop-in; the outer ones keep their SVG transform attributes -->
            <Transition name="lbl" appear>
              <g :key="label.text" class="lbl-in" :class="{ below: label.below }">
                <rect :x="-label.w / 2" y="0" :width="label.w" height="28" rx="14" :style="{ stroke: label.color }" />
                <path v-if="!label.below" d="M-6 27.5 0 35 6 27.5Z" :style="{ fill: '#fff', stroke: label.color }" class="tail" />
                <text x="0" y="18.5" text-anchor="middle">{{ label.text }}</text>
              </g>
            </Transition>
          </g>
        </g>
      </svg>
      <p class="drag-hint" aria-hidden="true"><Ico n="drag" size="15" /> 드래그해서 돌려 보세요<span v-if="kst" class="clock" :class="{ nite: kst.night }"><Ico :n="kst.night ? 'moon' : 'sun'" duo size="14" />지금 도쿄 {{ kst.time }} · {{ kst.word }}</span></p>
    </div>

    <div class="panel">
      <p class="eyebrow">귀여움으로 세계까지 · WORLD MAP</p>
      <h1 id="wm-h">큐스트 월드맵 <Ico class="h-ico" n="globe" duo size="0.9em" /></h1>
      <div class="stats">
        <div><b :key="'c' + bump" :class="{ pop: bump }">{{ shownStats.countries }}</b><span>나라</span></div>
        <div><b :key="'m' + bump" :class="{ pop: bump }">{{ shownStats.cities }}</b><span>도시</span></div>
        <div class="up"><b>{{ upcomingCount }}</b><span>예정</span></div>
      </div>
      <p class="odo" :aria-label="`지금까지 날아온 거리 약 ${fmtKm(odo.flown)}킬로미터`">
        <span class="odo-k"><Ico n="plane" duo size="16" />날아온 거리</span>
        <b>{{ fmtKm(odo.flown) }}</b><small>km</small>
        <em v-if="odo.laps >= 0.05">지구 {{ odo.laps.toFixed(2) }}바퀴</em>
        <i v-if="odo.planned" class="odo-up">+ 예정 {{ fmtKm(odo.planned) }}km</i>
        <span class="odo-bar" aria-hidden="true"><span :style="{ transform: `scaleX(${Math.min(1, odo.laps)})` }" /></span>
      </p>
      <Transition name="swap" mode="out-in">
        <article :key="cur.iso + cur.title" class="now" :style="{ '--cc': COUNTRY[cur.country].color }">
          <p class="now-top"><span class="flag" aria-hidden="true">{{ cur.country }}</span>{{ cur.date }} · {{ COUNTRY[cur.country].ko }}<em v-if="!done(cur)">예정</em></p>
          <h2 :lang="jaLang(cur.title)">{{ cur.title }}</h2>
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
      <ol ref="stepsEl" class="steps" aria-label="여정 단계">
        <li v-for="(c, i) in CHAPTERS" :key="c.iso + c.title">
          <button type="button" :class="{ on: i === step, past: i < step, up: !done(c) }" :style="{ '--cc': COUNTRY[c.country].color }" :aria-current="i === step ? 'step' : undefined" @click="jump(i)">
            <span class="dot" aria-hidden="true" /><span class="sd">{{ c.date }}</span><span class="st"><i class="cc" aria-hidden="true">{{ c.country }}</i>{{ c.title }}</span>
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
.globe { position: relative; width: 100%; height: auto; touch-action: none; cursor: grab; } /* no CSS filter here: Chrome paints a faint box around a filtered SVG — the shadow is an SVG gradient instead */
.globe:active { cursor: grabbing; }
.grat { fill: none; stroke: #e6cfe0; stroke-width: 0.6; vector-effect: non-scaling-stroke; }
.rim { fill: none; stroke: #fff; stroke-width: 3; opacity: 0.8; pointer-events: none; }
.land { fill: #f1e2ec; stroke: #fff; stroke-width: 0.5; transition: fill 0.9s ease; }
.land.hit { stroke: #fff; stroke-width: 1.2; filter: drop-shadow(0 0 6px rgba(255, 107, 157, 0.45)); }
.nohit { pointer-events: none; }
.night path { fill: #3b2466; fill-opacity: 0.22; }
.city-light { fill: #ffd98a; opacity: 0.55; filter: blur(3px); animation: twinkle 3.2s ease-in-out infinite; }
@keyframes twinkle { 50% { opacity: 0.85; } }
.clock { display: inline-flex; align-items: center; gap: 5px; margin-left: 10px; padding: 3px 10px 3px 8px; border-radius: 999px; font-weight: 800; color: #9a5a14; background: #fff4df; }
.clock .ico { --ico-fill: #ffd98a; }
.clock.nite { color: #4b2f7f; background: #efe7fb; }
.clock.nite .ico { --ico-fill: #c9b4f2; }
.arc { fill: none; stroke: #c92f69; stroke-width: 2.4; stroke-linecap: round; filter: drop-shadow(0 0 3px rgba(255, 107, 157, 0.7)); }
.arc.up { stroke: #a06cd5; stroke-dasharray: 2 6; }
.pin circle { transition: r 0.3s; }
.pin { cursor: pointer; }
.pin-hit { fill: transparent; }
.pin-dot { transform-box: fill-box; transform-origin: center; transition: transform 0.35s var(--spring), r 0.3s; }
.pin:hover .pin-dot { transform: scale(1.55); }
.pin.on .pin-dot { transform: scale(1.3); }
.pin.fresh > .pin-dot { animation: land 0.7s var(--spring); }
@keyframes land { 0% { r: 0; } 60% { r: 9; } 100% { r: 5.5; } }
.ping { fill: none; stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: ping 1.4s ease-out 2; }
@keyframes ping { from { transform: scale(1); opacity: 0.9; } to { transform: scale(5); opacity: 0; } }
.atmo { animation: breathe 6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
@keyframes breathe { 50% { opacity: 0.7; transform: scale(1.015); } }
.flash { opacity: 0; animation: flash 1.3s ease-out; pointer-events: none; }
@keyframes flash { 0% { opacity: 0.95; filter: brightness(1.35) drop-shadow(0 0 10px #fff); } 100% { opacity: 0; } }
.plane { color: #c92f69; pointer-events: none; }
.plane-disc { fill: #fff; stroke: currentColor; stroke-width: 2; filter: drop-shadow(0 4px 8px rgba(90, 20, 60, 0.3)); }
.plane.up { color: #7d4fb0; }
.plane .ico { --ico-fill: currentColor; stroke-width: 1.2; }
.lbl { pointer-events: none; }
.lbl rect { fill: #fff; stroke-width: 2; filter: drop-shadow(0 6px 10px rgba(90, 30, 70, 0.22)); }
.lbl .tail { stroke-width: 2; stroke-dasharray: 0 12 30; } /* hide the tail's top edge where it meets the bubble */
.lbl text { font-size: 13px; font-weight: 800; fill: #2f1a35; font-family: var(--cs-sans); }
.lbl-enter-active { transition: opacity 0.25s, transform 0.5s var(--spring); }
.lbl-enter-from { opacity: 0; transform: translateY(8px) scale(0.8); }
.lbl-leave-active { transition: opacity 0.15s; }
.lbl-leave-to { opacity: 0; }
.lbl-in { transform-box: fill-box; transform-origin: 50% 100%; }
.lbl-in.below { transform-origin: 50% 0; }
.stats b.pop { animation: pop 0.5s var(--spring); display: inline-block; }
@keyframes pop { 0% { transform: translateY(6px) scale(0.85); opacity: 0.4; } 100% { transform: none; opacity: 1; } }
.drag-hint { margin: 4px 0 0 !important; text-align: center; font-size: 12px; color: #735779; }
/* panel */
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #9c2457; }
.panel h1 { margin: 4px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(30px, 4vw, 46px) !important; line-height: 1.15; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
.stats div { padding: 12px 14px; border-radius: 18px; background: #fff; border: 1.5px solid #f3d6e4; display: flex; align-items: baseline; gap: 6px; }
.stats b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 30px; color: #c92f69; font-variant-numeric: tabular-nums; }
.stats .up b { color: #7d4fb0; }
.stats span { font-size: 13px; font-weight: 700; color: #5a4060; }
.odo { position: relative; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin: 10px 0 0; padding: 11px 14px 15px; border-radius: 18px; background: linear-gradient(100deg, #fff 0%, #fff6fa 100%); border: 1.5px dashed #f0c6da; overflow: hidden; }
.odo-k { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: #5a4060; margin-right: 2px; align-self: center; }
.odo b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px; color: #c92f69; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.odo small { font-size: 13px; font-weight: 800; color: #c92f69; }
.odo em { font-style: normal; font-size: 12px; font-weight: 800; color: #8a3a63; background: #ffe6f0; border-radius: 999px; padding: 2px 9px; align-self: center; }
.odo .odo-up { font-style: normal; font-size: 12px; font-weight: 700; color: #6a4596; align-self: center; margin-left: auto; }
.odo-bar { position: absolute; left: 14px; right: 14px; bottom: 6px; height: 3px; border-radius: 3px; background: #f7e1ec; overflow: hidden; }
.odo-bar span { display: block; height: 100%; background: linear-gradient(90deg, #ff6b9d, #a06cd5); transform-origin: left; border-radius: inherit; }
.now { margin-top: 14px; padding: 18px 20px; border-radius: 24px; color: #fff; background: linear-gradient(135deg, color-mix(in srgb, var(--cc) min(62%, var(--ink-mix, 100%)), #2a1030), #2a1030); box-shadow: 0 20px 40px -28px rgba(42, 16, 48, 0.8); }
.now-top { margin: 0 !important; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #ffe4f0; }
.now-top em { font-style: normal; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.2); }
.flag { display: inline-grid; place-items: center; min-width: 30px; height: 20px; padding: 0 6px; border-radius: 6px; font-size: 10.5px; font-weight: 900; letter-spacing: 0.08em; color: #2a1030; background: color-mix(in srgb, var(--cc) 55%, white); box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.7); }
.h-ico { color: #c92f69; --ico-fill: #ffd3e4; vertical-align: -0.08em; }
.drag-hint { display: flex; align-items: center; justify-content: center; gap: 6px; }
.cc { display: inline-block; margin-right: 7px; padding: 1px 5px; border-radius: 5px; font-style: normal; font-size: 10px; font-weight: 900; letter-spacing: 0.06em; color: color-mix(in srgb, var(--cc) 70%, #2a1030); background: color-mix(in srgb, var(--cc) 16%, white); vertical-align: 1px; }
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
.steps button { width: 100%; display: grid; grid-template-columns: 14px 106px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 12px; border-radius: 14px; text-align: left; color: #5a4060; background: none; transition: background 0.2s; }
.steps button:hover { background: #fdf0f6; }
.steps .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--cc); background: #fff; transition: background 0.3s; }
.steps .past .dot, .steps .on .dot { background: var(--cc); }
.steps .up .dot { border-style: dashed; }
.steps .sd { white-space: nowrap; font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
.steps .st { font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.steps .on { background: #fde8f1; color: var(--ink); }
@media (max-width: 900px) {
  .wm { grid-template-columns: minmax(0, 1fr); }
  .panel { min-width: 0; }
  .globe-wrap { position: relative; top: 0; max-width: 520px; margin: 0 auto; width: 100%; }
  /* step list → horizontal chip rail (was a 20-row list under the globe) */
  .steps { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x proximity; overscroll-behavior-x: contain; scrollbar-width: none; padding: 4px 2px 12px !important;
    mask-image: linear-gradient(90deg, transparent, #000 14px, #000 calc(100% - 14px), transparent); }
  .steps::-webkit-scrollbar { display: none; }
  .steps li { flex: none; scroll-snap-align: center; }
  .steps button { width: 152px; height: 100%; grid-template-columns: 10px minmax(0, 1fr); grid-template-rows: auto 1fr; row-gap: 6px; column-gap: 8px; align-items: start; padding: 10px 12px; border: 1.5px solid #f3d6e4; background: #fff; border-radius: 16px; }
  .steps .dot { margin-top: 3px; }
  .steps .st { grid-column: 1 / -1; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.35; font-size: 13px; }
  .steps .on { border-color: var(--cc); box-shadow: 0 8px 18px -12px var(--cc); }
  .steps .up { border-style: dashed; }
}
@media (prefers-reduced-motion: reduce) { .land, .pin circle { transition: none; } .pin:hover .pin-dot { transform: none; } .ping, .pin.fresh > .pin-dot, .atmo, .flash, .stats b.pop, .city-light { animation: none; } .lbl-enter-active { transition: none; } .swap-enter-active, .swap-leave-active { transition: none; } }
/* original watercolour sky (higgsfield, no people) behind the whole map page — full-bleed on .VPContent, so no 100vw spill;
   it fades into the page colour below the fold */
:global(.world-page .VPContent) {
  background: linear-gradient(180deg, rgba(255, 247, 240, 0) 0, rgba(255, 247, 240, 0) 380px, var(--vp-c-bg) 790px),
    url('/art/world-sky.webp') center top / max(100%, 1500px) auto no-repeat;
}
@media (max-width: 900px) { :global(.world-page .VPContent) { background-size: auto, auto 860px; background-position: 0 0, 38% 0; } }
</style>
