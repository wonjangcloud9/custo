<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { members, prefectureKo, onColor, type Member } from '../data/members'
import { events, startMs, endMs } from '../data/events'
// Birthday-day mini events (#278, user 2026-11-26: "생탄제니만큼 이벤트요소도 넣어주공"):
// blow out the number candles, send hearts (counted on this device, goal = her new age), and a 3-question quiz
// built only from the verified profile fields in members.ts. Shown on her page and on home, on the day only.
const props = defineProps<{ m: Member; age: number | null; home?: boolean }>()
const short = computed(() => props.m.ko.split(' ')[1] ?? props.m.ko)
const digits = computed(() => (props.age ? String(props.age).split('') : ['♡']))

// ---- 생탄제 today (from events.ts)
const now = ref<number | null>(null)
let timer: number | undefined
const show = computed(() => {
  if (now.value === null) return null
  const d = new Date(now.value + 9 * 3600e3).toISOString().slice(0, 10)
  return events.find((e) => e.member === props.m.id && e.date === d) ?? null
})
const showState = computed(() => {
  if (!show.value || now.value === null) return ''
  const s = startMs(show.value), e = endMs(show.value)
  if (now.value >= e) return 'done'
  if (now.value >= s) return 'live'
  const min = Math.ceil((s - now.value) / 60000)
  return min >= 60 ? `${Math.floor(min / 60)}시간 ${min % 60}분 전` : `${min}분 전`
})

// ---- candles
const lit = ref<boolean[]>([])
const wished = ref(false)
const reduce = ref(false)
const confetti = ref<{ id: number; x: number; c: string; d: number; r: number }[]>([])
let burstId = 0
function burst(n = 40) {
  if (reduce.value) return
  const cs = [props.m.color, props.m.color, ...members.map((x) => x.color)]
  confetti.value = Array.from({ length: n }, (_, i) => ({ id: ++burstId, x: Math.random() * 100, c: cs[i % cs.length], d: Math.random() * 0.5, r: Math.random() * 360 }))
  window.setTimeout(() => (confetti.value = []), 2600)
}
function blow() {
  if (wished.value) { lit.value = digits.value.map(() => true); wished.value = false; return }
  lit.value.forEach((_, i) => window.setTimeout(() => { lit.value[i] = false; if (lit.value.every((v) => !v)) { wished.value = true; burst() } }, reduce.value ? 0 : i * 260))
}
function blowOne(i: number) {
  if (!lit.value[i]) return
  lit.value[i] = false
  if (lit.value.every((v) => !v)) { wished.value = true; burst() }
}

// ---- hearts (this device only)
const hearts = ref(0)
const floaters = ref<{ id: number; x: number; s: number }[]>([])
const goal = computed(() => props.age ?? 10)
const key = computed(() => `custo-bday-hearts-${props.m.id}-${new Date(now.value ?? Date.now()).getFullYear()}`)
function sendHeart() {
  hearts.value++
  try { localStorage.setItem(key.value, String(hearts.value)) } catch { /* private mode */ }
  if (!reduce.value) {
    const f = { id: ++burstId, x: 20 + Math.random() * 60, s: 0.8 + Math.random() * 0.6 }
    floaters.value.push(f)
    window.setTimeout(() => (floaters.value = floaters.value.filter((x) => x.id !== f.id)), 1400)
  }
  if (hearts.value === goal.value) burst(56)
}

// ---- quiz (verified fields only; deterministic option order)
type Q = { q: string; opts: string[]; a: string }
function pickOthers(vals: string[], mine: string, n = 3) {
  return [...new Set(vals.filter((v) => v !== mine))].slice(0, n)
}
function order(opts: string[], seed: number) {
  return opts.map((o, i) => ({ o, k: (i * 7 + seed * 3) % 5 })).sort((a, b) => a.k - b.k).map((x) => x.o)
}
const quiz = computed<Q[]>(() => {
  const m = props.m, others = members.filter((x) => x.id !== m.id)
  const qs: Q[] = []
  const h = `${m.height}cm`
  qs.push({ q: `${short.value}의 키는?`, a: h, opts: order([h, ...pickOthers(others.map((x) => `${x.height}cm`), h)], 1) })
  const bp = prefectureKo[m.birthplace] ?? m.birthplace
  qs.push({ q: `${short.value}의 출신지는?`, a: bp, opts: order([bp, ...pickOthers(others.map((x) => prefectureKo[x.birthplace] ?? x.birthplace), bp)], 2) })
  const hob = m.hobbies[m.hobbies.length - 1]
  if (hob) {
    const pool = others.flatMap((x) => x.hobbies).filter((x) => !m.hobbies.includes(x))
    qs.push({ q: `다음 중 ${short.value}의 취미는?`, a: hob, opts: order([hob, ...pickOthers(pool, hob)], 3) })
  }
  return qs
})
const picks = ref<(string | null)[]>([])
const score = computed(() => picks.value.filter((p, i) => p === quiz.value[i]?.a).length)
const done = computed(() => quiz.value.length > 0 && picks.value.filter(Boolean).length === quiz.value.length)
function pick(i: number, o: string) {
  if (picks.value[i]) return
  picks.value[i] = o
  if (done.value && score.value === quiz.value.length) burst(48)
}
const verdict = computed(() => (score.value === quiz.value.length ? `만점! ${short.value} 생일 마스터` : score.value ? `${score.value}/${quiz.value.length} — 프로필에서 다시 확인해 봐요` : '0점… 오늘 프로필을 같이 읽어 봐요'))

