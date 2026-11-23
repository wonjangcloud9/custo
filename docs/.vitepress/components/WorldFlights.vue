<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CHAPTERS, COUNTRY, type Chapter } from '../data/world'
import { jaLang } from '../theme/lang'

// 'Next flights' on /world/: every upcoming stop as a boarding pass. The plane on each pass sits where the
// group is between the previous stop and that one (today's share of the gap), so the first pass is mid-air
// and later ones wait at the gate. Clicking a pass flies the globe there (WorldMap listens for `wm:jump`).
const CODE: Record<string, string> = { 도쿄: 'TYO', NHK홀: 'TYO', 日本武道館: 'TYO', 서울: 'SEL', 고양: 'SEL', 호놀룰루: 'HNL', 타이난: 'TNN', 요코하마: 'YOK', 아이치: 'NGO' }
const cityName = (n: string) => n.replace(/ \(.*\)/, '')
const code = (n: string, c: Chapter['country']) => CODE[cityName(n)] ?? CODE[n] ?? c
const rad = Math.PI / 180
function km(a: [number, number], b: [number, number]) {
  const [l1, p1] = [a[0] * rad, a[1] * rad], [l2, p2] = [b[0] * rad, b[1] * rad]
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)))
}
const ms = (iso: string) => Date.parse(iso + 'T00:00:00+09:00')

const now = ref(0) // client-only
onMounted(() => { now.value = Date.now() })
const today = computed(() => (now.value ? new Date(now.value + 9 * 3600e3).toISOString().slice(0, 10) : ''))

// quadratic arc in a 300×64 box: P0 (20,52) → P2 (280,52), control (150,-6)
const P0 = [20, 52], C = [150, -6], P2 = [280, 52]
function at(t: number) {
  const x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0]
  const y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1]
  const dx = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0]), dy = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1])
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI }
}
const ARC = `M${P0[0]} ${P0[1]}Q${C[0]} ${C[1]} ${P2[0]} ${P2[1]}`

const passes = computed(() => {
  if (!today.value) return []
  return CHAPTERS.map((c, i) => ({ c, i })).filter(({ c, i }) => i > 0 && c.iso > today.value).map(({ c, i }) => {
    const prev = CHAPTERS[i - 1], from = prev.pins[prev.pins.length - 1], to = c.pins[0]
    const span = ms(c.iso) - ms(prev.iso), t = Math.max(0, Math.min(1, (now.value - ms(prev.iso)) / span))
    const days = Math.ceil((ms(c.iso) - now.value) / 864e5)
    const gate = c.sub.split(' · ')[0]
    let seed = i * 7919
    const bars = Array.from({ length: 34 }, () => { seed = (seed * 16807) % 2147483647; return 1 + (seed % 3) })
    return {
      i, c, t, days, gate, bars, plane: at(Math.max(0.04, Math.min(0.96, t))), boarding: t > 0,
      from: { code: code(from.name, prev.country), name: cityName(from.name) }, to: { code: code(to.name, c.country), name: cityName(to.name) },
      km: km(from.ll, to.ll), color: COUNTRY[c.country].color,
    }
  })
})

function go(i: number) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.querySelector('.wm')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  window.dispatchEvent(new CustomEvent('wm:jump', { detail: i }))
}
</script>

