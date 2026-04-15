<template>
  <div class="flashcard-wrapper">
    <div class="card-scene" @click="flip">
      <div class="card-body" :class="{ flipped: isFlipped }">
        <div class="card-face card-front">
          <p class="card-text">{{ cards[currentIndex].front }}</p>
          <span class="flip-hint">클릭해서 뒤집기</span>
        </div>
        <div class="card-face card-back">
          <p class="card-text">{{ cards[currentIndex].back }}</p>
        </div>
      </div>
    </div>

    <div class="card-controls">
      <button class="nav-btn" :disabled="currentIndex === 0" @click.stop="prev">◀</button>
      <span class="progress">{{ currentIndex + 1 }} / {{ cards.length }}</span>
      <button class="nav-btn" :disabled="currentIndex === cards.length - 1" @click.stop="next">▶</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Card {
  front: string
  back: string
}

const props = defineProps<{ cards: Card[] }>()

const currentIndex = ref(0)
const isFlipped = ref(false)

function flip() {
  isFlipped.value = !isFlipped.value
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    isFlipped.value = false
  }
}

function next() {
  if (currentIndex.value < props.cards.length - 1) {
    currentIndex.value++
    isFlipped.value = false
  }
}
</script>

<style scoped>
.flashcard-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin: 1.5rem 0;
}

.card-scene {
  width: 100%;
  max-width: 480px;
  height: 220px;
  perspective: 900px;
  cursor: pointer;
}

.card-body {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
  border-radius: 16px;
}

.card-body.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 4px 20px rgba(196, 156, 255, 0.18), 0 1px 6px rgba(255, 107, 157, 0.1);
}

.card-front {
  background: linear-gradient(135deg, #ffe8f4 0%, #f0e4ff 100%);
}

.card-back {
  background: linear-gradient(135deg, #FF6B9D 0%, #C49CFF 100%);
  color: #fff;
  transform: rotateY(180deg);
}

.card-text {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  text-align: center;
  margin: 0;
  color: inherit;
  line-height: 1.5;
}

.card-front .card-text {
  color: #3a2050;
}

.flip-hint {
  position: absolute;
  bottom: 0.75rem;
  font-size: 0.72rem;
  color: #b89ac8;
  font-family: 'Noto Sans KR', sans-serif;
  letter-spacing: 0.02em;
}

.card-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  background: #fff;
  border: 2px solid #FF6B9D;
  color: #FF6B9D;
  border-radius: 999px;
  width: 40px;
  height: 40px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover:not(:disabled) {
  background: #FF6B9D;
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.progress {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
  font-size: 0.9rem;
  color: #9966cc;
  font-weight: 600;
  min-width: 48px;
  text-align: center;
}
</style>