onMounted(() => {
  reduce.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  now.value = Date.now()
  timer = window.setInterval(() => (now.value = Date.now()), 30000)
  lit.value = digits.value.map(() => true)
  picks.value = quiz.value.map(() => null)
  try { hearts.value = Number(localStorage.getItem(key.value)) || 0 } catch { /* ignore */ }
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="bev" :class="{ home: props.home }" :style="{ '--mc': props.m.color, '--on': onColor(props.m.color) }" :aria-label="`${props.m.ko} 생일 이벤트`">
    <div class="confetti" aria-hidden="true">
      <i v-for="p in confetti" :key="p.id" :style="{ left: p.x + '%', background: p.c, animationDelay: p.d + 's', rotate: p.r + 'deg' }" />
    </div>
    <header class="bev-head">
      <p class="eyebrow"><Ico n="gift" duo size="15" /> 오늘만 열리는 생일 이벤트</p>
      <h2 class="ttl">{{ short }}의 {{ props.age ? props.age + '번째 ' : '' }}생일 파티</h2>
      <p v-if="show" class="show">
        <Ico n="mic" duo size="15" />
        <span lang="ja">{{ show.ja }}</span>
        <span>· {{ show.time }} <span lang="ja">開演</span><template v-if="show.venue"> · <span lang="ja">{{ show.venue }}</span></template></span>
        <b v-if="showState" class="st" :class="showState === 'live' ? 'live' : ''">{{ showState === 'live' ? '지금 공연 중' : showState === 'done' ? '공연 종료 · 수고했어요' : showState }}</b>
      </p>
    </header>

    <div class="grid">
      <!-- 1. candles -->
      <div class="card cake-card">
        <p class="c-ttl"><Ico n="cake" duo size="16" /> 촛불 불기</p>
        <div class="cake" aria-hidden="true">
          <div class="candles">
            <button v-for="(d, i) in digits" :key="i" type="button" class="candle" tabindex="-1" @click="blowOne(i)">
              <span class="flame" :class="{ out: !lit[i] }" /><span class="smoke" :class="{ on: !lit[i] }" />
              <span class="num">{{ d }}</span>
            </button>
          </div>
          <div class="tier t1"><span class="drip" /></div>
          <div class="tier t2"><span class="drip" /></div>
          <div class="plate" />
        </div>
        <button type="button" class="btn" @click="blow">{{ wished ? '촛불 다시 켜기' : '후~ 촛불 불기' }}</button>
        <p class="msg" aria-live="polite"><template v-if="wished"><b>소원 접수 완료</b> · <span lang="ja">{{ props.m.nickname }}、お誕生日おめでとう！</span></template><template v-else>촛불을 하나씩 눌러도 돼요</template></p>
      </div>

      <!-- 2. hearts -->
      <div class="card heart-card">
        <p class="c-ttl"><Ico n="hearts" duo size="16" /> 축하 하트</p>
        <div class="hwrap">
          <span v-for="f in floaters" :key="f.id" class="fl" :style="{ left: f.x + '%', scale: f.s }" aria-hidden="true"><Ico n="heart" duo size="22" /></span>
          <button type="button" class="hbtn" :aria-label="`${short}에게 축하 하트 보내기`" @click="sendHeart"><Ico n="heart" duo size="44" /></button>
        </div>
        <p class="count" aria-live="polite"><b>{{ hearts }}</b> 개 보냄</p>
        <div class="bar" role="progressbar" :aria-valuenow="Math.min(hearts, goal)" aria-valuemin="0" :aria-valuemax="goal" :aria-label="`나이만큼 ${goal}개 목표`">
          <span :style="{ width: Math.min(100, (hearts / goal) * 100) + '%' }" />
        </div>
        <p class="msg">{{ hearts >= goal ? `나이만큼 ${goal}번 축하 달성!` : `나이만큼 ${goal}개 · ${goal - hearts}개 남음` }}<br><small>이 기기에만 저장돼요</small></p>
      </div>

      <!-- 3. quiz -->
      <div class="card quiz-card">
        <p class="c-ttl"><Ico n="crown" duo size="16" /> 생일 퀴즈 {{ quiz.length }}문제</p>
        <ol class="qs">
          <li v-for="(q, i) in quiz" :key="i">
            <p class="q">{{ q.q }}</p>
            <div class="opts">
              <button v-for="o in q.opts" :key="o" type="button" class="opt" :disabled="!!picks[i]"
                :class="{ right: picks[i] && o === q.a, wrong: picks[i] === o && o !== q.a }" @click="pick(i, o)">{{ o }}</button>
            </div>
          </li>
        </ol>
        <p class="msg" aria-live="polite">
          <template v-if="done"><b>{{ verdict }}</b> · <button type="button" class="link" @click="picks = quiz.map(() => null)">다시 풀기</button></template>
          <template v-else>답은 <a :href="withBase(`/members/${props.m.id}`)">{{ short }} 프로필</a>에 다 있어요</template>
        </p>
      </div>
    </div>
    <a v-if="props.home" class="more" :href="withBase(`/members/${props.m.id}`)">생일 퀴즈 · 축하 카드 저장은 {{ short }} 페이지에서 →</a>
  </section>
</template>

<style scoped>
.bev { position: relative; overflow: hidden; margin: 0 0 16px; padding: 20px; border-radius: 28px;
  background: linear-gradient(160deg, color-mix(in srgb, var(--mc) 14%, var(--vp-c-bg)), var(--vp-c-bg) 70%); border: 1px solid color-mix(in srgb, var(--mc) 30%, transparent); }
.bev.home { margin-top: 12px; }
.bev-head { position: relative; }
.eyebrow { margin: 0 !important; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: color-mix(in srgb, var(--mc) 70%, var(--vp-c-text-1)); }
.ttl { margin: 4px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(22px, 4vw, 30px); line-height: 1.25; }
.show { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin: 8px 0 0 !important; font-size: 14px; }
.st { margin-left: 4px; padding: 2px 10px; border-radius: 999px; background: color-mix(in srgb, var(--mc) 16%, transparent); color: color-mix(in srgb, var(--mc) 55%, var(--vp-c-text-1)); font-size: 13px; }
.st.live { background: var(--mc); color: var(--on); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--mc) 25%, transparent); } }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
/* home: candles + hearts only, side by side even on phones (quiz lives on her page) */
.home .quiz-card { display: none; }
.home .grid { grid-template-columns: 1fr 1fr; }
@media (max-width: 600px) { .bev.home { padding: 16px 14px; } .home .card { padding: 12px 8px; gap: 8px; } .home .cake { zoom: 0.78; } .home .hwrap { height: 96px; } .home .hbtn { width: 74px; height: 74px; } .home .btn { padding: 8px 12px; font-size: 13px; } .home .c-ttl { font-size: 14px; } }
.card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; border-radius: 20px; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); text-align: center; }
.c-ttl { margin: 0 !important; align-self: flex-start; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 15px; }
.msg { margin: 0 !important; font-size: 13px; line-height: 1.5; color: var(--vp-c-text-2); }
.msg b { color: var(--vp-c-text-1); }
.btn { padding: 9px 18px; border-radius: 999px; background: var(--mc); color: var(--on); font-weight: 700; font-size: 14px; }
.btn:hover { filter: brightness(1.06); }
.btn:focus-visible, .opt:focus-visible, .hbtn:focus-visible, .link:focus-visible { outline: 2px solid var(--mc); outline-offset: 2px; }

