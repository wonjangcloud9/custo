<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CHAPTERS, COUNTRY, type Chapter } from '../data/world'
import { jaLang } from '../theme/lang'

// Passport page under the /world/ globe: one ink stamp per stop, the frame shape follows the country
// (JP round, KR rectangle, TW octagon, US oval). Upcoming stops are a dashed pencil outline with a D-day.
// Clicking a stamp scrolls up and flies the globe there (WorldMap listens for `wm:jump`).
const today = ref('') // client-only, so the build date never decides what is stamped
const nowMs = ref(0)
onMounted(() => { nowMs.value = Date.now(); today.value = new Date(nowMs.value + 9 * 3600e3).toISOString().slice(0, 10) })
const done = (c: Chapter) => !!today.value && c.iso <= today.value

const OCT = Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + (k * Math.PI) / 4; return [70 + 62 * Math.cos(a), 70 + 62 * Math.sin(a)] })
const octPts = (s: number) => OCT.map(([x, y]) => `${(70 + (x - 70) * s).toFixed(1)},${(70 + (y - 70) * s).toFixed(1)}`).join(' ')
const OCT_OUT = octPts(1), OCT_IN = octPts(0.86)

const cityOf = (c: Chapter) => {
  if (c.pins.length > 3) { const m = c.sub.match(/(\d+)도시/); return `${m ? m[1] : c.pins.length}도시 투어` }
  return c.pins[0].name.replace(/ \(.*\)/, '')
}
const stamps = computed(() => CHAPTERS.map((c, i) => {
  const d = done(c)
  const days = today.value && !d ? Math.ceil((Date.parse(c.iso + 'T00:00:00+09:00') - nowMs.value) / 864e5) : null
  return {
    c, i, d, days, city: cityOf(c), color: COUNTRY[c.country].color, ko: COUNTRY[c.country].ko.replace(/ \(.*\)/, ''),
    rot: ((i * 37) % 13) - 6, dy: ((i * 53) % 7) - 3, // deterministic hand-stamped wobble
  }
}))
const count = computed(() => stamps.value.filter((s) => s.d).length)

function go(i: number) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.querySelector('.wm')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  window.dispatchEvent(new CustomEvent('wm:jump', { detail: i }))
}
</script>

<template>
  <section class="wst" :class="{ ready: !!today }" aria-labelledby="wst-h">
    <svg width="0" height="0" class="wst-defs" aria-hidden="true" focusable="false">
      <filter id="wst-ink" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="3" result="s" />
        <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.55" result="m" />
        <feComposite in="d" in2="m" operator="in" />
      </filter>
    </svg>
    <header class="wst-head">
      <p class="wst-eye">PASSPORT · 입국 스탬프</p>
      <h2 id="wst-h"><Ico n="passport" duo size="0.95em" /> 큐스트 여권</h2>
      <p class="wst-sum" v-if="today"><b>{{ count }}</b>개 찍었어요 · 빈칸 <b>{{ CHAPTERS.length - count }}</b>개는 다음 여행지</p>
      <p class="wst-sum" v-else>공연지마다 하나씩 찍히는 입국 도장</p>
    </header>
    <ol class="wst-page">
      <li v-for="s in stamps" :key="s.c.iso + s.c.title" class="st" :class="[s.c.country, { up: !s.d }]" :style="{ '--cc': s.color, '--r': s.rot + 'deg', '--dy': s.dy + 'px', '--i': s.i }">
        <button type="button" class="st-btn" :aria-label="`${s.c.date} ${s.c.title}${s.d ? '' : ' (예정)'} — 지구본에서 보기`" @click="go(s.i)">
          <span class="st-thunk"><svg viewBox="0 0 140 140" class="st-ink" aria-hidden="true">
            <g :filter="s.d ? 'url(#wst-ink)' : undefined">
              <template v-if="s.c.country === 'JP'"><circle cx="70" cy="70" r="62" class="f" /><circle cx="70" cy="70" r="54" class="f thin" /></template>
              <template v-else-if="s.c.country === 'KR'"><rect x="10" y="22" width="120" height="96" rx="12" class="f" /><rect x="17" y="29" width="106" height="82" rx="7" class="f thin" /></template>
              <template v-else-if="s.c.country === 'TW'"><polygon :points="OCT_OUT" class="f" /><polygon :points="OCT_IN" class="f thin" /></template>
              <template v-else><ellipse cx="70" cy="70" rx="64" ry="50" class="f" /><ellipse cx="70" cy="70" rx="56" ry="42" class="f thin" /></template>
              <text x="70" y="48" class="t-top" :lang="s.d ? 'ja' : undefined">{{ s.c.country }} · {{ s.d ? '入国' : 'NEXT' }}</text>
              <text x="70" y="76" class="t-city" :lang="jaLang(s.city)" :textLength="s.city.length > 6 ? 92 : undefined" lengthAdjust="spacingAndGlyphs">{{ s.city }}</text>
              <text x="70" y="96" class="t-date" :textLength="s.c.date.length > 10 ? 80 : undefined" lengthAdjust="spacingAndGlyphs">{{ s.c.date }}</text>
              <path v-if="s.d" d="M44 104h52" class="f thin" />
            </g>
          </svg></span>
          <span v-if="!s.d && s.days !== null" class="st-dday">D-{{ s.days }}</span>
          <span class="st-cap" :lang="jaLang(s.c.title)">{{ s.c.title }}</span>
        </button>
      </li>
      <li class="st q" aria-hidden="true">
        <span class="st-thunk"><svg viewBox="0 0 140 140" class="st-ink"><circle cx="70" cy="70" r="56" class="f" /><text x="70" y="84" class="t-q">?</text></svg></span>
        <span class="st-cap">다음은 어디로?</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.wst-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.wst { margin: 56px 0 8px; }
