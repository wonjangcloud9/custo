<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { MV } from '../data/discography'
import { members, memberById, onColor } from '../data/members'

// Two modes on blurred, zoomed official YouTube stills that clear up over 8s (faster answer = more points):
//  - song:   YouTube's auto-generated frames of the 15 official MVs (i.ytimg.com/vi/<id>/maxres{1,2,3}.jpg)
//  - member: the member "legend cut" thumbnails (solo MV teasers / fancams / birthday lives, feeds.json)
const SONGS = Object.entries(MV).map(([title, id]) => ({ title, id }))
const ROUNDS = 10
const REVEAL_MS = 8000
type Mode = 'song' | 'member' | 'daily'
const DAILY_ROUNDS = 5
// daily challenge: the same 5 MV scenes for everyone on a given Japan date (seeded, not Math.random)
const jstDate = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const seeded = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const dayKey = ref('')
const KEY = (m: Mode) => (m === 'daily' ? `custo-mvquiz-daily-${dayKey.value}` : m === 'member' ? 'custo-mvquiz-best-member' : 'custo-mvquiz-best')

interface Opt { key: string; label: string; color?: string; kanji?: string; on?: string }
interface Round { id: string; img: string; key: string; label: string; fx: number; fy: number; options: Opt[] }
const mode = ref<Mode>('song')
const stage = ref<'start' | 'play' | 'done'>('start')
const rounds = ref<Round[]>([])
const idx = ref(0)
const picked = ref<string | null>(null)
const score = ref(0)
const right = ref(0)
const streak = ref(0)
const bestStreak = ref(0)
const gained = ref(0)
const r = ref(0) // reveal 0..1
const best = ref<number | null>(null)
const copied = ref(false)
const loading = ref(false)
const nextBtn = ref<HTMLButtonElement | null>(null)
let t0 = 0
let timer: number | undefined
const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

let rnd: () => number = Math.random
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const cur = computed(() => rounds.value[idx.value])
const MEMBER_OPTS: Opt[] = members.map((m) => ({ key: m.id, label: m.ko.split(' ')[1], color: m.color, kanji: m.ja.slice(2, 3), on: onColor(m.color) }))

