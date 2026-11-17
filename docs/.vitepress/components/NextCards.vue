<script setup lang="ts">
import { withBase } from 'vitepress'

// "Where next" link cards for page bottoms (replaces plain markdown link lines).
defineProps<{ title?: string; items: { href: string; emoji: string; t: string; d: string; c?: string }[] }>()
</script>

<template>
  <section class="nc" :aria-label="title || '더 둘러보기'">
    <p v-if="title" class="nc-h">{{ title }}</p>
    <div class="nc-grid">
      <a v-for="(it, i) in items" :key="it.href" class="card" :href="withBase(it.href)" :style="{ '--c': it.c || '#FF6B9D', '--i': i }">
        <span class="em" aria-hidden="true">{{ it.emoji }}</span>
        <span class="tx"><b>{{ it.t }}</b><small>{{ it.d }}</small></span>
        <span class="ar" aria-hidden="true">→</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.nc { margin: 36px 0 8px; }
.nc-h { margin: 0 0 12px !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px; font-weight: 800; color: #2f1a35; }
.nc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 12px; }
.card { position: relative; display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 22px; overflow: hidden; text-decoration: none !important; color: #2f1a35 !important;
  background: radial-gradient(140% 120% at 0% 0%, color-mix(in srgb, var(--c) 18%, white), transparent 60%), #fff; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c) 26%, white);
  transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1), box-shadow 0.3s; }
.card:hover { transform: translateY(-3px); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c) 55%, white), 0 18px 30px -24px color-mix(in srgb, var(--c) 70%, #2a1030); }
.em { flex: none; display: grid; place-items: center; width: 46px; height: 46px; border-radius: 16px; font-size: 24px; background: color-mix(in srgb, var(--c) 16%, white); transition: transform 0.5s cubic-bezier(.34, 1.56, .64, 1); }
.card:hover .em { transform: rotate(-8deg) scale(1.08); }
.tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tx b { font-size: 15.5px; }
.tx small { font-size: 12.5px; color: #6a4f70; line-height: 1.45; }
.ar { flex: none; font-weight: 900; color: color-mix(in srgb, var(--c) 60%, #2a1030); transition: transform 0.3s; }
.card:hover .ar { transform: translateX(4px); }
@media (prefers-reduced-motion: reduce) { .card, .em, .ar { transition: none; } }
</style>
