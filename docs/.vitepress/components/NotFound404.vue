<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'

const guide = ref(members[0])
onMounted(() => { guide.value = members[Math.floor(Math.random() * members.length)] })
const LINKS = [
  { t: '홈', h: '/', e: '🏠' }, { t: '멤버', h: '/members/', e: '💖' }, { t: '영상 아카이브', h: '/videos/', e: '🎬' },
  { t: '스케줄', h: '/schedule/', e: '🗓️' }, { t: '정상까지의 여정', h: '/journey/', e: '🗻' }, { t: '紅白 특집', h: '/kohaku/', e: '🎍' },
]
const openSearch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
</script>

<template>
  <section class="nf" :style="{ '--mc': guide.color }">
    <h1 class="big" aria-label="404">
      <span v-for="(c, i) in ['4', '0', '4']" :key="i" :style="{ '--i': i, color: members[(i * 3 + 1) % 8].color }">{{ c }}</span>
    </h1>
    <p class="msg">앗, 길을 잃었어요… 이 거리엔 아무것도 없네요 🥲</p>
    <p class="guide"><span class="face">{{ guide.ja.slice(-2, -1) }}</span><b>{{ guide.ko }}</b>가 길을 안내해 줄게요!</p>
    <div class="links">
      <a v-for="l in LINKS" :key="l.h" :href="withBase(l.h)">{{ l.e }} {{ l.t }}</a>
      <button type="button" @click="openSearch">🔍 검색하기 (⌘K)</button>
    </div>
  </section>
</template>

<style scoped>
.nf { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 16px; color: #3a2340; }
.big { margin: 0; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(110px, 24vw, 220px); line-height: 1; letter-spacing: -0.04em; border: 0; }
.big span { display: inline-block; text-shadow: 0 10px 0 rgba(58, 35, 64, 0.08); animation: hop 2.4s cubic-bezier(.34, 1.56, .64, 1) infinite; animation-delay: calc(var(--i) * 0.18s); }
@keyframes hop { 0%, 60%, 100% { transform: translateY(0) rotate(0); } 25% { transform: translateY(-0.12em) rotate(-6deg); } }
.msg { margin: 12px 0 0; font-size: 18px; font-weight: 700; }
.guide { display: inline-flex; align-items: center; gap: 8px; margin: 14px 0 0; padding: 8px 16px; border-radius: 999px; background: color-mix(in srgb, var(--mc) 14%, white); font-size: 14px; }
.face { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); color: #fff; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; }
.links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 26px; max-width: 620px; }
.links a, .links button { padding: 10px 16px; border-radius: 999px; background: #fff; border: 1.5px solid #f1d4e1; color: #3a2340 !important; font-weight: 700; font-size: 14px; text-decoration: none !important;
  transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1); }
.links a:hover, .links button:hover { transform: translateY(-3px) rotate(-1.5deg); }
.links button { background: #3a2340; color: #fff !important; border-color: #3a2340; }
@media (prefers-reduced-motion: reduce) { .big span { animation: none; } .links a, .links button { transition: none; } }
</style>