async function start(m: Mode = mode.value) {
  mode.value = m
  dayKey.value = jstDate()
  rnd = m === 'daily' ? seeded(Number(dayKey.value.replace(/-/g, ''))) : Math.random
  const focus = () => ({ fx: 25 + rnd() * 50, fy: 20 + rnd() * 45 })
  if (m !== 'member') {
    rounds.value = shuffle(SONGS).slice(0, m === 'daily' ? DAILY_ROUNDS : ROUNDS).map((s) => ({
      id: s.id, img: `https://i.ytimg.com/vi/${s.id}/maxres${1 + Math.floor(rnd() * 3)}.jpg`, key: s.title, label: s.title, ...focus(),
      options: shuffle([s.title, ...shuffle(SONGS.filter((o) => o.id !== s.id)).slice(0, 3).map((o) => o.title)]).map((t) => ({ key: t, label: t })),
    }))
  } else {
    loading.value = true
    const all = (await import('../data/feeds.json')).default as Record<string, { id: string; hq?: boolean; kind: string; title: string }[]>
    // solo MV-teaser stills only (checked by eye 2026-11-18): variety/vlog thumbnails show several
    // members with name captions; the かわいいだけじゃだめですか？ teasers print the name; the
    // キューにストップできません！ and ぷりきゅきゅ teasers are pair shots; audition teasers aren't MV stills
    const SKIP = /かわいいだけじゃ(だめ|ダメ)|キューにストップ|ぷりきゅきゅ/
    const feeds = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.filter((c) => c.kind === 'teaser' && c.title.includes('MV Teaser') && !SKIP.test(c.title))]))
    loading.value = false
    // spread the 10 rounds over the members (no member more than twice), one random cut each
    const ids = shuffle([...members.map((x) => x.id), ...members.map((x) => x.id)]).slice(0, ROUNDS)
    const used = new Set<string>()
    rounds.value = ids.map((mid) => {
      const cut = shuffle(feeds[mid].filter((c) => !used.has(c.id)))[0]
      used.add(cut.id)
      // start the zoom near the face (upper middle of a teaser frame)
      return { id: cut.id, img: `https://i.ytimg.com/vi/${cut.id}/${cut.hq ? 'maxresdefault' : 'hqdefault'}.jpg`, key: mid, label: memberById[mid].ko, fx: 35 + Math.random() * 30, fy: 22 + Math.random() * 22, options: MEMBER_OPTS }
    })
  }
  idx.value = 0; score.value = 0; right.value = 0; streak.value = 0; bestStreak.value = 0; copied.value = false
  try { const b = localStorage.getItem(KEY(m)); best.value = b ? Number(b) : null } catch { /* ignore */ }
  stage.value = 'play'
  begin()
}
function begin() {
  picked.value = null; gained.value = 0; r.value = 0; t0 = performance.now()
  clearInterval(timer)
  timer = window.setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / REVEAL_MS)
    r.value = reduce() ? Math.floor(p * 3) / 3 : p
    if (p >= 1) clearInterval(timer)
  }, 80)
}
function answer(key: string) {
  if (picked.value) return
  clearInterval(timer)
  picked.value = key
  const elapsed = performance.now() - t0
  if (key === cur.value.key) {
    gained.value = Math.max(20, Math.round(100 - (Math.min(elapsed, REVEAL_MS) / REVEAL_MS) * 80))
    score.value += gained.value; right.value++; streak.value++; bestStreak.value = Math.max(bestStreak.value, streak.value)
  } else { streak.value = 0 }
  r.value = 1
  nextTick(() => nextBtn.value?.focus({ preventScroll: true }))
}
function next() {
  if (idx.value < total.value - 1) { idx.value++; begin(); return }
  stage.value = 'done'
  try { if (best.value === null || score.value > best.value) { localStorage.setItem(KEY(mode.value), String(score.value)); best.value = score.value } } catch { /* ignore */ }
  if (mode.value === 'daily') bumpStreak()
}
// daily streak: consecutive Japan dates on which today's five was finished (this browser only)
const STREAK_KEY = 'custo-mvquiz-daily-streak'
const streakDays = ref(0)
const prevDay = (d: string) => new Date(Date.parse(d + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)
function readStreak(): { last: string; n: number } {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"last":"","n":0}') } catch { return { last: '', n: 0 } }
}
function bumpStreak() {
  const today = jstDate(), s = readStreak()
  const n = s.last === today ? s.n : s.last === prevDay(today) ? s.n + 1 : 1
  try { localStorage.setItem(STREAK_KEY, JSON.stringify({ last: today, n })) } catch { /* ignore */ }
  streakDays.value = n
}
// shown on the start screen: alive if played today or yesterday
const liveStreak = ref(0)
onMounted(() => { const s = readStreak(), t = jstDate(); liveStreak.value = s.last === t || s.last === prevDay(t) ? s.n : 0 })
// keyboard: 1–4 (song) / 1–8 (member) answer, Enter/→ next; ignored while typing or with modifiers
function onKey(e: KeyboardEvent) {
  if (stage.value !== 'play' || !cur.value || e.metaKey || e.ctrlKey || e.altKey) return
  const t = e.target as HTMLElement | null
  if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName))) return
  const n = Number(e.key)
  if (!picked.value && n >= 1 && n <= cur.value.options.length) { e.preventDefault(); answer(cur.value.options[n - 1].key); return }
  if (picked.value && (e.key === 'Enter' || e.key === 'ArrowRight') && document.activeElement !== nextBtn.value) { e.preventDefault(); next() }
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  // shared daily link (?daily) drops friends straight into today's five
  if (new URLSearchParams(location.search).has('daily')) start('daily')
})
onBeforeUnmount(() => { clearInterval(timer); window.removeEventListener('keydown', onKey) })

