<script setup lang="ts">
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { MV } from '../data/discography'

// "Which MV is this scene from?" — frames are YouTube's own auto-generated stills of the official MVs
// (i.ytimg.com/vi/<id>/maxres{1,2,3}.jpg). Starts zoomed + blurred and clears up; faster = more points.
const SONGS = Object.entries(MV).map(([title, id]) => ({ title, id }))
const ROUNDS = 10
const REVEAL_MS = 8000
const KEY = 'custo-mvquiz-best'

interface Round { id: string; title: string; frame: number; fx: number; fy: number; options: string[] }
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
const nextBtn = ref<HTMLButtonElement | null>(null)
let t0 = 0
let timer: number | undefined
const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const cur = computed(() => rounds.value[idx.value])

function start() {
  rounds.value = shuffle(SONGS).slice(0, ROUNDS).map((s) => ({
    ...s, frame: 1 + Math.floor(Math.random() * 3), fx: 25 + Math.random() * 50, fy: 25 + Math.random() * 50,
    options: shuffle([s.title, ...shuffle(SONGS.filter((o) => o.id !== s.id)).slice(0, 3).map((o) => o.title)]),
  }))
  idx.value = 0; score.value = 0; right.value = 0; streak.value = 0; bestStreak.value = 0; copied.value = false
  try { const b = localStorage.getItem(KEY); best.value = b ? Number(b) : null } catch { /* ignore */ }
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
function answer(opt: string) {
  if (picked.value) return
  clearInterval(timer)
  picked.value = opt
  const elapsed = performance.now() - t0
  if (opt === cur.value.title) {
    gained.value = Math.max(20, Math.round(100 - (Math.min(elapsed, REVEAL_MS) / REVEAL_MS) * 80))
    score.value += gained.value; right.value++; streak.value++; bestStreak.value = Math.max(bestStreak.value, streak.value)
  } else { streak.value = 0 }
  r.value = 1
  nextTick(() => nextBtn.value?.focus({ preventScroll: true }))
}
function next() {
  if (idx.value < ROUNDS - 1) { idx.value++; begin(); return }
  stage.value = 'done'
  try { if (best.value === null || score.value > best.value) { localStorage.setItem(KEY, String(score.value)); best.value = score.value } } catch { /* ignore */ }
}
onBeforeUnmount(() => clearInterval(timer))

const rank = computed(() => {
  const s = score.value
  if (s >= 800) return { t: '큐스트 MV 마스터', e: '👑' }
  if (s >= 600) return { t: '프로 큐티스트', e: '💖' }
  if (s >= 400) return { t: '성장 중인 큐티스트', e: '🌱' }
  return { t: 'MV 정주행 추천!', e: '🎬' }
})
async function share() {
  const text = `🎯 큐스트 MV 장면 퀴즈 ${score.value}점 (${right.value}/${ROUNDS}) — ${rank.value.e} ${rank.value.t}\n${location.href}`
  try { await navigator.clipboard.writeText(text); copied.value = true } catch { copied.value = false }
}
const imgStyle = computed(() => (cur.value ? {
  transformOrigin: `${cur.value.fx}% ${cur.value.fy}%`,
  transform: `scale(${(2.6 - 1.6 * r.value).toFixed(3)})`,
  filter: `blur(${((1 - r.value) * 9).toFixed(2)}px) saturate(${(0.6 + 0.4 * r.value).toFixed(2)})`,
} : {}))
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
        <li>🔍 확대되고 흐릿한 MV 장면이 점점 선명해져요</li>
        <li>⚡ 빨리 맞힐수록 높은 점수 (최대 100점 × {{ ROUNDS }}문제)</li>
        <li>🎬 공식 MV {{ SONGS.length }}곡에서 랜덤 출제</li>
      </ul>
      <button type="button" class="go" @click="start">퀴즈 시작 ▶</button>
    </div>

    <!-- PLAY -->
    <div v-else-if="stage === 'play' && cur" class="play">
      <div class="hud">
        <span class="q">Q{{ idx + 1 }} / {{ ROUNDS }}</span>
        <span class="pts">{{ score }}점</span>
        <span v-if="streak >= 2" class="streak">🔥 {{ streak }}연속</span>
      </div>
      <div class="frame" :class="{ ok: picked && picked === cur.title, no: picked && picked !== cur.title }">
        <img :key="cur.id + cur.frame" :src="`https://i.ytimg.com/vi/${cur.id}/maxres${cur.frame}.jpg`" alt="MV의 한 장면 (어떤 곡인지 맞혀 보세요)" :style="imgStyle" />
        <span class="bar" aria-hidden="true"><i :style="{ transform: `scaleX(${1 - r})` }" /></span>
        <span v-if="picked && gained" class="plus" aria-hidden="true">+{{ gained }}</span>
      </div>
      <div class="opts" role="group" aria-label="곡 선택">
        <button v-for="o in cur.options" :key="o" type="button" class="opt" lang="ja" :disabled="!!picked"
          :class="{ correct: picked && o === cur.title, wrong: picked === o && o !== cur.title, dim: picked && o !== cur.title && picked !== o }" @click="answer(o)">{{ o }}</button>
      </div>
      <div class="fb" aria-live="polite">
        <template v-if="picked">
          <p v-if="picked === cur.title" class="good">정답! +{{ gained }}점 🎉</p>
          <p v-else class="bad">아쉬워요 — 정답은 <b lang="ja">{{ cur.title }}</b></p>
          <div class="fb-act">
            <a :href="`https://www.youtube.com/watch?v=${cur.id}`" target="_blank" rel="noopener">MV 보기 ↗</a>
            <button ref="nextBtn" type="button" class="go sm" @click="next">{{ idx < ROUNDS - 1 ? '다음 장면 →' : '결과 보기 🏆' }}</button>
          </div>
        </template>
      </div>
    </div>

    <!-- DONE -->
    <div v-else class="done">
      <p class="rk-e" aria-hidden="true">{{ rank.e }}</p>
      <p class="rk">{{ rank.t }}</p>
      <p class="sc"><b>{{ score }}</b>점 · {{ right }}/{{ ROUNDS }} 정답 · 최고 연속 {{ bestStreak }}</p>
      <p v-if="best !== null" class="best">내 최고 기록 {{ best }}점{{ best === score ? ' — 새 기록! ✨' : '' }}</p>
      <div class="done-act">
        <button type="button" class="go" @click="start">다시 도전 🔄</button>
        <button type="button" class="ghost" @click="share">{{ copied ? '복사됨 ✓' : '결과 복사해서 자랑하기' }}</button>
      </div>
    </div>
    <p class="src">장면 이미지: 공식 MV(KAWAII LAB. / CUTIE STREET 채널)에서 YouTube가 생성한 썸네일</p>
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
.best { margin: 0 !important; font-size: 14px; font-weight: 700; color: #6a4f70; }
.done-act { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 10px; }
.ghost { padding: 12px 20px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1.5px #f1d4e1; font-weight: 800; color: #a33366; }
.src { margin: 22px 0 0 !important; text-align: center; font-size: 12px; color: #735779; }
@media (max-width: 560px) {
  .opts { grid-template-columns: minmax(0, 1fr); }
  .ph { width: 220px; transform: translateX(-50%) rotate(calc((var(--i) - 2) * 7deg)) translateX(calc((var(--i) - 2) * 26px)); }
  .deck { height: 180px; }
}
@media (prefers-reduced-motion: reduce) { .ph, .streak, .plus, .rk-e, .opt.wrong { animation: none; } .go, .opt { transition: none; } }
</style>
