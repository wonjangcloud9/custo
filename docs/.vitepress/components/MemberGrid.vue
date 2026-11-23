<script setup lang="ts">
import { useOshi } from '../theme/oshi'
const oshi = useOshi()
import { withBase } from 'vitepress'
import { members, onColor } from '../data/members'
</script>

<template>
  <div class="mg">
    <a v-for="(m, i) in members" :key="m.id" class="mg-card" :href="withBase(`/members/${m.id}`)" :style="{ '--mc': m.color, '--on': onColor(m.color), '--i': i }">
      <span class="mg-no">{{ String(i + 1).padStart(2, '0') }}</span>
      <span class="mg-emoji" aria-hidden="true"><Ico n="heart" duo size="22" /></span>
      <span v-if="oshi === m.id" class="mg-oshi"><Ico n="heart" duo size="1em" /> 내 최애</span>
      <span class="mg-face" aria-hidden="true">{{ m.ja.slice(-2, -1) }}</span>
      <span class="mg-info">
        <b class="mg-ja" lang="ja">{{ m.ja }}</b>
        <span class="mg-ko">{{ m.ko }}</span>
        <span class="mg-meta">{{ m.birthday.replace(/-/g, '.') }} · {{ m.height }}cm · {{ m.colorName }}</span>
      </span>
      <span class="mg-go" aria-hidden="true">→</span>
    </a>
  </div>
</template>

<style scoped>
.mg {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin: 20px 0 36px;
}
.mg-card {
  position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;
  aspect-ratio: 4 / 5; padding: 16px; border-radius: 26px; text-decoration: none !important; color: #3a2340 !important;
  background:
    radial-gradient(120% 80% at 80% 0%, color-mix(in srgb, var(--mc) 55%, white), transparent 60%),
    linear-gradient(170deg, color-mix(in srgb, var(--mc) 30%, white), #fff 75%);
  border: 1.5px solid color-mix(in srgb, var(--mc) 30%, white);
  transition: transform 0.6s var(--spring), box-shadow 0.3s;
  animation: mgIn 0.8s var(--spring) both; animation-delay: calc(var(--i) * 60ms);
}
@keyframes mgIn { from { opacity: 0; transform: translateY(24px) scale(0.92); } }
.mg-card:hover { transform: translateY(-8px) rotate(calc((var(--i) - 3.5) * 0.4deg)); box-shadow: 0 24px 40px -20px color-mix(in srgb, var(--mc) 90%, #000); }
.mg-no { position: absolute; top: 14px; left: 16px; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; color: color-mix(in srgb, var(--mc) 45%, #2a1030); }
.mg-emoji { position: absolute; top: 10px; right: 14px; display: inline-flex; color: color-mix(in srgb, var(--mc) 80%, #2a1030); --ico-fill: var(--mc); transition: transform 0.6s var(--spring); }
.mg-card:hover .mg-emoji { transform: scale(1.4) rotate(-15deg); }
.mg-face {
  position: absolute; top: 8%; left: 50%; translate: -50% 0;
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 128px; line-height: 1;
  color: #fff; text-shadow: 0 10px 30px color-mix(in srgb, var(--mc) 80%, transparent);
  -webkit-text-stroke: 2px color-mix(in srgb, var(--mc) 50%, white);
  transition: transform 0.7s var(--spring);
}
.mg-card:hover .mg-face { transform: rotate(-8deg) scale(1.08); }
.mg-info { position: relative; display: flex; flex-direction: column; gap: 2px; }
.mg-ja { font-family: 'Zen Maru Gothic', var(--cs-sans); font-size: 22px; }
.mg-ko { font-size: 14px; font-weight: 600; }
.mg-meta { font-size: 11.5px; color: #735779; margin-top: 2px; }
.mg-go {
  position: absolute; right: 14px; bottom: 14px; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
  background: var(--mc); color: var(--on, #fff); font-weight: 700; transform: scale(0.6); opacity: 0; transition: transform 0.5s var(--spring), opacity 0.2s;
}
.mg-card:hover .mg-go, .mg-card:focus-visible .mg-go { transform: none; opacity: 1; }
@media (max-width: 520px) {
  .mg { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .mg-card { padding: 12px; border-radius: 20px; }
  .mg-face { font-size: 84px; }
  .mg-ja { font-size: 17px; }
  .mg-meta { font-size: 10.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .mg-card { animation: none; transition: none; }
  .mg-face, .mg-emoji, .mg-go { transition: none; }
}
.mg-oshi { position: absolute; top: 10px; right: 10px; z-index: 2; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 800; color: #fff; background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); }
</style>
