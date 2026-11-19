<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClock } from '../theme/today'
import { withBase } from 'vitepress'
import { news, tagMeta, type NewsTag } from '../data/news'

const props = defineProps<{ mode?: 'ticker' | 'full' }>()
const now = useClock()
const isNew = (d: string) => now.value !== null && now.value - new Date(`${d}T00:00:00+09:00`).getTime() < 3 * 86400000

const tag = ref<'all' | NewsTag>('all')
const showJa = ref(false)
const list = computed(() => news.filter((n) => tag.value === 'all' || n.tag === tag.value))
const days = computed(() => {
  const out: { date: string; items: typeof news }[] = []
  for (const n of list.value) {
    let d = out.find((x) => x.date === n.date)
    if (!d) { d = { date: n.date, items: [] }; out.push(d) }
    d.items.push(n)
  }
  return out
})
const fmt = (d: string) => d.slice(5).replace('-', '.')
</script>

<template>
  <!-- HOME TICKER -->
  <div v-if="props.mode === 'ticker'" class="ticker" role="region" aria-label="최신 공식 소식">
    <a class="tk-label" :href="withBase('/news/')"><span class="dot" aria-hidden="true" />NEWS</a>
    <div class="tk-track">
      <div class="tk-row">
        <template v-for="k in 2" :key="k">
          <a v-for="n in news.slice(0, 8)" :key="k + n.url" class="tk-item" :href="n.url" target="_blank" rel="noopener" :aria-hidden="k === 2" :tabindex="k === 2 ? -1 : 0">
            <Ico :n="tagMeta[n.tag].ico" duo size="14" /><b>{{ fmt(n.date) }}</b>{{ n.ko }}
          </a>
        </template>
      </div>
    </div>
    <a class="tk-all" :href="withBase('/news/')">전체 →</a>
  </div>

  <!-- FULL PAGE -->
  <section v-else class="nf">
    <h2 class="sr-only">공식 소식 목록</h2>
    <div class="bar">
      <div class="chips" role="toolbar" aria-label="소식 분류">
        <button type="button" class="chip" :aria-pressed="tag === 'all'" @click="tag = 'all'">전체 <small>{{ news.length }}</small></button>
        <button v-for="(m, k) in tagMeta" :key="k" type="button" class="chip" :aria-pressed="tag === k" :style="{ '--tc': m.color }" @click="tag = k as NewsTag">
          <Ico :n="m.ico" duo size="14" /> {{ m.ko }} <small>{{ news.filter((n) => n.tag === k).length }}</small>
        </button>
      </div>
      <label class="ja-toggle"><input v-model="showJa" type="checkbox" /> 일본어 원문 보기</label>
    </div>
    <div v-for="d in days" :key="d.date" class="day">
      <div class="date"><b>{{ fmt(d.date) }}</b><small>{{ d.date.slice(0, 4) }}</small></div>
      <div class="items">
        <article v-for="n in d.items" :key="n.url" class="item" :style="{ '--tc': tagMeta[n.tag].color }">
          <div class="top">
            <span class="tag"><Ico :n="tagMeta[n.tag].ico" duo size="13" /> {{ tagMeta[n.tag].ko }}</span>
            <span v-if="isNew(n.date)" class="new">NEW</span>
          </div>
          <h3>{{ n.ko }}</h3>
          <p v-if="showJa" class="ja" lang="ja">{{ n.ja }}</p>
          <div class="acts">
            <a :href="n.url" target="_blank" rel="noopener">원문 보기 ↗</a>
            <a v-if="n.internal" :href="withBase(n.internal)">관련 페이지 →</a>
          </div>
        </article>
      </div>
    </div>
    <p class="src">출처: <a href="https://cutiestreet.asobisystem.com/news/1" target="_blank" rel="noopener">CUTIE STREET 공식 INFORMATION</a> · 한국어는 공식 제목의 요약이며, 정확한 내용은 원문을 확인하세요.</p>
  </section>
</template>

