<script setup lang="ts">
import { withBase } from 'vitepress'
import type { Member } from '../data/members'
// Floating balloons + banner for a member's birthday. Purely decorative motion; reduced-motion shows a static banner.
const props = defineProps<{ m: Member; age: number | null; compact?: boolean }>()
const balloons = Array.from({ length: 7 }, (_, i) => ({ x: 6 + i * 14, d: (i % 4) * 0.6, s: 0.8 + (i % 3) * 0.18, c: i % 2 }))
</script>

<template>
  <a v-if="props.compact" class="ribbon" :href="withBase(`/members/${props.m.id}`)" :style="{ '--mc': props.m.color }">
    <span class="rb-emoji" aria-hidden="true">🎂</span>
    <span>오늘은 <b>{{ props.m.ko }}</b>의 {{ props.age ? props.age + '번째 ' : '' }}생일! HAPPY BIRTHDAY {{ props.m.emoji }}</span>
    <span class="rb-go" aria-hidden="true">→</span>
  </a>
  <div v-else class="party" :style="{ '--mc': props.m.color }" role="status">
    <div class="balloons" aria-hidden="true">
      <span v-for="(b, i) in balloons" :key="i" class="bl" :class="{ alt: b.c }" :style="{ left: b.x + '%', animationDelay: b.d + 's', scale: b.s }"><i /></span>
    </div>
    <p class="hb">HAPPY BIRTHDAY</p>
    <p class="who">🎂 {{ props.m.ja }} · {{ props.m.ko }}<template v-if="props.age"> — {{ props.age }}번째 생일</template> {{ props.m.emoji }}</p>
    <p class="say" lang="ja">お誕生日おめでとう！</p>
  </div>
</template>

<style scoped>
.ribbon { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 12px 18px; border-radius: 999px; text-decoration: none !important; color: #fff !important; font-weight: 700;
  background: linear-gradient(90deg, color-mix(in srgb, var(--mc) 62%, #2a1030), color-mix(in srgb, var(--mc) 80%, #2a1030)); box-shadow: 0 14px 30px -16px var(--mc); }
.rb-emoji { font-size: 22px; animation: wob 1.6s ease-in-out infinite; }
@keyframes wob { 50% { transform: rotate(-12deg) scale(1.15); } }
.rb-go { margin-left: auto; }
.party { position: relative; overflow: hidden; margin: 0 0 14px; padding: 26px 20px 22px; border-radius: 28px; text-align: center; color: #fff;
  background: radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--mc) 70%, white), color-mix(in srgb, var(--mc) 62%, #2a1030)); }
.balloons { position: absolute; inset: 0; pointer-events: none; }
.bl { position: absolute; bottom: -90px; width: 44px; height: 56px; border-radius: 50% 50% 46% 46%; background: radial-gradient(circle at 35% 30%, #fff8, transparent 30%), #fff; opacity: 0.85;
  animation: rise 6s ease-in infinite; }
.bl.alt { background: radial-gradient(circle at 35% 30%, #fff8, transparent 30%), color-mix(in srgb, var(--mc) 40%, white); }
.bl i { position: absolute; left: 50%; top: 100%; width: 1px; height: 40px; background: rgba(255, 255, 255, 0.7); }
@keyframes rise { 0% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-160px) rotate(4deg); } 100% { transform: translateY(-340px) rotate(-3deg); opacity: 0; } }
.hb { position: relative; margin: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: clamp(30px, 6vw, 54px); letter-spacing: 0.08em; text-shadow: 0 4px 20px rgba(40, 10, 40, 0.35); }
.who { position: relative; margin: 6px 0 0 !important; font-size: 17px; font-weight: 700; }
.say { position: relative; margin: 4px 0 0 !important; font-family: 'Noto Sans JP', sans-serif; font-size: 14px; opacity: 0.95; }
@media (prefers-reduced-motion: reduce) { .bl { animation: none; display: none; } .rb-emoji { animation: none; } }
</style>
