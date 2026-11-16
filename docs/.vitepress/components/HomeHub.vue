<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'
import videosRaw from '../data/videos.json'
import { events, startMs } from '../data/events'
import LegendOfDay from './LegendOfDay.vue'
import NewsFeed from './NewsFeed.vue'

interface Video { id: string; title: string; duration: string; category: string; members: string[]; date: string; venue: string; channel?: string; published?: string }
const videos = videosRaw as Video[]
const latest = videos.filter((v) => !v.channel).slice(0, 8)

// Featured milestones come from the shared, source-verified schedule data
const EMOJI: Record<string, string> = { event: '❄️', live: '🎡', release: '💿', tv: '🎍' }
const EVENTS = events.filter((e) => e.featured).map((e) => ({
  id: e.date + e.cat, at: new Date(startMs(e)).toISOString(), label: e.short ?? e.ja, ko: e.ko + (e.venue ? ` · ${e.venue}` : ''), emoji: EMOJI[e.cat] ?? '✨', link: e.url,
}))

const now = ref<number | null>(null)
let timer: number | undefined
const upcoming = computed(() => {
  const t = now.value ?? 0
  return EVENTS.map((e) => ({ ...e, ms: new Date(e.at).getTime() - t })).filter((e) => !now.value || e.ms > -86400000)
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
  { n: videos.length, unit: '편', label: '공식 영상 아카이브' },
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

onMounted(() => {
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
onBeforeUnmount(() => { clearInterval(timer); io?.disconnect() })

const HEAD1 = '귀여움으로'.split('')
const HEAD2 = '세계까지'.split('')
function cleanTitle(t: string) {
  return t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍[^【]*/, '').trim()
}
</script>

<template>
  <div class="hh">
    <!-- HERO -->
    <section ref="hero" class="hero" @pointermove="sparkle">
      <div class="hero-copy">
        <p class="eyebrow"><span class="live-dot" />CUTIE STREET 팬허브 · KR ⇄ JP</p>
        <h1 class="head">
          <span class="line"><span v-for="(c, i) in HEAD1" :key="'a' + i" class="ch" :style="{ '--i': i, '--c': members[i % 8].color }">{{ c }}</span></span>
          <span class="line"><span v-for="(c, i) in HEAD2" :key="'b' + i" class="ch" :style="{ '--i': i + 6, '--c': members[(i + 5) % 8].color }">{{ c }}</span><span class="globe" aria-hidden="true">🌏</span></span>
        </h1>
        <p class="tag-ja">かわいいで、世界へ。 <span>— 原宿から世界へ KAWAII を届ける 8人組</span></p>
        <div class="cta">
          <a class="btn primary" :href="withBase('/members/')">멤버 만나기 <span aria-hidden="true">→</span></a>
          <a class="btn" :href="withBase('/videos/')">영상 아카이브</a>
          <a class="btn ghost" :href="withBase('/japanese/beginner/hiragana')">일본어 배우기</a>
        </div>
      </div>

      <div class="orbit-wrap" aria-hidden="true">
        <div class="core"><b>CUTIE</b><b>STREET</b><small>KAWAII LAB.</small></div>
        <div class="orbit">
          <span v-for="(m, i) in members" :key="m.id" class="sat" :style="{ '--a': i * 45 + 'deg', '--mc': m.color }"><i>{{ m.ja.slice(-2, -1) }}</i></span>
        </div>
        <div class="ring r1" /><div class="ring r2" />
      </div>
    </section>

    <!-- COUNTDOWN -->
    <section class="cd" aria-label="다가오는 일정">
      <a v-for="(e, i) in upcoming" :key="e.id" class="cd-card" :class="{ next: i === 0 }" :href="e.link" target="_blank" rel="noopener">
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

    <NewsFeed mode="ticker" />

    <!-- STATS -->
    <section ref="statsEl" class="stats">
      <div v-for="(s, i) in STATS" :key="s.label" class="stat">
        <b>{{ shown[i] }}<small>{{ s.unit }}</small></b>
        <span>{{ s.label }}</span>
      </div>
    </section>

    <LegendOfDay />

    <!-- MEMBERS ACCORDION -->
    <section class="sec">
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
    <section class="sec">
      <div class="sec-head"><h2>NEW ON YOUTUBE</h2><a :href="withBase('/videos/')">아카이브 {{ videos.length }}편 →</a></div>
      <div class="rail">
        <a v-for="v in latest" :key="v.id" class="rv" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener">
          <span class="rv-thumb"><img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" width="320" height="180" /><span v-if="v.duration" class="rv-dur">{{ v.duration }}</span><span v-if="v.published && now !== null && now - new Date(v.published + 'T00:00:00Z').getTime() < 7 * 86400000" class="rv-new">NEW</span></span>
          <span class="rv-ttl">{{ cleanTitle(v.title) }}</span>
          <span v-if="v.date" class="rv-date">{{ v.date.replace(/-/g, '.') }}</span>
        </a>
      </div>
    </section>

    <!-- EXPLORE -->
    <section class="sec">
      <div class="sec-head"><h2>EXPLORE</h2></div>
      <div class="bento">
        <a class="b b-lg" :href="withBase('/japanese/beginner/hiragana')"><span class="b-emoji">🎤</span><b>멤버 이름으로 히라가나</b><span>덕질하면서 일본어 첫걸음</span></a>
        <a class="b" :href="withBase('/japanese/lyrics/kawaii-dake')"><span class="b-emoji">🎵</span><b>가사로 배우기</b><span>かわいいだけじゃだめですか？</span></a>
        <a class="b" :href="withBase('/japanese/idol-japanese/live-terms')"><span class="b-emoji">📣</span><b>현장 일본어</b><span>특전회·물판·콜</span></a>
        <a class="b" :href="withBase('/discography/')"><span class="b-emoji">💿</span><b>디스코그래피</b><span>싱글 & 앨범</span></a>
        <a class="b" :href="withBase('/stages/')"><span class="b-emoji">🎬</span><b>레전드 무대</b><span>엠카·THE FIRST TAKE</span></a>
        <a class="b" :href="withBase('/schedule/')"><span class="b-emoji">📅</span><b>스케줄</b><span>투어·방송·이벤트</span></a>
        <a class="b" :href="withBase('/which-member/')"><span class="b-emoji">🔮</span><b>나와 닮은 멤버</b><span>6문항 테스트</span></a>
        <a class="b" :href="withBase('/live-guide/')"><span class="b-emoji">🔦</span><b>펜라이트 가이드</b><span>라이브 준비</span></a>
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
.tag-ja span { display: block; font-size: 14px; font-weight: 500; color: #735779; margin-top: 6px; font-family: 'Noto Sans JP', sans-serif; }
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
.orbit { position: absolute; inset: 0; animation: spin 24s linear infinite; }
.sat {
  position: absolute; left: 50%; top: 50%; width: 15%; aspect-ratio: 1; margin: -7.5% 0 0 -7.5%;
  transform: rotate(var(--a)) translateX(205%) rotate(calc(-1 * var(--a)));
}
.sat i {
  display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; font-style: normal;
  background: var(--mc); color: #fff; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: clamp(14px, 2vw, 22px);
  box-shadow: 0 10px 22px -8px var(--mc), inset 0 -4px 0 rgba(0, 0, 0, 0.08);
  animation: spin 24s linear infinite reverse;
}

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

/* ACCORDION */
.acc { display: flex; gap: 8px; height: 320px; }
.acc-item {
  position: relative; flex: 1; min-width: 0; border-radius: 28px; overflow: hidden; text-decoration: none !important; color: #fff !important;
  background: linear-gradient(170deg, color-mix(in srgb, var(--mc) 70%, white), var(--mc));
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
  .bento { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 130px; }
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