/* cake */
.cake { position: relative; width: 170px; height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
.candles { display: flex; gap: 10px; margin-bottom: -2px; z-index: 1; }
.candle { position: relative; display: flex; flex-direction: column; align-items: center; padding-top: 22px; cursor: pointer; }
.num { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 900; font-size: 40px; line-height: 1; color: #fff; -webkit-text-stroke: 2px var(--mc); paint-order: stroke; text-shadow: 0 2px 0 color-mix(in srgb, var(--mc) 60%, #2a1030); }
.flame { position: absolute; top: 0; width: 12px; height: 20px; border-radius: 50% 50% 45% 45% / 60% 60% 40% 40%; background: radial-gradient(circle at 50% 70%, #fff 0 25%, #ffd23f 45%, #ff8a3d 75%); box-shadow: 0 0 14px 4px #ffd23f88; transform-origin: 50% 100%; animation: flick 0.5s ease-in-out infinite alternate; transition: opacity 0.25s, scale 0.25s; }
.flame.out { opacity: 0; scale: 0.2; }
@keyframes flick { to { transform: rotate(4deg) scaleY(1.1); } }
.smoke { position: absolute; top: 2px; width: 6px; height: 6px; border-radius: 50%; background: #bbb8; opacity: 0; }
.smoke.on { animation: smoke 1.4s ease-out forwards; }
@keyframes smoke { 0% { opacity: 0.8; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-30px) scale(3); } }
.tier { position: relative; border-radius: 10px 10px 6px 6px; overflow: hidden; }
.t1 { width: 120px; height: 34px; background: color-mix(in srgb, var(--mc) 25%, #fff); }
.t2 { width: 156px; height: 42px; margin-top: -4px; background: color-mix(in srgb, var(--mc) 70%, #fff); }
.drip { position: absolute; inset: 0 0 auto; height: 12px; background: radial-gradient(circle at 10px 0, #fff 9px, transparent 10px) 0 0 / 20px 12px repeat-x; opacity: 0.95; }
.t2 .drip { background-image: radial-gradient(circle at 10px 0, color-mix(in srgb, var(--mc) 25%, #fff) 9px, transparent 10px); }
.plate { width: 176px; height: 8px; border-radius: 999px; background: var(--vp-c-divider); }

/* hearts */
.hwrap { position: relative; width: 100%; height: 118px; display: grid; place-items: center; }
.hbtn { width: 88px; height: 88px; border-radius: 50%; display: grid; place-items: center; color: var(--mc); background: color-mix(in srgb, var(--mc) 12%, var(--vp-c-bg)); border: 2px solid color-mix(in srgb, var(--mc) 40%, transparent); transition: transform 0.12s; --ico-fill: color-mix(in srgb, var(--mc) 55%, transparent); }
.hbtn:active { transform: scale(0.9); }
.fl { position: absolute; bottom: 30px; color: var(--mc); pointer-events: none; animation: up 1.4s ease-out forwards; }
@keyframes up { to { transform: translateY(-90px) rotate(12deg); opacity: 0; } }
.count { margin: 0 !important; font-size: 14px; }
.count b { font-size: 26px; color: color-mix(in srgb, var(--mc) 70%, var(--vp-c-text-1)); font-variant-numeric: tabular-nums; }
.bar { width: 100%; height: 10px; border-radius: 999px; background: var(--vp-c-default-soft); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: inherit; background: var(--mc); transition: width 0.3s; }

/* quiz */
.qs { list-style: none; margin: 0 !important; padding: 0 !important; width: 100%; display: grid; gap: 10px; text-align: left; }
.qs li { margin: 0 !important; }
.q { margin: 0 0 6px !important; font-weight: 700; font-size: 14px; }
.opts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.opt { padding: 7px 8px; border-radius: 12px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); font-size: 13px; line-height: 1.3; transition: background 0.2s, border-color 0.2s; }
.opt:not(:disabled):hover { border-color: var(--mc); }
.opt:disabled { cursor: default; opacity: 0.6; }
.opt.right { opacity: 1; background: var(--mc); border-color: var(--mc); color: var(--on); font-weight: 700; }
.opt.wrong { opacity: 1; text-decoration: line-through; border-color: var(--vp-c-text-3); }
.link { color: var(--vp-c-brand-1); text-decoration: underline; font-size: 13px; }
.more { display: inline-block; margin-top: 12px; font-size: 14px; font-weight: 700; color: color-mix(in srgb, var(--mc) 70%, var(--vp-c-text-1)) !important; text-decoration: none !important; }

.confetti { position: absolute; inset: 0 0 auto; height: 0; pointer-events: none; z-index: 3; }
.confetti i { position: absolute; top: -16px; width: 9px; height: 14px; border-radius: 2px; animation: fall 2.2s cubic-bezier(.2, .6, .4, 1) forwards; }
@keyframes fall { to { transform: translateY(560px) rotate(540deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .flame, .st.live { animation: none; } .fl, .confetti { display: none; } }
</style>
