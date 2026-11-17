<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { events, startMs } from '../data/events'

// Arena tour 'CUTIE LAND' as a stamp rally — stops come straight from events.ts (official schedule)
const COLORS = ['#FFC93C', '#FF4757', '#3CCFA8', '#4A90D9', '#FF9F43', '#5DC8F5', '#A06CD5', '#FF6B9D']
const shows = events.filter((e) => e.ko.includes('아레나 투어')).sort((a, b) => startMs(a) - startMs(b))
const stops = (() => {
  const out: { venue: string; city: string; dates: string[]; url: string; final: boolean }[] = []
  for (const e of shows) {
    let s = out.find((x) => x.venue === e.venue)
    const city = (e.ko.split('·').pop() || '').replace(/DAY\d/, '').trim()
    if (!s) { s = { venue: e.venue || '', city, dates: [], url: e.url, final: e.ko.includes('FINAL') }; out.push(s) }
    s.dates.push(e.date)
  }
  return out
})()

const now = ref<number | null>(null)
const clips = ref<Record<string, { id: string; title: string }>>({})
onMounted(async () => {
  now.value = Date.now()
  // one official live clip per finished stop (matched by performance date)
  const dated = (await import('../data/otd-videos.json')).default as { id: string; title: string; date: string }[]
  const map: Record<string, { id: string; title: string }> = {}
  for (const s of stops) {
    const v = dated.find((x) => s.dates.includes(x.date) && /LIVE|ダイジェスト/.test(x.title))
    if (v) map[s.venue] = v
  }
  clips.value = map
})
const showDone = (d: string) => now.value !== null && new Date(`${d}T23:59:59+09:00`).getTime() < now.value
const state = (s: (typeof stops)[number]) => (now.value === null ? 'todo' : s.dates.every(showDone) ? 'done' : s.dates.some(showDone) ? 'half' : 'todo')
const doneShows = computed(() => shows.filter((e) => showDone(e.date)).length)
const nextStop = computed(() => stops.find((s) => state(s) !== 'done'))
const dday = computed(() => (nextStop.value && now.value ? Math.ceil((new Date(`${nextStop.value.dates[0]}T00:00:00+09:00`).getTime() - now.value) / 86400000) : null))
const md = (d: string) => d.slice(5).replace('-', '/')
const fmt = (ds: string[]) => ds.map((d, i) => (i > 0 && d.slice(5, 7) === ds[0].slice(5, 7) ? d.slice(8) : md(d))).join('–') // 09/29–30, 10/31–11/01
</script>

