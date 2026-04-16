<template>
  <div class="romaji-toggle-wrapper">
    <button class="toggle-btn" @click="showRomaji = !showRomaji">
      <span class="toggle-icon">{{ showRomaji ? '🔤' : '✨' }}</span>
      {{ showRomaji ? '로마지 숨기기' : '로마지 보기' }}
    </button>

    <div class="items-grid">
      <div v-for="(item, i) in items" :key="i" class="item-card">
        <p class="jp-text">{{ item.japanese }}</p>
        <Transition name="romaji-slide">
          <p v-if="showRomaji" class="romaji-text">{{ item.romaji }}</p>
        </Transition>
        <p v-if="item.meaning" class="meaning-text">{{ item.meaning }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface RomajiItem {
  japanese: string
  romaji: string
  meaning?: string
}

defineProps<{ items: RomajiItem[] }>()

const showRomaji = ref(false)
</script>

<style scoped>
.romaji-toggle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin: 1.5rem 0;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.4rem;
  border: 2px solid var(--custo-pink, #FF6B9D);
  border-radius: 999px;
  background: #fff;
  color: #FF6B9D;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.25s, color 0.25s, box-shadow 0.25s;
}

.toggle-btn:hover {
  background: #FF6B9D;
  color: #fff;
  box-shadow: 0 4px 14px rgba(255, 107, 157, 0.3);
}

.toggle-icon {
  font-size: 1rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.9rem;
  width: 100%;
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}

.item-card {
  background: linear-gradient(135deg, #ffe8f4 0%, #f0e4ff 100%);
  border-radius: 14px;
  padding: 1rem 0.9rem;
  text-align: center;
  box-shadow:
    0 3px 14px rgba(196, 156, 255, 0.15),
    0 1px 4px rgba(255, 107, 157, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(196, 156, 255, 0.25),
    0 2px 8px rgba(255, 107, 157, 0.12);
}

.jp-text {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: #3a2050;
  margin: 0 0 0.25rem;
  line-height: 1.5;
}

.romaji-text {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: #9966cc;
  margin: 0 0 0.2rem;
  letter-spacing: 0.03em;
}

.meaning-text {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 0.8rem;
  font-weight: 400;
  color: #b89ac8;
  margin: 0.3rem 0 0;
}

/* Romaji slide transition */
.romaji-slide-enter-active,
.romaji-slide-leave-active {
  transition: opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease;
  overflow: hidden;
  max-height: 2rem;
}

.romaji-slide-enter-from,
.romaji-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin: 0;
}
</style>