<template>
  <section v-if="passes.length" class="wfl" aria-labelledby="wfl-h">
    <header class="wfl-head">
      <p class="wfl-eye">NEXT FLIGHTS · 다음 비행</p>
      <h2 id="wfl-h"><Ico n="plane" duo size="0.95em" /> 다음 공연지 탑승권</h2>
    </header>
    <ol class="wfl-list">
      <li v-for="(p, k) in passes" :key="p.c.iso" :style="{ '--cc': p.color, '--k': k }">
        <button type="button" class="bp" :aria-label="`${p.c.date} ${p.c.title} — ${p.from.name}에서 ${p.to.name}까지 약 ${p.km.toLocaleString()}km, D-${p.days}. 지구본에서 보기`" @click="go(p.i)">
          <span class="bp-main">
            <span class="bp-top"><b>CUTIE AIR</b><span>{{ p.boarding ? '비행 중' : '탑승 대기' }}</span></span>
            <span class="bp-route">
              <span class="ap"><b>{{ p.from.code }}</b><small>{{ p.from.name }}</small></span>
              <svg viewBox="0 0 300 64" class="bp-arc" aria-hidden="true">
                <path :d="ARC" class="arc-bg" />
                <path :d="ARC" class="arc-done" pathLength="1" :style="{ strokeDashoffset: 1 - p.t }" />
                <circle :cx="P0[0]" :cy="P0[1]" r="4" class="ap-dot" /><circle :cx="P2[0]" :cy="P2[1]" r="4" class="ap-dot to" />
                <g :transform="`translate(${p.plane.x} ${p.plane.y}) rotate(${p.plane.a + 90})`" class="bp-plane"><g transform="translate(-11 -11)"><Ico n="plane" duo size="22" /></g></g>
              </svg>
              <span class="ap to"><b>{{ p.to.code }}</b><small>{{ p.to.name }}</small></span>
            </span>
            <span class="bp-fields">
              <span><small>날짜</small><b>{{ p.c.date }}</b></span>
              <span class="wide"><small>게이트</small><b :lang="jaLang(p.gate)">{{ p.gate }}</b></span>
              <span><small>거리</small><b>{{ p.km.toLocaleString() }}km</b></span>
            </span>
          </span>
          <span class="bp-stub">
            <small>BOARDING</small>
            <b>D-{{ p.days }}</b>
            <span class="bp-title" :lang="jaLang(p.c.title)">{{ p.c.title }}</span>
            <span class="bp-bars" aria-hidden="true"><i v-for="(w, j) in p.bars" :key="j" :style="{ width: w + 'px' }" /></span>
          </span>
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.wfl { margin: 56px auto 0; max-width: 820px; }
.wfl-head { text-align: center; margin-bottom: 18px; }
.wfl-eye { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; color: #7a55b0; }
.wfl-head h2 { margin: 6px 0 0; padding: 0; border: 0; font-size: clamp(24px, 3vw, 30px); display: inline-flex; align-items: center; gap: 8px; color: #3a1530; letter-spacing: -0.01em; }
.wfl-head h2 :deep(svg) { color: #a06cd5; }
.wfl-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.wfl-list li { margin: 0; filter: drop-shadow(0 14px 16px rgba(90, 30, 70, 0.12)); }

.bp {
  all: unset; box-sizing: border-box; width: 100%; cursor: pointer; display: grid; grid-template-columns: 1fr 190px; border-radius: 20px; position: relative;
  /* perforation notches cut where main and stub meet */
  --n: radial-gradient(circle at calc(100% - 190px) 0, transparent 11px, #000 11.5px) top / 100% 51% no-repeat, radial-gradient(circle at calc(100% - 190px) 100%, transparent 11px, #000 11.5px) bottom / 100% 51% no-repeat;
  -webkit-mask: var(--n); mask: var(--n);
  background: linear-gradient(90deg, #fff 0 calc(100% - 190px), color-mix(in oklab, var(--cc) 14%, #fff) 0);
  transition: transform 0.45s cubic-bezier(0.3, 1.5, 0.5, 1);
  -webkit-tap-highlight-color: transparent;
}
.bp::before { content: ''; position: absolute; top: 14px; bottom: 14px; right: 190px; border-left: 2px dashed color-mix(in oklab, var(--cc) 40%, #e9dce6); }
.bp:hover { transform: translateY(-3px) rotate(-0.6deg); }
.bp:focus-visible { outline: 2.5px solid #c2185b; outline-offset: 3px; }
.bp-main { display: flex; flex-direction: column; gap: 10px; padding: 16px 22px 18px; min-width: 0; border-left: 6px solid var(--cc); border-radius: 20px 0 0 20px; }
.bp-top { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: #9a7f92; }
.bp-top b { color: color-mix(in oklab, var(--cc) 58%, #2a0a20); letter-spacing: 0.2em; }
.bp-top span { letter-spacing: 0.04em; padding: 2px 8px; border-radius: 999px; background: color-mix(in oklab, var(--cc) 16%, #fff); color: color-mix(in oklab, var(--cc) 70%, #2a0a20); }
.bp-route { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; }
.ap { display: flex; flex-direction: column; line-height: 1.05; }
.ap.to { text-align: right; }
.ap b { font-size: 34px; font-weight: 900; letter-spacing: 0.02em; color: #2e1328; font-variant-numeric: tabular-nums; }
.ap small { font-size: 12px; font-weight: 700; color: #8a6a80; margin-top: 3px; }
.bp-arc { width: 100%; height: auto; overflow: visible; }
.arc-bg { fill: none; stroke: #e2d2df; stroke-width: 2; stroke-dasharray: 2 6; stroke-linecap: round; }
.arc-done { fill: none; stroke: var(--cc); stroke-width: 2.6; stroke-linecap: round; stroke-dasharray: 1 1; }
.ap-dot { fill: #fff; stroke: #c7afc2; stroke-width: 2; }
.ap-dot.to { stroke: var(--cc); }
.bp-plane { color: color-mix(in oklab, var(--cc) 75%, #2a0a20); }
.bp-fields { display: grid; grid-template-columns: auto 1fr auto; gap: 18px; border-top: 1.5px solid #f2e6ee; padding-top: 10px; }
.bp-fields span { display: flex; flex-direction: column; min-width: 0; }
.bp-fields small { font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; color: #735779; }
.bp-fields b { font-size: 14px; font-weight: 800; color: #3a2340; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.bp-stub { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 14px 16px; text-align: center; }
.bp-stub small { font-size: 10.5px; font-weight: 800; letter-spacing: 0.2em; color: color-mix(in oklab, var(--cc) 60%, #3a2340); }
.bp-stub > b { font-size: 34px; font-weight: 900; line-height: 1; color: color-mix(in oklab, var(--cc) 72%, #2a0a20); font-variant-numeric: tabular-nums; }
.bp-title { font-size: 12px; font-weight: 700; line-height: 1.3; color: #5a3a50; text-wrap: balance; }
.bp-bars { display: flex; gap: 2px; height: 26px; margin-top: 6px; }
.bp-bars i { display: block; background: #3a2340; opacity: 0.78; border-radius: 0.5px; }

@media (max-width: 640px) {
  .wfl { margin-top: 40px; }
  .bp { grid-template-columns: 1fr; --n: radial-gradient(circle at 0 calc(100% - 118px), transparent 11px, #000 11.5px) left / 51% 100% no-repeat, radial-gradient(circle at 100% calc(100% - 118px), transparent 11px, #000 11.5px) right / 51% 100% no-repeat; background: linear-gradient(180deg, #fff 0 calc(100% - 118px), color-mix(in oklab, var(--cc) 14%, #fff) 0); }
  .bp::before { top: auto; bottom: 118px; left: 16px; right: 16px; border-left: 0; border-top: 2px dashed color-mix(in oklab, var(--cc) 40%, #e9dce6); }
  .bp-main { padding: 14px 16px 16px; border-left-width: 5px; border-radius: 20px 20px 0 0; }
  .ap b { font-size: 26px; }
  .bp-fields { gap: 12px; }
  .bp-fields b { font-size: 13px; }
  .bp-stub { height: 118px; box-sizing: border-box; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto auto; column-gap: 14px; text-align: left; justify-items: start; align-content: center; }
  .bp-stub small { grid-column: 1; }
  .bp-stub > b { grid-column: 1; font-size: 30px; }
  .bp-title { grid-column: 2; grid-row: 1 / 3; align-self: center; }
  .bp-bars { grid-column: 1 / -1; height: 18px; margin-top: 4px; overflow: hidden; max-width: 100%; }
}

/* passes slide in like they're being handed over the counter */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .wfl-list li { animation: wflIn linear both; animation-timeline: view(); animation-range: entry 5% cover 28%; }
    @keyframes wflIn { from { opacity: 0; transform: translateX(calc(40px + var(--k) * 12px)) rotate(2deg); } to { opacity: 1; transform: none; } }
    .arc-done { transition: stroke-dashoffset 1.4s cubic-bezier(0.2, 0.7, 0.2, 1); }
  }
}
@media (prefers-reduced-motion: reduce) { .bp { transition: none; } }
</style>
