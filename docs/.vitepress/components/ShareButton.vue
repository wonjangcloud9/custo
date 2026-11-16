<script setup lang="ts">
import { ref } from 'vue'
// Native share sheet when available (mobile), otherwise copy the link.
const props = defineProps<{ title: string; text?: string; url?: string; label?: string; dark?: boolean }>()
const state = ref<'idle' | 'copied' | 'shared'>('idle')
async function share() {
  const url = props.url || location.href
  const data = { title: props.title, text: props.text || props.title, url }
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data); state.value = 'shared'
    } else {
      await navigator.clipboard.writeText(url); state.value = 'copied'
    }
  } catch { return }
  setTimeout(() => (state.value = 'idle'), 1800)
}
</script>

<template>
  <button type="button" class="share" :class="{ dark: props.dark, done: state !== 'idle' }" @click="share">
    <span class="ic" aria-hidden="true">{{ state === 'idle' ? '🔗' : '✓' }}</span>
    <span>{{ state === 'copied' ? '링크 복사됨' : state === 'shared' ? '공유 완료' : (props.label || '공유하기') }}</span>
    <i v-if="state !== 'idle'" class="burst" aria-hidden="true"><b v-for="n in 6" :key="n" :style="{ '--a': n * 60 + 'deg' }">♥</b></i>
  </button>
</template>

<style scoped>
.share { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 700;
  background: #fff; color: #3a2340; border: 1.5px solid #f1d4e1; transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1), background 0.2s; }
.share:hover { transform: translateY(-2px) rotate(-1.5deg); }
.share:active { transform: scale(0.92); }
.share.dark { background: #3a2340; color: #fff; border-color: #3a2340; }
.share.done { background: #13866a; color: #fff; border-color: #13866a; }
.burst { position: absolute; left: 22px; top: 50%; pointer-events: none; }
.burst b { position: absolute; font-size: 10px; color: #ff6b9d; animation: fly 0.7s ease-out forwards; transform: rotate(var(--a)) translateY(0); }
@keyframes fly { to { transform: rotate(var(--a)) translateY(-26px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .burst { display: none; } .share { transition: none; } }
</style>
