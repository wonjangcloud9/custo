<template>
  <div class="quiz-container" :class="{ done: finished }">
    <!-- top: progress dots + best score -->
    <div class="qz-top">
      <ol class="dots" :aria-label="`${questions.length}문제 중 ${finished ? questions.length : currentIndex + 1}번째`">
        <li v-for="(_, i) in questions" :key="i" :class="dotClass(i)" />
      </ol>
      <span v-if="best !== null" class="best">최고 기록 {{ best }}/{{ questions.length }}</span>
    </div>

    <Transition name="qz" mode="out-in">
      <!-- RESULT -->
      <div v-if="finished" key="result" class="result">
        <div class="ring" :style="{ '--p': score / questions.length }" aria-hidden="true">
          <span><Ico :n="resultEmoji" duo size="1em" /></span>
        </div>
        <p class="r-score"><b>{{ score }}</b> / {{ questions.length }}</p>
        <p class="r-label">{{ resultLabel }}</p>
        <button ref="restartBtn" type="button" class="btn" @click="restart">다시 도전 <Ico n="refresh" /></button>
      </div>

      <!-- QUESTION -->
      <div v-else :key="currentIndex" class="question">
        <p class="q-no">Q{{ currentIndex + 1 }}</p>
        <p class="q-text">{{ cur.q }}</p>
        <div class="opts">
          <button
            v-for="(opt, idx) in cur.options"
            :key="idx"
            type="button"
            class="opt"
            :class="optionClass(idx)"
            :disabled="answered"
            :style="{ '--i': idx }"
            @click="answer(idx)"
          >
            <span class="key" aria-hidden="true">{{ 'ABCD'[idx] }}</span>
            <span class="lbl">{{ opt }}</span>
            <span v-if="answered && idx === cur.answer" class="mark" aria-hidden="true">✓</span>
            <span v-else-if="answered && idx === selectedOption" class="mark" aria-hidden="true">✕</span>
            <span v-if="answered && idx === selectedOption && idx === cur.answer" class="burst" aria-hidden="true">
              <i v-for="h in 6" :key="h" :style="{ '--h': h }">♥</i>
            </span>
          </button>
        </div>
        <div class="feedback" aria-live="polite">
          <template v-if="answered">
            <p v-if="selectedOption === cur.answer" class="ok">정답! <Ico n="sparkle" duo /></p>
            <p v-else class="no">아쉬워요 — 정답은 <b>{{ cur.options[cur.answer] }}</b></p>
            <button ref="nextBtn" type="button" class="btn" @click="next">
              <template v-if="currentIndex < questions.length - 1">다음 문제 →</template><template v-else>결과 보기 <Ico n="trophy" /></template>
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

interface Question {
  q: string
  options: string[]
  answer: number
}

const props = defineProps<{ questions: Question[]; quizId?: string }>()

const currentIndex = ref(0)
const selectedOption = ref<number | null>(null)
const answered = ref(false)
const score = ref(0)
const finished = ref(false)
const results = ref<boolean[]>([])
const best = ref<number | null>(null)
const nextBtn = ref<HTMLButtonElement | null>(null)
const restartBtn = ref<HTMLButtonElement | null>(null)
const cur = computed(() => props.questions[currentIndex.value])

