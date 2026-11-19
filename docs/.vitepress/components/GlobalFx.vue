<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import { members, memberById } from '../data/members'
import { loadOshi, oshi } from '../theme/oshi'

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

// the browser's toolbar colour (theme-color) follows the member: her colour on her page, else your 최애's, else pink
const DEFAULT_THEME = '#FF6B9D'
function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const id = route.path.match(/\/members\/([a-z]+)(?:\.html)?$/)?.[1]
  meta.setAttribute('content', (id && memberById[id]?.color) || (oshi.value && memberById[oshi.value]?.color) || DEFAULT_THEME)
}
watch([() => route.path, oshi], () => syncThemeColor())

// offline support (#234): register the service worker once the page is idle (production builds only), and say
// so when the connection drops — at an arena the page you're on keeps working from the saved copy
const net = ref<'' | 'offline' | 'back'>('')
let backTimer: ReturnType<typeof setTimeout> | undefined
const onOffline = () => { clearTimeout(backTimer); net.value = 'offline' }
const onOnline = () => { if (net.value !== 'offline') return; net.value = 'back'; backTimer = setTimeout(() => (net.value = ''), 2600) }
function registerSw() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const go = () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {})
  'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 2000)
}

// a few screen-reader labels are hard-coded in English inside VitePress' theme (no config for them) — #200
const CHROME_KO: [string, string, string][] = [
  ['#main-nav-aria-label', 'text', '주 메뉴'],
  ['#sidebar-aria-label', 'text', '사이드바 메뉴'],
  ['#doc-footer-aria-label', 'text', '이전·다음 페이지'],
  ['.VPNavBarHamburger', 'aria-label', '메뉴 열기'],
  ['.VPNavBarExtra button', 'aria-label', '더 보기'],
  ['.VPSidebarItem .caret[role="button"]', 'aria-label', '목록 펼치기·접기'],
]
function localizeChrome() {
  for (const [sel, what, ko] of CHROME_KO) {
    for (const el of document.querySelectorAll(sel)) {
      if (what === 'text') { if (el.textContent?.trim() !== ko) el.textContent = ko } else el.setAttribute(what, ko)
    }
  }
}
watch(() => route.path, () => nextTick(localizeChrome))

onMounted(() => {
  localizeChrome()
  registerSw()
  if (!navigator.onLine) net.value = 'offline'
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
  loadOshi()
  syncThemeColor()
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('pointerdown', burst, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', burst)
  window.removeEventListener('offline', onOffline)
  window.removeEventListener('online', onOnline)
  clearTimeout(backTimer)
})
watch(() => route.path, () => requestAnimationFrame(enter))
</script>

<template>
  <div class="fx-progress" aria-hidden="true" />
  <div class="fx-net-live" role="status" aria-live="polite">
    <Transition name="fx-net">
      <p v-if="net" :key="net" class="fx-net" :class="net">
        <span class="fx-net-i" aria-hidden="true">{{ net === 'offline' ? '📴' : '📶' }}</span>
        {{ net === 'offline' ? '오프라인 — 저장된 화면으로 볼게요' : '다시 연결됐어요' }}
      </p>
    </Transition>
  </div>
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
/* connection pill: bottom-centre, above the phone home bar; the icon gives a little "searching for signal" wobble */
.fx-net-live { position: fixed; left: 0; right: 0; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 90; display: flex; justify-content: center; pointer-events: none; }
.fx-net { margin: 0; display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px 9px 12px; border-radius: 999px; font-size: 13.5px; font-weight: 800; letter-spacing: 0.01em;
  color: #fff; background: #3a2340; box-shadow: 0 14px 30px -14px rgba(42, 16, 48, 0.7), inset 0 0 0 1.5px rgba(255, 255, 255, 0.14); word-break: keep-all; }
.fx-net.back { background: #0f7a5c; }
.fx-net-i { display: inline-block; font-size: 15px; }
.fx-net.offline .fx-net-i { animation: fx-net-seek 2.4s ease-in-out infinite; }
@keyframes fx-net-seek { 0%, 60%, 100% { transform: rotate(0); } 70% { transform: rotate(-14deg); } 80% { transform: rotate(10deg); } 90% { transform: rotate(-5deg); } }
.fx-net-enter-active { transition: transform 0.5s cubic-bezier(.34, 1.56, .64, 1), opacity 0.3s; }
.fx-net-leave-active { transition: transform 0.3s ease-in, opacity 0.25s; }
.fx-net-enter-from, .fx-net-leave-to { transform: translateY(24px) scale(0.9); opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .fx-progress { animation: none !important; transform: scaleX(0); }
  .fx-net.offline .fx-net-i { animation: none; }
  .fx-net-enter-active, .fx-net-leave-active { transition: opacity 0.2s; }
  .fx-net-enter-from, .fx-net-leave-to { transform: none; }
}
</style>