const total = computed(() => rounds.value.length || ROUNDS)
const isSong = computed(() => mode.value !== 'member')
const rank = computed(() => {
  const s = (score.value / total.value) * 10, mv = isSong.value // scaled to a 10-round game
  if (s >= 800) return { t: mv ? '큐스트 MV 마스터' : '찐 큐티스트 인증', e: '👑' }
  if (s >= 600) return { t: '프로 큐티스트', e: '💖' }
  if (s >= 400) return { t: '성장 중인 큐티스트', e: '🌱' }
  return { t: mv ? 'MV 정주행 추천!' : '멤버 페이지 정주행 추천!', e: mv ? '🎬' : '👀' }
})
const modeName = computed(() => (mode.value === 'daily' ? `오늘의 MV 퀴즈 ${+dayKey.value.slice(5, 7)}/${+dayKey.value.slice(8)}` : mode.value === 'song' ? 'MV 장면 퀴즈' : '멤버 맞히기 퀴즈'))
const shareUrl = () => location.origin + location.pathname + (mode.value === 'daily' ? '?daily' : '')
async function share() {
  const text = `🎯 큐스트 ${modeName.value} ${score.value}점 (${right.value}/${total.value}) — ${rank.value.e} ${rank.value.t}${mode.value === 'daily' && streakDays.value > 1 ? ` · 🔥${streakDays.value}일 연속` : ''}`
  // phones: the system share sheet; elsewhere (or if it is dismissed/unsupported): copy to clipboard
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: `큐스트 ${modeName.value}`, text, url: shareUrl() }); return } catch (e) { if ((e as Error).name === 'AbortError') return }
  }
  try { await navigator.clipboard.writeText(`${text}\n${shareUrl()}`); copied.value = true } catch { copied.value = false }
}
const imgStyle = computed(() => {
  if (!cur.value) return {}
  const z = isSong.value ? 2.6 : 2.2
  return {
    transformOrigin: `${cur.value.fx}% ${cur.value.fy}%`,
    transform: `scale(${(z - (z - 1) * r.value).toFixed(3)})`,
    filter: `blur(${((1 - r.value) * 9).toFixed(2)}px) saturate(${(0.6 + 0.4 * r.value).toFixed(2)})`,
  }
})
const curMember = computed(() => (mode.value === 'member' && cur.value ? memberById[cur.value.key] : null))
</script>