.wst-head { text-align: center; margin-bottom: 18px; }
.wst-eye { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; color: #a0507a; }
.wst-head h2 { margin: 6px 0 4px; padding: 0; border: 0; font-size: clamp(24px, 3vw, 30px); letter-spacing: -0.01em; display: inline-flex; align-items: center; gap: 8px; color: #3a1530; }
.wst-head h2 :deep(svg) { color: #c2185b; }
.wst-sum { margin: 0; font-size: 14px; color: #6b4a5e; }
.wst-sum b { color: #c2185b; font-weight: 900; }

/* the passport page: warm paper, guilloche rings, a centre fold on wide screens */
.wst-page {
  --paper: #fffaf2;
  list-style: none; margin: 0; padding: 26px 22px 30px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 22px 14px;
  border-radius: 22px; position: relative; isolation: isolate;
  background:
    linear-gradient(90deg, transparent calc(50% - 1px), rgba(160, 80, 122, 0.16) 50%, transparent calc(50% + 1px)),
    linear-gradient(90deg, transparent 46%, rgba(90, 30, 70, 0.05) 50%, transparent 54%),
    repeating-radial-gradient(circle at 18% 30%, transparent 0 13px, rgba(194, 24, 91, 0.045) 13px 14px),
    repeating-radial-gradient(circle at 82% 72%, transparent 0 13px, rgba(74, 144, 217, 0.045) 13px 14px),
    var(--paper);
  border: 1.5px solid #f0dccb; box-shadow: 0 1px 0 #fff inset, 0 24px 40px -28px rgba(90, 30, 70, 0.45), 0 2px 0 #f6e7da, 0 4px 0 #efdccd;
}
.st { position: relative; list-style: none; margin: 0; padding: 0; }
.st-btn { all: unset; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; cursor: pointer; border-radius: 16px; padding: 4px 2px 6px; -webkit-tap-highlight-color: transparent; }
.st-btn:focus-visible { outline: 2.5px solid #c2185b; outline-offset: 2px; }
.st-thunk { display: block; width: 100%; max-width: 150px; }
.st-ink { width: 100%; aspect-ratio: 1; display: block; color: color-mix(in oklab, var(--cc) 78%, #3a0a2a); transform: translateY(var(--dy)) rotate(var(--r)); transition: transform 0.45s var(--spring, cubic-bezier(0.3, 1.5, 0.5, 1)); }
.st-btn:hover .st-ink, .st-btn:focus-visible .st-ink { transform: translateY(calc(var(--dy) - 4px)) rotate(0deg) scale(1.06); }
.f { fill: none; stroke: currentColor; stroke-width: 4.2; }
.f.thin { stroke-width: 1.8; }
text { fill: currentColor; text-anchor: middle; font-family: inherit; }
.t-top { font-size: 10.5px; font-weight: 800; letter-spacing: 0.16em; }
.t-city { font-size: 17px; font-weight: 900; letter-spacing: -0.01em; }
.t-date { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; font-variant-numeric: tabular-nums; }
.st:not(.up):not(.q) .st-ink { mix-blend-mode: multiply; opacity: 0.92; }
.st.up .st-ink { color: #8a55c0; opacity: 0.7; }
.st.up .f { stroke-dasharray: 5 6; stroke-width: 2.2; }
.st.up .f.thin { display: none; }
.st.q { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 2px 6px; }
.st.q .st-ink { color: #c9b3a4; transform: rotate(-4deg); }
.st.q .f { stroke-dasharray: 2 7; stroke-width: 2.4; stroke-linecap: round; }
.t-q { font-size: 44px; font-weight: 900; opacity: 0.7; }
.st.q .st-cap { color: #a08a7c; font-weight: 600; }
.st-dday { position: absolute; top: 6px; right: 4px; padding: 2px 8px; border-radius: 999px; background: #a06cd5; color: #fff; font-size: 11px; font-weight: 800; box-shadow: 0 4px 10px -5px #a06cd5; }
.st-cap { font-size: 12.5px; line-height: 1.35; font-weight: 700; color: #4a2a3e; text-align: center; text-wrap: balance; max-width: 15em; }
.st.up .st-cap { color: #7a5f8e; font-weight: 600; }
/* before mount nothing is decided yet — keep the frames faint so there is no stamped→empty flip */
.wst:not(.ready) .st-ink { opacity: 0.18; }
.wst:not(.ready) .st-dday { display: none; }

@media (max-width: 860px) {
  .wst-page { grid-template-columns: repeat(4, 1fr); background: repeating-radial-gradient(circle at 18% 30%, transparent 0 13px, rgba(194, 24, 91, 0.045) 13px 14px), repeating-radial-gradient(circle at 82% 72%, transparent 0 13px, rgba(74, 144, 217, 0.045) 13px 14px), var(--paper); }
}
@media (max-width: 560px) {
  .wst { margin-top: 40px; }
  .wst-page { grid-template-columns: repeat(3, 1fr); padding: 18px 10px 22px; gap: 16px 6px; border-radius: 18px; }
  .st-cap { font-size: 11.5px; }
  .st-dday { top: 0; right: 0; font-size: 10.5px; padding: 1px 6px; }
}

/* each stamp thunks down as it scrolls into view */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .wst.ready .st:not(.up):not(.q) .st-thunk { animation: thunk linear both; animation-timeline: view(); animation-range: entry 10% cover 32%; }
    @keyframes thunk {
      0% { opacity: 0; transform: rotate(-10deg) scale(1.5); }
      62% { opacity: 1; transform: rotate(0deg) scale(0.94); }
      100% { opacity: 1; transform: none; }
    }
  }
}
@media (prefers-reduced-motion: reduce) { .st-ink { transition: none; } }
</style>
