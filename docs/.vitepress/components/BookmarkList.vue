<template>
  <div class="bookmark-list">
    <div v-if="bookmarks.length" class="bml-header">
      <span class="bml-count">저장한 단어 {{ bookmarks.length }}개</span>
      <button class="bml-clear" @click="clearAll">전체 삭제</button>
    </div>

    <div v-if="bookmarks.length" class="bml-grid">
      <div v-for="(b, i) in bookmarks" :key="b.word + b.reading" class="bml-card">
        <button class="bml-remove" title="삭제" @click="remove(i)">✕</button>
        <p class="bml-word">{{ b.word }}</p>
        <p class="bml-reading">{{ b.reading }}</p>
        <p class="bml-meaning">{{ b.meaning }}</p>
        <span class="bml-date">{{ b.date }}</span>
      </div>
    </div>

    <div v-else class="bml-empty">
      저장한 단어가 없어요! 학습 중 ⭐ 버튼을 눌러보세요
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Bookmark {
  word: string
  reading: string
  meaning: string
  date: string
}

const STORAGE_KEY = 'custo-bookmarks'
const bookmarks = ref<Bookmark[]>([])

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    bookmarks.value = raw ? JSON.parse(raw) : []
  } catch {
    bookmarks.value = []
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.value))
  } catch { /* 무시 */ }
}

function remove(index: number) {
  bookmarks.value.splice(index, 1)
  save()
}

function clearAll() {
  if (!confirm('저장한 단어를 모두 삭제할까요?')) return
  bookmarks.value = []
  save()
}

onMounted(load)
</script>

<style scoped>
.bookmark-list {
  margin: 1.5rem 0;
  font-family: 'Noto Sans KR', sans-serif;
}

.bml-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.bml-count {
  font-size: 0.95rem;
  font-weight: 600;
  color: #9966cc;
}

.bml-clear {
  background: none;
  border: 1.5px solid #FF6B9D;
  color: #FF6B9D;
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.bml-clear:hover {
  background: #FF6B9D;
  color: #fff;
}

.bml-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.85rem;
}

.bml-card {
  position: relative;
  background: linear-gradient(135deg, #ffe8f4 0%, #f0e4ff 100%);
  border-radius: 14px;
  padding: 1.1rem 1rem 0.9rem;
  box-shadow: 0 3px 14px rgba(196, 156, 255, 0.16),
              0 1px 4px rgba(255, 107, 157, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bml-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(196, 156, 255, 0.24),
              0 2px 8px rgba(255, 107, 157, 0.12);
}

.bml-remove {
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  color: #cba4e0;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  transition: color 0.15s;
}

.bml-remove:hover {
  color: #FF6B9D;
}

.bml-word {
  margin: 0;
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #3a2050;
}

.bml-reading {
  margin: 0.15rem 0 0;
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 0.82rem;
  color: #9966cc;
}

.bml-meaning {
  margin: 0.4rem 0 0;
  font-size: 0.88rem;
  color: #5a3d6e;
  font-weight: 500;
}

.bml-date {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.68rem;
  color: #c0a4d8;
}

.bml-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #b89ac8;
  font-size: 1rem;
  background: linear-gradient(135deg, #ffe8f4 0%, #f0e4ff 100%);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(196, 156, 255, 0.12);
}
</style>
