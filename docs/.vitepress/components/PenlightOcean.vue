<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'

const sel = ref<string>('all')
const wave = ref(true)
const tick = ref(0)
let timer: number | undefined
const COLS = 18, ROWS = 4
const sticks = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, row: Math.floor(i / COLS), col: i % COLS, jitter: ((i * 37) % 11) / 10 }))
const colorOf = (i: number) => {
  if (sel.value !== 'all') return members.find((m) => m.id === sel.value)!.color
  return members[(Math.floor(i / 2) + tick.value) % members.length].color
}
const current = computed(() => (sel.value === 'all' ? null : members.find((m) => m.id === sel.value)!))

// checklist
const ITEMS = [
  { id: 'ticket', t: '티켓 / 입장 방법 확인', s: '공식 사이트의 공연 상세 페이지에서 입장 방식·개장 시간을 확인' },
  { id: 'rules', t: '공연장 규칙 공지 읽기', s: '촬영·응원 도구 관련 규칙은 공연마다 다를 수 있어요' },
  { id: 'penlight', t: '펜라이트 + 예비 건전지', s: '최애 멤버 컬러를 미리 세팅!' },
  { id: 'color', t: '최애 멤버 컬러 외우기', s: '위 펜라이트 시뮬레이터로 연습 ✨' },
  { id: 'jp', t: '현장 일본어 복습', s: '물판·특전회 회화 페이지에서 5분 복습', link: '/japanese/idol-japanese/conversations' },
  { id: 'setlist', t: '최근 라이브 영상으로 예습', s: '영상 아카이브의 LIVE 필터', link: '/videos/?cat=live' },
  { id: 'schedule', t: '공연 일정 캘린더에 추가', s: '스케줄 페이지에서 .ics / Google 캘린더', link: '/schedule/' },
]
const done = ref<Set<string>>(new Set())
function toggle(id: string) {
  const s = new Set(done.value); s.has(id) ? s.delete(id) : s.add(id); done.value = s
  try { localStorage.setItem('custo-live-check', JSON.stringify([...s])) } catch { /* ignore */ }
}
const pct = computed(() => Math.round((done.value.size / ITEMS.length) * 100))

let reduce = false
onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) wave.value = false
  try { done.value = new Set(JSON.parse(localStorage.getItem('custo-live-check') || '[]')) } catch { /* ignore */ }
  timer = window.setInterval(() => { if (sel.value === 'all' && wave.value) tick.value++ }, 900)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section class="po">
    <h2 class="sr-only">펜라이트 시뮬레이터와 라이브 준비</h2>
    <div class="stage" :class="{ waving: wave }" :style="{ '--glow': current?.color ?? '#ff6b9d' }">
      <div class="lights" aria-hidden="true" />
      <div class="crowd" role="img" :aria-label="current ? `${current.ko} 컬러 펜라이트 바다` : '8색 펜라이트 바다'">
        <span v-for="s in sticks" :key="s.i" class="stick"
          :style="{ '--c': colorOf(s.i), '--row': s.row, '--col': s.col, '--j': s.jitter, left: `${(s.col + 0.5 + (s.row % 2) * 0.5) * (100 / (COLS + 0.5))}%` }">
          <i class="glow" /><i class="tube" /><i class="grip" />
        </span>
      </div>
      <div class="caption">
        <b>{{ current ? `${current.emoji} ${current.ja} — ${current.colorName}` : '🌈 8색 순환 모드' }}</b>
        <small>{{ current ? current.color : '멤버를 고르면 객석이 그 색으로 물들어요' }}</small>
      </div>
    </div>

    <div class="pick" role="toolbar" aria-label="펜라이트 색 선택">
      <button type="button" class="chip all" :aria-pressed="sel === 'all'" @click="sel = 'all'">🌈 전체</button>
      <button v-for="m in members" :key="m.id" type="button" class="chip" :aria-pressed="sel === m.id" :style="{ '--mc': m.color }" @click="sel = m.id">
        <span class="sw" />{{ m.ko.split(' ')[1] }}<small>{{ m.colorName }}</small>
      </button>
      <label class="wave-toggle"><input v-model="wave" type="checkbox" /> 흔들기</label>
    </div>

    <div class="check">
      <div class="check-head">
        <h3>라이브 준비 체크리스트</h3>
        <span class="bar"><i :style="{ width: pct + '%' }" /></span><b>{{ pct }}%</b>
      </div>
      <ul>
        <li v-for="it in ITEMS" :key="it.id" :class="{ on: done.has(it.id) }">
          <button type="button" class="box" :aria-pressed="done.has(it.id)" :aria-label="`${it.t} 완료 표시`" @click="toggle(it.id)">{{ done.has(it.id) ? '✓' : '' }}</button>
          <span class="txt"><b>{{ it.t }}</b><small>{{ it.s }}</small></span>
          <a v-if="it.link" :href="withBase(it.link)" class="go">바로가기 →</a>
        </li>
      </ul>
      <p v-if="pct === 100" class="ready">준비 완료! 즐거운 라이브 되세요 🎉</p>
    </div>
  </section>
</template>

