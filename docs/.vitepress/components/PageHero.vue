<script setup lang="ts">
import { members } from '../data/members'

// Shared page header for hub pages (replaces the plain markdown "# title").
defineProps<{ eyebrow: string; title: string; lead?: string; sticker?: string }>()
</script>

<template>
  <header class="ph">
    <p class="eb">{{ eyebrow }}</p>
    <h1>
      <span class="t">{{ title }}</span>
      <span v-if="sticker" class="stk" aria-hidden="true">{{ sticker }}</span>
    </h1>
    <p v-if="lead" class="lead">{{ lead }}</p>
    <div class="beads" aria-hidden="true">
      <i v-for="(m, i) in members" :key="m.id" :style="{ '--c': m.color, '--i': i }" />
    </div>
  </header>
</template>

<style scoped>
.ph { position: relative; padding: 8px 0 18px; margin-bottom: 18px; color: #2f1a35; }
.eb { display: inline-block; margin: 0 !important; padding: 4px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 900; letter-spacing: 0.2em; color: #a33366; background: #fff; box-shadow: inset 0 0 0 1.5px #f6d3e2; }
h1 { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 12px 0 0 !important; padding: 0 !important; border: 0 !important;
  font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(32px, 5vw, 54px) !important; font-weight: 900; line-height: 1.12 !important; letter-spacing: -0.01em; }
.t { background: linear-gradient(100deg, #2f1a35 30%, #a33366 70%, #6b3fa0); -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: rise 0.8s cubic-bezier(.34, 1.56, .64, 1) both; }
.stk { display: inline-grid; place-items: center; width: 1.25em; height: 1.25em; font-size: 0.78em; border-radius: 30%; background: #fff; box-shadow: 0 10px 22px -14px rgba(90, 30, 70, 0.6), inset 0 0 0 1.5px #f6d3e2;
  transform: rotate(8deg); animation: wob 3.2s ease-in-out 0.8s infinite, rise 0.8s cubic-bezier(.34, 1.56, .64, 1) 0.1s both; }
.lead { margin: 10px 0 0 !important; max-width: 640px; font-size: 16px; line-height: 1.7; color: #5a4060; }
.beads { display: flex; gap: 6px; margin-top: 16px; }
.beads i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 22%, transparent);
  animation: drop 0.7s cubic-bezier(.34, 1.56, .64, 1) both, bob 2.6s ease-in-out infinite; animation-delay: calc(var(--i) * 60ms + 0.2s), calc(var(--i) * 180ms + 1s); }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } }
@keyframes wob { 0%, 100% { transform: rotate(8deg); } 50% { transform: rotate(-6deg) translateY(-3px); } }
@keyframes drop { from { opacity: 0; transform: translateY(-14px) scale(0.4); } }
@keyframes bob { 50% { translate: 0 -3px; } }
@media (prefers-reduced-motion: reduce) { .t, .stk, .beads i { animation: none; } }
</style>