<template>
  <section class="mq" aria-labelledby="mq-h">
    <h2 id="mq-h" class="sr-only">MV 장면 퀴즈</h2>

    <!-- START -->
    <div v-if="stage === 'start'" class="start">
      <div class="deck" aria-hidden="true">
        <span v-for="(s, i) in SONGS.slice(0, 5)" :key="s.id" class="ph" :style="{ '--i': i }"><img :src="`https://i.ytimg.com/vi/${s.id}/hq${(i % 3) + 1}.jpg`" alt="" loading="lazy" /></span>
      </div>
      <ul class="rules">
        <li>🔍 확대되고 흐릿한 장면이 점점 선명해져요</li>
        <li>⚡ 빨리 맞힐수록 높은 점수 (문제당 최대 100점)</li>
        <li class="kb-tip">⌨️ 키보드: 숫자 키로 답하고 Enter로 다음 문제</li>
      </ul>
      <div class="modes">
        <button type="button" class="mode" @click="start('song')"><span aria-hidden="true">🎬</span><b>무슨 곡?</b><small>공식 MV {{ SONGS.length }}곡의 한 장면</small></button>
        <button type="button" class="mode mem" :disabled="loading" @click="start('member')"><span aria-hidden="true">💖</span><b>누구일까?</b><small>멤버 솔로 MV 티저 · 8명 중 한 명</small></button>
        <button type="button" class="mode day" @click="start('daily')"><span aria-hidden="true">📅</span><b>오늘의 5문제</b><small>오늘은 모두에게 같은 5장면 · 친구와 점수 비교<template v-if="liveStreak"> · 🔥 {{ liveStreak }}일 연속</template></small></button>
      </div>
    </div>

    <!-- PLAY -->
    <div v-else-if="stage === 'play' && cur" class="play">
      <div class="hud">
        <span class="q">{{ mode === 'daily' ? '오늘의 5문제' : isSong ? '무슨 곡?' : '누구일까?' }} · Q{{ idx + 1 }} / {{ total }}</span>
        <span class="pts">{{ score }}점</span>
        <span v-if="streak >= 2" class="streak">🔥 {{ streak }}연속</span>
      </div>
      <div class="frame" :class="{ ok: picked && picked === cur.key, no: picked && picked !== cur.key }">
        <img :key="cur.img" :src="cur.img" :alt="isSong ? 'MV의 한 장면 (어떤 곡인지 맞혀 보세요)' : '멤버 컷 (누구인지 맞혀 보세요)'" :style="imgStyle" />
        <span class="bar" aria-hidden="true"><i :style="{ transform: `scaleX(${1 - r})` }" /></span>
        <span v-if="picked && gained" class="plus" aria-hidden="true">+{{ gained }}</span>
      </div>
      <div class="opts" :class="{ mems: mode === 'member' }" role="group" :aria-label="isSong ? '곡 선택' : '멤버 선택'">
        <button v-for="o in cur.options" :key="o.key" type="button" class="opt" :lang="isSong ? 'ja' : undefined" :disabled="!!picked" :style="o.color ? { '--mc': o.color } : undefined"
          :class="{ correct: picked && o.key === cur.key, wrong: picked === o.key && o.key !== cur.key, dim: picked && o.key !== cur.key && picked !== o.key }" @click="answer(o.key)">
          <kbd class="hk" aria-hidden="true">{{ cur.options.indexOf(o) + 1 }}</kbd><span v-if="o.kanji" class="kj" aria-hidden="true" :style="{ color: o.on }">{{ o.kanji }}</span>{{ o.label }}
        </button>
      </div>
      <div class="fb" aria-live="polite">
        <template v-if="picked">
          <p v-if="picked === cur.key" class="good">정답! +{{ gained }}점 🎉</p>
          <p v-else class="bad">아쉬워요 — 정답은 <b :lang="isSong ? 'ja' : undefined">{{ cur.label }}</b></p>
          <div class="fb-act">
            <a :href="`https://www.youtube.com/watch?v=${cur.id}`" target="_blank" rel="noopener">{{ isSong ? 'MV 보기 ↗' : '영상 보기 ↗' }}</a>
            <a v-if="curMember" :href="`../members/${curMember.id}`">{{ curMember.ko.split(' ')[1] }} 페이지 →</a>
            <button ref="nextBtn" type="button" class="go sm" @click="next">{{ idx < total - 1 ? '다음 장면 →' : '결과 보기 🏆' }}</button>
          </div>
        </template>
      </div>
    </div>

    <!-- DONE -->
    <div v-else class="done">
      <p class="rk-e" aria-hidden="true">{{ rank.e }}</p>
      <p class="rk">{{ rank.t }}</p>
      <p class="sc"><b>{{ score }}</b>점 · {{ right }}/{{ total }} 정답 · 최고 연속 {{ bestStreak }}</p>
      <p v-if="mode === 'daily' && streakDays" class="streak-d">🔥 {{ streakDays }}일 연속 참여!</p>
      <p v-if="mode === 'daily'" class="best">내일 0시(일본 시간)에 새 5문제가 나와요</p>
      <p v-if="best !== null" class="best">{{ mode === 'daily' ? '오늘' : '내' }} 최고 기록 {{ best }}점{{ best === score ? ' — 새 기록! ✨' : '' }}</p>
      <div class="done-act">
        <button type="button" class="go" @click="start()">다시 도전 🔄</button>
        <button type="button" class="ghost" @click="stage = 'start'">모드 바꾸기</button>
        <button type="button" class="ghost" @click="share">{{ copied ? '복사됨 ✓' : '결과 자랑하기 📣' }}</button>
      </div>
    </div>
    <p class="src">이미지: 공식 YouTube 채널(KAWAII LAB. / CUTIE STREET) 영상의 썸네일·YouTube 자동 장면</p>
  </section>