<style scoped>
.ticker { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 8px 10px; border-radius: 999px; background: #fff; border: 1.5px solid #f3d9e6; overflow: hidden; }
.tk-label { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: #3a2340; color: #fff !important; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-decoration: none !important; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #ff6b9d; animation: ping 1.6s infinite; }
@keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(255, 107, 157, 0.7); } 70%, 100% { box-shadow: 0 0 0 8px rgba(255, 107, 157, 0); } }
.tk-track { flex: 1; min-width: 0; overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent); }
.tk-row { display: flex; gap: 28px; width: max-content; animation: marquee 48s linear infinite; }
.ticker:hover .tk-row, .ticker:focus-within .tk-row { animation-play-state: paused; }
@keyframes marquee { to { transform: translateX(-50%); } }
.tk-item { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; color: #3a2340 !important; text-decoration: none !important; white-space: nowrap; }
.tk-item b { color: #c92f69; font-variant-numeric: tabular-nums; }
.tk-item:hover { text-decoration: underline !important; }
.tk-all { flex: none; font-size: 12px; font-weight: 700; color: #a33366 !important; padding-right: 6px; }

.nf { color: #3a2340; margin: 8px 0 40px; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 8px; }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
.chips::-webkit-scrollbar { display: none; }
.chip { flex: none; padding: 7px 13px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; border: 1.5px solid #f1dce7; color: #3a2340; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.chip small { opacity: 0.6; }
.chip[aria-pressed='true'] { background: var(--tc, #3a2340); border-color: transparent; color: #fff; }
.ja-toggle { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 12px 0 8px; border-radius: 999px; font-size: 13px; font-weight: 600; color: #5a4060; cursor: pointer; } /* the whole label is the tap target (#197) */
.ja-toggle:hover { background: #faf3f7; }
.ja-toggle input { width: 18px; height: 18px; margin: 0; accent-color: #c92f69; }
.day { display: grid; grid-template-columns: 70px 1fr; gap: 14px; padding: 14px 0; border-top: 1px dashed #f0dbe6; }
.date { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 64px; border-radius: 18px; background: #fff; border: 1.5px solid #f3dfe9; }
.date b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px; }
.date small { font-size: 11px; color: #735779; }
.items { display: grid; gap: 10px; min-width: 0; }
.item { padding: 14px 16px; border-radius: 20px; background: #fff; border: 1.5px solid color-mix(in srgb, var(--tc) 22%, white); border-left: 5px solid var(--tc); transition: transform 0.5s cubic-bezier(.34, 1.56, .64, 1); }
.item:hover { transform: translateX(4px); }
@supports (animation-timeline: view()) {
  .item { animation: nIn linear both; animation-timeline: view(); animation-range: entry 0% entry 60%; }
  @keyframes nIn { from { opacity: 0; transform: translateY(14px); } }
}
.top { display: flex; align-items: center; gap: 6px; }
.tag { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: color-mix(in srgb, var(--tc) 12%, white); color: color-mix(in srgb, var(--tc) 82%, #2a1030); }
.new { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; padding: 3px 7px; border-radius: 6px; color: #fff; background: #c42235; }
.item h3 { margin: 8px 0 0 !important; padding: 0 !important; border: 0 !important; font-size: 16px !important; line-height: 1.45 !important; }
.ja { margin: 6px 0 0 !important; font-size: 13px; color: #735779; font-family: var(--cs-sans); line-height: 1.6 !important; }
.acts { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.acts a { font-size: 12px; font-weight: 700; padding: 6px 11px; border-radius: 999px; background: #faf3f7; color: #3a2340 !important; text-decoration: none !important; }
.src { margin-top: 24px !important; font-size: 12px; color: #735779; }
@media (max-width: 640px) { .day { grid-template-columns: 52px 1fr; gap: 10px; } .date { height: 52px; } .date b { font-size: 16px; } .tk-all { display: none; } }
@media (prefers-reduced-motion: reduce) { .tk-row { animation: none; } .dot { animation: none; } .item { animation: none !important; transition: none; } .tk-track { overflow-x: auto; } }
</style>
