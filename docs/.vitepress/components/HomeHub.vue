<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { members, daysToBirthday, ageOn, onColor } from '../data/members'
import BirthdayParty from './BirthdayParty.vue'
import homeVideos from '../data/home-videos.json'
import { events, startMs } from '../data/events'
import LegendOfDay from './LegendOfDay.vue'
import TodayDigest from './TodayDigest.vue'
import { useOshi } from '../theme/oshi'
import NewsFeed from './NewsFeed.vue'

interface Video { id: string; title: string; duration: string; category: string; members: string[]; date: string; venue: string; channel?: string; published?: string }
const TOTAL = (homeVideos as { total: number }).total
const latest = (homeVideos as { latest: Video[] }).latest
const dated = ref<{ id: string; title: string; date: string }[]>([]) // otd-videos.json, loaded after mount

// Featured milestones come from the shared, source-verified schedule data
const EMOJI: Record<string, string> = { event: '❄️', live: '🎡', release: '💿', tv: '🎍' }
// featured events that have an in-site special page
const INTERNAL: Record<string, string> = { '2026-12-02': '/cutie-land/', '2026-12-31': '/kohaku/', '2027-01-23': '/korea/' }
const EVENTS = events.filter((e) => e.featured).map((e) => ({
  id: e.date + e.cat, at: new Date(startMs(e)).toISOString(),
  // shown until it ends: the published end time, otherwise the end of its Japan date
  until: Date.parse(`${e.date}T${e.end ?? '23:59'}:59+09:00`), label: e.short ?? e.ja, ko: e.ko + (e.venue ? ` · ${e.venue}` : ''), emoji: EMOJI[e.cat] ?? '✨', link: INTERNAL[e.date] ? withBase(INTERNAL[e.date]) : e.url, ext: !INTERNAL[e.date],
}))

const now = ref<number | null>(null)
let timer: number | undefined
const upcoming = computed(() => {
  const t = now.value ?? 0
  return EVENTS.map((e) => ({ ...e, ms: new Date(e.at).getTime() - t })).filter((e) => !now.value || e.until > t).slice(0, 4) // nearest four fill the 4-col / 2-col grid
})
function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}
const pad = (n: number) => String(n).padStart(2, '0')

// Count-up stats
const STATS = [
  { n: 8, unit: '명', label: '멤버' },
  { n: 3, unit: '장', label: 'CD 싱글 (3rd 오리콘 1위)' },
  { n: TOTAL, unit: '편', label: '공식 영상 아카이브' },
  { n: 77, unit: '회', label: '紅白 첫 출장' },
]
const shown = ref(STATS.map(() => 0))
const statsEl = ref<HTMLElement | null>(null)
let io: IntersectionObserver | undefined

// Sparkle trail
const hero = ref<HTMLElement | null>(null)
let reduce = false
let last = 0
function sparkle(e: PointerEvent) {
  if (reduce || !hero.value) return
  const t = performance.now()
  if (t - last < 40) return
  last = t
  const r = hero.value.getBoundingClientRect()
  const s = document.createElement('span')
  s.className = 'spark'
  s.textContent = ['✦', '♡', '✧', '★'][Math.floor(Math.random() * 4)]
  s.style.left = e.clientX - r.left + 'px'
  s.style.top = e.clientY - r.top + 'px'
  s.style.color = members[Math.floor(Math.random() * 8)].color
  s.style.setProperty('--dx', (Math.random() - 0.5) * 60 + 'px')
  hero.value.appendChild(s)
  setTimeout(() => s.remove(), 900)
}

