<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClock } from '../theme/today'
import { loadFonts, roundRect, fitText, deliver } from '../theme/card'

// A share card counting down to a big date (album release, 紅白 …): 1080×1350 canvas, text and colour only.
// Hidden once the date has passed; on the day it reads TODAY.
const props = defineProps<{
  date: string // YYYY-MM-DD (Japan date)
  kicker: string // small line at the top
  glyph: string // 1–2 characters in the tile
  title: string // e.g. '「CUTIE LAND」 발매까지'
  todayTitle: string // e.g. '「CUTIE LAND」 오늘 발매!'
  sub: string // date line
  from: string // gradient start (white text sits on it — pick a deep colour)
  to: string // gradient end
  file: string // download name without extension
  path: string // site path shown in the footer, e.g. '/cutie-land/'
  label?: string // button text
}>()
const now = useClock()
const jst = (ms: number) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10)
const days = computed(() => (now.value === null ? null : Math.round((Date.parse(`${props.date}T00:00:00+09:00`) - Date.parse(`${jst(now.value)}T00:00:00+09:00`)) / 86400000)))
const state = ref<'' | 'busy' | 'saved' | 'shared' | 'failed'>('')

async function draw(d: number): Promise<Blob | null> {
  const W = 1080, H = 1350
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const g = cv.getContext('2d')
  if (!g) return null
  const footer = `CUTIE STREET 팬허브 · ${location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}${props.path}`
  await loadFonts(props.kicker + props.glyph + props.title + props.todayTitle + props.sub + footer + 'D-0123456789TODAY',
    ['700 120px "Zen Maru Gothic"', '700 60px "Noto Sans KR"', '700 60px "Noto Sans JP"'])
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, props.from); bg.addColorStop(1, props.to)
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  const glow = g.createRadialGradient(W * 0.78, H * 0.18, 30, W * 0.78, H * 0.18, 640)
  glow.addColorStop(0, 'rgba(255,255,255,0.28)'); glow.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = glow; g.fillRect(0, 0, W, H)
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillStyle = 'rgba(255,255,255,0.16)'
  for (const [x, y, s] of [[120, 170, 64], [950, 330, 50], [170, 1080, 84], [900, 1170, 60], [80, 660, 46], [990, 780, 42]]) {
    g.font = `700 ${s}px "Noto Sans KR", sans-serif`; g.fillText('✦', x, y)
  }
  g.fillStyle = '#fff'
  fitText(g, props.kicker, '"Noto Sans JP", "Noto Sans KR", sans-serif', 40, W / 2, 130, W - 160)
  g.fillStyle = 'rgba(255,255,255,0.2)'; roundRect(g, W / 2 - 170, 200, 340, 340, 72); g.fill()
  g.fillStyle = '#fff'
  fitText(g, props.glyph, '"Zen Maru Gothic", "Noto Sans JP", sans-serif', props.glyph.length > 1 ? 150 : 210, W / 2, 380, 300)
  g.font = `700 ${d === 0 ? 210 : 250}px "Zen Maru Gothic", sans-serif`
  g.fillText(d === 0 ? 'TODAY' : `D-${d}`, W / 2, 750)
  g.fillStyle = 'rgba(255,255,255,0.92)'
  fitText(g, d === 0 ? props.todayTitle : props.title, '"Noto Sans KR", "Noto Sans JP", sans-serif', 56, W / 2, 930, W - 120)
  g.fillStyle = 'rgba(255,255,255,0.8)'
  fitText(g, props.sub, '"Noto Sans KR", "Noto Sans JP", sans-serif', 42, W / 2, 1010, W - 120)
  g.fillStyle = 'rgba(255,255,255,0.7)'
  fitText(g, footer, '"Noto Sans KR", sans-serif', 32, W / 2, H - 90, W - 120)
  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'))
}

async function save() {
  if (state.value === 'busy' || days.value === null || days.value < 0) return
  state.value = 'busy'
  let blob: Blob | null = null
  try { blob = await draw(days.value) } catch { /* reported below */ }
  if (!blob) { state.value = 'failed' } else {
    const r = await deliver(blob, `${props.file}.png`, props.title)
    state.value = r === 'cancelled' ? '' : r
  }
  if (state.value) setTimeout(() => (state.value = ''), 1800)
}
</script>

<template>
  <div v-if="days !== null && days >= 0" class="cc">
    <button type="button" class="cc-btn" :disabled="state === 'busy'" @click="save">
      {{ state === 'busy' ? '만드는 중…' : state === 'saved' ? '✓ 저장했어요' : state === 'shared' ? '✓ 공유 완료' : state === 'failed' ? '만들지 못했어요' : (label ?? '📸 D-day 카드 저장') }}
    </button>
    <span class="sr-only" aria-live="polite">{{ state === 'saved' ? '카드 이미지를 저장했어요' : state === 'shared' ? '카드 이미지를 공유했어요' : state === 'failed' ? '카드 이미지를 만들지 못했어요' : '' }}</span>
  </div>
</template>

<style scoped>
.cc { display: flex; justify-content: center; margin: 4px 0 18px; }
.cc-btn { padding: 9px 18px; border-radius: 999px; font-size: 13.5px; font-weight: 800; color: #fff; background: linear-gradient(100deg, v-bind(from), v-bind(to));
  box-shadow: 0 10px 22px -14px rgba(90, 30, 70, 0.6); transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.cc-btn:hover:not(:disabled) { transform: translateY(-2px) rotate(-1deg); }
.cc-btn:disabled { opacity: 0.7; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .cc-btn { transition: none; } }
</style>
