<template>
  <button
    class="word-bookmark"
    :class="{ active: isBookmarked }"
    :title="isBookmarked ? '북마크 해제' : '단어 저장'"
    @click.stop="toggle"
  >
    <svg viewBox="0 0 24 24" class="bm-icon">
      <path
        v-if="isBookmarked"
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
        fill="currentColor"
      />
      <path
        v-else
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </svg>
  </button>
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

const props = defineProps<{
  word: string
  reading: string
  meaning: string
}>()

const isBookmarked = ref(false)

function getBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBookmarks(list: Bookmark[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch { /* 무시 */ }
}

function checkState() {
  const list = getBookmarks()
  isBookmarked.value = list.some(
    (b) => b.word === props.word && b.reading === props.reading,
  )
}

function toggle() {
  const list = getBookmarks()
  const idx = list.findIndex(
    (b) => b.word === props.word && b.reading === props.reading,
  )
  if (idx >= 0) {
    list.splice(idx, 1)
    isBookmarked.value = false
  } else {
    list.push({
      word: props.word,
      reading: props.reading,
      meaning: props.meaning,
      date: new Date().toISOString().slice(0, 10),
    })
    isBookmarked.value = true
  }
  saveBookmarks(list)
}

onMounted(checkState)
</script>

<style scoped>
.word-bookmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #C49CFF;
  cursor: pointer;
  vertical-align: middle;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.2s ease;
}

.word-bookmark:hover {
  color: #FF6B9D;
  transform: scale(1.2);
}

.word-bookmark.active {
  color: #FF6B9D;
  animation: bm-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bm-icon {
  width: 18px;
  height: 18px;
}

@keyframes bm-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.4); }
  100% { transform: scale(1); }
}
</style>
