<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { members, ageOn, daysToBirthday, prefectureKo } from '../data/members'

type Key = 'order' | 'name' | 'age' | 'height' | 'bday' | 'from'
const key = ref<Key>('order')
const dir = ref<1 | -1>(1)
const now = ref<Date | null>(null)
onMounted(() => { now.value = new Date() })

const rows = computed(() => members.map((m, i) => ({
  m, i,
  age: now.value ? ageOn(m.birthday, now.value) : null,
  dd: now.value ? daysToBirthday(m.birthday, now.value) : null,
  md: m.birthday.slice(5),
})))
const sorted = computed(() => {
  const r = [...rows.value]
  const v = (x: (typeof r)[number]): number | string => {
    switch (key.value) {
      case 'name': return x.m.ko
      case 'age': return x.m.birthday // older first when ascending by birthday? handled by sign below
      case 'height': return x.m.height
      case 'bday': return x.dd ?? x.md
      case 'from': return prefectureKo[x.m.birthplace] || x.m.birthplace
      default: return x.i
    }
  }
  r.sort((a, b) => {
    const A = v(a), B = v(b)
    let c = typeof A === 'number' && typeof B === 'number' ? A - B : String(A).localeCompare(String(B), 'ko')
    if (key.value === 'age') c = -c // ascending age = latest birthday first
    return c * dir.value || a.i - b.i
  })
  return r
})
function sortBy(k: Key) {
  if (key.value === k) dir.value = dir.value === 1 ? -1 : 1
  else { key.value = k; dir.value = 1 }
}
const COLS: { k: Key; label: string }[] = [
  { k: 'order', label: '#' }, { k: 'name', label: '멤버' }, { k: 'age', label: '나이' }, { k: 'height', label: '키' }, { k: 'bday', label: '생일 (D-day)' }, { k: 'from', label: '출신' },
]
const ariaSort = (k: Key) => (key.value === k ? (dir.value === 1 ? 'ascending' : 'descending') : 'none')
const hMin = Math.min(...members.map((m) => m.height)), hMax = Math.max(...members.map((m) => m.height))
</script>

<template>
  <div class="mt">
    <table>
      <caption>열 제목을 누르면 정렬돼요 (다시 누르면 반대로)</caption>
      <thead>
        <tr>
          <th v-for="c in COLS" :key="c.k" :aria-sort="ariaSort(c.k)" scope="col" :class="`c-${c.k}`">
            <button type="button" :class="{ on: key === c.k }" @click="sortBy(c.k)">
              {{ c.label }}<span class="arr" aria-hidden="true">{{ key === c.k ? (dir === 1 ? '▲' : '▼') : '↕' }}</span>
            </button>
          </th>
          <th scope="col">컬러</th>
        </tr>
      </thead>
      <TransitionGroup tag="tbody" name="row">
        <tr v-for="r in sorted" :key="r.m.id" :style="{ '--mc': r.m.color }">
          <td class="n c-order">{{ String(r.i + 1).padStart(2, '0') }}</td>
          <td class="who c-name">
            <a :href="withBase(`/members/${r.m.id}`)"><span class="face">{{ r.m.ja.slice(-2, -1) }}</span><span><b lang="ja">{{ r.m.ja }}</b><small>{{ r.m.ko }}</small></span></a>
          </td>
          <td class="num">{{ r.age === null ? '–' : r.age + '세' }}</td>
          <td class="ht"><span class="hbar"><i :style="{ width: 30 + ((r.m.height - hMin) / (hMax - hMin)) * 70 + '%' }" /></span><span class="num">{{ r.m.height }}cm</span></td>
          <td class="num">{{ r.m.birthday.slice(5).replace('-', '/') }} <small v-if="r.dd !== null" :class="{ soon: r.dd <= 14 }">{{ r.dd === 0 ? '🎂 오늘' : 'D-' + r.dd }}</small></td>
          <td><span lang="ja">{{ r.m.birthplace }}</span> <small>{{ prefectureKo[r.m.birthplace] }}</small></td>
          <td><span class="sw" aria-hidden="true" />{{ r.m.colorName }}</td>
        </tr>
      </TransitionGroup>
    </table>
    <p class="src">출처: 공식 프로필 · Wikipedia(일본어) — 나이·D-day는 오늘 날짜 기준 자동 계산</p>
  </div>
</template>

<style scoped>
.mt { margin: 12px 0 8px; overflow-x: auto; border-radius: 20px; border: 1.5px solid #f3dbe8; background: #fff; }
table { width: 100%; min-width: 640px; border-collapse: collapse; margin: 0 !important; display: table !important; border: 0 !important; }
caption { caption-side: top; text-align: left; padding: 12px 16px 4px; font-size: 12.5px; color: #735779; }
th, td { border: 0 !important; padding: 10px 12px !important; text-align: left; vertical-align: middle; background: none !important; }
thead th { border-bottom: 1.5px solid #f3e3ec !important; }
th button { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 800; color: #5a4060; background: none; padding: 4px 6px; border-radius: 8px; white-space: nowrap; }
th button:hover, th button.on { background: #fdf0f6; color: #3a2340; }
.arr { font-size: 10px; opacity: 0.6; }
tbody tr { border-bottom: 1px solid #f8eef3; transition: background 0.2s; }
tbody tr:hover { background: color-mix(in srgb, var(--mc) 8%, white) !important; }
.row-move { transition: transform 0.5s cubic-bezier(.34, 1.56, .64, 1); }
.n { font-size: 12px; font-weight: 800; color: #735779; font-variant-numeric: tabular-nums; }
.who a { display: flex; align-items: center; gap: 10px; text-decoration: none !important; color: #3a2340 !important; }
.face { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--mc) 62%, #2a1030); color: #fff; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; }
.who b { display: block; font-size: 14px; }
.who small { font-size: 12px; color: #735779; }
.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ht { display: flex; align-items: center; gap: 8px; min-width: 150px; }
.hbar { flex: 1; height: 8px; border-radius: 999px; background: #f6edf2; overflow: hidden; }
.hbar i { display: block; height: 100%; border-radius: 999px; background: color-mix(in srgb, var(--mc) 70%, #2a1030); }
td small { font-size: 11.5px; color: #735779; }
small.soon { color: #fff; background: #c92f69; padding: 1px 7px; border-radius: 999px; font-weight: 800; }
.sw { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--mc); margin-right: 6px; vertical-align: -1px; box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.5px color-mix(in srgb, var(--mc) 40%, white); }
.src { margin: 0 !important; padding: 8px 16px 12px; font-size: 11.5px; color: #735779; }
@media (max-width: 700px) {
  .c-order { display: none; }
  .c-name { position: sticky; left: 0; z-index: 2; background: #fff !important; box-shadow: 6px 0 8px -6px rgba(90, 30, 70, 0.25); }
  .mt table th.c-name, .mt table td.c-name { background: #fff !important; }
  .mt table th.c-name { z-index: 3; }
  table { min-width: 600px; }
}
@media (prefers-reduced-motion: reduce) { .row-move { transition: none; } }
</style>
