<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// '📥 저장됨' chip (#235): tells you this page is saved by the service worker (#234), so it will open at the
// venue without signal. Shown only once the copy really is in the cache — checked on mount, again when the
// worker takes control, and once more a few seconds later (the first visit saves pages while idle).
const ready = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const pageKey = (path: string) => location.origin + path.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '')

async function check() {
  if (ready.value || !('caches' in window)) return
  try {
    for (const name of await caches.keys()) {
      if (!name.startsWith('cs-pages-')) continue
      if (await (await caches.open(name)).match(pageKey(location.pathname))) { ready.value = true; return }
    }
  } catch { /* storage blocked (private mode): just don't show the chip */ }
}

onMounted(() => {
  if (!('serviceWorker' in navigator)) return
  check()
  navigator.serviceWorker.addEventListener('controllerchange', check)
  timer = setTimeout(check, 7000)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', check)
})
</script>

<template>
  <!-- the slot is always there (server-rendered) so the chip fading in never pushes the page down -->
  <p class="or" :class="{ on: ready }" :aria-hidden="!ready">
    <span class="or-i" aria-hidden="true">📥</span>
    <span><b>저장됨</b> · 전파가 없어도 이 페이지는 열려요</span>
  </p>
</template>

<style scoped>
.or { display: flex; width: fit-content; max-width: 100%; align-items: center; gap: 8px; margin: -6px 0 18px !important; padding: 7px 14px 7px 10px; border-radius: 999px;
  font-size: 13px; line-height: 1.4; color: #3f2645; background: #fff; box-shadow: inset 0 0 0 1.5px #d9c7e6, 0 8px 18px -14px rgba(90, 30, 70, 0.5); word-break: keep-all;
  visibility: hidden; opacity: 0; transform: translateY(6px) scale(0.96); transition: opacity 0.35s, transform 0.5s cubic-bezier(.34, 1.56, .64, 1), visibility 0s 0.5s; }
.or.on { visibility: visible; opacity: 1; transform: none; transition: opacity 0.35s, transform 0.5s cubic-bezier(.34, 1.56, .64, 1); }
.or b { color: #0f6e53; }
.or-i { display: inline-block; font-size: 15px; }
/* the arrow "drops" into the tray once, like a download landing */
.or.on .or-i { animation: or-drop 0.8s 0.15s cubic-bezier(.3, 1.4, .5, 1) both; }
@keyframes or-drop { 0% { transform: translateY(-10px); opacity: 0; } 50% { transform: translateY(2px); opacity: 1; } 75% { transform: translateY(-2px); } 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .or, .or.on { transform: none; transition: opacity 0.2s; }
  .or.on .or-i { animation: none; }
}
</style>
