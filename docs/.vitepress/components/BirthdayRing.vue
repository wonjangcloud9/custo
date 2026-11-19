<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToday } from '../theme/today'
import { withBase, useRouter } from 'vitepress'
import { members, daysToBirthday, ageOn, onColor } from '../data/members'
import { birthdaysIcs, downloadIcs } from '../data/birthdays'

const SIZE = 360, C = SIZE / 2, R = 132
const now = useToday() // moves to the new day if left open past midnight
const hover = ref<string | null>(null)
const router = useRouter()
const go = (id: string) => router.go(withBase(`/members/${id}`))

// all eight birthdays as one yearly calendar file (data/birthdays.ts)
const icsSaved = ref(false)
function saveBirthdays() {
  downloadIcs(birthdaysIcs(members, location.origin + withBase('/members/')), 'cutiestreet-member-birthdays.ics')
  icsSaved.value = true; setTimeout(() => (icsSaved.value = false), 1800)
}

const dayOfYear = (m: number, d: number) => {
  const start = Date.UTC(2025, 0, 1) // non-leap reference year
  return (Date.UTC(2025, m - 1, d) - start) / 86400000
}
const angle = (doy: number) => (doy / 365) * Math.PI * 2 - Math.PI / 2
const pos = (doy: number, r = R) => ({ x: C + Math.cos(angle(doy)) * r, y: C + Math.sin(angle(doy)) * r })

// birthdays close together (e.g. 11/8, 11/11) get staggered radii so the dots don't overlap
const placed = (() => {
  const base = members.map((m) => {
    const [, mo, d] = m.birthday.split('-').map(Number)
    return { m, mo, d, doy: dayOfYear(mo, d), r: R }
  }).sort((a, b) => a.doy - b.doy)
  let flip = 1
  for (let i = 1; i < base.length; i++) {
    if (base[i].doy - base[i - 1].doy < 12) { base[i].r = R + 30 * flip; flip *= -1 } else flip = 1
  }
  return base
})()
const dots = computed(() => placed.map((b) => ({
  ...b, ...pos(b.doy, b.r),
  dd: now.value ? daysToBirthday(b.m.birthday, now.value) : null,
  turning: now.value ? ageOn(b.m.birthday, now.value) + (daysToBirthday(b.m.birthday, now.value) === 0 ? 0 : 1) : null,
})))
const upcoming = computed(() => [...dots.value].sort((a, b) => (a.dd ?? 0) - (b.dd ?? 0)))
const next = computed(() => upcoming.value[0])
const today = computed(() => {
  if (!now.value) return null
  return pos(dayOfYear(now.value.getMonth() + 1, now.value.getDate()), R - 34)
})
const todayDot = computed(() => (now.value ? pos(dayOfYear(now.value.getMonth() + 1, now.value.getDate()), R) : null))
const months = Array.from({ length: 12 }, (_, i) => ({ i, ...pos(dayOfYear(i + 1, 15), R + 34), tick: pos(dayOfYear(i + 1, 1), R + 10), tick2: pos(dayOfYear(i + 1, 1), R - 10) }))
const focus = computed(() => dots.value.find((d) => d.m.id === hover.value) ?? next.value)

</script>

<template>
  <section class="br">
    <div class="ring-wrap">
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="ring" role="img" aria-label="멤버 생일 링 캘린더">
        <defs>
          <linearGradient id="br-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffd6e7" /><stop offset="1" stop-color="#e5d9ff" />
          </linearGradient>
        </defs>
        <circle :cx="C" :cy="C" :r="R" fill="none" stroke="url(#br-g)" stroke-width="22" />
        <circle :cx="C" :cy="C" :r="R" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 6" />
        <g v-for="mo in months" :key="mo.i">
          <line :x1="mo.tick.x" :y1="mo.tick.y" :x2="mo.tick2.x" :y2="mo.tick2.y" stroke="#e7cfe0" stroke-width="1.5" />
          <text :x="mo.x" :y="mo.y" class="mo" text-anchor="middle" dominant-baseline="middle">{{ mo.i + 1 }}月</text>
        </g>
        <!-- today needle -->
        <g v-if="today && todayDot">
          <line :x1="C" :y1="C" :x2="today.x" :y2="today.y" stroke="#3a2340" stroke-width="2" stroke-linecap="round" class="needle" />
          <circle :cx="todayDot.x" :cy="todayDot.y" r="5" fill="#3a2340" />
        </g>
        <!-- members -->
        <g v-for="d in dots" :key="d.m.id" role="link" tabindex="0" :aria-label="`${d.m.ko} 페이지로`" class="dot" :class="{ next: next && d.m.id === next.m.id, on: hover === d.m.id }"
          @click="go(d.m.id)" @keydown.enter="go(d.m.id)" @mouseenter="hover = d.m.id" @mouseleave="hover = null" @focus="hover = d.m.id" @blur="hover = null">
          <circle :cx="d.x" :cy="d.y" r="17" :fill="d.m.color" stroke="#fff" stroke-width="3" />
          <text :x="d.x" :y="d.y + 1" text-anchor="middle" dominant-baseline="middle" class="kanji">{{ d.m.ja.slice(-2, -1) }}</text>
          <title>{{ d.m.ko }} {{ d.mo }}/{{ d.d }}</title>
        </g>
        <!-- center -->
        <g v-if="focus" class="center">
          <circle :cx="C" :cy="C" r="78" fill="#fff" />
          <text :x="C" :y="C - 34" text-anchor="middle" class="c-eyebrow">{{ hover ? 'BIRTHDAY' : 'NEXT ♡' }}</text>
          <text :x="C" :y="C - 6" text-anchor="middle" class="c-name" :fill="focus.m.color">{{ focus.m.ja }}</text>
          <text :x="C" :y="C + 18" text-anchor="middle" class="c-date">{{ focus.mo }}월 {{ focus.d }}일</text>
          <text :x="C" :y="C + 46" text-anchor="middle" class="c-dd">{{ focus.dd === null ? '' : focus.dd === 0 ? 'TODAY!' : 'D-' + focus.dd }}</text>
        </g>
      </svg>
    </div>
    <ol class="list">
      <li v-for="d in upcoming" :key="d.m.id" :style="{ '--mc': d.m.color }" :class="{ on: hover === d.m.id }"
        @mouseenter="hover = d.m.id" @mouseleave="hover = null">
        <a :href="withBase(`/members/${d.m.id}`)">
          <span class="li-dot" :style="{ '--on': onColor(d.m.color) }" aria-hidden="true">{{ d.m.ja.slice(-2, -1) }}</span>
          <span class="li-name"><b>{{ d.m.ko }}</b><small>{{ d.mo }}/{{ d.d }}<template v-if="d.turning"> · {{ d.turning }}번째 생일</template></small></span>
          <span class="li-dd">{{ d.dd === null ? '' : d.dd === 0 ? 'TODAY ♡' : 'D-' + d.dd }}</span>
        </a>
      </li>
    </ol>
    <div class="br-ics">
      <button type="button" class="br-ics-btn" @click="saveBirthdays"><template v-if="icsSaved">✓ 캘린더 파일을 받았어요</template><template v-else><Ico n="calendar" duo size="16" /> 멤버 생일 8개 캘린더에 넣기</template></button>
      <small>매년 반복 · 전날 오전 9시 알림 · 아이폰·구글·아웃룩 캘린더에서 열면 추가돼요</small>
    </div>
  </section>
