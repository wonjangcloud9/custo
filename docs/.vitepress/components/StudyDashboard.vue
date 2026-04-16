<template>
  <div class="dashboard">
    <h2 class="dashboard-title">나의 학습 현황</h2>

    <!-- Empty State -->
    <div v-if="!hasData" class="empty-state">
      <span class="empty-icon">📚</span>
      <p class="empty-msg">아직 학습 기록이 없어요!<br>퀴즈나 플래시카드를 시작해보세요</p>
    </div>

    <!-- Data State -->
    <template v-else>
      <!-- Streak & Last Study -->
      <div class="info-row">
        <div class="info-card">
          <span class="info-icon">🔥</span>
          <div>
            <p class="info-label">연속 학습</p>
            <p class="info-value">{{ streakDays }}일</p>
          </div>
        </div>
        <div class="info-card">
          <span class="info-icon">📅</span>
          <div>
            <p class="info-label">마지막 학습</p>
            <p class="info-value">{{ formattedLastDate }}</p>
          </div>
        </div>
      </div>

      <!-- Quiz Scores -->
      <section v-if="quizEntries.length" class="section">
        <h3 class="section-title">퀴즈 점수</h3>
        <div v-for="entry in quizEntries" :key="entry.id" class="bar-item">
          <div class="bar-header">
            <span class="bar-label">{{ entry.id }}</span>
            <span class="bar-score">{{ entry.score }}/{{ entry.total }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill quiz-fill" :style="{ width: entry.pct + '%' }"></div>
          </div>
        </div>
      </section>

      <!-- Flashcard Progress -->
      <section v-if="flashcardEntries.length" class="section">
        <h3 class="section-title">플래시카드 진행률</h3>
        <div v-for="entry in flashcardEntries" :key="entry.id" class="bar-item">
          <div class="bar-header">
            <span class="bar-label">{{ entry.id }}</span>
            <span class="bar-score">{{ entry.viewed }}/{{ entry.total }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill fc-fill" :style="{ width: entry.pct + '%' }"></div>
          </div>
        </div>
      </section>

      <!-- Reset -->
      <div class="reset-wrap">
        <button class="reset-btn" @click="resetProgress">초기화</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface QuizScore { score: number; total: number; date: string }
interface FlashcardProg { viewed: number; total: number; date: string }
interface StudyProgress {
  quizScores: Record<string, QuizScore[]>
  flashcardProgress: Record<string, FlashcardProg>
  lastStudyDate: string
}

const STORAGE_KEY = 'custo-study-progress'
const data = ref<StudyProgress | null>(null)

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    data.value = raw ? JSON.parse(raw) : null
  } catch { data.value = null }
}

onMounted(load)

const hasData = computed(() => !!data.value)

const formattedLastDate = computed(() => {
  if (!data.value?.lastStudyDate) return '-'
  return data.value.lastStudyDate.slice(0, 10)
})

const streakDays = computed(() => {
  if (!data.value?.lastStudyDate) return 0
  const last = new Date(data.value.lastStudyDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - last.getTime()) / 86_400_000)
  return diff <= 1 ? 1 : 0
})

const quizEntries = computed(() => {
  if (!data.value?.quizScores) return []
  return Object.entries(data.value.quizScores).map(([id, attempts]) => {
    const latest = attempts[attempts.length - 1]
    const pct = latest.total ? Math.round((latest.score / latest.total) * 100) : 0
    return { id, score: latest.score, total: latest.total, pct }
  })
})

const flashcardEntries = computed(() => {
  if (!data.value?.flashcardProgress) return []
  return Object.entries(data.value.flashcardProgress).map(([id, p]) => {
    const pct = p.total ? Math.round((p.viewed / p.total) * 100) : 0
    return { id, viewed: p.viewed, total: p.total, pct }
  })
})

function resetProgress() {
  if (!confirm('학습 기록을 모두 초기화할까요?')) return
  localStorage.removeItem(STORAGE_KEY)
  data.value = null
}
</script>

<style scoped>
.dashboard {
  max-width: 560px;
  margin: 1.5rem auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(196,156,255,.15), 0 1px 6px rgba(255,107,157,.1);
  padding: 2rem 1.75rem;
  border: 1px solid rgba(255,107,157,.12);
  font-family: 'Noto Sans KR', sans-serif;
}

.dashboard-title {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #FF6B9D;
  text-align: center;
  margin: 0 0 1.5rem;
}

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 2rem 0; }
.empty-icon { font-size: 2.5rem; }
.empty-msg { text-align: center; color: #b89ac8; font-size: .92rem; line-height: 1.6; margin: 0; }

/* Info Row */
.info-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1.5rem; }
.info-card { display: flex; align-items: center; gap: .6rem; background: linear-gradient(135deg, #fff0f8, #f5eeff); border-radius: 12px; padding: .75rem 1rem; }
.info-icon { font-size: 1.4rem; }
.info-label { font-size: .72rem; color: #b89ac8; margin: 0; }
.info-value { font-family: 'Zen Maru Gothic', sans-serif; font-size: 1.05rem; font-weight: 700; color: #3a2050; margin: 0; }

/* Sections */
.section { margin-bottom: 1.25rem; }
.section-title { font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif; font-size: .95rem; font-weight: 700; color: #9966cc; margin: 0 0 .65rem; }

/* Bar Items */
.bar-item { margin-bottom: .65rem; }
.bar-header { display: flex; justify-content: space-between; margin-bottom: .25rem; }
.bar-label { font-size: .82rem; color: #3a2050; font-weight: 500; }
.bar-score { font-size: .78rem; color: #b89ac8; }
.bar-track { height: 10px; background: #f5eeff; border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }
.quiz-fill { background: linear-gradient(90deg, #FF6B9D, #C49CFF); }
.fc-fill { background: linear-gradient(90deg, #C49CFF, #FF6B9D); }

/* Reset */
.reset-wrap { display: flex; justify-content: center; margin-top: 1rem; }
.reset-btn { padding: .5rem 1.5rem; border-radius: 999px; border: 2px solid #FF6B9D; background: #fff; color: #FF6B9D; font-family: 'Noto Sans KR', sans-serif; font-size: .85rem; font-weight: 600; cursor: pointer; transition: background .2s, color .2s; }
.reset-btn:hover { background: #FF6B9D; color: #fff; }
</style>
