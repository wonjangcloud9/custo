<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { members, memberById, prefectureKo, onColor } from '../data/members'

// Every option maps only to verified facts (member color, hobbies, hometown, birthday season, unit) — see loop/ROADMAP.md
interface Opt { label: string; emoji: string; pts: Record<string, number>; why: string }
interface Q { q: string; opts: Opt[] }
const Qs: Q[] = [
  { q: '제일 끌리는 색은?', opts: members.map((m) => ({ label: m.colorName, emoji: m.emoji, pts: { [m.id]: 3 }, why: `멤버 컬러 ${m.colorName}` })) },
  { q: '오랜만의 쉬는 날, 뭐 할까?', opts: [
    { label: '귀여운 옷 직접 만들기', emoji: '🧵', pts: { risa: 3 }, why: '귀여운 옷 만들기가 취미' },
    { label: '드라마 몰아보고 맛집 가기', emoji: '🍖', pts: { aika: 3 }, why: '드라마 감상·먹는 것이 취미' },
    { label: 'YouTube랑 애니 정주행', emoji: '📺', pts: { kana: 3 }, why: 'YouTube·애니메이션 감상이 취미' },
    { label: '땀 흘리며 운동하기', emoji: '🏃', pts: { ayano: 3 }, why: '운동이 취미' },
    { label: '바다에서 수상레저', emoji: '🌊', pts: { emiru: 3 }, why: '수상바이크가 취미' },
    { label: '예쁜 카페 탐방', emoji: '☕', pts: { miyu: 3 }, why: '카페 탐방이 취미' },
    { label: '배드민턴 한 판', emoji: '🏸', pts: { nagisa: 3 }, why: '배드민턴이 취미' },
    { label: '이불 속 만화책', emoji: '📚', pts: { haruka: 3 }, why: '만화 감상이 취미' },
  ] },
  { q: '동아리 하나만 고른다면?', opts: [
    { label: '댄스부', emoji: '💃', pts: { risa: 1, aika: 1, kana: 2, ayano: 1, nagisa: 1 }, why: '댄스를 사랑하는 멤버' },
    { label: '패션·의상부', emoji: '👗', pts: { risa: 2 }, why: '옷 만들기를 좋아함' },
    { label: '헤어메이크업부', emoji: '🎀', pts: { miyu: 2 }, why: '헤어 어레인지가 취미' },
    { label: '만화연구회', emoji: '✏️', pts: { haruka: 2 }, why: '만화 감상이 취미' },
    { label: '맛집탐방부', emoji: '🍜', pts: { aika: 2 }, why: '먹는 것이 취미' },
    { label: '해양레저부', emoji: '⛵', pts: { emiru: 2 }, why: '소형선박 면허 보유' },
    { label: '배드민턴부', emoji: '🏸', pts: { nagisa: 2 }, why: '배드민턴이 취미' },
    { label: '영상제작부', emoji: '🎬', pts: { kana: 2 }, why: 'YouTube를 좋아함' },
  ] },
  { q: '가보고 싶은 일본 여행지는?', opts: [
    { label: '구마모토', emoji: '🐻', pts: { risa: 1, miyu: 1 }, why: '구마모토현 출신' },
    { label: '도쿄', emoji: '🗼', pts: { aika: 1 }, why: '도쿄도 출신' },
    { label: '치바', emoji: '🌻', pts: { kana: 1 }, why: '치바현 출신' },
    { label: '아이치·나고야', emoji: '🏯', pts: { ayano: 1 }, why: '아이치현 출신' },
    { label: '가나가와·요코하마', emoji: '🎡', pts: { emiru: 1, nagisa: 1 }, why: '가나가와현 출신' },
    { label: '홋카이도', emoji: '❄️', pts: { haruka: 1 }, why: '홋카이도 출신' },
  ] },
  { q: '내가 태어난 계절은?', opts: [
    { label: '봄 (3~5월)', emoji: '🌸', pts: { emiru: 1, ayano: 1 }, why: '봄 생일' },
    { label: '여름 (6~8월)', emoji: '🌻', pts: { nagisa: 1 }, why: '여름 생일' },
    { label: '가을 (9~11월)', emoji: '🍁', pts: { miyu: 1, risa: 1, kana: 1, aika: 1 }, why: '가을 생일' },
    { label: '겨울 (12~2월)', emoji: '⛄', pts: { haruka: 1 }, why: '겨울 생일' },
  ] },
  { q: '지금 기분에 맞는 유닛곡은?', opts: [
    { label: 'Crush on you', emoji: '💘', pts: { aika: 1, kana: 1, ayano: 1, nagisa: 1, haruka: 1 }, why: 'ちーむすとりーと 멤버' },
    { label: 'I Amai Me Mind', emoji: '🍭', pts: { risa: 1, emiru: 1, miyu: 1 }, why: 'ちーむきゅーてぃー 멤버' },
    { label: 'どんどんどん！', emoji: '🥁', pts: { risa: 1, aika: 1, miyu: 1 }, why: '유닛곡「どんどんどん！」 멤버' },
    { label: '君なんだ', emoji: '🌿', pts: { kana: 1, ayano: 1, emiru: 1 }, why: '유닛곡「君なんだ」 멤버' },
    { label: 'おやすみサイレンナイト', emoji: '🌙', pts: { nagisa: 1, haruka: 1 }, why: '유닛곡「おやすみサイレンナイト」 멤버' },
  ] },
]

