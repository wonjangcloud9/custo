<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { events, catMeta, startMs, toIcs, googleCalUrl, type CsEvent, type EventCat, isOnNow, nowWord, endMs } from '../data/events'
import { memberById } from '../data/members'
import { goingKey, loadGoing, saveGoing } from '../data/going'

const now = ref<number | null>(null)
let timer: number | undefined
const cat = ref<'all' | EventCat>('all')
// '갈 거예요 / 볼 거예요' marks — kept only in this browser (localStorage), never sent anywhere
const going = ref<Set<string>>(new Set())
const mineOnly = ref(false)
const popKey = ref('')
const isGoing = (e: CsEvent) => going.value.has(goingKey(e))
function toggleGoing(e: CsEvent) {
  const k = goingKey(e), next = new Set(going.value)
  if (next.has(k)) next.delete(k); else { next.add(k); popKey.value = k; setTimeout(() => { if (popKey.value === k) popKey.value = '' }, 700) }
  going.value = next
  saveGoing(next)
}
// share your marked list as text (only when you press the button; nothing is sent otherwise)
const shared = ref<'' | 'copied' | 'shared' | 'failed'>('')
async function shareMine() {
  const list = upcomingFiltered.value
  const lines = list.map((e) => `${+e.date.slice(5, 7)}/${+e.date.slice(8)}(${wd(e.date)})${e.time ? ' ' + e.time : ''} ${e.ja}`)
  const text = `✋ 나의 큐스트 일정 ${list.length}개\n${lines.join('\n')}`
  const url = location.origin + withBase('/schedule/')
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: '나의 큐스트 일정', text, url }); shared.value = 'shared'; setTimeout(() => (shared.value = ''), 1800); return } catch (e) { if ((e as Error).name === 'AbortError') return }
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); shared.value = 'copied' } catch { shared.value = 'failed' }
  setTimeout(() => (shared.value = ''), 1800)
}
const passes = (e: CsEvent) => (cat.value === 'all' || e.cat === cat.value) && (!mineOnly.value || isGoing(e))
const showPast = ref(false)
// past events link to that day's official footage: own-channel videos of that performance date and
// other channels' uploads from that day or the next (loaded only when past events are shown)
interface DayVid { id: string; t: string; other: boolean }
const dayVids = ref<Record<string, DayVid[]>>({})
watch(showPast, async (on) => {
  if (!on || Object.keys(dayVids.value).length) return
  const [v, a] = await Promise.all([import('../data/videos.json'), import('../data/appearances.json')])
  const map: Record<string, DayVid[]> = {}
  const push = (d: string, x: DayVid) => { if (d) (map[d] ||= []).push(x) }
  for (const x of v.default as { id: string; title: string; date: string; category: string }[]) if (x.category !== 'digest') push(x.date, { id: x.id, t: x.title, other: false })
  for (const x of a.default as { id: string; title: string; date: string }[]) push(x.date, { id: x.id, t: x.title, other: true })
  dayVids.value = map
})
const nextDay = (d: string) => new Date(Date.parse(d + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10)
const vidsFor = (e: CsEvent) => [...(dayVids.value[e.date] || []), ...(dayVids.value[nextDay(e.date)] || []).filter((x) => x.other)]
const shortT = (t: string) => t.replace(/【[^】]*】|\[[^\]]*\]/g, '').replace(/📍.*$/, '').replace(/CUTIE STREET/g, '').trim().slice(0, 22) || '영상'
const view = ref<'list' | 'cal'>('list')
// Month grid (Sun-start), months that contain events
const calMonth = ref('')
const calMonths = [...new Set(events.map((e) => e.date.slice(0, 7)))].sort()
const calIdx = computed(() => Math.max(0, calMonths.indexOf(calMonth.value)))
const selDay = ref('')
const grid = computed(() => {
  const ym = calMonths[calIdx.value]
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells: { date: string | null; d: number; items: CsEvent[] }[] = []
  for (let i = 0; i < first; i++) cells.push({ date: null, d: 0, items: [] })
  for (let d = 1; d <= days; d++) {
    const date = `${ym}-${String(d).padStart(2, '0')}`
    cells.push({ date, d, items: sorted.filter((e) => e.date === date && (cat.value === 'all' || e.cat === cat.value)) })
  }
  while (cells.length % 7) cells.push({ date: null, d: 0, items: [] })
  return cells
})
const selItems = computed(() => grid.value.find((c) => c.date === selDay.value)?.items ?? [])
const todayStr = computed(() => (now.value === null ? '' : new Date(now.value + 9 * 3600e3).toISOString().slice(0, 10)))

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