</template>

<style scoped>
.br-ics { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 18px; text-align: center; }
.br-ics-btn { padding: 9px 18px; border-radius: 999px; font-size: 13.5px; font-weight: 800; color: #fff; background: #3a2340; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.br-ics-btn:hover { transform: translateY(-2px); }
.br-ics small { font-size: 12px; color: #6a4f70; }
@media (prefers-reduced-motion: reduce) { .br-ics-btn { transition: none; } }
.br { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px; align-items: center; margin: 16px 0 40px; padding: 24px; border-radius: 32px; background: linear-gradient(160deg, #fff3f8, #f6f0ff); color: #3a2340; }
.ring-wrap { max-width: 420px; width: 100%; justify-self: center; }
.ring { width: 100%; height: auto; overflow: visible; }
.mo { font-size: 11px; font-weight: 700; fill: #7d6083; font-family: 'Zen Maru Gothic', sans-serif; }
.needle { transform-origin: 180px 180px; animation: needleIn 1.4s var(--spring) both; }
@keyframes needleIn { from { transform: rotate(-200deg); opacity: 0; } }
.dot { cursor: pointer; outline: none; }
.dot:focus-visible circle { stroke: #3a2340; }
.dot circle { transition: r 0.4s var(--spring), filter 0.3s; transform-box: fill-box; transform-origin: center; }
.dot:hover circle, .dot.on circle { r: 22; filter: drop-shadow(0 6px 10px rgba(90, 30, 70, 0.35)); }
.dot.next circle { animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 50% { filter: drop-shadow(0 0 10px var(--pc, #ff6b9d)); } }
.kanji { fill: #fff; font-size: 15px; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; pointer-events: none; }
.c-eyebrow { font-size: 10px; letter-spacing: 0.22em; font-weight: 800; fill: #c2457a; }
.c-name { font-size: 20px; font-weight: 700; font-family: 'Zen Maru Gothic', var(--cs-sans); }
.c-date { font-size: 13px; fill: #735779; font-weight: 600; }
.c-dd { font-size: 24px; font-weight: 800; fill: #3a2340; font-family: 'Zen Maru Gothic', sans-serif; }
.list { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; gap: 8px; }
.list li { margin: 0 !important; }
.list a { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 18px; background: #fff; text-decoration: none !important; color: #3a2340 !important;
  border: 1.5px solid color-mix(in srgb, var(--mc) 25%, white); transition: transform 0.5s var(--spring), box-shadow 0.3s; }
.list li.on a, .list a:hover { transform: translateX(6px); box-shadow: 0 12px 24px -16px color-mix(in srgb, var(--mc) 90%, #000); }
.li-dot { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--mc); color: var(--on, #fff); font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; flex: none; }
.li-name { display: flex; flex-direction: column; line-height: 1.3; }
.li-name b { font-size: 14px; }
.li-name small { font-size: 12px; color: #735779; }
.li-dd { margin-left: auto; font-weight: 800; font-size: 15px; color: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); font-variant-numeric: tabular-nums; }
@media (max-width: 760px) { .br { grid-template-columns: 1fr; padding: 16px; } }
@media (prefers-reduced-motion: reduce) { .needle, .dot.next circle { animation: none; } .list a, .dot circle { transition: none; } }
</style>