const step = ref(0)
const answers = ref<number[]>([])
const flipped = ref(false)
const confetti = ref<{ id: number; x: number; c: string; d: number; r: number }[]>([])

function choose(i: number) {
  answers.value = [...answers.value.slice(0, step.value), i]
  if (step.value < Qs.length - 1) step.value++
  else { step.value = Qs.length; reveal() }
}
function back() { if (step.value > 0) step.value-- }
function restart() { step.value = 0; answers.value = []; flipped.value = false; confetti.value = [] }

const scores = computed(() => {
  const s: Record<string, number> = Object.fromEntries(members.map((m) => [m.id, 0]))
  answers.value.forEach((a, qi) => { for (const [k, v] of Object.entries(Qs[qi].opts[a].pts)) s[k] += v })
  return s
})
const result = computed(() => {
  const colorPick = answers.value[0] !== undefined ? members[answers.value[0]].id : ''
  return [...members].sort((a, b) => scores.value[b.id] - scores.value[a.id] || (b.id === colorPick ? 1 : 0) - (a.id === colorPick ? 1 : 0))[0]
})
const reasons = computed(() => [...new Set(answers.value.map((a, qi) => Qs[qi].opts[a]).filter((o) => (o.pts[result.value.id] ?? 0) > 0).map((o) => o.why))].slice(0, 4))
const maxScore = computed(() => Qs.reduce((n, q) => n + Math.max(...q.opts.map((o) => o.pts[result.value.id] ?? 0)), 0))
const pct = computed(() => Math.min(99, Math.round((scores.value[result.value.id] / Math.max(1, maxScore.value)) * 100)))

function reveal() {
  flipped.value = false
  nextTick(() => setTimeout(() => {
    flipped.value = true
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti.value = Array.from({ length: 36 }, (_, i) => ({ id: i, x: Math.random() * 100, c: i % 3 ? result.value.color : members[i % 8].color, d: Math.random() * 0.6, r: Math.random() * 360 }))
    }
  }, 350))
}

// share image (original graphic only — no photos)
async function download() {
  const m = result.value
  const W = 1080, H = 1350
  const lines = ['나와 닮은 CUTIE STREET 멤버는', m.ja, `${m.ko} ${m.emoji} ${pct.value}% 일치`, ...reasons.value.slice(0, 3).map((r) => `♡ ${r}`), 'custo · CUTIE STREET 비공식 팬허브']
  // web fonts load per unicode-range subset — ask for the ones holding this exact text before drawing (#172)
  try {
    const all = lines.join('') + m.ja.slice(-2, -1)
    await Promise.all(['700 100px "Zen Maru Gothic"', '700 40px "Noto Sans KR"', '400 40px "Noto Sans KR"', '700 40px "Noto Sans JP"'].map((f) => document.fonts.load(f, all)))
  } catch { /* system fonts */ }
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#fff6fb'); grad.addColorStop(1, m.color + '55')
  g.fillStyle = grad; g.fillRect(0, 0, W, H)
  g.fillStyle = m.color; g.beginPath(); g.arc(W / 2, 560, 300, 0, Math.PI * 2); g.fill()
  g.fillStyle = onColor(m.color); g.font = '700 360px "Zen Maru Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle' // dark kanji on bright colours
  g.fillText(m.ja.slice(-2, -1), W / 2, 580)
  g.fillStyle = '#3a2340'; g.textBaseline = 'alphabetic'
  g.font = '700 40px "Noto Sans KR", sans-serif'; g.fillText(lines[0], W / 2, 150)
  g.font = '700 110px "Zen Maru Gothic", "Noto Sans JP", sans-serif'; g.fillText(m.ja, W / 2, 1000)
  g.font = '700 48px "Noto Sans KR", sans-serif'; g.fillText(`${m.ko} ${m.emoji} ${pct.value}% 일치`, W / 2, 1080)
  g.font = '400 34px "Noto Sans KR", sans-serif'; g.fillStyle = '#6a4f70'
  reasons.value.slice(0, 3).forEach((r, i) => g.fillText(`♡ ${r}`, W / 2, 1160 + i * 48))
  g.font = '700 28px "Noto Sans KR", sans-serif'; g.fillStyle = '#8a6a90'; g.fillText('custo · CUTIE STREET 비공식 팬허브', W / 2, H - 50)
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `cutiestreet-match-${m.id}.png`; a.click()
}
</script>