<template>
  <section class="ts" aria-labelledby="ts-h">
    <header class="ts-head">
      <div>
        <p class="ts-kicker">JAPAN ARENA TOUR 2026 -AUTUMN-</p>
        <h3 id="ts-h">CUTIE LAND 스탬프 랠리 🎟️</h3>
      </div>
      <div class="ts-count" aria-live="polite"><b>{{ doneShows }}</b><span>/ {{ shows.length }}공연</span></div>
    </header>
    <div class="ts-bar" role="progressbar" :aria-valuenow="doneShows" aria-valuemin="0" :aria-valuemax="shows.length" aria-label="투어 진행률">
      <i :style="{ width: (doneShows / shows.length) * 100 + '%' }" />
    </div>
    <ol class="ts-grid">
      <li v-for="(s, i) in stops" :key="s.venue" class="stop" :class="[state(s), { next: nextStop === s, final: s.final }]" :style="{ '--sc': COLORS[i % 8] }">
        <span class="stamp" aria-hidden="true">
          <span class="ring"><b>{{ s.city }}</b><small>{{ fmt(s.dates) }}</small></span>
          <span v-if="state(s) === 'done'" class="ink">CLEAR</span>
        </span>
        <span class="meta">
          <span class="dt">{{ fmt(s.dates) }}</span>
          <span class="venue" lang="ja">{{ s.venue }}</span>
          <span class="st">
            <template v-if="state(s) === 'done'">✔ 완료</template>
            <template v-else-if="nextStop === s">{{ s.final ? 'FINAL · ' : '' }}{{ dday === 0 ? 'TODAY' : 'D-' + dday }}</template>
            <template v-else>예정</template>
          </span>
          <a v-if="clips[s.venue]" class="clip" :href="`https://www.youtube.com/watch?v=${clips[s.venue].id}`" target="_blank" rel="noopener">▶ 무대 영상</a>
          <a v-else-if="state(s) !== 'done'" class="clip" :href="s.url" target="_blank" rel="noopener">공식 상세 ↗</a>
        </span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.ts { margin: 18px 0 8px; padding: 20px 22px 22px; border-radius: 28px; color: #3a2340;
  background: radial-gradient(circle at 1px 1px, rgba(160, 108, 213, 0.18) 1px, transparent 0) 0 0 / 14px 14px, #fffaf4; border: 1.5px solid #f1d4e1; }
.ts-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.ts-kicker { margin: 0 !important; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #a33366; }
.ts-head h3 { margin: 2px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px !important; }
.ts-count { flex: none; display: flex; align-items: baseline; gap: 4px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ts-count b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 34px; color: #c92f69; }
.ts-count span { font-size: 13px; font-weight: 700; color: #735779; }
.ts-bar { height: 8px; margin: 10px 0 16px; border-radius: 999px; background: #f4e6ee; overflow: hidden; }
.ts-bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #ffc93c, #ff6b9d, #a06cd5); }
.ts-grid { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
.stop { margin: 0 !important; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.stamp { position: relative; width: 100%; max-width: 120px; aspect-ratio: 1; }
.ring { position: absolute; inset: 0; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border: 2.5px dashed color-mix(in srgb, var(--sc) 55%, #cdb8c8); background: #fff; color: #8a7290; }
.ring b { font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(14px, 1.6vw, 18px); }
.ring small { font-size: 11px; font-variant-numeric: tabular-nums; }
.done .ring, .half .ring { border-style: double; border-width: 5px; border-color: color-mix(in srgb, var(--sc) 80%, #2a1030); color: color-mix(in srgb, var(--sc) 55%, #2a1030);
  background: color-mix(in srgb, var(--sc) 12%, white); rotate: -8deg; }
.done:nth-child(even) .ring { rotate: 7deg; }
.ink { position: absolute; left: 50%; bottom: -4%; translate: -50% 0; rotate: -10deg; padding: 0 6px; border: 2px solid #d6336c; border-radius: 6px; color: #d6336c; background: rgba(255, 255, 255, 0.75);
  font-size: 10px; font-weight: 900; letter-spacing: 0.1em; background: #fff; }
.done .stamp { animation: thunk both cubic-bezier(.34, 1.56, .64, 1); animation-timeline: view(); animation-range: entry 10% entry 70%; }
@keyframes thunk { from { scale: 1.6; opacity: 0; } to { scale: 1; opacity: 1; } }
.next .ring { border-color: #c92f69; color: #c92f69; animation: beat 1.6s ease-in-out infinite; }
@keyframes beat { 50% { scale: 1.05; } }
.final .ring::after { content: '★ FINAL'; position: absolute; top: -10px; padding: 1px 8px; border-radius: 999px; background: #3a2340; color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; }
.meta { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.dt { display: none; font-size: 10.5px; font-weight: 800; font-variant-numeric: tabular-nums; color: #5a4060; }
.venue { font-size: 11px; color: #735779; line-height: 1.3; }
.st { font-size: 12px; font-weight: 800; }
.done .st { color: #136b53; }
.next .st { color: #c92f69; }
.clip { font-size: 11.5px; font-weight: 700; color: #a33366 !important; }
@media (max-width: 860px) { .ts-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 520px) {
  .ts-grid { grid-template-columns: repeat(4, 1fr); gap: 16px 6px; } .ts { padding: 16px 12px; } .ts-head h3 { font-size: 19px !important; }
  .ring b { font-size: 13px; } .ring small { display: none; } .dt { display: block; }
  .final .ring::after { top: -12px; font-size: 8.5px; padding: 0 6px; } .venue { font-size: 10px; } .st, .clip { font-size: 10.5px; } .ink { font-size: 9px; padding: 0 4px; }
}
@media (prefers-reduced-motion: reduce) { .done .stamp, .next .ring { animation: none; } }
</style>
