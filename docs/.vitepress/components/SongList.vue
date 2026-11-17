<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { songs } from '../data/songs'

const props = defineProps<{ exclude?: string }>()
const list = computed(() => songs.filter((s) => s.id !== props.exclude))
</script>

<template>
  <div class="sl">
    <a v-for="(s, i) in list" :key="s.id" class="sc" :href="withBase(`/discography/${s.id}`)" :style="{ '--g1': s.grad[0], '--g2': s.grad[1], '--g3': s.grad[2], '--i': i }">
      <span class="art" aria-hidden="true"><span lang="ja">{{ s.title }}</span></span>
      <span class="txt"><small>{{ s.facts[0].v }}</small><b lang="ja">{{ s.title }}</b><span>{{ s.meaning }}</span></span>
    </a>
  </div>
</template>

<style scoped>
.sl { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 14px; }
.sc { display: flex; flex-direction: column; gap: 10px; padding: 10px 10px 14px; border-radius: 24px; background: #fff; border: 1.5px solid #f6e0ea; text-decoration: none !important; color: #2f1a35 !important;
  transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1), box-shadow 0.3s; }
.sc:hover { transform: translateY(-4px) rotate(-0.6deg); box-shadow: 0 22px 36px -26px rgba(90, 30, 70, 0.55); }
.art { aspect-ratio: 16 / 10; border-radius: 18px; padding: 16px; display: flex; align-items: flex-end;
  background: radial-gradient(120% 120% at 0% 0%, var(--g1), transparent 60%), radial-gradient(120% 120% at 100% 100%, var(--g3), transparent 60%), var(--g2); }
.art span { font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-weight: 900; font-size: 20px; line-height: 1.2; color: #fff; text-shadow: 0 3px 16px rgba(42, 16, 48, 0.3); overflow-wrap: anywhere; }
.txt { display: flex; flex-direction: column; gap: 2px; padding: 0 4px; }
.txt small { font-size: 12px; color: #6a4f70; }
.txt b { font-size: 16px; }
.txt span { font-size: 13px; color: #5a4060; }
@media (prefers-reduced-motion: reduce) { .sc { transition: none; } }
</style>
