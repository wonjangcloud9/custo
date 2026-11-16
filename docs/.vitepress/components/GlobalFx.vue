<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vitepress'
import { members } from '../data/members'

const route = useRoute()
let reduce = false
let last = 0

function burst(e: PointerEvent) {
  if (reduce || e.button !== 0) return
  const t = e.target
  if (t instanceof Element && t.closest('input, textarea, select, iframe, canvas, [contenteditable]')) return
  const now = performance.now()
  if (now - last < 120) return
  last = now
  const n = 6
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.className = 'fx-heart'
    s.textContent = i % 3 === 0 ? '✦' : '♥'
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.6
    const d = 26 + Math.random() * 22
    s.style.left = e.clientX + 'px'
    s.style.top = e.clientY + 'px'
    s.style.color = members[(Math.floor(now / 7) + i) % members.length].color
    s.style.setProperty('--dx', Math.cos(a) * d + 'px')
    s.style.setProperty('--dy', Math.sin(a) * d - 10 + 'px')
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 750)
  }
}

function enter() {
  if (reduce) return
  const el = document.querySelector('.VPContent') as HTMLElement | null
  if (!el) return
  el.classList.remove('fx-enter')
  void el.offsetWidth
  el.classList.add('fx-enter')
  setTimeout(() => el.classList.remove('fx-enter'), 700)
}

onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('pointerdown', burst, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('pointerdown', burst))
watch(() => route.path, () => requestAnimationFrame(enter))
</script>

<template>
  <div class="fx-progress" aria-hidden="true" />
</template>

<style>
.fx-progress {
  position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 100; pointer-events: none;
  background: linear-gradient(90deg, #ffc93c, #ff4757, #3ccfa8, #4a90d9, #ff9f43, #5dc8f5, #a06cd5, #ff6b9d);
  transform-origin: 0 50%; transform: scaleX(0);
}
@supports (animation-timeline: scroll()) {
  .fx-progress { animation: fx-grow linear both; animation-timeline: scroll(root block); }
  @keyframes fx-grow { to { transform: scaleX(1); } }
}
.fx-heart {
  position: fixed; z-index: 9999; pointer-events: none; font-size: 13px; line-height: 1; translate: -50% -50%;
  animation: fx-pop 0.75s cubic-bezier(.2, .8, .2, 1) forwards;
}
@keyframes fx-pop {
  0% { transform: translate(0, 0) scale(0.2); opacity: 1; }
  60% { opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(1) rotate(25deg); opacity: 0; }
}
.VPContent.fx-enter { animation: fx-enter 0.6s cubic-bezier(.2, .8, .2, 1); }
@keyframes fx-enter { from { opacity: 0.001; transform: translateY(14px); filter: blur(4px); } }
@media (prefers-reduced-motion: reduce) {
  .fx-progress { animation: none !important; transform: scaleX(0); }
}
</style>
