<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { songs, type Song } from '../data/songs'

// Song cards. Index mode (no `exclude`): year + writer filters over all songs.
// Song-page mode (`exclude` = current song): 4 picks — same writers first, then the nearest releases.
const props = defineProps<{ exclude?: string }>()
const date = (s: Song) => s.facts[0].v.slice(0, 10)
const sorted = [...songs].sort((a, b) => date(a).localeCompare(date(b)))

// writers from the credit rows (작사 / 작곡 / 편곡 / combined), suffixes like "-amazuti-" or "(ARTribe)" dropped
const CREDIT = /작사|작곡|편곡|트랙 프로듀스/
const writersOf = (s: Song) => [...new Set(s.facts.filter((f) => CREDIT.test(f.k)).flatMap((f) => f.v.split(/\s*[·,、]\s*/))
  .map((n) => n.replace(/-amazuti-|\s*\(.*?\)/g, '').trim()).filter(Boolean))]
const W = new Map(songs.map((s) => [s.id, writersOf(s)]))
const topWriters = computed(() => {
  const c = new Map<string, number>()
  for (const ws of W.values()) for (const w of ws) c.set(w, (c.get(w) || 0) + 1)
  return [...c.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})
const years = [...new Set(sorted.map((s) => date(s).slice(0, 4)))]

const year = ref('')
const writer = ref('')
const list = computed(() => {
  if (props.exclude) {
    const me = songs.find((s) => s.id === props.exclude)
    if (!me) return []
    const mine = new Set(W.get(me.id))
    const t = Date.parse(date(me).replace(/\./g, '-'))
    return songs.filter((s) => s.id !== me.id)
      .map((s) => ({ s, shared: (W.get(s.id) || []).filter((w) => mine.has(w)).length, gap: Math.abs(Date.parse(date(s).replace(/\./g, '-')) - t) }))
      .sort((a, b) => b.shared - a.shared || a.gap - b.gap).slice(0, 4).map((x) => x.s)
  }
  return sorted.filter((s) => (!year.value || date(s).startsWith(year.value)) && (!writer.value || W.get(s.id)!.includes(writer.value)))
})
</script>

<template>
  <div>
    <div v-if="!exclude" class="flt">
      <div class="row" role="toolbar" aria-label="발매 연도">
        <button type="button" class="chip" :aria-pressed="!year" @click="year = ''">전체 <small>{{ songs.length }}</small></button>
        <button v-for="y in years" :key="y" type="button" class="chip" :aria-pressed="year === y" @click="year = year === y ? '' : y">{{ y }}</button>
      </div>
      <div class="row" role="toolbar" aria-label="자주 함께한 작가">
        <span class="lbl">✍️ 자주 함께한 작가</span>
        <button v-for="[w, n] in topWriters" :key="w" type="button" class="chip wr" :aria-pressed="writer === w" @click="writer = writer === w ? '' : w">{{ w }} <small>{{ n }}</small></button>
      </div>
      <p class="cnt" aria-live="polite">{{ list.length }}곡</p>
    </div>
    <TransitionGroup tag="div" name="sc" class="sl">
      <a v-for="(s, i) in list" :key="s.id" class="sc" :href="withBase(`/discography/${s.id}`)" :style="{ '--g1': s.grad[0], '--g2': s.grad[1], '--g3': s.grad[2], '--i': i }">
        <span class="art" aria-hidden="true"><span lang="ja">{{ s.title }}</span></span>
        <span class="txt"><small>{{ s.facts[0].v }}</small><b lang="ja">{{ s.title }}</b><span>{{ s.meaning }}</span></span>
      </a>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.flt { display: grid; gap: 10px; margin-bottom: 16px; }
.row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.lbl { font-size: 12.5px; font-weight: 800; color: #6a4f70; margin-right: 4px; }
.chip { padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; color: #2f1a35; box-shadow: inset 0 0 0 1.5px #f1d4e1; transition: transform 0.35s cubic-bezier(.34, 1.56, .64, 1); }
.chip small { color: #735779; margin-left: 2px; }
.chip.wr { font-size: 12.5px; }
.chip:hover { transform: translateY(-2px); }
.chip[aria-pressed='true'] { background: #2f1a35; color: #fff; box-shadow: none; }
.chip[aria-pressed='true'] small { color: #f3dbe7; }
.cnt { margin: 0 !important; font-size: 13px; color: #5a4060; }
.sl { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 14px; }
.sc { display: flex; flex-direction: column; gap: 10px; padding: 10px 10px 14px; border-radius: 24px; background: #fff; border: 1.5px solid #f6e0ea; text-decoration: none !important; color: #2f1a35 !important;
  transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1), box-shadow 0.3s; }
.sc:hover { transform: translateY(-4px) rotate(-0.6deg); box-shadow: 0 22px 36px -26px rgba(90, 30, 70, 0.55); }
.art { aspect-ratio: 16 / 10; border-radius: 18px; padding: 16px; display: flex; align-items: flex-end;
  background: linear-gradient(to top, rgba(42, 16, 48, 0.55), rgba(42, 16, 48, 0) 62%), radial-gradient(120% 120% at 0% 0%, var(--g1), transparent 60%), radial-gradient(120% 120% at 100% 100%, var(--g3), transparent 60%), var(--g2); }
.art span { font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-weight: 900; font-size: 20px; line-height: 1.2; color: #fff; text-shadow: 0 3px 16px rgba(42, 16, 48, 0.3); overflow-wrap: anywhere; }
.txt { display: flex; flex-direction: column; gap: 2px; padding: 0 4px; }
.txt small { font-size: 12px; color: #6a4f70; }
.txt b { font-size: 16px; }
.txt span { font-size: 13px; color: #5a4060; }
.sc-enter-active { transition: opacity 0.3s, transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.sc-enter-from { opacity: 0; transform: scale(0.95); }
.sc-leave-active { display: none; transition: none !important; animation: none !important; }
@media (prefers-reduced-motion: reduce) { .sc, .chip { transition: none; } .sc-enter-active { transition: none; } }
</style>
