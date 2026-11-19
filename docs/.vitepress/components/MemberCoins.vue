<script setup lang="ts">
import { withBase } from 'vitepress'
import { memberById, onColor } from '../data/members'

// Overlapping member-colour coins (#210/#211) for events only some members are in (鬼レンチャン, TGC …).
// link: each coin goes to the member page (only where the row isn't itself a link — no nested links);
// otherwise the coins are decoration and the names in the text carry the meaning.
const props = defineProps<{ ids: string[]; link?: boolean }>()
const short = (id: string) => memberById[id].ko.split(' ')[1]
</script>

<template>
  <span class="mcoins">
    <template v-for="(id, i) in props.ids" :key="id">
      <a v-if="link" class="wm" :href="withBase(`/members/${id}`)" :style="{ '--mc': memberById[id].color, '--on': onColor(memberById[id].color), '--i': i }"
        :aria-label="`${memberById[id].ko} 페이지`" :title="memberById[id].ko"><span lang="ja" aria-hidden="true">{{ memberById[id].ja.slice(-2, -1) }}</span></a>
      <span v-else class="wm" aria-hidden="true" :style="{ '--mc': memberById[id].color, '--on': onColor(memberById[id].color), '--i': i }"><span lang="ja">{{ memberById[id].ja.slice(-2, -1) }}</span></span>
    </template>
    <small>{{ props.ids.map(short).join('·') }} 출연</small>
  </span>
</template>

<style scoped>
.mcoins { display: inline-flex; align-items: center; vertical-align: middle; }
.mcoins small { margin-left: 6px; font-size: 11.5px; font-weight: 800; color: #4a2f50; white-space: nowrap; }
/* overlapping coins; each tilts and lifts on hover, like a hand of cards */
.wm { position: relative; display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; margin-left: -6px; font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif;
  font-size: 13px; font-weight: 700; line-height: 1; background: var(--mc); color: var(--on) !important; text-decoration: none !important; box-shadow: 0 0 0 2px #fff;
  transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); z-index: calc(5 - var(--i)); }
.wm:first-child { margin-left: 0; }
a.wm:hover, a.wm:focus-visible { transform: translateY(-3px) rotate(calc(-8deg + var(--i) * 16deg)); z-index: 6; }
@media (prefers-reduced-motion: reduce) { .wm { transition: none; } a.wm:hover, a.wm:focus-visible { transform: none; } }
</style>