const filtered = computed(() => sorted.filter((e) => passes(e) && (showPast.value || !isPast(e))))
const pastCount = computed(() => sorted.filter((e) => isPast(e) && passes(e)).length)
const goingCount = computed(() => sorted.filter((e) => isGoing(e) && !isPast(e)).length)
watch(goingCount, (n) => { if (!n) mineOnly.value = false })

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
  for (const e of sorted) if ((showPast.value || !isPast(e)) && (!mineOnly.value || isGoing(e))) { c.all++; c[e.cat] = (c[e.cat] || 0) + 1 }
  return c
})
const WD = ['日', '月', '火', '水', '木', '金', '土']
const wd = (date: string) => WD[new Date(`${date}T12:00:00+09:00`).getUTCDay()]
function dLabel(e: CsEvent) {
  if (now.value === null) return ''
  if (isPast(e)) return '종료'
  if (isOnNow(e, now.value)) return nowWord(e)
  if (e.end && endMs(e) <= now.value) return '종료' // published end has passed, even if it's still that day
  if (isToday(e)) return 'TODAY'
  const days = Math.ceil((new Date(`${e.date}T00:00:00+09:00`).getTime() - now.value) / 86400000)
  return `D-${days}`
}

const upcomingFiltered = computed(() => sorted.filter((e) => passes(e) && !isPast(e)))
function downloadIcs(e: CsEvent | CsEvent[]) {
  const blob = new Blob([toIcs(e)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = Array.isArray(e) ? `cutiestreet-schedule-${cat.value}.ics` : `cutiestreet-${e.date}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

onMounted(() => {
  const ym = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7)
  calMonth.value = calMonths.includes(ym) ? ym : calMonths[calMonths.length - 1]
  now.value = Date.now()
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
// Month jump chips (list view) + scroll-spy
const activeMo = ref('')
let moSpy: IntersectionObserver | undefined
function jumpMo(key: string) { scrollToId(`mo-${key}`) }
function scrollToId(id: string, instant = false) {
  const reduce = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = document.getElementById(id)
  if (!el) return false
  const bar = document.querySelector('.bar') as HTMLElement | null
  const offset = (bar ? bar.getBoundingClientRect().height + parseFloat(getComputedStyle(bar).top || '0') : 80) + 12 // sticky bar height differs per viewport
  window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - offset, behavior: reduce ? 'auto' : 'smooth' })
  return true
}
function watchMonths() {
  moSpy?.disconnect()
  moSpy = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) activeMo.value = e.target.id.slice(3) }, { rootMargin: '-30% 0px -60% 0px' })
  document.querySelectorAll('.mo[id^="mo-"]').forEach((el) => moSpy!.observe(el))
}
onMounted(() => {
  requestAnimationFrame(watchMonths)
  going.value = loadGoing()
  // deep link from the home digest: /schedule/?mine opens on your marked events
  if (new URLSearchParams(location.search).has('mine') && goingCount.value) mineOnly.value = true
  // deep link from the home week strip: /schedule/#d-YYYY-MM-DD → that day (or its month when the day has nothing),
  // once the client-side list (past days hidden) has rendered
  const h = decodeURIComponent(location.hash.slice(1))
  if (/^d-\d{4}-\d\d-\d\d$/.test(h)) setTimeout(() => { if (!scrollToId(h, true)) scrollToId(`mo-${h.slice(2, 9)}`, true) }, 60)
})
watch([months, view], () => nextTick(watchMonths))
// phones: while scrolling down, fold the filter rows so only the month jumper stays pinned; scrolling up unfolds them
const compact = ref(false)
// Folding changes the bar's height by ~110px, and the browser's scroll anchoring then moves scrollY by the
// same amount. Read as a user scroll, that jump flipped the fold back, sixty times a second (seen with reduced
// motion on). So after each toggle, ignore scroll for a moment and take the settled position as the new baseline.
let lastY = 0, ticking = false, holdUntil = 0
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const y = scrollY
    ticking = false
    if (performance.now() < holdUntil) { lastY = y; return }
    const phone = matchMedia('(max-width: 640px)').matches
    const next = phone && y > 400 && y > lastY + 4 ? true : y < lastY - 4 || y <= 400 || !phone ? false : compact.value
    if (next !== compact.value) { compact.value = next; holdUntil = performance.now() + 300 }
    lastY = y
  })
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => { clearInterval(timer); moSpy?.disconnect(); window.removeEventListener('scroll', onScroll) })
</script>

<template>
  <section class="sb">
    <!-- NEXT UP -->
    <a v-if="next" class="next" :href="next.url" target="_blank" rel="noopener" :style="{ '--cc': catMeta[next.cat].color }">
      <span class="next-eyebrow"><span class="dot" /> NEXT UP · {{ catMeta[next.cat].emoji }} {{ catMeta[next.cat].ko }}</span>
      <b class="next-title" :lang="jaLang(next.ja)">{{ next.ja }}</b>
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
    <div class="bar" :class="{ compact }">
      <div class="chips" role="toolbar" aria-label="카테고리">
        <button type="button" class="chip" :aria-pressed="cat === 'all'" @click="cat = 'all'">전체 <small>{{ counts.all }}</small></button>
        <button v-for="(m, k) in catMeta" :key="k" type="button" class="chip" :aria-pressed="cat === k" :style="{ '--cc': m.color }"
          @click="cat = k as EventCat">{{ m.emoji }} {{ m.ko }} <small>{{ counts[k] || 0 }}</small></button>
        <button v-if="goingCount" type="button" class="chip mine" :aria-pressed="mineOnly" @click="mineOnly = !mineOnly">✋ 내 일정 <small>{{ goingCount }}</small></button>
      </div>
      <label v-if="view === 'list'" class="past"><input v-model="showPast" type="checkbox" /> 지난 일정 {{ pastCount }}개 보기</label>
      <div class="seg" role="group" aria-label="보기 방식">
        <button type="button" :aria-pressed="view === 'list'" @click="view = 'list'">☰ 목록</button>
        <button type="button" :aria-pressed="view === 'cal'" @click="view = 'cal'">▦ 달력</button>
      </div>
      <nav v-if="view === 'list' && months.length > 1" class="mjump" aria-label="월 바로가기">
        <button v-for="(mo, i) in months" :key="mo.key" type="button" :class="{ on: activeMo === mo.key }" :aria-current="activeMo === mo.key ? 'true' : undefined" @click="jumpMo(mo.key)">
          <small v-if="i === 0 || mo.key.slice(0, 4) !== months[i - 1].key.slice(0, 4)">{{ mo.key.slice(2, 4) }}'</small>{{ mo.label }}<i>{{ mo.days.reduce((a, d) => a + d.items.length, 0) }}</i>
        </button>
      </nav>
    </div>

    <!-- CALENDAR -->
    <div v-if="view === 'cal'" class="cal">
      <div class="cal-head">
        <button type="button" class="nav" :disabled="calIdx === 0" aria-label="이전 달" @click="calMonth = calMonths[calIdx - 1]; selDay = ''">‹</button>
        <b>{{ calMonths[calIdx].slice(0, 4) }}년 {{ Number(calMonths[calIdx].slice(5)) }}월</b>
        <button type="button" class="nav" :disabled="calIdx === calMonths.length - 1" aria-label="다음 달" @click="calMonth = calMonths[calIdx + 1]; selDay = ''">›</button>
      </div>
      <div class="wk"><span v-for="(w, i) in ['日', '月', '火', '水', '木', '金', '土']" :key="w" :class="{ sun: i === 0, sat: i === 6 }">{{ w }}</span></div>
      <div class="days">
        <button v-for="(c, i) in grid" :key="i" type="button" class="day-c" :disabled="!c.date || !c.items.length"
          :class="{ blank: !c.date, has: c.items.length, today: c.date === todayStr, sel: c.date === selDay, past: c.date && c.date < todayStr }"
          :aria-label="c.date ? `${c.d}일 일정 ${c.items.length}개${c.items.some(isGoing) ? ' · 내 일정 있음' : ''}` : undefined" @click="selDay = c.date === selDay ? '' : (c.date || '')">
          <span v-if="c.date" class="dn">{{ c.d }}</span>
          <span v-if="c.items.some(isGoing)" class="mine-dot" aria-hidden="true">💖</span>
          <span class="pips"><i v-for="e in c.items.slice(0, 4)" :key="e.ja" :style="{ background: e.member ? memberById[e.member].color : catMeta[e.cat].color }" /></span>
          <span v-if="c.items.length" class="first">{{ catMeta[c.items[0].cat].emoji }} {{ c.items[0].ko }}</span>
        </button>
      </div>
      <div v-if="selItems.length" class="sel-list">
        <a v-for="e in selItems" :key="e.ja + e.date" :href="e.url" target="_blank" rel="noopener" :style="{ '--cc': e.member ? memberById[e.member].color : catMeta[e.cat].color }">
          <span class="pill">{{ catMeta[e.cat].emoji }} {{ catMeta[e.cat].ko }}</span><span v-if="isGoing(e)" class="pill mine-pill">💖 내 일정</span><b lang="ja">{{ e.ja }}</b>
          <small>{{ e.ko }}<template v-if="e.time"> · {{ e.time }}{{ e.end ? `–${e.end}` : '' }} {{ timeLabel(e) }}</template><template v-if="e.venue"> · 📍 {{ e.venue }}</template></small>
        </a>
      </div>
      <p v-else class="cal-hint">점이 있는 날짜를 눌러 일정을 확인하세요</p>
    </div>

    <div v-if="view === 'list' && (upcomingFiltered.length > 1 || (mineOnly && upcomingFiltered.length))" class="ics-all-row">
      <button v-if="mineOnly" type="button" class="share-mine" :class="{ done: shared === 'copied' || shared === 'shared' }" @click="shareMine">
        {{ shared === 'copied' ? '✓ 목록 복사됨' : shared === 'shared' ? '✓ 공유 완료' : shared === 'failed' ? '복사하지 못했어요' : '📤 내 일정 공유' }}
      </button>
      <button type="button" class="ics-all" @click="downloadIcs(upcomingFiltered)">📅 {{ mineOnly ? '내 일정' : '다가오는 일정' }} {{ upcomingFiltered.length }}개 한 번에 캘린더에 넣기 (.ics)</button>
      <small>아이폰·구글·아웃룩 캘린더에서 열면 한꺼번에 추가돼요 · 🔔 하루 전·1시간 전 알림 포함 (종일 일정은 전날 오전 9시){{ cat === 'all' ? '' : ' · 지금 고른 카테고리만' }}</small>
    </div>

    <!-- TIMELINE -->
    <div v-show="view === 'list'" class="tl">
      <section v-for="mo in months" :id="`mo-${mo.key}`" :key="mo.key" class="mo">
        <h2 class="mo-h"><span>{{ mo.label }}</span><small>{{ mo.key.slice(0, 4) }}</small></h2>
        <div v-for="d in mo.days" :id="`d-${d.date}`" :key="d.date" class="day" :class="{ past: isPast(d.items[0]), today: isToday(d.items[0]) }">
          <div class="date">
            <b>{{ Number(d.date.slice(8)) }}</b>
            <span :class="{ sun: wd(d.date) === '日', sat: wd(d.date) === '土' }">{{ wd(d.date) }}</span>
          </div>
          <div class="items">
            <article v-for="e in d.items" :key="e.ja + e.date" class="ev" :class="{ mine: isGoing(e) }"
              :style="{ '--cc': e.member ? memberById[e.member].color : catMeta[e.cat].color }">
              <div class="ev-top">
                <span class="pill">{{ catMeta[e.cat].emoji }} {{ catMeta[e.cat].ko }}</span>
                <span v-if="e.member" class="bday">🎂 {{ memberById[e.member].ko }}</span>
                <span class="dd" :class="{ hot: ['TODAY', 'ON AIR', 'NOW'].includes(dLabel(e)), live: ['ON AIR', 'NOW'].includes(dLabel(e)) }">{{ dLabel(e) }}</span>
              </div>
              <h3 class="ev-ja" :lang="jaLang(e.ja)">{{ e.ja }}</h3>
              <p class="ev-ko">{{ e.ko }}</p>
              <p class="ev-meta">
                <span v-if="e.time">🕕 {{ e.time }}{{ e.end ? `–${e.end}` : '' }} {{ timeLabel(e) }}</span>
                <span v-if="e.venue">📍 <span :lang="jaLang(e.venue)">{{ e.venue }}</span></span>
              </p>
              <div class="ev-act">
                <a :href="e.url" target="_blank" rel="noopener">공식 상세 ↗</a>
                <template v-if="isPast(e)">
                  <a v-for="v in vidsFor(e).slice(0, 2)" :key="v.id" class="vid" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener" :title="v.t">{{ v.other ? '📺' : '▶' }} {{ shortT(v.t) }}</a>
                  <small v-if="vidsFor(e).length > 2" class="vid-more">+{{ vidsFor(e).length - 2 }}</small>
                </template>
                <template v-if="!isPast(e)">
                  <button type="button" class="go" :class="{ on: isGoing(e), pop: popKey === goingKey(e) }" :aria-pressed="isGoing(e)" @click="toggleGoing(e)">
                    <span aria-hidden="true">{{ isGoing(e) ? '💖' : e.cat === 'tv' ? '📺' : '✋' }}</span> {{ e.cat === 'tv' ? '볼 거예요' : '갈 거예요' }}
                  </button>
                  <button type="button" @click="downloadIcs(e)">📅 .ics</button>
                  <a :href="googleCalUrl(e)" target="_blank" rel="noopener">Google 캘린더</a>
                  <a v-if="e.cat === 'live'" class="prep" :href="withBase('/live-guide/')">🔦 라이브 준비</a>
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
/* the server can't know what's next (it depends on now), so it renders a placeholder; size it like the real card and
   give the card the same floor, or the whole timeline jumps when it hydrates (desktop CLS 0.116, #235) */
.next, .skeleton { min-height: 300px; justify-content: center; }
@media (min-width: 641px) { .next, .skeleton { min-height: 287px; } }
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

.bar { position: sticky; top: calc(var(--pin-top, 64px) + 4px); z-index: 5; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 18px 0 8px; padding: 8px; border-radius: 20px; background: rgba(255, 248, 240, 0.86); backdrop-filter: blur(10px); }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
.chips::-webkit-scrollbar { display: none; }
.chip { flex: none; padding: 7px 13px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; border: 1.5px solid #f1dce7; color: var(--ink); transition: transform 0.45s var(--spring), background 0.2s, color 0.2s; }
.chip small { opacity: 0.55; margin-left: 2px; }
.chip:active { transform: scale(0.9); }
.chip[aria-pressed='true'] { background: color-mix(in srgb, var(--cc, #3a2340) 62%, #2a1030); border-color: transparent; color: #fff; }
.seg { display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: #f6e9f0; margin-left: auto; }
.seg button { padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 700; color: #5a4060; background: none; }
.seg button[aria-pressed='true'] { background: #fff; color: #3a2340; box-shadow: 0 2px 6px rgba(90, 30, 70, 0.15); }
.cal { margin-top: 14px; padding: 18px; border-radius: 26px; background: #fff; border: 1.5px solid #f3dbe8; }
.cal-head { display: flex; align-items: center; justify-content: center; gap: 18px; }
.cal-head b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px; min-width: 150px; text-align: center; }
.nav { width: 36px; height: 36px; border-radius: 50%; font-size: 22px; line-height: 1; background: #faf2f6; color: #3a2340; }
.nav:disabled { opacity: 0.35; }
.wk { display: grid; grid-template-columns: repeat(7, 1fr); margin-top: 12px; text-align: center; font-size: 12px; font-weight: 800; color: #735779; }
.wk .sun { color: #c42235; } .wk .sat { color: #2b5ea8; }
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 6px; }
.day-c { position: relative; min-height: 86px; padding: 6px; border-radius: 14px; background: #fdf8fa; text-align: left; display: flex; flex-direction: column; gap: 4px; color: #3a2340; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1), background 0.2s; }
.day-c.blank { background: none; }
/* #d-YYYY-MM-DD links: keep the day clear of the sticky nav + filter bar, also for the browser's own hash scroll */
.day { scroll-margin-top: 190px; }
@media (max-width: 640px) { .day { scroll-margin-top: 72px; } }
.mine-dot { position: absolute; top: 4px; right: 5px; font-size: 11px; line-height: 1; }
.mine-pill { background: #fde3ee !important; color: #8a2350 !important; }
.day-c.has { background: #fff3f8; cursor: pointer; }
.day-c.has:hover { transform: translateY(-2px); background: #ffe8f2; }
.day-c.past { opacity: 0.5; }
.day-c.today { box-shadow: inset 0 0 0 2px #c92f69; }
.day-c.sel { background: #3a2340; color: #fff; }
.day-c:disabled:not(.blank) { cursor: default; }
.dn { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }
.pips { display: flex; gap: 3px; }
.pips i { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 0 1.5px #fff; }
.first { font-size: 11px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sel-list { display: grid; gap: 8px; margin-top: 14px; }
.sel-list a { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 16px; border-left: 5px solid var(--cc); background: #fdf6fa; color: #3a2340 !important; text-decoration: none !important; }
.sel-list b { font-family: 'Noto Sans JP', sans-serif; font-size: 15px; }
.sel-list small { font-size: 12.5px; color: #5a4060; }
.sel-list .pill { align-self: flex-start; }
.cal-hint { margin: 12px 0 0 !important; text-align: center; font-size: 13px; color: #735779; }
.past { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #735779; white-space: nowrap; cursor: pointer; }
.past input { accent-color: #ff6b9d; }

.ics-all-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 14px 0 0; }
.ics-all { padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 800; color: #fff; background: #3a2340; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.ics-all:hover { transform: translateY(-2px); }
.share-mine { padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 800; color: #8a2350; background: #fde3ee; transition: transform 0.4s var(--spring), background 0.2s; }
.share-mine:hover { transform: translateY(-2px); }
.share-mine.done { background: #c2185b; color: #fff; }
@media (prefers-reduced-motion: reduce) { .share-mine { transition: none; } }
.ics-all-row small { font-size: 12px; color: #735779; }
@media (prefers-reduced-motion: reduce) { .ics-all { transition: none; } }
.mjump { flex-basis: 100%; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 2px 2px 0; }
.mjump::-webkit-scrollbar { display: none; }
.mjump button { flex: none; display: inline-flex; align-items: baseline; gap: 4px; padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 800; color: #5a4060; background: #fff; border: 1.5px solid #f1d4e1; transition: background 0.2s, color 0.2s, transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.mjump button small { font-size: 10.5px; color: #6a4f70; }
.mjump button i { font-style: normal; font-size: 11px; color: #6a4f70; }
.mjump button:hover { transform: translateY(-1px); }
.mjump button.on { background: #c92f69; border-color: #c92f69; color: #fff; }
.mjump button.on small, .mjump button.on i { color: #ffe0ec; }
.mo { margin-top: 26px; scroll-margin-top: calc(var(--vp-nav-height, 64px) + 130px); }
@media (prefers-reduced-motion: reduce) { .mjump button { transition: none; } }
.mo-h { display: flex; align-items: baseline; gap: 8px; margin: 0 0 10px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 30px !important; }
.mo-h small { font-size: 14px; color: #6a4f70; }
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
.pill { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: color-mix(in srgb, var(--cc) 14%, white); color: color-mix(in srgb, var(--cc) 48%, #2a1030); }
.bday { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: color-mix(in srgb, var(--cc) 62%, #2a1030); color: #fff; }
.dd { margin-left: auto; font-size: 12px; font-weight: 800; color: #6a4f70; font-variant-numeric: tabular-nums; }
.dd.hot { color: #fff; background: #ff3b6f; padding: 2px 8px; border-radius: 999px; animation: pulse 1.4s ease-in-out infinite; }
.dd.live { background: #c2185b; letter-spacing: 0.04em; }
@keyframes pulse { 50% { transform: scale(1.08); } }
.ev-ja { margin: 8px 0 2px !important; padding: 0 !important; border: 0 !important; font-family: 'Noto Sans JP', sans-serif; font-size: 16px !important; line-height: 1.4 !important; font-weight: 700; overflow-wrap: anywhere; white-space: normal; }
.ev-ko { margin: 0 !important; font-size: 13px; color: #6a4a70; }
.ev-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 6px 0 0 !important; font-size: 12.5px; color: #735779; }
.ev-act { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.ev-act a, .ev-act button { font-size: 12px; font-weight: 700; padding: 6px 11px; border-radius: 999px; background: #faf3f7; color: var(--ink) !important; text-decoration: none !important; transition: transform 0.4s var(--spring), background 0.2s; }
.ev-act button.go { position: relative; background: #fff; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--cc) 45%, white); }
.ev-act button.go.on { background: color-mix(in srgb, var(--cc) 62%, #2a1030); color: #fff !important; box-shadow: none; }
.ev-act button.go.pop span { display: inline-block; animation: go-pop 0.6s var(--spring); }
.ev-act button.go.pop::after { content: '♥ ♥ ♥'; position: absolute; left: 50%; top: -4px; transform: translateX(-50%); font-size: 11px; letter-spacing: 6px; color: var(--cc); pointer-events: none; animation: go-burst 0.7s ease-out forwards; }
@keyframes go-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.35); } 100% { transform: scale(1); } }
@keyframes go-burst { from { opacity: 1; transform: translate(-50%, 4px) scale(0.6); } to { opacity: 0; transform: translate(-50%, -16px) scale(1.15); } }
.ev.mine { box-shadow: 0 0 0 2px color-mix(in srgb, var(--cc) 55%, white), 0 10px 24px -18px rgba(90, 30, 70, 0.5); }
.chip.mine[aria-pressed='true'] { background: #c2185b; }
html[data-oshi] .chip.mine[aria-pressed='true'] { background: var(--custo-accent); }
@media (prefers-reduced-motion: reduce) { .ev-act button.go.pop span, .ev-act button.go.pop::after { animation: none; } .ev-act button.go.pop::after { content: none; } }
.ev-act a:hover, .ev-act button:hover { transform: translateY(-2px); background: color-mix(in srgb, var(--cc) 18%, white); }
.empty { text-align: center; padding: 40px 0; color: #735779; }
.ev-act a.vid { background: #2f1a35; color: #fff !important; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev-act a.prep { background: #fff3c4; color: #5a3d00 !important; }
.vid-more { align-self: center; font-size: 12px; font-weight: 700; color: #735779; }
.src { margin-top: 28px !important; font-size: 12px; color: #735779; }

@media (max-width: 640px) {
  .bar.compact .chips, .bar.compact .past, .bar.compact .seg { display: none; }
  .bar.compact { padding: 6px 8px; }
  .day-c { min-height: 54px; padding: 4px; border-radius: 10px; }
  .first { display: none; }
  .cal { padding: 12px; }
  .seg { margin-left: 0; }
  .next { padding: 20px; border-radius: 22px; }
  .clock { gap: 6px; }
  .clock > span { min-width: 0; flex: 1; padding: 8px 4px; }
  .clock b { font-size: 26px; }
  .day { grid-template-columns: 48px 1fr; gap: 10px; }
  .date { height: 52px; border-radius: 14px; }
  .date b { font-size: 20px; }
  .chips { flex-basis: 100%; }
  .past { padding-left: 4px; }
  .ev-ja { font-size: 14.5px !important; }
}
@media (prefers-reduced-motion: reduce) {
  .next::after, .dot, .tick, .dd.hot, .ev { animation: none !important; }
  .next, .ev, .chip { transition: none; }
}
</style>