const today = ref<Date | null>(null)
const forceBday = ref('')
const bdayToday = computed(() => (today.value ? members.find((m) => m.id === forceBday.value || daysToBirthday(m.birthday, today.value!) === 0) ?? null : null))
// Korea show banner (Korean fans' headline) — from the official schedule, hidden once it has passed
const korea = events.find((e) => e.ja.includes('Live in Korea'))
const koreaDays = computed(() => (korea && today.value ? Math.ceil((new Date(`${korea.date}T00:00:00+09:00`).getTime() - today.value.getTime()) / 86400000) : null))
const oshi = useOshi()
const oshiM = computed(() => (oshi.value ? members.find((m) => m.id === oshi.value) ?? null : null))
const koreaInCountdown = computed(() => !!korea && upcoming.value.some((e) => e.id === korea.date + korea.cat)) // card already shows it
// 1st album countdown for the EXPLORE tile (JST midnight of release day)
const albumD = computed(() => (today.value ? Math.ceil((Date.parse('2026-12-02T00:00:00+09:00') - today.value.getTime()) / 86400000) : null))
const bdaySoon = computed(() => (today.value && !bdayToday.value ? members.map((m) => ({ m, d: daysToBirthday(m.birthday, today.value!) })).filter((x) => x.d > 0 && x.d <= 14).sort((a, b) => a.d - b.d)[0] ?? null : null))
// N years ago around today (JST month-day, ±3 days) from dated official videos
const onThisDay = computed(() => {
  if (!today.value) return []
  const jst = new Date(today.value.getTime() + 9 * 3600e3)
  const y = jst.getUTCFullYear(), md = Date.UTC(2000, jst.getUTCMonth(), jst.getUTCDate())
  return dated.value.filter((v) => Number(v.date.slice(0, 4)) < y).map((v) => {
    const [vy, vm, vd] = v.date.split('-').map(Number)
    return { v, ago: y - vy, diff: Math.round((Date.UTC(2000, vm - 1, vd) - md) / 86400000) }
  }).filter((x) => Math.abs(x.diff) <= 3).sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff) || b.ago - a.ago).slice(0, 4)
})
onMounted(() => {
  import('../data/otd-videos.json').then(async (m) => {
    dated.value = m.default
    await nextTick()
    const el = document.getElementById('otd'); if (el && spy) spy.observe(el) // section appears after load
  })
  today.value = new Date()
  forceBday.value = new URLSearchParams(location.search).get('bday') ?? '' // preview: ?bday=<id>
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  now.value = Date.now()
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
  io = new IntersectionObserver((entries) => {
    if (!entries.some((en) => en.isIntersecting)) return
    io?.disconnect()
    if (reduce) { shown.value = STATS.map((s) => s.n); return }
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1400)
      const ease = 1 - Math.pow(1 - p, 4)
      shown.value = STATS.map((s) => Math.round(s.n * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, { threshold: 0.4 })
  if (statsEl.value) io.observe(statsEl.value)
})
// Section dot navigator (scroll spy)
const SECTIONS = [
  { id: 'today', label: '오늘의 큐스트', c: '#ff4d8d' }, { id: 'top', label: '홈', c: '#ff6b9d' }, { id: 'next', label: '다가오는 일정', c: '#ffc93c' }, { id: 'legend', label: '오늘의 레전드 컷', c: '#ff4757' },
  { id: 'otd', label: 'ON THIS DAY', c: '#3ccfa8' }, { id: 'colors', label: '8 COLORS', c: '#4a90d9' }, { id: 'new', label: 'NEW ON YOUTUBE', c: '#ff9f43' }, { id: 'explore', label: 'EXPLORE', c: '#a06cd5' },
]
const activeSec = ref('top')
let spy: IntersectionObserver | undefined
function goSec(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
onMounted(() => {
  spy = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) activeSec.value = e.target.id }, { rootMargin: '-45% 0px -50% 0px' })
  for (const s of SECTIONS) { const el = document.getElementById(s.id); if (el) spy.observe(el) }
})
onBeforeUnmount(() => { clearInterval(timer); io?.disconnect(); spy?.disconnect() })

const HEAD1 = '귀여움으로'.split('')
const HEAD2 = '세계까지'.split('')
function cleanTitle(t: string) {
  return t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍[^【]*/, '').trim()
}
</script>

