<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import videosRaw from '../data/videos.json'
import { members } from '../data/members'

// Charts follow the dataviz skill: single-series bars in one validated hue (#C92F69),
// <=24px thick, 4px rounded data-end, 2px gaps, hairline grid, selective labels, hover tooltips, table view.
interface Video { id: string; title: string; duration: string; category: string; members: string[]; date: string; channel?: string }
const videos = videosRaw as Video[]
const CAT_KO: Record<string, string> = { live: '라이브', variety: '버라이어티', digest: '다이제스트', dance: '안무·FOCUS', birthday: '생탄제', mv: 'MV·리릭', vlog: '브이로그', making: '메이킹' }

const secs = (d: string) => d.split(':').map(Number).reduce((a, n) => a * 60 + n, 0)
const totalSec = videos.reduce((a, v) => a + (v.duration ? secs(v.duration) : 0), 0)
const tiles = [
  { v: videos.length.toLocaleString(), u: '편', l: '아카이브 영상' },
  { v: Math.floor(totalSec / 3600).toLocaleString(), u: `시간 ${Math.round((totalSec % 3600) / 60)}분`, l: '총 재생 시간 (MV 제외)' },
  { v: String(videos.filter((v) => v.channel).length), u: '편', l: '공식 MV (KAWAII LAB.)' },
  { v: String(videos.filter((v) => v.category === 'live').length), u: '편', l: '라이브 영상' },
]

// by month (event date in the title)
const months = computed(() => {
  const m = new Map<string, number>()
  for (const v of videos) if (v.date) m.set(v.date.slice(0, 7), (m.get(v.date.slice(0, 7)) || 0) + 1)
  const keys = [...m.keys()].sort()
  if (!keys.length) return []
  const out: { k: string; n: number }[] = []
  let [y, mo] = keys[0].split('-').map(Number)
  const [ey, em] = keys[keys.length - 1].split('-').map(Number)
  while (y < ey || (y === ey && mo <= em)) { const k = `${y}-${String(mo).padStart(2, '0')}`; out.push({ k, n: m.get(k) || 0 }); mo++; if (mo > 12) { mo = 1; y++ } }
  return out
})
const mMax = computed(() => Math.max(...months.value.map((x) => x.n)))
const yTicks = computed(() => { const step = mMax.value > 40 ? 20 : 10; return Array.from({ length: Math.floor(mMax.value / step) + 1 }, (_, i) => i * step) })
const yTop = computed(() => yTicks.value[yTicks.value.length - 1] + (mMax.value > yTicks.value[yTicks.value.length - 1] ? (mMax.value > 40 ? 20 : 10) : 0))

