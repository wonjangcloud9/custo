<script setup lang="ts">
import { ref } from 'vue'
import { memberById, onColor, ageOn } from '../data/members'
import { loadFonts, roundRect, fitText, deliver } from '../theme/card'

// '생일 D-day 카드': draws a 1080×1350 share card on a canvas — member colour, her kanji, the countdown,
// names and the date. Text and colour only (no photos, rule 2). Phones get the share sheet, others a PNG download.
const props = defineProps<{ id: string; dday: number | null }>()
const state = ref<'' | 'busy' | 'saved' | 'shared' | 'failed'>('')

const mix = (hex: string, w: number) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${c.map((v) => Math.round(v + (255 - v) * w)).join(',')})`
}

async function draw(): Promise<Blob | null> {
  const m = memberById[props.id]
  const W = 1080, H = 1350
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  await loadFonts(`${m.ja}${m.ko}0123456789D-HAPPYBIRTHDAY오늘은의번째생일까지♥·月日CUTIESTREET팬허브${location.host}/members`,
    ['700 120px "Zen Maru Gothic"', '700 60px "Noto Sans KR"', '700 60px "Noto Sans JP"'])
  const ink = onColor(m.color)
  const soft = ink === '#fff' ? 'rgba(255,255,255,0.82)' : 'rgba(42,16,48,0.72)'
  // background: member colour fading to a lighter tint, with a soft glow
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, m.color); bg.addColorStop(1, mix(m.color, 0.35))
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  const glow = g.createRadialGradient(W * 0.75, H * 0.2, 40, W * 0.75, H * 0.2, 620)
  glow.addColorStop(0, 'rgba(255,255,255,0.35)'); glow.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = glow; g.fillRect(0, 0, W, H)
  // scattered hearts (fixed positions so every save looks the same)
  g.fillStyle = ink === '#fff' ? 'rgba(255,255,255,0.22)' : 'rgba(42,16,48,0.12)'
  g.textAlign = 'center'; g.textBaseline = 'middle'
  for (const [x, y, s] of [[120, 160, 70], [930, 300, 54], [180, 1060, 90], [880, 1180, 66], [560, 120, 40], [980, 760, 46], [90, 640, 50]]) {
    g.font = `700 ${s}px "Noto Sans KR", sans-serif`; g.fillText('♥', x, y)
  }
  // the kanji tile
  const kanji = m.ja.slice(-2, -1)
  g.fillStyle = ink === '#fff' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.45)'
  const tx = W / 2 - 170, ty = 170
  roundRect(g, tx, ty, 340, 340, 72); g.fill()
  g.fillStyle = ink; g.font = '700 230px "Zen Maru Gothic", "Noto Sans JP", sans-serif'; g.fillText(kanji, W / 2, ty + 180)
  // countdown
  const d = props.dday
  const today = d === 0
  g.font = `700 ${today ? 150 : 250}px "Zen Maru Gothic", sans-serif`
  g.fillText(today ? 'HAPPY' : `D-${d}`, W / 2, today ? 690 : 720)
  if (today) g.fillText('BIRTHDAY', W / 2, 850)
  const fit = (text: string, family: string, size: number, y: number) => fitText(g, text, family, size, W / 2, y, W - 120)
  g.fillStyle = soft
  const turning = ageOn(m.birthday, new Date()) + (today ? 0 : 1)
  fit(today ? `오늘은 ${m.ko}의 ${turning}번째 생일 ♥` : `${m.ko} ${turning}번째 생일까지`, '"Noto Sans KR", sans-serif', 54, today ? 990 : 900)
  fit(`${m.ja} · ${+m.birthday.slice(5, 7)}月${+m.birthday.slice(8)}日`, '"Noto Sans JP", sans-serif', 46, today ? 1070 : 980)
  // footer
  g.fillStyle = ink === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(42,16,48,0.6)'
  fit(`CUTIE STREET 팬허브 · ${location.host}${import.meta.env.BASE_URL}members/${m.id}`, '"Noto Sans KR", sans-serif', 34, H - 90)
  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'))
}

async function save() {
  if (state.value === 'busy' || props.dday === null) return
  state.value = 'busy'
  const m = memberById[props.id]
  let blob: Blob | null = null
  try { blob = await draw() } catch { /* canvas unsupported → report below instead of staying 'busy' */ }
  if (!blob) { state.value = 'failed'; return reset() }
  const r = await deliver(blob, `cutiestreet-${m.id}-birthday.png`, `${m.ko} 생일 카운트다운`)
  if (r === 'cancelled') { state.value = ''; return }
  state.value = r; reset()
}
function reset() { setTimeout(() => (state.value = ''), 1800) }
</script>

<template>
  <span class="sr-only" aria-live="polite">{{ state === 'saved' ? '카드 이미지를 저장했어요' : state === 'shared' ? '카드 이미지를 공유했어요' : state === 'failed' ? '카드 이미지를 만들지 못했어요' : '' }}</span>
  <button type="button" class="bc" :disabled="dday === null || state === 'busy'" @click="save">
    {{ state === 'busy' ? '만드는 중…' : state === 'saved' ? '✓ 저장했어요' : state === 'shared' ? '✓ 공유 완료' : state === 'failed' ? '만들지 못했어요' : dday === 0 ? '🎂 축하 카드 저장' : '🎂 D-day 카드 저장' }}
  </button>
</template>

<style scoped>
.bc { margin-top: 8px; align-self: flex-start; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #fff; color: var(--mc-deep, #6b1d43);
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--mc, #ff6b9d) 40%, white); transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.bc:hover:not(:disabled) { transform: translateY(-2px) rotate(-1deg); }
.bc:disabled { opacity: 0.6; }
@media (prefers-reduced-motion: reduce) { .bc { transition: none; } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