<template>
  <section class="mm">
    <div v-if="step < Qs.length" class="quiz">
      <div class="prog" aria-hidden="true"><i v-for="(q, i) in Qs" :key="i" :class="{ on: i <= step }" :style="{ '--c': members[i % 8].color }" /></div>
      <p class="qn">Q{{ step + 1 }} / {{ Qs.length }}</p>
      <Transition name="q" mode="out-in">
        <div :key="step">
          <h2 class="q">{{ Qs[step].q }}</h2>
          <div class="opts" :class="{ many: Qs[step].opts.length > 6 }">
            <button v-for="(o, i) in Qs[step].opts" :key="o.label" type="button" class="opt" :class="{ sel: answers[step] === i }"
              :style="{ '--i': i, '--c': step === 0 ? members[i].color : members[(i * 3 + step) % 8].color }" @click="choose(i)">
              <span class="oe">{{ o.emoji }}</span><span>{{ o.label }}</span>
            </button>
          </div>
        </div>
      </Transition>
      <button v-if="step > 0" type="button" class="back" @click="back">← 이전</button>
    </div>

    <div v-else class="res">
      <div class="confetti" aria-hidden="true">
        <i v-for="p in confetti" :key="p.id" :style="{ left: p.x + '%', background: p.c, animationDelay: p.d + 's', rotate: p.r + 'deg' }" />
      </div>
      <div class="card" :class="{ flipped }" :style="{ '--mc': result.color }">
        <div class="face back-f" aria-hidden="true"><span>?</span></div>
        <div class="face front-f">
          <p class="r-eyebrow">나와 닮은 멤버는</p>
          <div class="r-kanji">{{ result.ja.slice(-2, -1) }}</div>
          <h2 class="r-name">{{ result.ja }}</h2>
          <p class="r-ko">{{ result.ko }} {{ result.emoji }} · <b>{{ pct }}%</b> 일치</p>
          <ul class="why"><li v-for="r in reasons" :key="r">♡ {{ r }}</li></ul>
          <p class="facts">{{ result.colorName }} · {{ prefectureKo[result.birthplace] }} 출신 · {{ result.birthday.slice(5).replace('-', '/') }} 생일</p>
        </div>
      </div>
      <div class="r-act">
        <a class="btn primary" :href="withBase(`/members/${result.id}`)" :style="{ background: `color-mix(in srgb, ${result.color} 62%, #2a1030)`, borderColor: 'transparent' }">{{ result.ko.split(' ')[1] }} 만나러 가기 →</a>
        <button type="button" class="btn" @click="download">📸 결과 이미지 저장</button>
        <button type="button" class="btn" @click="restart">↺ 다시 하기</button>
      </div>
      <div class="board">
        <span v-for="m in [...members].sort((a, b) => scores[b.id] - scores[a.id])" :key="m.id" :style="{ '--c': m.color, '--w': Math.max(4, (scores[m.id] / Math.max(1, scores[result.id])) * 100) + '%' }">
          <small>{{ m.ko.split(' ')[1] }}</small><i /><b>{{ scores[m.id] }}</b>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.mm { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px auto 40px; max-width: 760px; }