const cats = computed(() => Object.entries(videos.reduce<Record<string, number>>((a, v) => ((a[v.category] = (a[v.category] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]))
const mem = computed(() => members.map((m) => ({ m, n: videos.filter((v) => v.members.includes(m.id)).length })).sort((a, b) => b.n - a.n))
const catMax = computed(() => cats.value[0]?.[1] || 1)
const memMax = computed(() => mem.value[0]?.n || 1)

const tip = ref<{ x: number; y: number; t: string } | null>(null)
function show(e: MouseEvent | FocusEvent, t: string) {
  const el = e.currentTarget as HTMLElement
  const host = el.closest('.vs') as HTMLElement
  const r = el.getBoundingClientRect(), h = host.getBoundingClientRect()
  tip.value = { x: r.left - h.left + r.width / 2, y: r.top - h.top, t }
}
const table = ref(false)
// monthly chart as one scrubbable slider (#197): 27 bars on a phone are 8px wide each — too small to tap one by
// one (WCAG 2.5.8) and, as buttons inside role=img, unreachable for screen readers. Now the whole chart is the
// target: tap or drag across it, or focus it and use ←/→/Home/End; the value is read out as text.
const colsEl = ref<HTMLElement | null>(null)
const cur = ref(-1) // -1 → latest month (months is computed)
const active = ref<number | null>(null)
const curIdx = computed(() => (cur.value < 0 ? months.value.length - 1 : cur.value))
const mLabel = (x: { k: string; n: number }) => `${x.k.replace('-', '년 ')}월 · ${x.n}편`
function showCol(i: number) {
  const el = colsEl.value; if (!el || !months.value.length) return
  i = Math.max(0, Math.min(months.value.length - 1, i))
  cur.value = i; active.value = i
  const bar = el.querySelectorAll<HTMLElement>('.col .bar')[i]
  const host = el.closest('.vs') as HTMLElement
  const r = bar.getBoundingClientRect(), h = host.getBoundingClientRect()
  // keep the bubble inside the card at the first/last months (it centres on the bar, ~120px wide)
  tip.value = { x: Math.max(66, Math.min(h.width - 66, r.left - h.left + r.width / 2)), y: r.top - h.top, t: mLabel(months.value[i]) }
}
function onPoint(e: PointerEvent) {
  if (e.type === 'pointermove' && e.pointerType !== 'mouse' && !e.buttons) return
  const b = (colsEl.value!.querySelector('.bars') as HTMLElement).getBoundingClientRect()
  showCol(Math.floor(((e.clientX - b.left) / b.width) * months.value.length))
}
function onLeave(e: PointerEvent) { if (e.pointerType === 'mouse' && document.activeElement !== colsEl.value) { tip.value = null; active.value = null } }
function onKey(e: KeyboardEvent) {
  const n = months.value.length, i = curIdx.value
  const to = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? i - 1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? i + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null
  if (to === null) return
  e.preventDefault(); showCol(to)
}
const fmtM = (k: string) => `${k.slice(2, 4)}.${k.slice(5)}`
</script>

<template>
  <section class="vs" @mouseleave="tip = null">
    <h2 class="sr-only">영상 통계</h2>
    <div class="tiles">
      <div v-for="t in tiles" :key="t.l" class="tile"><b>{{ t.v }}<small>{{ t.u }}</small></b><span>{{ t.l }}</span></div>
    </div>

    <div class="card">
      <div class="head">
        <div><h3>월별 영상 수</h3><p>영상 제목의 공연·촬영 날짜 기준 ({{ months.length }}개월 · 날짜가 있는 영상 {{ months.reduce((a, x) => a + x.n, 0) }}편)</p></div>
        <button type="button" class="tbl" :aria-pressed="table" @click="table = !table">{{ table ? '차트 보기' : '표로 보기' }}</button>
      </div>
      <div v-if="!table" ref="colsEl" class="cols" role="slider" tabindex="0" :aria-label="`월별 영상 수 (최대 ${mMax}편) — 좌우 화살표로 달을 옮겨요`"
        aria-orientation="horizontal" :aria-valuemin="0" :aria-valuemax="Math.max(0, months.length - 1)" :aria-valuenow="curIdx" :aria-valuetext="months[curIdx] ? mLabel(months[curIdx]) : ''"
        @pointerdown="onPoint" @pointermove="onPoint" @pointerleave="onLeave" @keydown="onKey" @focus="showCol(curIdx)" @blur="tip = null; active = null">
        <div class="grid" aria-hidden="true"><span v-for="t in yTicks" :key="t" :style="{ bottom: (t / yTop) * 100 + '%' }"><i>{{ t }}</i></span></div>
        <div class="bars" aria-hidden="true">
          <div v-for="(x, i) in months" :key="x.k" class="col" :class="{ on: active === i }">
            <span class="bar" :style="{ height: (x.n / yTop) * 100 + '%' }"><em v-if="x.n === mMax">{{ x.n }}</em></span>
            <small v-if="x.k.endsWith('-01') || x.k === months[0].k">{{ fmtM(x.k) }}</small>
          </div>
        </div>
      </div>
      <table v-else class="t"><thead><tr><th>월</th><th>영상 수</th></tr></thead><tbody><tr v-for="x in months" :key="x.k"><td>{{ x.k }}</td><td>{{ x.n }}</td></tr></tbody></table>
    </div>

    <div class="two">
      <div class="card">
        <div class="head"><div><h3>카테고리별</h3><p>제목 키워드로 자동 분류</p></div></div>
        <ul class="hbars">
          <li v-for="[c, n] in cats" :key="c" @mouseleave="tip = null" @mouseenter="show($event, `${CAT_KO[c] || c} · ${n}편 (${Math.round((n / videos.length) * 100)}%)`)">
            <span class="lab">{{ CAT_KO[c] || c }}</span>
            <span class="track"><i :style="{ width: (n / catMax) * 100 + '%' }" /></span>
            <span class="val">{{ n }}</span>
          </li>
        </ul>
      </div>
      <div class="card">
        <div class="head"><div><h3>멤버별 출연 (제목 기준)</h3><p>제목에 이름이 들어간 개인 영상 수</p></div></div>
        <ul class="hbars">
          <li v-for="x in mem" :key="x.m.id" @mouseleave="tip = null" @mouseenter="show($event, `${x.m.ko} · ${x.n}편`)">
            <a class="lab" :href="withBase(`/videos/?m=${x.m.id}`)"><span class="chip" :style="{ background: x.m.color }" />{{ x.m.ko.split(' ')[1] }}</a>
            <span class="track"><i :style="{ width: (x.n / memMax) * 100 + '%' }" /></span>
            <span class="val">{{ x.n }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="tip" class="tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }" role="tooltip">{{ tip.t }}</div>
  </section>
</template>

<style scoped>
.vs { position: relative; color: #3a2340; margin: 8px 0 40px; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.tile { padding: 16px 18px; border-radius: 20px; background: #fff; border: 1.5px solid #f3dbe8; }
.tile b { display: block; font-family: 'Zen Maru Gothic', sans-serif; font-size: 36px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tile small { font-size: 15px; margin-left: 2px; }
.tile span { font-size: 12.5px; color: #735779; font-weight: 600; }
.card { margin-top: 14px; padding: 18px 20px; border-radius: 24px; background: #fff; border: 1.5px solid #f3dbe8; }
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.head h3 { margin: 0 !important; padding: 0 !important; border: 0 !important; font-size: 17px !important; font-family: 'Zen Maru Gothic', sans-serif; }
.head p { margin: 2px 0 0 !important; font-size: 12.5px; color: #735779; }
.tbl { flex: none; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 999px; background: #faf3f7; color: #3a2340; }
.cols { position: relative; height: 220px; margin: 18px 0 0 30px; touch-action: pan-y; cursor: crosshair; border-radius: 8px; }
.cols:focus-visible { outline: 3px solid #ffb3cf; outline-offset: 6px; }
.grid { position: absolute; inset: 0 0 22px 0; }
.grid span { position: absolute; left: 0; right: 0; height: 1px; background: #f1e6ec; }
.grid i { position: absolute; left: -30px; top: -8px; width: 24px; text-align: right; font-style: normal; font-size: 11px; color: #735779; font-variant-numeric: tabular-nums; }
.bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 2px; }
.col { position: relative; flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding: 0 0 22px; }
.bar { position: relative; z-index: 1; width: 100%; max-width: 24px; min-height: 1px; background: #c92f69; border-radius: 4px 4px 0 0; transition: filter 0.2s; }
.col.on .bar { filter: brightness(0.78); }
/* the scrub cursor: a soft hairline under the picked month */
.col.on::after { content: ''; position: absolute; top: 0; bottom: 22px; left: 50%; width: 1px; background: color-mix(in srgb, #c92f69 35%, transparent); }
.bar em { position: absolute; bottom: 100%; left: 50%; translate: -50% -4px; font-style: normal; font-size: 11px; font-weight: 800; color: #3a2340; }
.col small { position: absolute; bottom: 0; left: 50%; translate: -50% 0; font-size: 10.5px; color: #735779; white-space: nowrap; }
.col:first-child small { left: 0; translate: 0 0; }
.t { width: 100%; margin-top: 12px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.hbars { list-style: none; margin: 14px 0 0 !important; padding: 0 !important; display: grid; gap: 8px; }
.hbars li { margin: 0 !important; display: grid; grid-template-columns: 86px 1fr 34px; align-items: center; gap: 10px; font-size: 13px; }
.lab { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #3a2340 !important; text-decoration: none !important; white-space: nowrap; }
.chip { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.track { height: 14px; }
.track i { display: block; height: 100%; max-height: 24px; background: #c92f69; border-radius: 0 4px 4px 0; transition: filter 0.2s; }
.hbars li:hover .track i { filter: brightness(0.82); }
.val { font-variant-numeric: tabular-nums; font-weight: 700; color: #3a2340; text-align: right; }
.tip { position: absolute; z-index: 5; translate: -50% calc(-100% - 8px); padding: 6px 10px; border-radius: 10px; background: #2a1730; color: #fff; font-size: 12px; font-weight: 600; white-space: nowrap; pointer-events: none; }
@media (max-width: 760px) { .tiles { grid-template-columns: repeat(2, 1fr); } .two { grid-template-columns: 1fr; } .tile b { font-size: 28px; } .cols { height: 180px; } }
</style>
