<template>
  <div class="quiz-container">
    <!-- Results Screen -->
    <div v-if="finished" class="result-screen">
      <p class="result-emoji">{{ resultEmoji }}</p>
      <p class="result-score">{{ score }} / {{ questions.length }}</p>
      <p class="result-label">{{ resultLabel }}</p>
      <button class="restart-btn" @click="restart">다시 도전 🔄</button>
    </div>

    <!-- Question Screen -->
    <div v-else class="question-screen">
      <p class="quiz-progress">{{ currentIndex + 1 }} / {{ questions.length }}</p>
      <p class="quiz-question">{{ questions[currentIndex].q }}</p>

      <div class="options-grid">
        <button
          v-for="(opt, idx) in questions[currentIndex].options"
          :key="idx"
          class="option-btn"
          :class="optionClass(idx)"
          :disabled="answered"
          @click="answer(idx)"
        >
          {{ opt }}
        </button>
      </div>

      <div v-if="answered" class="answer-feedback">
        <p v-if="selectedOption === questions[currentIndex].answer" class="correct-msg">정답! 🎉</p>
        <p v-else class="wrong-msg">
          오답 😢 정답: {{ questions[currentIndex].options[questions[currentIndex].answer] }}
        </p>
        <button class="next-btn" @click="next">
          {{ currentIndex < questions.length - 1 ? '다음 문제 →' : '결과 보기 🏆' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Question {
  q: string
  options: string[]
  answer: number
}

const props = defineProps<{ questions: Question[] }>()

const currentIndex = ref(0)
const selectedOption = ref<number | null>(null)
const answered = ref(false)
const score = ref(0)
const finished = ref(false)

function answer(idx: number) {
  if (answered.value) return
  selectedOption.value = idx
  answered.value = true
  if (idx === props.questions[currentIndex.value].answer) {
    score.value++
  }
}

function next() {
  if (currentIndex.value < props.questions.length - 1) {
    currentIndex.value++
    selectedOption.value = null
    answered.value = false
  } else {
    finished.value = true
  }
}

function restart() {
  currentIndex.value = 0
  selectedOption.value = null
  answered.value = false
  score.value = 0
  finished.value = false
}

function optionClass(idx: number) {
  if (!answered.value) return ''
  const correct = props.questions[currentIndex.value].answer
  if (idx === correct) return 'correct'
  if (idx === selectedOption.value) return 'wrong'
  return ''
}

const resultEmoji = computed(() => {
  const ratio = score.value / props.questions.length
  if (ratio === 1) return '🌟'
  if (ratio >= 0.6) return '😊'
  return '💪'
})

const resultLabel = computed(() => {
  const ratio = score.value / props.questions.length
  if (ratio === 1) return '만점!'
  if (ratio >= 0.6) return '잘했어요!'
  return '다시 도전!'
})
</script>

<style scoped>
.quiz-container {
  max-width: 560px;
  margin: 1.5rem auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(196, 156, 255, 0.15), 0 1px 6px rgba(255, 107, 157, 0.1);
  padding: 2rem 1.75rem;
  border: 1px solid rgba(255, 107, 157, 0.12);
}

.quiz-progress {
  font-size: 0.78rem;
  color: #b89ac8;
  text-align: right;
  margin: 0 0 0.75rem;
  font-family: 'Noto Sans KR', sans-serif;
}

.quiz-question {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c2c2c;
  margin-bottom: 1.25rem;
  line-height: 1.6;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.option-btn {
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  border: 2px solid rgba(255, 107, 157, 0.3);
  background: linear-gradient(135deg, #fff0f8 0%, #f5eeff 100%);
  color: #3a2050;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  text-align: left;
  line-height: 1.4;
}

.option-btn:hover:not(:disabled) {
  border-color: #FF6B9D;
  transform: translateY(-1px);
}

.option-btn:disabled {
  cursor: not-allowed;
}

.option-btn.correct {
  border-color: #2ecc71;
  background: #eafaf1;
  color: #1a7a45;
}

.option-btn.wrong {
  border-color: #e74c3c;
  background: #fdf0ef;
  color: #a93226;
}

.answer-feedback {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

.correct-msg {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #2ecc71;
  margin: 0;
}

.wrong-msg {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 0.92rem;
  color: #e74c3c;
  margin: 0;
  text-align: center;
}

.next-btn {
  padding: 0.55rem 1.5rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #FF6B9D 0%, #C49CFF 100%);
  color: #fff;
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.next-btn:hover {
  opacity: 0.85;
}

/* Result Screen */
.result-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
}

.result-emoji {
  font-size: 3rem;
  margin: 0;
}

.result-score {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #FF6B9D;
  margin: 0;
}

.result-label {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 1.1rem;
  color: #9966cc;
  margin: 0;
  font-weight: 600;
}

.restart-btn {
  margin-top: 0.75rem;
  padding: 0.6rem 1.75rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #FF6B9D 0%, #C49CFF 100%);
  color: #fff;
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.restart-btn:hover {
  opacity: 0.85;
}
</style>
