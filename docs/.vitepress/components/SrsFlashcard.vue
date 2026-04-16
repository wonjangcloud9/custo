<template>
  <div class="srs-wrapper">
    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-header">
        <span class="progress-label">마스터 진행률</span>
        <span class="progress-count">{{ masteredCount }} / {{ cards.length }}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- Congratulations -->
    <div v-if="allMastered" class="congrats">
      <span class="congrats-icon">🎊</span>
      <p class="congrats-text">모든 카드를 마스터했어요!</p>
      <button class="reset-btn" @click="resetDeck">다시 시작</button>
    </div>

    <!-- Card -->
    <template v-else>
      <div class="card-scene" @click="flip">
        <div class="card-body" :class="{ flipped: isFlipped }">
          <div class="card-face card-front">
            <p class="card-text">{{ currentCard.front }}</p>
            <span class="flip-hint">클릭해서 뒤집기</span>
          </div>
          <div class="card-face card-back">
            <p class="card-text">{{ currentCard.back }}</p>
          </div>
        </div>
      </div>

      <!-- SRS Buttons (show after flip) -->
      <div v-if="isFlipped" class="srs-controls">
        <button class="srs-btn srs-hard" @click.stop="answer(0)">어려워요 😢</button>
        <button class="srs-btn srs-ok" @click.stop="answer(1)">애매해요 🤔</button>
        <button class="srs-btn srs-easy" @click.stop="answer(2)">알겠어요! 🎉</button>
      </div>

      <span class="queue-hint">남은 카드: {{ queue.length }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Card { front: string; back: string }
interface CardState { box: number; lastReview: string }
type DeckState = Record<number, CardState>

const props = defineProps<{ cards: Card[]; deckId: string }>()

const isFlipped = ref(false)
const deckState = ref<DeckState>({})
const queue = ref<number[]>([])
const queueIdx = ref(0)

const storageKey = computed(() => `custo-srs-${props.deckId}`)

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (raw) deckState.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

function saveState() {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(deckState.value))
  } catch { /* ignore */ }
}