</template>

<style scoped>
.mq { --ink: #2f1a35; --spring: cubic-bezier(.34, 1.56, .64, 1); max-width: 640px; margin: 0 auto; color: var(--ink); }
.start { display: grid; justify-items: center; gap: 18px; padding: 10px 0 6px; }
.deck { position: relative; width: min(100%, 520px); height: 230px; }
.ph { position: absolute; left: 50%; top: 10px; width: 300px; aspect-ratio: 16 / 9; border-radius: 20px; overflow: hidden; border: 5px solid #fff; box-shadow: 0 24px 40px -24px rgba(90, 30, 70, 0.6);
  transform: translateX(-50%) rotate(calc((var(--i) - 2) * 7deg)) translateX(calc((var(--i) - 2) * 46px)); animation: fan 0.9s var(--spring) both; animation-delay: calc(var(--i) * 70ms); }
.ph img { width: 100%; height: 100%; object-fit: cover; filter: blur(3px) saturate(0.8); }
@keyframes fan { from { transform: translateX(-50%) rotate(0) translateY(30px); opacity: 0; } }
.rules { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; gap: 6px; text-align: center; font-size: 15px; color: #5a4060; }
.rules li { margin: 0 !important; }
.go { padding: 13px 28px; border-radius: 999px; background: linear-gradient(100deg, #ff4f8b, #a06cd5); color: #fff; font-family: 'Zen Maru Gothic', sans-serif; font-size: 17px; font-weight: 900;
  box-shadow: 0 16px 28px -16px #c92f69; transition: transform 0.4s var(--spring); }
.go:hover { transform: translateY(-2px) scale(1.03); }
.go.sm { padding: 10px 20px; font-size: 15px; }
.go:focus-visible, .ghost:focus-visible, .opt:focus-visible { outline: 3px solid #ffb3cf; outline-offset: 3px; }
.modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; width: min(100%, 520px); }
.mode { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 18px 14px; border-radius: 22px; color: #fff; background: linear-gradient(130deg, #c92f69, #a0285c);
  box-shadow: 0 18px 30px -18px #c92f69; transition: transform 0.45s var(--spring); }
.mode.day { grid-column: 1 / -1; background: linear-gradient(130deg, #b34a0a, #b02a4f); box-shadow: 0 18px 30px -18px #c2413a; }
.mode.mem { background: linear-gradient(130deg, #7d4cb8, #5a2e8c); box-shadow: 0 18px 30px -18px #6b3fa0; }
.mode span { font-size: 30px; }
.mode b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px; }
.mode small { font-size: 12.5px; opacity: 0.92; }
.mode:hover { transform: translateY(-3px) rotate(-1deg); }
.mode:focus-visible { outline: 3px solid #ffb3cf; outline-offset: 3px; }
.opts.mems { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; }
.opts.mems .opt { min-height: 0; }
.opts.mems .opt { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 10px 6px; font-size: 13.5px; }
.opt { position: relative; }
.hk { position: absolute; right: 8px; top: 6px; font-family: inherit; font-size: 10.5px; font-weight: 800; color: #9a7f9f; padding: 0 5px; border-radius: 5px; box-shadow: inset 0 0 0 1px #ecdbe4; background: #fff; }
.opts:not(.mems) .opt { padding-right: 30px; }
@media (pointer: coarse) { .hk, .kb-tip { display: none; } }
.kj { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--mc); color: #fff; font-family: 'Zen Maru Gothic', sans-serif; font-size: 17px; font-weight: 900; }
.opts.mems .opt:hover:not(:disabled) { box-shadow: inset 0 0 0 2px var(--mc); }
.hud { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; font-weight: 800; }
.q { font-size: 14px; color: #a33366; letter-spacing: 0.08em; }
.pts { margin-left: auto; font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px; }
.streak { padding: 3px 10px; border-radius: 999px; background: #fff0e0; color: #8a4a00; font-size: 13px; animation: pop 0.5s var(--spring); }
@keyframes pop { from { transform: scale(0.6); } }
.frame { position: relative; aspect-ratio: 16 / 9; border-radius: 24px; overflow: hidden; background: #2a1030; box-shadow: 0 26px 50px -30px rgba(42, 16, 48, 0.8); transition: box-shadow 0.3s; }
.frame img { width: 100%; height: 100%; object-fit: cover; display: block; will-change: transform, filter; }
.frame.ok { box-shadow: 0 0 0 4px #2fb47c, 0 26px 50px -30px rgba(42, 16, 48, 0.8); }
.frame.no { box-shadow: 0 0 0 4px #e0566b, 0 26px 50px -30px rgba(42, 16, 48, 0.8); }
.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: rgba(255, 255, 255, 0.25); }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #ffd166, #ff4f8b); transform-origin: left; }
.plus { position: absolute; right: 18px; top: 14px; padding: 6px 14px; border-radius: 999px; background: #fff; color: #157a4c; font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px; font-weight: 900; animation: rise 0.8s var(--spring) both; }
@keyframes rise { from { opacity: 0; transform: translateY(14px) scale(0.7); } }
.opts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin-top: 14px; }
.opt { min-height: 54px; padding: 10px 14px; border-radius: 16px; background: #fff; box-shadow: inset 0 0 0 1.5px #f1d4e1; color: var(--ink); font-size: 15px; font-weight: 700; text-align: left; overflow-wrap: anywhere;
  transition: transform 0.35s var(--spring), background 0.2s, opacity 0.3s; }
.opt:hover:not(:disabled) { transform: translateY(-2px); box-shadow: inset 0 0 0 2px #ff6b9d; }
.opt.correct { background: #ecf9f2; box-shadow: inset 0 0 0 2px #2fb47c; color: #135c3b; }
.opt.wrong { background: #fdf0f2; box-shadow: inset 0 0 0 2px #e0566b; color: #8f1f33; animation: shake 0.4s ease; }
.opt.dim { opacity: 0.5; }
.opt:disabled { cursor: default; }
@keyframes shake { 25%, 75% { transform: translateX(-5px); } 50% { transform: translateX(5px); } }
.fb { min-height: 0; }
.fb:not(:empty) { margin-top: 14px; }
.good, .bad { margin: 0 0 10px !important; text-align: center; font-weight: 800; font-size: 16px; }
.good { color: #157a4c; }
.bad { color: #a52a3f; }
.fb-act { display: flex; justify-content: center; align-items: center; gap: 16px; }
.fb-act a { font-size: 14px; font-weight: 700; color: #a33366 !important; }
.done { display: grid; justify-items: center; gap: 6px; padding: 14px 0; text-align: center; }
.rk-e { margin: 0 !important; font-size: 64px; animation: pop 0.7s var(--spring) both; }
.rk { margin: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 28px; font-weight: 900; }
.sc { margin: 0 !important; font-size: 16px; color: #5a4060; }
.sc b { font-size: 26px; color: #a33366; }
.streak-d { margin: 4px 0 0 !important; padding: 4px 12px; border-radius: 999px; background: #fff0e0; color: #7a3d00; font-weight: 900; font-size: 15px; animation: pop 0.6s var(--spring) both; }
.best { margin: 0 !important; font-size: 14px; font-weight: 700; color: #6a4f70; }
.done-act { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 10px; }
.ghost { padding: 12px 20px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1.5px #f1d4e1; font-weight: 800; color: #a33366; }
.src { margin: 22px 0 0 !important; text-align: center; font-size: 12px; color: #735779; }
@media (max-width: 560px) {
  .opts { grid-template-columns: minmax(0, 1fr); }
  .opts.mems { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .ph { width: 220px; transform: translateX(-50%) rotate(calc((var(--i) - 2) * 7deg)) translateX(calc((var(--i) - 2) * 26px)); }
  .deck { height: 180px; }
}
@media (prefers-reduced-motion: reduce) { .mode { transition: none; } .ph, .streak, .streak-d, .plus, .rk-e, .opt.wrong { animation: none; } .go, .opt { transition: none; } }
</style>