<template>
  <div class="hh">
    <nav class="dots" aria-label="홈 섹션 이동">
      <button v-for="sct in SECTIONS" :key="sct.id" type="button" class="dot-btn" :class="{ on: activeSec === sct.id }" :style="{ '--dc': sct.c }"
        :aria-label="sct.label" :aria-current="activeSec === sct.id ? 'true' : undefined" @click="goSec(sct.id)">
        <span class="dot-label">{{ sct.label }}</span><i />
      </button>
    </nav>
    <!-- TODAY (top of home) -->
    <TodayDigest />
    <!-- HERO -->
    <section id="top" ref="hero" class="hero" @pointermove="sparkle">
      <div class="hero-copy">
        <p class="eyebrow"><span class="live-dot" />CUTIE STREET 팬허브 · KR ⇄ JP</p>
        <a v-if="oshiM" class="oshi-chip" :href="withBase(`/members/${oshiM.id}`)" :style="{ '--mc': oshiM.color }">💖 나의 최애 · <b>{{ oshiM.ko.split(' ')[1] }}</b> {{ oshiM.emoji }} →</a>
        <h1 class="head">
          <span class="line"><span v-for="(c, i) in HEAD1" :key="'a' + i" class="ch" :style="{ '--i': i, '--c': members[i % 8].color }">{{ c }}</span></span>
          <span class="line"><span v-for="(c, i) in HEAD2" :key="'b' + i" class="ch" :style="{ '--i': i + 6, '--c': members[(i + 5) % 8].color }">{{ c }}</span><span class="globe" aria-hidden="true">🌏</span></span>
        </h1>
        <p class="tag-ja">かわいいで、世界へ。 <span>— 原宿から世界へ KAWAII を届ける 8人組</span></p>
        <div class="cta">
          <a class="btn primary" :href="withBase('/members/')">멤버 만나기 <span aria-hidden="true">→</span></a>
          <a class="btn" :href="withBase('/videos/')">영상 아카이브</a>
          <a class="btn ghost" :href="withBase('/start/')">🎓 처음이에요</a>
          <a class="btn ghost" :href="withBase('/journey/')">🗻 정상까지의 여정</a>
        </div>
      </div>

      <div class="orbit-wrap">
        <div class="core" aria-hidden="true"><b>CUTIE</b><b>STREET</b><small>KAWAII LAB.</small></div>
        <nav class="orbit" aria-label="멤버 바로가기">
          <a v-for="(m, i) in members" :key="m.id" class="sat" :href="withBase(`/members/${m.id}`)" :aria-label="`${m.ko} (${m.ja}) 페이지`"
            :style="{ '--a': i * 45 + 'deg', '--mc': m.color, '--on': onColor(m.color) }"><i>{{ m.ja.slice(-2, -1) }}<span class="sat-tip">{{ m.ko.split(' ')[1] }} {{ m.emoji }}</span></i></a>
        </nav>
        <div class="ring r1" aria-hidden="true" /><div class="ring r2" aria-hidden="true" />
      </div>
    </section>

    <!-- COUNTDOWN -->
    <section id="next" class="cd" aria-label="다가오는 일정">
      <a v-for="(e, i) in upcoming" :key="e.id" class="cd-card" :class="{ next: i === 0 }" :href="e.link" :target="e.ext ? '_blank' : undefined" :rel="e.ext ? 'noopener' : undefined">
        <span class="cd-emoji" aria-hidden="true">{{ e.emoji }}</span>
        <span class="cd-label">{{ e.label }}</span>
        <span class="cd-ko">{{ e.ko }}</span>
        <span v-if="now === null" class="cd-d">D-··</span>
        <span v-else-if="e.ms <= 0" class="cd-d now">TODAY ✨</span>
        <template v-else>
          <span class="cd-d">D-{{ parts(e.ms).d }}</span>
          <span v-if="i === 0" class="cd-clock">
            <b>{{ pad(parts(e.ms).h) }}</b>:<b>{{ pad(parts(e.ms).m) }}</b>:<b :key="parts(e.ms).s" class="tick">{{ pad(parts(e.ms).s) }}</b>
          </span>
        </template>
      </a>
    </section>

    <a v-if="korea && koreaDays !== null && koreaDays >= 0 && !koreaInCountdown" class="kr" :href="withBase('/korea/')">
      <span class="kr-flag" aria-hidden="true">🇰🇷</span>
      <span class="kr-txt"><small>한국 공연 확정</small><b>{{ korea.ja }}</b><span>{{ korea.date.replace(/-/g, '.') + ' · ' + korea.venue + ' · ' + (korea.time ?? '') + ' 시작 · 멜론티켓 예매' }}</span></span>
      <span class="kr-dd">{{ koreaDays === 0 ? 'TODAY' : 'D-' + koreaDays }}</span>
    </a>
    <BirthdayParty v-if="bdayToday" :m="bdayToday" :age="today ? ageOn(bdayToday.birthday, today) + (daysToBirthday(bdayToday.birthday, today) === 0 ? 0 : 1) : null" compact />
    <a v-else-if="bdaySoon" class="soon" :href="withBase(`/members/${bdaySoon.m.id}`)" :style="{ '--mc': bdaySoon.m.color }">🎂 <b>{{ bdaySoon.m.ko }}</b> 생일까지 <b>D-{{ bdaySoon.d }}</b> · {{ bdaySoon.m.birthday.slice(5).replace('-', '/') }} {{ bdaySoon.m.emoji }}</a>
    <NewsFeed mode="ticker" />

    <!-- STATS -->
    <section ref="statsEl" class="stats">
      <div v-for="(s, i) in STATS" :key="s.label" class="stat">
        <b>{{ shown[i] }}<small>{{ s.unit }}</small></b>
        <span>{{ s.label }}</span>
      </div>
    </section>

    <LegendOfDay id="legend" />

    <section v-if="onThisDay.length" id="otd" class="sec otd">
      <div class="sec-head"><h2>ON THIS DAY</h2><span class="otd-sub">몇 년 전 이맘때의 큐티스트리트</span></div>
      <div class="otd-grid">
        <a v-for="x in onThisDay" :key="x.v.id" class="otd-card" :href="`https://www.youtube.com/watch?v=${x.v.id}`" target="_blank" rel="noopener">
          <span class="otd-th"><img :src="`https://i.ytimg.com/vi/${x.v.id}/mqdefault.jpg`" alt="" loading="lazy" /><b>{{ x.ago }}년 전 {{ x.diff === 0 ? '오늘' : '이맘때' }}</b></span>
          <span class="otd-t">{{ cleanTitle(x.v.title) }}</span><small>{{ x.v.date.replace(/-/g, '.') }}</small>
        </a>
      </div>
    </section>

    <!-- MEMBERS ACCORDION -->
    <section id="colors" class="sec">
      <div class="sec-head"><h2>8 COLORS, 1 STREET</h2><a :href="withBase('/members/')">전체 멤버 →</a></div>
      <div class="acc">
        <a v-for="(m, i) in members" :key="m.id" class="acc-item" :href="withBase(`/members/${m.id}`)" :style="{ '--mc': m.color, '--i': i }">
          <span class="acc-kanji" aria-hidden="true">{{ m.ja.slice(-2, -1) }}</span>
          <span class="acc-body">
            <b>{{ m.ja }}</b>
            <span>{{ m.ko }} · {{ m.emoji }} {{ m.colorName }}</span>
          </span>
        </a>
      </div>
    </section>

    <!-- LATEST VIDEOS -->
    <section id="new" class="sec">
      <div class="sec-head"><h2>NEW ON YOUTUBE</h2><a :href="withBase('/videos/')">아카이브 {{ TOTAL }}편 →</a></div>
      <div class="rail">
        <a v-for="v in latest" :key="v.id" class="rv" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener">
          <span class="rv-thumb"><img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" width="320" height="180" /><span v-if="v.duration" class="rv-dur">{{ v.duration }}</span><span v-if="v.published && now !== null && now - new Date(v.published + 'T00:00:00Z').getTime() < 7 * 86400000" class="rv-new">NEW</span></span>
          <span class="rv-ttl">{{ cleanTitle(v.title) }}</span>
          <span v-if="v.date" class="rv-date">{{ v.date.replace(/-/g, '.') }}</span>
        </a>
      </div>
    </section>

    <!-- EXPLORE -->
    <section id="explore" class="sec">
      <div class="sec-head"><h2>EXPLORE</h2></div>
      <div class="bento">
        <a class="b b-lg" :href="withBase('/journey/')"><span class="b-emoji">🗻</span><b>정상까지의 여정</b><span>데뷔부터 紅白까지, 3D로 오르는 큐스트의 길</span></a>
        <a class="b" :href="withBase('/units/')"><span class="b-emoji">💞</span><b>유닛 & 케미</b><span>멤버 조합 케미 파인더</span></a>
        <a class="b b-kr" :href="withBase('/korea/')"><span class="b-emoji">🇰🇷</span><b>큐스트 in KOREA</b><span>한국 공연·한국어 버전 곡</span></a>
        <a class="b" :href="withBase('/discography/')"><span class="b-emoji">💿</span><b>디스코그래피</b><span>싱글 & 앨범</span></a>
        <a class="b" :href="withBase('/stages/')"><span class="b-emoji">🎬</span><b>레전드 무대</b><span>엠카·THE FIRST TAKE</span></a>
        <a class="b" :href="withBase('/schedule/')"><span class="b-emoji">📅</span><b>스케줄</b><span>투어·방송·이벤트</span></a>
        <a class="b" :href="withBase('/which-member/')"><span class="b-emoji">🔮</span><b>나와 닮은 멤버</b><span>6문항 테스트</span></a>
        <a class="b" :href="withBase('/live-guide/')"><span class="b-emoji">🔦</span><b>펜라이트 가이드</b><span>라이브 준비</span></a>
        <a class="b" :href="withBase('/kohaku/')"><span class="b-emoji">🎍</span><b>紅白 특집</b><span>12/31 첫 출장 카운트다운</span></a>
        <a class="b b-quiz" :href="withBase('/mv-quiz/')"><i class="b-new">NEW</i><span class="b-emoji">🎯</span><b>MV 장면 퀴즈</b><span>흐릿한 한 장면, 무슨 곡일까? · 📅 오늘의 5문제</span></a>
        <a class="b" :href="withBase('/appearances/')"><i class="b-new">NEW</i><span class="b-emoji">📺</span><b>출연 아카이브</b><span>다른 채널에 나온 큐스트</span></a>
        <a class="b b-cl" :href="withBase('/cutie-land/')"><span class="b-emoji">💿</span><b>CUTIE LAND</b><span>{{ albumD === null ? '1st ALBUM 12.02' : albumD > 0 ? `1st ALBUM 발매 D-${albumD}` : albumD === 0 ? '오늘 발매! 🎉' : '1st ALBUM 발매 중' }}</span></a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hh {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340;
  max-width: 1240px; margin: 0 auto; padding: 24px 24px 80px; color: var(--ink);
}