const KEY = 'custo-quiz-best'
function readBest(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
onMounted(() => {
  if (props.quizId) {
    const b = readBest()[props.quizId]
    if (typeof b === 'number') best.value = b
  }
})

function answer(idx: number) {
  if (answered.value) return
  selectedOption.value = idx
  answered.value = true
  const ok = idx === cur.value.answer
  results.value[currentIndex.value] = ok
  if (ok) score.value++
  nextTick(() => nextBtn.value?.focus({ preventScroll: true }))
}

function saveBest() {
  if (!props.quizId) return
  try {
    const all = readBest()
    if ((all[props.quizId] ?? -1) < score.value) all[props.quizId] = score.value
    localStorage.setItem(KEY, JSON.stringify(all))
    best.value = all[props.quizId]
  } catch { /* storage unavailable */ }
}

function next() {
  if (currentIndex.value < props.questions.length - 1) {
    currentIndex.value++
    selectedOption.value = null
    answered.value = false
  } else {
    finished.value = true
    saveBest()
    nextTick(() => setTimeout(() => restartBtn.value?.focus({ preventScroll: true }), 320))
  }
}

function restart() {
  currentIndex.value = 0
  selectedOption.value = null
  answered.value = false
  score.value = 0
  results.value = []
  finished.value = false
}

function dotClass(i: number) {
  if (results.value[i] === true) return 'ok'
  if (results.value[i] === false) return 'no'
  if (!finished.value && i === currentIndex.value) return 'now'
  return ''
}

function optionClass(idx: number) {
  if (!answered.value) return ''
  if (idx === cur.value.answer) return 'correct'
  if (idx === selectedOption.value) return 'wrong'
  return 'dim'
}

const ratio = computed(() => score.value / props.questions.length)
const resultEmoji = computed(() => (ratio.value === 1 ? 'crown' : ratio.value >= 0.6 ? 'heart' : 'dumbbell'))
const resultLabel = computed(() => (ratio.value === 1 ? '만점! 진정한 큐스트 팬이에요' : ratio.value >= 0.6 ? '잘했어요!' : '다시 도전해 봐요!'))
</script>

<style scoped>
.quiz-container {
  --qa: var(--mc, var(--custo-accent, #FF6B9D));
  --qd: color-mix(in srgb, var(--qa) min(62%, var(--ink-mix, 100%)), #2a1030);
  --spring: cubic-bezier(.34, 1.56, .64, 1);
  max-width: 560px; margin: 1.5rem auto; padding: 22px 22px 24px; border-radius: 26px; color: #2f1a35; overflow: hidden;
  background: radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--qa) 14%, white), transparent 55%), #fff;
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--qa) 24%, white), 0 24px 44px -34px color-mix(in srgb, var(--qa) 60%, #2a1030);
}
.qz-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 20px; }
.dots { list-style: none; display: flex; gap: 6px; margin: 0 !important; padding: 0 !important; }
.dots li { margin: 0 !important; width: 10px; height: 10px; border-radius: 999px; background: color-mix(in srgb, var(--qa) 18%, #f3e9ee); transition: width 0.4s var(--spring), background 0.3s; }
.dots li.now { width: 26px; background: var(--qa); }
.dots li.ok { background: #2fb47c; }
.dots li.no { background: #e0566b; }
.best { font-size: 12px; font-weight: 800; color: var(--qd); padding: 3px 10px; border-radius: 999px; background: color-mix(in srgb, var(--qa) 12%, white); }

.q-no { margin: 16px 0 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 13px; font-weight: 900; letter-spacing: 0.12em; color: var(--qd); }
.q-text { margin: 4px 0 16px !important; font-family: 'Zen Maru Gothic', var(--cs-sans); font-size: 18px; font-weight: 800; line-height: 1.5; }
.opts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.opt {
  position: relative; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 10px 14px 10px 10px; border-radius: 16px; text-align: left;
  background: #fff; border: 1.5px solid color-mix(in srgb, var(--qa) 28%, white); color: #2f1a35; font-size: 14.5px; font-weight: 600; line-height: 1.4; cursor: pointer;
  transition: transform 0.4s var(--spring), border-color 0.2s, background 0.2s, opacity 0.3s;
  animation: optIn 0.5s var(--spring) both; animation-delay: calc(var(--i) * 55ms);
}
@keyframes optIn { from { opacity: 0; transform: translateY(10px) scale(0.97); } }
.opt:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--qa); background: color-mix(in srgb, var(--qa) 7%, white); }
.opt:active:not(:disabled) { transform: scale(0.97); }
.opt:disabled { cursor: default; }
.key { flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 10px; font-size: 12.5px; font-weight: 900; color: var(--qd); background: color-mix(in srgb, var(--qa) 14%, white); transition: background 0.2s, color 0.2s; }
.lbl { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.mark { flex: none; font-weight: 900; font-size: 15px; }
.opt.correct { border-color: #2fb47c; background: #ecf9f2; color: #135c3b; animation: pop 0.55s var(--spring); }
.opt.correct .key { background: #2fb47c; color: #fff; }
.opt.wrong { border-color: #e0566b; background: #fdf0f2; color: #8f1f33; animation: shake 0.45s ease; }
.opt.wrong .key { background: #e0566b; color: #fff; }
.opt.dim { opacity: 0.5; }
@keyframes pop { 40% { transform: scale(1.04); } }
@keyframes shake { 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
.burst { position: absolute; inset: 0; pointer-events: none; }
.burst i { position: absolute; left: 50%; top: 50%; font-style: normal; font-size: 14px; color: var(--qa); opacity: 0;
  animation: heart 0.9s ease-out forwards; --a: calc(var(--h) * 60deg); }
@keyframes heart {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--a)) translateY(0) rotate(calc(var(--a) * -1)) scale(0.4); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--a)) translateY(-46px) rotate(calc(var(--a) * -1)) scale(1.1); }
}
.feedback { min-height: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.feedback:not(:empty) { margin-top: 16px; }
.ok, .no { margin: 0 !important; font-size: 15px; font-weight: 800; text-align: center; }
.ok { color: #157a4c; }
.no { color: #a52a3f; }
.btn { padding: 10px 22px; border-radius: 999px; border: 0; background: var(--qd); color: #fff; font-family: 'Zen Maru Gothic', var(--cs-sans); font-size: 14.5px; font-weight: 800; cursor: pointer; transition: transform 0.4s var(--spring), box-shadow 0.3s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -14px var(--qd); }
.btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--qa) 55%, white); outline-offset: 3px; }

.result { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 0 4px; }
.ring { --p: 0; width: 112px; height: 112px; border-radius: 50%; display: grid; place-items: center; animation: ringIn 1s var(--spring) both;
  background: radial-gradient(closest-side, #fff 78%, transparent 79%), conic-gradient(var(--qa) calc(var(--p) * 360deg), color-mix(in srgb, var(--qa) 14%, #f3e9ee) 0); }
.ring span { display: grid; font-size: 42px; line-height: 1; color: #c92f69; }
@keyframes ringIn { from { transform: scale(0.6) rotate(-30deg); opacity: 0; } }
.r-score { margin: 6px 0 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px; color: #6a4f70; }
.r-score b { font-size: 34px; color: var(--qd); }
.r-label { margin: 0 0 8px !important; font-size: 15px; font-weight: 700; }

.qz-enter-active, .qz-leave-active { transition: opacity 0.25s, transform 0.3s var(--spring); }
.qz-enter-from { opacity: 0; transform: translateX(18px); }
.qz-leave-to { opacity: 0; transform: translateX(-18px); }

@media (max-width: 520px) {
  .quiz-container { padding: 18px 16px 20px; }
  .opts { grid-template-columns: minmax(0, 1fr); }
  .q-text { font-size: 16.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .opt, .opt.correct, .opt.wrong, .ring, .burst i { animation: none; }
  .burst { display: none; }
  .qz-enter-active, .qz-leave-active, .opt, .btn, .dots li { transition: none; }
}
</style>