.quiz { padding: 26px; border-radius: 30px; background: #fff; border: 1.5px solid #f3dbe8; box-shadow: 0 30px 50px -36px rgba(150, 60, 110, 0.6); position: relative; }
.prog { display: flex; gap: 6px; }
.prog i { flex: 1; height: 6px; border-radius: 999px; background: #f6e6ee; transition: background 0.4s; }
.prog i.on { background: var(--c); }
.qn { margin: 14px 0 0 !important; font-size: 12px; font-weight: 800; letter-spacing: 0.2em; color: #c2457a; }
.q { margin: 6px 0 18px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(24px, 4vw, 32px) !important; }
.opts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.opts.many { grid-template-columns: repeat(2, 1fr); }
.opt { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 18px; text-align: left; font-size: 15px; font-weight: 700; color: var(--ink);
  background: color-mix(in srgb, var(--c) 9%, white); border: 2px solid color-mix(in srgb, var(--c) 25%, white);
  transition: transform 0.5s var(--spring), border-color 0.2s, background 0.2s; animation: optIn 0.5s var(--spring) both; animation-delay: calc(var(--i) * 40ms); }
@keyframes optIn { from { opacity: 0; transform: translateY(14px) scale(0.96); } }
.opt:hover { transform: translateY(-3px) rotate(-0.8deg); border-color: var(--c); }
.opt:active { transform: scale(0.95); }
.opt.sel { background: var(--c); color: #fff; border-color: var(--c); }
.oe { font-size: 22px; }
.back { margin-top: 14px; font-size: 13px; font-weight: 700; color: #735779; background: none; }
.q-enter-active, .q-leave-active { transition: opacity 0.25s, transform 0.35s var(--spring); }
.q-enter-from { opacity: 0; transform: translateX(30px); }
.q-leave-to { opacity: 0; transform: translateX(-30px); }

.res { position: relative; text-align: center; }
.confetti { position: absolute; inset: -20px 0 auto; height: 0; pointer-events: none; z-index: 3; }
.confetti i { position: absolute; top: 0; width: 9px; height: 14px; border-radius: 2px; animation: fall 1.8s cubic-bezier(.2, .6, .4, 1) forwards; }
@keyframes fall { from { transform: translateY(-20px); opacity: 1; } to { transform: translateY(560px) rotate(540deg); opacity: 0; } }
.card { position: relative; width: min(380px, 100%); aspect-ratio: 4 / 5; margin: 0 auto; perspective: 1200px; }
.face { position: absolute; inset: 0; border-radius: 30px; backface-visibility: hidden; transition: transform 0.9s var(--spring); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 22px; }
.back-f { background: linear-gradient(135deg, #ffc93c, #ff4757, #3ccfa8, #4a90d9, #a06cd5, #ff6b9d); color: #fff; font-size: 120px; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; }
.front-f { transform: rotateY(180deg); background: linear-gradient(160deg, #fff, color-mix(in srgb, var(--mc) 22%, white)); border: 2px solid color-mix(in srgb, var(--mc) 40%, white); box-shadow: 0 40px 60px -30px color-mix(in srgb, var(--mc) 80%, #000); }
.card.flipped .back-f { transform: rotateY(-180deg); }
.card.flipped .front-f { transform: rotateY(0); }
.r-eyebrow { margin: 0 !important; font-size: 13px; font-weight: 800; letter-spacing: 0.16em; color: #c2457a; }
.r-kanji { flex: none; width: 130px; height: 130px; margin: 12px 0; border-radius: 50%; display: grid; place-items: center; background: var(--mc); color: #fff; font-size: 70px; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; box-shadow: 0 16px 30px -12px var(--mc); }
.r-name { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: 38px !important; color: color-mix(in srgb, var(--mc) 60%, #3a2340); }
.r-ko { margin: 4px 0 0 !important; font-weight: 700; }
.why { list-style: none; padding: 0 !important; margin: 12px 0 0 !important; font-size: 13.5px; color: #5a4060; }
.why li { margin: 2px 0 !important; }
.facts { margin: 10px 0 0 !important; font-size: 12px; color: #735779; }
.r-act { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 22px; }
.btn { padding: 12px 18px; border-radius: 999px; font-weight: 700; font-size: 14px; background: #fff; color: var(--ink) !important; text-decoration: none !important; border: 1.5px solid #f3cfe0; transition: transform 0.45s var(--spring); }
.btn.primary { color: #fff !important; }
.btn:hover { transform: translateY(-2px) rotate(-1deg); }
.board { display: grid; gap: 6px; max-width: 420px; margin: 26px auto 0; }
.board span { display: grid; grid-template-columns: 64px 1fr 28px; align-items: center; gap: 8px; font-size: 12px; }
.board small { text-align: right; font-weight: 700; }
.board i { height: 10px; border-radius: 999px; background: var(--c); width: var(--w); transition: width 1s var(--spring); }
.board b { text-align: left; font-variant-numeric: tabular-nums; }
@media (max-width: 560px) { .quiz { padding: 18px; } .opts, .opts.many { grid-template-columns: 1fr; } .opt { padding: 12px 14px; } }
@media (prefers-reduced-motion: reduce) { .face { transition: none; } .opt { animation: none; transition: none; } .q-enter-active, .q-leave-active { transition: none; } }
</style>