<style scoped>
.po { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px 0 40px; }
.stage { position: relative; height: 360px; border-radius: 30px; overflow: hidden; background: radial-gradient(120% 80% at 50% 0%, #2a1236, #0d0612 70%); }
.lights { position: absolute; inset: 0; background:
  conic-gradient(from 200deg at 20% -10%, transparent 0 20deg, color-mix(in srgb, var(--glow) 35%, transparent) 26deg, transparent 34deg),
  conic-gradient(from 140deg at 80% -10%, transparent 0 20deg, color-mix(in srgb, var(--glow) 35%, transparent) 26deg, transparent 34deg);
  filter: blur(6px); opacity: 0.8; animation: sweep 6s ease-in-out infinite alternate; transition: background 0.6s; }
@keyframes sweep { to { transform: translateX(4%) skewX(-4deg); } }
.crowd { position: absolute; left: 0; right: 0; bottom: 0; height: 64%; }
.stick { position: absolute; bottom: calc(var(--row) * 18% - 10%); width: 10px; height: 90px; translate: -50% 0; transform-origin: 50% 100%;
  z-index: calc(10 - var(--row)); scale: calc(1 - var(--row) * 0.12); filter: brightness(calc(1 - var(--row) * 0.14)); }
.waving .stick { animation: sway 1.4s ease-in-out infinite alternate; animation-delay: calc(var(--col) * -0.09s + var(--j) * -0.2s); }
@keyframes sway { from { rotate: -16deg; } to { rotate: 16deg; } }
.tube { position: absolute; left: 1px; right: 1px; top: 0; height: 64px; border-radius: 6px 6px 3px 3px; background: linear-gradient(90deg, var(--c), color-mix(in srgb, var(--c) 45%, white) 50%, var(--c)); box-shadow: 0 0 10px 2px var(--c), 0 0 22px 4px color-mix(in srgb, var(--c) 60%, transparent); transition: background 0.5s, box-shadow 0.5s; }
.glow { position: absolute; left: 50%; top: -22px; width: 64px; height: 110px; translate: -50% 0; border-radius: 50%; background: radial-gradient(closest-side, var(--c), transparent); opacity: 0.95; filter: blur(8px); mix-blend-mode: screen; transition: background 0.5s; }
.grip { position: absolute; left: 0; right: 0; bottom: 0; height: 26px; border-radius: 3px 3px 6px 6px; background: #241830; box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.15); }
.caption { position: absolute; left: 22px; top: 18px; display: flex; flex-direction: column; color: #fff; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6); }
.caption b { font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: 22px; }
.caption small { font-size: 12px; opacity: 0.8; font-family: ui-monospace, monospace; }

.pick { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; align-items: center; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; border: 1.5px solid #f1dce7; color: var(--ink); transition: transform 0.45s var(--spring); }
.chip small { font-size: 10.5px; opacity: 0.6; }
.chip .sw { width: 12px; height: 12px; border-radius: 50%; background: var(--mc); box-shadow: 0 0 8px var(--mc); }
.chip[aria-pressed='true'] { background: color-mix(in srgb, var(--mc, #3a2340) 62%, #2a1030); border-color: transparent; color: #fff; transform: translateY(-2px); }
.chip[aria-pressed='true'] .sw { background: #fff; }
.chip.all[aria-pressed='true'] { background: linear-gradient(90deg, #ffc93c, #ff4757, #3ccfa8, #4a90d9, #a06cd5, #ff6b9d); border-color: transparent; }
.wave-toggle { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #735779; }
.wave-toggle input { accent-color: #ff6b9d; }

.check { margin-top: 26px; padding: 22px; border-radius: 26px; background: #fff; border: 1.5px solid #f3dbe8; }
.check-head { display: flex; align-items: center; gap: 12px; }
.check-head h3 { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px !important; flex: 1; }
.bar { width: 120px; height: 8px; border-radius: 999px; background: #f6e6ee; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #ff6b9d, #a06cd5); transition: width 0.6s var(--spring); }
.check ul { list-style: none; padding: 0 !important; margin: 14px 0 0 !important; display: grid; gap: 8px; }
.check li { display: flex; align-items: center; gap: 12px; margin: 0 !important; padding: 10px 12px; border-radius: 16px; background: #fdf6fa; transition: background 0.3s; }
.check li.on { background: #f1fbf6; }
.check li.on .txt b { text-decoration: line-through; text-decoration-color: #3ccfa8; text-decoration-thickness: 2px; }
.box { flex: none; width: 26px; height: 26px; border-radius: 8px; border: 2px solid #e3c9d8; background: #fff; color: #fff; font-weight: 800; transition: transform 0.45s var(--spring), background 0.2s, border-color 0.2s; }
.box[aria-pressed='true'] { background: #3ccfa8; border-color: #3ccfa8; transform: rotate(-8deg) scale(1.1); }
.txt { display: flex; flex-direction: column; min-width: 0; }
.txt b { font-size: 14px; }
.txt small { font-size: 12px; color: #735779; }
.go { margin-left: auto; font-size: 12px; font-weight: 700; color: #a33366 !important; white-space: nowrap; }
.ready { margin: 14px 0 0 !important; font-weight: 800; color: #3ccfa8; text-align: center; }
@media (max-width: 640px) { .pick { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; } .pick::-webkit-scrollbar { display: none; } .chip { flex: none; } .wave-toggle { flex: none; margin-left: 4px; } .stage { height: 280px; } .stick { width: 7px; height: 70px; } .tube { height: 50px; } .grip { height: 20px; } .caption b { font-size: 18px; } .go { display: none; } }
@media (prefers-reduced-motion: reduce) { .lights, .waving .stick { animation: none; } }
</style>