/* HERO */
.hero {
  position: relative; display: grid; grid-template-columns: 1.15fr 1fr; align-items: center; gap: 24px;
  min-height: 560px; padding: 32px 8px; overflow: hidden; border-radius: 40px;
}
.hero :deep(.spark) {
  position: absolute; pointer-events: none; font-size: 16px; translate: -50% -50%;
  animation: spark 0.9s cubic-bezier(.2, .8, .2, 1) forwards; z-index: 3;
}
@keyframes spark { to { opacity: 0; transform: translate(var(--dx), -50px) scale(0.3) rotate(120deg); } }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #c2457a; background: #fff; padding: 6px 14px; border-radius: 999px; box-shadow: 0 6px 16px -10px rgba(255, 107, 157, 0.6); margin: 0 0 22px; }
.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff4f8b; box-shadow: 0 0 0 0 rgba(255, 79, 139, 0.6); animation: ping 1.6s infinite; }
@keyframes ping { 70% { box-shadow: 0 0 0 10px rgba(255, 79, 139, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 79, 139, 0); } }
.head { margin: 0; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: clamp(54px, 8.4vw, 112px); line-height: 1.02; letter-spacing: -0.03em; border: 0; }
.line { display: block; white-space: nowrap; }
.ch {
  display: inline-block; color: var(--ink);
  animation: chIn 1s var(--spring) both, chHue 6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 70ms), calc(var(--i) * 300ms + 1.2s);
  transition: transform 0.5s var(--spring), color 0.2s;
}
.ch:hover { transform: translateY(-0.12em) rotate(-6deg) scale(1.06); color: var(--c); }
@keyframes chIn { from { opacity: 0; transform: translateY(0.6em) rotate(10deg) scale(0.4); filter: blur(6px); } }
@keyframes chHue { 0%, 85%, 100% { color: var(--ink); } 90% { color: var(--c); } }
.globe { display: inline-block; font-size: 0.7em; margin-left: 0.12em; vertical-align: 0.1em; animation: spin 8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.tag-ja { margin: 22px 0 0; font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: 22px; font-weight: 700; color: #c2457a; }
.tag-ja span { display: block; font-size: 14px; font-weight: 400; color: #735779; margin-top: 6px; font-family: 'Noto Sans JP', sans-serif; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
.btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 14px 22px; border-radius: 999px; font-weight: 700; font-size: 15px;
  background: #fff; color: var(--ink) !important; text-decoration: none !important; border: 1.5px solid #f3cfe0;
  transition: transform 0.5s var(--spring), box-shadow 0.3s;
}
.btn:hover { transform: translateY(-3px) rotate(-1.5deg); box-shadow: 0 14px 26px -16px rgba(150, 60, 110, 0.6); }
.btn:active { transform: scale(0.94); }
.btn.primary { background: var(--ink); color: #fff !important; border-color: var(--ink); }
.btn.primary span { transition: transform 0.5s var(--spring); }
.btn.primary:hover span { transform: translateX(4px); }
.btn.ghost { background: transparent; border-style: dashed; }

.orbit-wrap { position: relative; width: min(460px, 100%); aspect-ratio: 1; justify-self: center; }
.core {
  position: absolute; inset: 30%; border-radius: 50%; display: grid; place-content: center; text-align: center; gap: 0;
  background: radial-gradient(circle at 35% 30%, #fff, #ffe1ee 60%, #f1dcff);
  box-shadow: 0 30px 60px -30px rgba(255, 107, 157, 0.8), inset 0 -10px 30px rgba(196, 156, 255, 0.35);
  font-family: 'Zen Maru Gothic', sans-serif; animation: breathe 4s ease-in-out infinite;
}
.core b { font-size: clamp(18px, 2.6vw, 28px); line-height: 1.05; letter-spacing: 0.06em; background: linear-gradient(135deg, #ff6b9d, #a06cd5); -webkit-background-clip: text; background-clip: text; color: transparent; }
.core small { font-size: 10px; letter-spacing: 0.24em; color: #7d6083; margin-top: 6px; font-weight: 700; }
@keyframes breathe { 50% { transform: scale(1.04); } }
.ring { position: absolute; border-radius: 50%; border: 1.5px dashed rgba(196, 156, 255, 0.45); }
.r1 { inset: 6%; animation: spin 40s linear infinite; }
.r2 { inset: 18%; border-color: rgba(255, 107, 157, 0.35); animation: spin 28s linear infinite reverse; }
.orbit { position: absolute; inset: 0; z-index: 2; pointer-events: none; animation: spin 24s linear infinite; }
.orbit .sat { pointer-events: auto; }
.ring, .core { pointer-events: none; }
.orbit-wrap:hover .orbit, .orbit-wrap:hover .sat i, .orbit:focus-within, .orbit:focus-within .sat i { animation-play-state: paused; }
.sat {
  position: absolute; left: 50%; top: 50%; width: 15%; aspect-ratio: 1; margin: -7.5% 0 0 -7.5%;
  transform: rotate(var(--a)) translateX(205%) rotate(calc(-1 * var(--a)));
}
.sat i {
  position: relative; display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; font-style: normal;
  background: var(--mc); color: var(--on, #fff); font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: clamp(14px, 2vw, 22px);
  box-shadow: 0 10px 22px -8px var(--mc), inset 0 -4px 0 rgba(0, 0, 0, 0.08);
  animation: spin 24s linear infinite reverse;
  transition: scale 0.45s var(--spring), box-shadow 0.3s;
}
.sat { text-decoration: none !important; border-radius: 50%; }
.sat:hover i, .sat:focus-visible i { scale: 1.22; box-shadow: 0 14px 28px -8px var(--mc), 0 0 0 4px #fff, inset 0 -4px 0 rgba(0, 0, 0, 0.08); }
.sat-tip { position: absolute; left: 50%; top: calc(100% + 6px); translate: -50% 4px; white-space: nowrap; font-size: 10px; font-family: 'Noto Sans KR', sans-serif; font-weight: 800; padding: 3px 9px; border-radius: 999px;
  background: #3a2340; color: #fff; opacity: 0; pointer-events: none; transition: opacity 0.2s, translate 0.35s var(--spring); }
.sat:hover .sat-tip, .sat:focus-visible .sat-tip { opacity: 1; translate: -50% 0; }

.oshi-chip { display: inline-flex; align-items: center; gap: 4px; margin: 10px 0 14px 8px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; text-decoration: none !important;
  color: #fff !important; background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); transition: transform 0.45s var(--spring); }
.oshi-chip:hover { transform: translateY(-2px) rotate(-1deg); }
/* COUNTDOWN */
.cd { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
.cd-card {
  position: relative; display: flex; flex-direction: column; gap: 2px; padding: 18px; border-radius: 24px; overflow: hidden;
  background: #fff; color: var(--ink) !important; text-decoration: none !important; border: 1.5px solid #f6dce9;
  transition: transform 0.5s var(--spring), box-shadow 0.3s;
}
.cd-card:hover { transform: translateY(-4px); box-shadow: 0 18px 30px -20px rgba(150, 60, 110, 0.6); }
.cd-card.next { background: linear-gradient(140deg, #3a2340, #6b2f63); color: #fff !important; border-color: transparent; }
.cd-card.next::after {
  content: ''; position: absolute; inset: -40%; background: conic-gradient(from 0deg, transparent, rgba(255, 107, 157, 0.35), transparent 30%);
  animation: spin 6s linear infinite; pointer-events: none;
}
.cd-card > * { position: relative; z-index: 1; }
.cd-emoji { font-size: 22px; }
.cd-label { font-family: 'Noto Sans JP', sans-serif; font-weight: 700; font-size: 14px; margin-top: 6px; }
.cd-ko { font-size: 12px; opacity: 0.7; }
.cd-d { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 36px; margin-top: 8px; font-variant-numeric: tabular-nums; color: #e8558a; }
.next .cd-d { color: #ffb3cf; }
.cd-clock { font-variant-numeric: tabular-nums; font-size: 15px; opacity: 0.9; }
.cd-clock b { display: inline-block; min-width: 1.4em; text-align: center; }
.tick { animation: tick 0.5s var(--spring); }
@keyframes tick { from { transform: translateY(-40%); opacity: 0; } }

/* STATS */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px; }
.stat { padding: 18px; border-radius: 24px; background: linear-gradient(160deg, #fff0f6, #f6efff); text-align: center; }
.stat b { display: block; font-family: 'Zen Maru Gothic', sans-serif; font-size: 44px; line-height: 1.1; font-variant-numeric: tabular-nums; background: linear-gradient(135deg, #ff6b9d, #a06cd5); -webkit-background-clip: text; background-clip: text; color: transparent; }
.stat b small { font-size: 18px; }
.stat span { font-size: 13px; color: #735779; font-weight: 600; }

/* SECTIONS */
.sec { margin-top: 64px; }
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.sec-head h2 { margin: 0; border: 0; padding: 0; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(26px, 4vw, 40px); letter-spacing: 0.02em; line-height: 1.1; }
.sec-head a { font-size: 14px; font-weight: 700; color: #c2457a !important; white-space: nowrap; }
@supports (animation-timeline: view()) {
  .sec-head h2 { animation: slideIn linear both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-30px); letter-spacing: 0.3em; } }
}

/* SECTION DOTS */
.dots { position: fixed; right: 18px; top: 50%; translate: 0 -50%; z-index: 20; display: flex; flex-direction: column; gap: 10px; }
.dot-btn { position: relative; display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 2px; background: none; }
.dot-btn i { width: 10px; height: 10px; border-radius: 999px; background: color-mix(in srgb, var(--dc) 35%, white); box-shadow: 0 0 0 2px #fff; transition: height 0.45s var(--spring), background 0.2s; }
.dot-btn.on i { height: 26px; background: var(--dc); }
.dot-label { position: absolute; right: 22px; white-space: nowrap; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #3a2340; color: #fff;
  opacity: 0; translate: 6px 0; pointer-events: none; transition: opacity 0.2s, translate 0.35s var(--spring); }
.dot-btn:hover .dot-label, .dot-btn:focus-visible .dot-label { opacity: 1; translate: 0 0; }
[id='today'], [id='top'], [id='next'], [id='legend'], [id='otd'], [id='colors'], [id='new'], [id='explore'] { scroll-margin-top: calc(var(--vp-nav-height, 64px) + 16px); }
@media (max-width: 1100px) { .dots { display: none; } }

/* BIRTHDAY SOON + ON THIS DAY */
.kr { position: relative; display: flex; align-items: center; gap: 14px; margin-top: 14px; padding: 14px 20px; border-radius: 22px; overflow: hidden; text-decoration: none !important; color: #3a2340 !important;
  background: linear-gradient(110deg, #fff 0%, #fff4f8 45%, #eef4ff 100%); border: 1.5px solid #f1d4e1; transition: transform 0.5s var(--spring); }
.kr::after { content: ''; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.85) 50%, transparent 70%); translate: -100% 0; animation: kr-shine 4.5s ease-in-out infinite; pointer-events: none; }
@keyframes kr-shine { 0%, 55% { translate: -100% 0; } 100% { translate: 100% 0; } }
.kr:hover { transform: translateY(-2px); }
.kr-flag { font-size: 30px; line-height: 1; }
.kr-txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.kr-txt small { font-size: 11.5px; font-weight: 800; letter-spacing: 0.08em; color: #c92f69; }
.kr-txt b { font-size: 16px; }
.kr-txt span { font-size: 12.5px; color: #5a4060; }
.kr-dd { margin-left: auto; flex: none; font-family: 'Zen Maru Gothic', sans-serif; font-size: 24px; font-weight: 700; color: #2b5ea8; }
@media (prefers-reduced-motion: reduce) { .kr::after { animation: none; display: none; } .kr { transition: none; } }
.soon { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 8px 16px; border-radius: 999px; font-size: 14px; text-decoration: none !important; color: color-mix(in srgb, var(--mc) min(60%, var(--ink-mix, 100%)), #2a1030) !important; background: color-mix(in srgb, var(--mc) 14%, white); border: 1.5px solid color-mix(in srgb, var(--mc) 35%, white); transition: transform 0.45s var(--spring); }
.soon:hover { transform: translateY(-2px); }
.otd-sub { font-size: 13px; color: #735779; font-weight: 600; }
.otd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.otd-card { display: flex; flex-direction: column; gap: 4px; text-decoration: none !important; color: var(--ink) !important; transition: transform 0.5s var(--spring); }
.otd-card:hover { transform: translateY(-4px) rotate(-1deg); }
.otd-th { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #fbe9f1; filter: sepia(0.25) saturate(0.9); transition: filter 0.4s; }
.otd-card:hover .otd-th { filter: none; }
.otd-th img { width: 100%; height: 100%; object-fit: cover; }
.otd-th b { position: absolute; left: 8px; top: 8px; font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); color: #a33366; }
.otd-t { font-size: 13px; font-weight: 600; line-height: 1.4; font-family: 'Noto Sans JP', sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.otd-card small { font-size: 12px; color: #735779; }

/* ACCORDION */
.acc { display: flex; gap: 8px; height: 320px; }
.acc-item {
  position: relative; flex: 1; min-width: 0; border-radius: 28px; overflow: hidden; text-decoration: none !important; color: #fff !important;
  background: linear-gradient(170deg, color-mix(in srgb, var(--mc) 70%, white), var(--mc) 45%, color-mix(in srgb, var(--mc) min(60%, var(--ink-mix, 100%)), #2a1030));
  transition: flex-grow 0.7s var(--spring), transform 0.5s var(--spring);
  display: flex; align-items: flex-end;
}
.acc-item:hover, .acc-item:focus-visible,
.acc:not(:hover):not(:focus-within) .acc-item:first-child { flex-grow: 4; }
.acc:not(:hover):not(:focus-within) .acc-item:first-child .acc-kanji { font-size: 150px; left: 18px; translate: 0 0; }
.acc:not(:hover):not(:focus-within) .acc-item:first-child .acc-body { opacity: 1; transform: none; }
.acc-kanji {
  position: absolute; top: 14px; left: 50%; translate: -50% 0; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700;
  font-size: 64px; line-height: 1; opacity: 0.9; transition: font-size 0.6s var(--spring), left 0.6s var(--spring), translate 0.6s var(--spring);
  text-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}
.acc-item:hover .acc-kanji { font-size: 150px; left: 18px; translate: 0 0; }
.acc-body { padding: 18px; display: flex; flex-direction: column; gap: 2px; opacity: 0; transform: translateY(10px); transition: opacity 0.3s, transform 0.5s var(--spring); white-space: nowrap; }
.acc-body { text-shadow: 0 1px 10px rgba(40, 10, 40, 0.45); }
.acc-body b { font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: 24px; }
.acc-body span { font-size: 13px; font-weight: 600; opacity: 0.9; }
.acc-item:hover .acc-body, .acc-item:focus-visible .acc-body { opacity: 1; transform: none; transition-delay: 0.15s; }

/* RAIL */
.rail { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 2px 12px; scrollbar-width: thin; }
.rv { flex: none; width: 260px; scroll-snap-align: start; text-decoration: none !important; color: var(--ink) !important; }
.rv-thumb { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 18px; overflow: hidden; background: #fbe9f1; box-shadow: 0 12px 24px -16px rgba(150, 60, 110, 0.6); }
.rv-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(.2, .8, .2, 1); }
.rv:hover img { transform: scale(1.07); }
.rv-new { position: absolute; left: 6px; top: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; padding: 3px 7px; border-radius: 6px; color: #fff; background: linear-gradient(135deg, #ff4757, #ff9f43); }
.rv-dur { position: absolute; right: 6px; bottom: 6px; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: rgba(30, 10, 30, 0.72); color: #fff; }
.rv-ttl { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 8px; font-size: 13.5px; font-weight: 600; line-height: 1.45; font-family: 'Noto Sans JP', sans-serif; }
.rv-date { font-size: 12px; color: #735779; }

/* BENTO */
.bento { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 150px; gap: 12px; }
.b {
  display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; padding: 18px; border-radius: 24px;
  background: #fff; border: 1.5px solid #f6dce9; color: var(--ink) !important; text-decoration: none !important;
  transition: transform 0.5s var(--spring), background 0.3s;
}
.b:hover { transform: translateY(-4px) rotate(-0.8deg); background: #fff5fa; }
.b-kr { background: linear-gradient(150deg, #fff 30%, #eaf1ff); }
.b { position: relative; }
.b-new { position: absolute; right: 12px; top: 12px; z-index: 1; padding: 2px 8px; border-radius: 999px; font-style: normal; font-size: 10.5px; font-weight: 900; letter-spacing: 0.12em; background: #ff4f8b; color: #fff; }
.b-quiz { grid-column: span 2; overflow: hidden; color: #fff !important; background: #2a1030; isolation: isolate; }
.b-quiz::before { content: ''; position: absolute; inset: -12px; z-index: -1; background: linear-gradient(100deg, rgba(42, 16, 48, 0.85) 30%, rgba(42, 16, 48, 0.25)), url('https://i.ytimg.com/vi/VQmdUnlNnds/maxres2.jpg') center / cover;
  filter: blur(7px) saturate(0.85); transform: scale(1.15); transition: filter 0.8s ease, transform 0.8s ease; }
.b-quiz:hover { background: #2a1030; }
.b-quiz:hover::before { filter: blur(0) saturate(1); transform: scale(1); }
.b-quiz b { color: #fff; }
.b-quiz span:not(.b-emoji) { color: #f3dbe7 !important; }
.b-cl { background: linear-gradient(150deg, #fff 35%, #fff1d6); }
@media (prefers-reduced-motion: reduce) { .b-quiz::before { transition: none; } }
.b-lg { grid-column: span 2; grid-row: span 2; background: linear-gradient(150deg, #ffe3ef, #efe4ff); }
.b-emoji { font-size: 28px; margin-bottom: auto; transition: transform 0.6s var(--spring); }
.b:hover .b-emoji { transform: scale(1.25) rotate(-12deg); }
.b-lg .b-emoji { font-size: 56px; }
.b b { font-size: 16px; }
.b-lg b { font-size: 26px; font-family: 'Zen Maru Gothic', sans-serif; }
.b span:not(.b-emoji) { font-size: 12.5px; color: #735779; }

@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; min-height: 0; text-align: left; }
  .orbit-wrap { width: min(340px, 90%); order: -1; }
  .cd, .stats { grid-template-columns: repeat(2, 1fr); }
  .acc { flex-direction: column; height: auto; }
  .acc-item { min-height: 64px; flex: none; }
  .acc-item:hover { flex-grow: 0; }
  .acc-kanji { font-size: 34px; left: 18px; translate: 0 0; top: 50%; margin-top: -17px; }
  .acc-item:hover .acc-kanji,
  .acc:not(:hover):not(:focus-within) .acc-item:first-child .acc-kanji { font-size: 34px; left: 18px; }
  .acc-body { opacity: 1; transform: none; padding: 12px 18px 12px 72px; }
  .acc-body b { font-size: 18px; }
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: minmax(130px, auto); }
  .otd-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 520px) {
  .hh { padding: 8px 16px 64px; }
  .hero { padding: 16px 0; gap: 8px; }
  .head { font-size: clamp(48px, 15vw, 64px); }
  .tag-ja { font-size: 18px; }
  .btn { padding: 12px 18px; font-size: 14px; }
  .cd-d { font-size: 28px; }
  .stat b { font-size: 34px; }
  .rv { width: 220px; }
}
@media (prefers-reduced-motion: reduce) {
  .ch, .globe, .orbit, .sat i, .ring, .core, .live-dot, .cd-card.next::after, .tick, .sec-head h2 { animation: none !important; }
  .acc-item, .acc-kanji, .acc-body, .btn, .b, .cd-card { transition: none; }
}
</style>
