<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { events, catMeta, startMs, toIcs, googleCalUrl, type CsEvent, type EventCat } from '../data/events'
import { memberById } from '../data/members'

const now = ref<number | null>(null)
let timer: number | undefined
const cat = ref<'all' | EventCat>('all')
const showPast = ref(false)

const sorted = [...events].sort((a, b) => startMs(a) - startMs(b) || a.cat.localeCompare(b.cat))
const dayEnd = (e: CsEvent) => new Date(`${e.date}T23:59:59+09:00`).getTime()
const isPast = (e: CsEvent) => now.value !== null && dayEnd(e) < now.value
const isToday = (e: CsEvent) => now.value !== null && !isPast(e) && startMs({ ...e, time: undefined }) <= now.value

const next = computed(() => (now.value === null ? null : sorted.find((e) => startMs(e) > now.value!) ?? null))
const cd = computed(() => {
  if (!next.value || now.value === null) return null
  const s = Math.max(0, Math.floor((startMs(next.value) - now.value) / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
})
const pad = (n: number) => String(n).padStart(2, '0')
const timeLabel = (e: CsEvent) => (e.cat === 'live' ? '開演' : e.cat === 'tv' ? '放送' : '開始')

const filtered = computed(() => sorted.filter((e) => (cat.value === 'all' || e.cat === cat.value) && (showPast.value || !isPast(e))))
const pastCount = computed(() => sorted.filter((e) => isPast(e) && (cat.value === 'all' || e.cat === cat.value)).length)

// group: month → day → events
const months = computed(() => {
  const out: { key: string; label: string; days: { date: string; items: CsEvent[] }[] }[] = []
  for (const e of filtered.value) {
    const key = e.date.slice(0, 7)
    let mo = out.find((x) => x.key === key)
    if (!mo) { mo = { key, label: `${Number(key.slice(5))}월`, days: [] }; out.push(mo) }
    let day = mo.days.find((d) => d.date === e.date)
    if (!day) { day = { date: e.date, items: [] }; mo.days.push(day) }
    day.items.push(e)
  }
  return out
})
const counts = computed(() => {
  const c: Record<string, number> = { all: 0 }
  for (const e of sorted) if (showPast.value || !isPast(e)) { c.all++; c[e.cat] = (c[e.cat] || 0) + 1 }
  return c
})
const WD = ['日', '月', '火', '水', '木', '金', '土']
const wd = (date: string) => WD[new Date(`${date}T12:00:00+09:00`).getUTCDay()]
function dLabel(e: CsEvent) {
  if (now.value === null) return ''
  if (isPast(e)) return '종료'
  if (isToday(e)) return 'TODAY'
  const days = Math.ceil((new Date(`${e.date}T00:00:00+09:00`).getTime() - now.value) / 86400000)
  return `D-${days}`
}

function downloadIcs(e: CsEvent) {
  const blob = new Blob([toIcs(e)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `cutiestreet-${e.date}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

onMounted(() => {
  now.value = Date.now()
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="sb">
    <!-- NEXT UP -->
    <a v-if="next" class="next" :href="next.url" target="_blank" rel="noopener" :style="{ '--cc': catMeta[next.cat].color }">
      <span class="next-eyebrow"><span class="dot" /> NEXT UP · {{ catMeta[next.cat].emoji }} {{ catMeta[next.cat].ko }}</span>
      <b class="next-title">{{ next.ja }}</b>
      <span class="next-ko">{{ next.ko }}<template v-if="next.venue"> · 📍 {{ next.venue }}</template></span>
      <span v-if="cd" class="clock" aria-live="off">
        <span><b>{{ cd.d }}</b><small>DAYS</small></span>
        <span><b>{{ pad(cd.h) }}</b><small>HRS</small></span>
        <span><b>{{ pad(cd.m) }}</b><small>MIN</small></span>
        <span><b :key="cd.s" class="tick">{{ pad(cd.s) }}</b><small>SEC</small></span>
      </span>
      <span class="next-when">{{ next.date.replace(/-/g, '.') }} ({{ wd(next.date) }}){{ next.time ? ' ' + next.time + ' JST ' + timeLabel(next) : '' }}</span>
    </a>
    <div v-else class="next skeleton" aria-hidden="true" />

    <!-- FILTERS -->
    <div class="bar">
      <div class="chips" role="toolbar" aria-label="카테고리">
        <button type="button" class="chip" :aria-pressed="cat === 'all'" @click="cat = 'all'">전체 <small>{{ counts.all }}</small></button>
        <button v-for="(m, k) in catMeta" :key="k" type="button" class="chip" :aria-pressed="cat === k" :style="{ '--cc': m.color }"
          @click="cat = k as EventCat">{{ m.emoji }} {{ m.ko }} <small>{{ counts[k] || 0 }}</small></button>
      </div>
      <label class="past"><input v-model="showPast" type="checkbox" /> 지난 일정 {{ pastCount }}개 보기</label>
    </div>

    <!-- TIMELINE -->
    <div class="tl">
      <section v-for="mo in months" :key="mo.key" class="mo">
        <h2 class="mo-h"><span>{{ mo.label }}</span><small>{{ mo.key.slice(0, 4) }}</small></h2>
        <div v-for="d in mo.days" :key="d.date" class="day" :class="{ past: isPast(d.items[0]), today: isToday(d.items[0]) }">
          <div class="date">
            <b>{{ Number(d.date.slice(8)) }}</b>
            <span :class="{ sun: wd(d.date) === '日', sat: wd(d.date) === '土' }">{{ wd(d.date) }}</span>
          </div>
          <div class="items">
            <article v-for="e in d.items" :key="e.ja + e.date" class="ev"
              :style="{ '--cc': e.member ? memberById[e.member].color : catMeta[e.cat].color }">
              <div class="ev-top">
                <span class="pill">{{ catMeta[e.cat].emoji }} {{ catMeta[e.cat].ko }}</span>
                <span v-if="e.member" class="bday">🎂 {{ memberById[e.member].ko }}</span>
                <span class="dd" :class="{ hot: dLabel(e) === 'TODAY' }">{{ dLabel(e) }}</span>
              </div>
              <h3 class="ev-ja">{{ e.ja }}</h3>
              <p class="ev-ko">{{ e.ko }}</p>
              <p class="ev-meta">
                <span v-if="e.time">🕕 {{ e.time }} {{ timeLabel(e) }}</span>
                <span v-if="e.venue">📍 {{ e.venue }}</span>
              </p>
              <div class="ev-act">
                <a :href="e.url" target="_blank" rel="noopener">공식 상세 ↗</a>
                <template v-if="!isPast(e)">
                  <button type="button" @click="downloadIcs(e)">📅 .ics</button>
                  <a :href="googleCalUrl(e)" target="_blank" rel="noopener">Google 캘린더</a>
                </template>
              </div>
            </article>
          </div>
        </div>
      </section>
      <p v-if="!months.length" class="empty">해당 조건의 일정이 없어요. 지난 일정 보기를 켜보세요 🗓️</p>
    </div>
    <p class="src">출처: <a href="https://cutiestreet.asobisystem.com/live_information/schedule/list" target="_blank" rel="noopener">CUTIE STREET 공식 스케줄</a> · 시간은 모두 일본 시간(JST, 한국과 동일). 변경될 수 있으니 공식 사이트를 꼭 확인하세요.</p>
  </section>
</template>

<style scoped>
.sb {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 12px 0 40px;
}
.next {
  position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 6px; padding: 26px 28px; border-radius: 28px;
  background: linear-gradient(140deg, #3a2340, #6b2f63 60%, color-mix(in srgb, var(--cc) 60%, #6b2f63));
  color: #fff !important; text-decoration: none !important; box-shadow: 0 30px 60px -30px rgba(107, 47, 99, 0.8);
  transition: transform 0.6s var(--spring);
}
.next:hover { transform: translateY(-3px); }
.next::after { content: ''; position: absolute; inset: -50%; background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.12), transparent 25%); animation: spin 8s linear infinite; pointer-events: none; }
@keyframes spin { to { transform: rotate(360deg); } }
.next > * { position: relative; z-index: 1; }
.skeleton { min-height: 220px; }
.next-eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 0.18em; color: #ffc1d8; display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #ff6b9d; animation: ping 1.6s infinite; }
@keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(255, 107, 157, 0.7); } 70%, 100% { box-shadow: 0 0 0 10px rgba(255, 107, 157, 0); } }
.next-title { font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: clamp(22px, 3.4vw, 34px); line-height: 1.25; }
.next-ko { font-size: 14px; opacity: 0.85; }
.clock { display: flex; gap: 10px; margin-top: 10px; }
.clock > span { display: flex; flex-direction: column; align-items: center; min-width: 64px; padding: 10px 8px; border-radius: 16px; background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(6px); }
.clock b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 34px; line-height: 1; font-variant-numeric: tabular-nums; }
.clock small { font-size: 10px; letter-spacing: 0.2em; opacity: 0.7; margin-top: 4px; }
.tick { display: inline-block; animation: tick 0.5s var(--spring); }
@keyframes tick { from { transform: translateY(-35%); opacity: 0; } }
.next-when { font-size: 13px; opacity: 0.8; margin-top: 4px; }

.bar { position: sticky; top: calc(var(--vp-nav-height, 64px) + 4px); z-index: 5; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 18px 0 8px; padding: 8px; border-radius: 20px; background: rgba(255, 248, 240, 0.86); backdrop-filter: blur(10px); }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
.chips::-webkit-scrollbar { display: none; }
.chip { flex: none; padding: 7px 13px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; border: 1.5px solid #f1dce7; color: var(--ink); transition: transform 0.45s var(--spring), background 0.2s, color 0.2s; }
.chip small { opacity: 0.55; margin-left: 2px; }
.chip:active { transform: scale(0.9); }
.chip[aria-pressed='true'] { background: color-mix(in srgb, var(--cc, #3a2340) 62%, #2a1030); border-color: transparent; color: #fff; }
.past { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #735779; white-space: nowrap; cursor: pointer; }
.past input { accent-color: #ff6b9d; }

.mo { margin-top: 26px; }
.mo-h { display: flex; align-items: baseline; gap: 8px; margin: 0 0 10px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 30px !important; }
.mo-h small { font-size: 14px; color: #7d6083; }
.day { display: grid; grid-template-columns: 64px 1fr; gap: 12px; padding: 10px 0; border-top: 1px dashed #f0dbe6; }
.day.past { opacity: 0.55; filter: saturate(0.6); }
.day.today .date { background: #ff6b9d; color: #fff; }
.day.today .date span { color: #fff !important; }
.date { display: flex; flex-direction: column; align-items: center; justify-content: center; align-self: start; height: 64px; border-radius: 18px; background: #fff; border: 1.5px solid #f3dfe9; }
.date b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 26px; line-height: 1; }
.date span { font-size: 12px; font-weight: 700; color: #735779; }
.date .sun { color: #c42235; } .date .sat { color: #2b5ea8; }
.items { display: grid; gap: 10px; min-width: 0; }
.ev {
  padding: 14px 16px; border-radius: 20px; background: #fff; border: 1.5px solid color-mix(in srgb, var(--cc) 25%, white);
  border-left: 5px solid var(--cc); transition: transform 0.5s var(--spring), box-shadow 0.3s; min-width: 0;
}
.ev:hover { transform: translateX(4px); box-shadow: 0 14px 26px -18px color-mix(in srgb, var(--cc) 80%, #000); }
@supports (animation-timeline: view()) {
  .ev { animation: evIn linear both; animation-timeline: view(); animation-range: entry 0% entry 60%; }
  @keyframes evIn { from { opacity: 0; transform: translateX(-16px); } }
}
.ev-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pill { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: color-mix(in srgb, var(--cc) 14%, white); color: color-mix(in srgb, var(--cc) 70%, #3a2340); }
.bday { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: color-mix(in srgb, var(--cc) 62%, #2a1030); color: #fff; }
.dd { margin-left: auto; font-size: 12px; font-weight: 800; color: #7d6083; font-variant-numeric: tabular-nums; }
.dd.hot { color: #fff; background: #ff3b6f; padding: 2px 8px; border-radius: 999px; animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(1.08); } }
.ev-ja { margin: 8px 0 2px !important; padding: 0 !important; border: 0 !important; font-family: 'Noto Sans JP', sans-serif; font-size: 16px !important; line-height: 1.4 !important; font-weight: 700; overflow-wrap: anywhere; white-space: normal; }
.ev-ko { margin: 0 !important; font-size: 13px; color: #6a4a70; }
.ev-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 6px 0 0 !important; font-size: 12.5px; color: #735779; }
.ev-act { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ev-act a, .ev-act button { font-size: 12px; font-weight: 700; padding: 6px 11px; border-radius: 999px; background: #faf3f7; color: var(--ink) !important; text-decoration: none !important; transition: transform 0.4s var(--spring), background 0.2s; }
.ev-act a:hover, .ev-act button:hover { transform: translateY(-2px); background: color-mix(in srgb, var(--cc) 18%, white); }
.empty { text-align: center; padding: 40px 0; color: #735779; }
.src { margin-top: 28px !important; font-size: 12px; color: #735779; }

@media (max-width: 640px) {
  .next { padding: 20px; border-radius: 22px; }
  .clock { gap: 6px; }
  .clock > span { min-width: 0; flex: 1; padding: 8px 4px; }
  .clock b { font-size: 26px; }
  .day { grid-template-columns: 48px 1fr; gap: 10px; }
  .date { height: 52px; border-radius: 14px; }
  .date b { font-size: 20px; }
  .bar { top: calc(var(--vp-nav-height, 64px) + 38px); }
  .chips { flex-basis: 100%; }
  .past { padding-left: 4px; }
  .ev-ja { font-size: 14.5px !important; }
}
@media (prefers-reduced-motion: reduce) {
  .next::after, .dot, .tick, .dd.hot, .ev { animation: none !important; }
  .next, .ev, .chip { transition: none; }
}
</style>