function syncStudyProgress() {
  try {
    const key = 'custo-study-progress'
    const raw = localStorage.getItem(key)
    const data = raw ? JSON.parse(raw) : { quizScores: {}, flashcardProgress: {}, lastStudyDate: '' }
    if (!data.flashcardProgress) data.flashcardProgress = {}
    data.flashcardProgress[props.deckId] = {
      viewed: masteredCount.value,
      total: props.cards.length,
      date: new Date().toISOString().slice(0, 10),
    }
    data.lastStudyDate = new Date().toISOString().slice(0, 10)
    localStorage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

function getBox(idx: number): number {
  return deckState.value[idx]?.box ?? 0
}

function buildQueue() {
  const box0: number[] = []
  const box1: number[] = []
  for (let i = 0; i < props.cards.length; i++) {
    const b = getBox(i)
    if (b === 0) box0.push(i)
    else if (b === 1) box1.push(i)
  }
  queue.value = [...box0, ...box1]
  queueIdx.value = 0
}

const currentCard = computed(() => {
  const idx = queue.value[queueIdx.value] ?? 0
  return props.cards[idx] ?? { front: '', back: '' }
})

const masteredCount = computed(() =>
  props.cards.reduce((n, _, i) => n + (getBox(i) >= 2 ? 1 : 0), 0)
)

const allMastered = computed(() => masteredCount.value === props.cards.length)

const progressPct = computed(() =>
  props.cards.length ? Math.round((masteredCount.value / props.cards.length) * 100) : 0
)

function flip() { isFlipped.value = !isFlipped.value }

function answer(box: number) {
  const cardIdx = queue.value[queueIdx.value]
  deckState.value[cardIdx] = { box, lastReview: new Date().toISOString() }
  saveState()
  syncStudyProgress()
  isFlipped.value = false

  if (box === 0) {
    // move to end of queue for immediate re-review
    queue.value.push(cardIdx)
  }

  queueIdx.value++
  if (queueIdx.value >= queue.value.length && !allMastered.value) {
    buildQueue()
  }
}

function resetDeck() {
  deckState.value = {}
  saveState()
  syncStudyProgress()
  isFlipped.value = false
  buildQueue()
}

onMounted(() => {
  loadState()
  buildQueue()
})

watch(() => props.deckId, () => {
  loadState()
  isFlipped.value = false
  buildQueue()
})
</script>

<style scoped>
.srs-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin: 1.5rem 0;
  font-family: 'Noto Sans KR', sans-serif;
}

/* Progress */
.progress-bar { width: 100%; max-width: 480px; }
.progress-header { display: flex; justify-content: space-between; margin-bottom: .3rem; }
.progress-label { font-size: .78rem; color: #b89ac8; font-weight: 500; }
.progress-count { font-size: .78rem; color: #9966cc; font-weight: 700;
  font-family: 'Zen Maru Gothic', sans-serif; }
.progress-track { height: 10px; background: #f5eeff; border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #FF6B9D, #C49CFF);
  transition: width .4s ease; }

/* Card */
.card-scene {
  width: 100%; max-width: 480px; height: 220px;
  perspective: 900px; cursor: pointer;
}
.card-body {
  width: 100%; height: 100%; position: relative;
  transform-style: preserve-3d;
  transition: transform .55s cubic-bezier(.4,.2,.2,1);
  border-radius: 16px;
}
.card-body.flipped { transform: rotateY(180deg); }
.card-face {
  position: absolute; inset: 0; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 1.5rem; backface-visibility: hidden; -webkit-backface-visibility: hidden;
  box-shadow: 0 4px 20px rgba(196,156,255,.18), 0 1px 6px rgba(255,107,157,.1);
}
.card-front { background: linear-gradient(135deg, #ffe8f4 0%, #f0e4ff 100%); }
.card-back {
  background: linear-gradient(135deg, #FF6B9D 0%, #C49CFF 100%);
  color: #fff; transform: rotateY(180deg);
}
.card-text {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 1.35rem; font-weight: 700; text-align: center;
  margin: 0; color: inherit; line-height: 1.5;
}
.card-front .card-text { color: #3a2050; }
.flip-hint {
  position: absolute; bottom: .75rem; font-size: .72rem;
  color: #b89ac8; font-family: 'Noto Sans KR', sans-serif;
}

/* SRS Buttons */
.srs-controls { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: center; }
.srs-btn { padding: .55rem 1.1rem; border-radius: 999px; border: 2px solid transparent;
  font-family: 'Noto Sans KR', sans-serif; font-size: .85rem; font-weight: 600;
  cursor: pointer; transition: transform .15s, box-shadow .2s; }
.srs-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(196,156,255,.25); }
.srs-hard { background: #fff0f3; border-color: #FF6B9D; color: #FF6B9D; }
.srs-ok { background: #f5eeff; border-color: #C49CFF; color: #9966cc; }
.srs-easy { background: linear-gradient(135deg, #FF6B9D, #C49CFF); color: #fff; border: none; }

.queue-hint { font-size: .75rem; color: #b89ac8; }

/* Congrats */
.congrats {
  display: flex; flex-direction: column; align-items: center; gap: .75rem;
  padding: 2.5rem 1rem; width: 100%; max-width: 480px;
  background: linear-gradient(135deg, #fff0f8, #f5eeff);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(196,156,255,.18), 0 1px 6px rgba(255,107,157,.1);
}
.congrats-icon { font-size: 2.5rem; }
.congrats-text {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 1.15rem; font-weight: 700; color: #9966cc; margin: 0;
}
.reset-btn {
  padding: .55rem 1.5rem; border-radius: 999px; border: 2px solid #FF6B9D;
  background: #fff; color: #FF6B9D;
  font-family: 'Noto Sans KR', sans-serif; font-size: .85rem; font-weight: 600;
  cursor: pointer; transition: background .2s, color .2s;
}
.reset-btn:hover { background: #FF6B9D; color: #fff; }
</style>
