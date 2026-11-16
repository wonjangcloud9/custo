<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'
import { milestones } from '../data/journey'

// Verified: モデルプレス https://mdpr.jp/music/detail/4875525 (edition, time, channels, quote)
const START = new Date('2026-12-31T19:20:00+09:00').getTime()
const END = new Date('2026-12-31T23:45:00+09:00').getTime()
const now = ref<number | null>(null)
let t: number | undefined
onMounted(() => { now.value = Date.now(); t = window.setInterval(() => (now.value = Date.now()), 1000); loadNotes() })
onBeforeUnmount(() => clearInterval(t))
const phase = computed(() => (now.value === null ? 'pre' : now.value < START ? 'pre' : now.value < END ? 'live' : 'done'))
const parts = computed(() => {
  const s = Math.max(0, Math.floor(((START) - (now.value ?? START)) / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return [{ v: String(Math.floor(s / 86400)), l: 'DAYS' }, { v: p(Math.floor((s % 86400) / 3600)), l: 'HRS' }, { v: p(Math.floor((s % 3600) / 60)), l: 'MIN' }, { v: p(s % 60), l: 'SEC' }]
})

const WORDS = [
  { ja: '紅白歌合戦', yomi: 'こうはくうたがっせん', ko: '홍백가합전 — NHK 연말 음악 특집' },
  { ja: '大晦日', yomi: 'おおみそか', ko: '섣달그믐날, 12월 31일' },
  { ja: '初出場', yomi: 'はつしゅつじょう', ko: '첫 출장' },
  { ja: '出場歌手', yomi: 'しゅつじょうかしゅ', ko: '출장 가수' },
  { ja: '歌唱曲', yomi: 'かしょうきょく', ko: '부를 곡' },
  { ja: '生放送', yomi: 'なまほうそう', ko: '생방송' },
]
const road = milestones.slice(-5)

// cheer notes (local only)
interface Note { id: number; text: string; c: string; r: number }
const notes = ref<Note[]>([])
const draft = ref('')
function loadNotes() { try { notes.value = JSON.parse(localStorage.getItem('custo-kohaku-notes') || '[]') } catch { /* ignore */ } }
function saveNotes() { try { localStorage.setItem('custo-kohaku-notes', JSON.stringify(notes.value)) } catch { /* ignore */ } }
function addNote() {
  const text = draft.value.trim().slice(0, 80)
  if (!text) return
  notes.value = [{ id: Date.now(), text, c: members[notes.value.length % 8].color, r: (Math.random() - 0.5) * 8 }, ...notes.value].slice(0, 24)
  draft.value = ''; saveNotes()
}
function removeNote(id: number) { notes.value = notes.value.filter((n) => n.id !== id); saveNotes() }
const xIntent = computed(() => `https://x.com/intent/post?text=${encodeURIComponent(`${draft.value || 'CUTIE STREET 紅白初出場おめでとう！'} #CUTIESTREET #きゅーすと #紅白歌合戦`)}`)
</script>

<template>
  <section class="ko">
    <div class="hero">
      <div class="half red" aria-hidden="true" /><div class="half white" aria-hidden="true" />
      <div class="hero-in">
        <p class="eyebrow">第77回 NHK紅白歌合戦 · 初出場</p>
        <h2 class="ttl"><span class="r">紅</span><span class="w">白</span><small>CUTIE STREET</small></h2>
        <template v-if="phase === 'pre'">
          <div class="flip" role="timer" aria-label="홍백 시작까지 남은 시간">
            <div v-for="p in parts" :key="p.l" class="cell">
              <span class="card"><b :key="p.v" class="digit">{{ p.v }}</b></span><small>{{ p.l }}</small>
            </div>
          </div>
          <p class="when">2026.12.31 (木) 19:20 – 23:45 JST · 한국도 같은 시각</p>
        </template>
        <p v-else-if="phase === 'live'" class="live"><span class="dot" /> 지금 생방송 중! NHK 総合</p>
        <p v-else class="live">🎊 첫 紅白, 수고했어요!</p>
      </div>
    </div>

    <div class="grid">
      <div class="box info">
        <h3>📺 방송 정보</h3>
        <dl>
          <dt>일시</dt><dd>2026년 12월 31일(목) 19:20 – 23:45 (JST)</dd>
          <dt>채널</dt><dd>NHK 総合 · BSP4K · BS8K · NHK AM(라디오) 생방송</dd>
          <dt>歌唱曲</dt><dd>공식 발표 대기 중 — 발표되면 업데이트할게요</dd>
        </dl>
        <a class="src" href="https://mdpr.jp/music/detail/4875525" target="_blank" rel="noopener">출처: 모델프레스 ↗</a>
      </div>
      <figure class="box quote" :style="{ '--mc': members[3].color }">
        <blockquote lang="ja">「以前からずっと大きな夢だったし、叶えたい目標でした。」</blockquote>
        <p class="tr">“예전부터 계속 큰 꿈이었고, 이루고 싶은 목표였어요.”</p>
        <figcaption>— 増田彩乃 (마스다 아야노) 💙, 출장 결정 회견</figcaption>
      </figure>
    </div>

    <div class="box road">
      <h3>🗻 紅白까지의 길</h3>
      <ol>
        <li v-for="(m, i) in road" :key="m.date" :style="{ '--mc': members[(i + 3) % 8].color }"><span>{{ m.date }}</span><b lang="ja">{{ m.ja }}</b><small>{{ m.ko }}</small></li>
      </ol>
      <a class="more" :href="withBase('/journey/')">3D 여정 전체 보기 →</a>
    </div>

    <div class="box words">
      <h3>🔤 홍백 일본어</h3>
      <div class="wl">
        <div v-for="w in WORDS" :key="w.ja" class="wd"><b lang="ja">{{ w.ja }}</b><small lang="ja">{{ w.yomi }}</small><span>{{ w.ko }}</span></div>
      </div>
    </div>

    <div class="box board">
      <h3>💌 응원 포스트잇 <small>(이 브라우저에만 저장돼요)</small></h3>
      <form class="add" @submit.prevent="addNote">
        <input v-model="draft" maxlength="80" placeholder="응원 한마디 (예: 첫 紅白 축하해요! 귀여움으로 세계까지 💖)" aria-label="응원 메시지" />
        <button type="submit">붙이기</button>
        <a class="x" :href="xIntent" target="_blank" rel="noopener">X에 응원 ↗</a>
      </form>
      <div class="notes">
        <div v-for="n in notes" :key="n.id" class="note" :style="{ '--c': n.c, '--r': n.r + 'deg' }">
          <p>{{ n.text }}</p>
          <button type="button" aria-label="메모 떼기" @click="removeNote(n.id)">✕</button>
        </div>
        <p v-if="!notes.length" class="empty">첫 번째 응원을 붙여주세요 ✨</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ko { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px 0 40px; }
.hero { position: relative; overflow: hidden; border-radius: 32px; min-height: 360px; display: grid; place-items: center; text-align: center; box-shadow: 0 30px 60px -36px rgba(120, 10, 30, 0.6); }
.half { position: absolute; top: 0; bottom: 0; width: 50%; }
.red { left: 0; background: linear-gradient(160deg, #e2364f, #b3122f); }
.white { right: 0; background: linear-gradient(200deg, #ffffff, #f4eef2); }
.hero::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 120%, rgba(255, 215, 120, 0.35), transparent 60%); pointer-events: none; }
.hero-in { position: relative; z-index: 1; padding: 30px 16px; }
.eyebrow { display: inline-block; margin: 0 !important; padding: 6px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); color: #a3122c; font-size: 12px; font-weight: 800; letter-spacing: 0.18em; }
.ttl { margin: 10px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', 'Noto Sans JP', serif; font-size: 96px !important; line-height: 1 !important; display: flex; align-items: baseline; justify-content: center; gap: 4px; flex-wrap: wrap; }
.ttl .r { color: #fff; text-shadow: 0 6px 20px rgba(80, 0, 20, 0.45); }
.ttl .w { color: #b3122f; text-shadow: 0 6px 20px rgba(120, 10, 30, 0.2); }
.ttl small { flex-basis: auto; display: inline-block; margin: 10px auto 0; padding: 5px 14px; border-radius: 999px; font-size: 15px; letter-spacing: 0.3em; color: #6b1023; background: rgba(255, 255, 255, 0.9); }
.ttl::after { content: ''; flex-basis: 100%; order: 2; }
.ttl small { order: 3; }
.flip { display: flex; justify-content: center; gap: 10px; margin-top: 18px; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cell small { font-size: 10px; letter-spacing: 0.22em; font-weight: 800; color: #6b1023; background: rgba(255, 255, 255, 0.88); padding: 2px 7px; border-radius: 999px; }
.card { position: relative; min-width: 72px; padding: 10px 10px; border-radius: 14px; background: #1f0f1a; color: #fff; perspective: 400px; box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.6); }
.card::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgba(255, 255, 255, 0.12); }
.digit { display: block; font-family: 'Zen Maru Gothic', sans-serif; font-size: 42px; line-height: 1; font-variant-numeric: tabular-nums; animation: flipIn 0.5s var(--spring); transform-origin: 50% 100%; }
@keyframes flipIn { from { transform: rotateX(80deg); opacity: 0.2; } }
.when { margin: 14px 0 0 !important; display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 700; color: #6b1023; }
.live { margin: 18px 0 0 !important; font-size: 22px; font-weight: 800; color: #fff; text-shadow: 0 2px 10px rgba(80, 0, 20, 0.6); display: flex; align-items: center; gap: 8px; justify-content: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #ffd34d; animation: ping 1.4s infinite; }
@keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(255, 211, 77, 0.8); } 70%, 100% { box-shadow: 0 0 0 12px rgba(255, 211, 77, 0); } }

.grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; margin-top: 16px; }
.box { padding: 20px; border-radius: 24px; background: #fff; border: 1.5px solid #f3dbe8; margin-top: 0; }
.road, .words, .board { margin-top: 14px; }
.box h3 { margin: 0 0 10px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px !important; }
.box h3 small { font-size: 12px; color: #735779; font-family: 'Noto Sans KR', sans-serif; }
dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; font-size: 14px; }
dt { font-weight: 800; color: #a3122c; }
dd { margin: 0; }
.src { display: inline-block; margin-top: 10px; font-size: 12px; color: #735779 !important; }
.quote { background: linear-gradient(160deg, #fff, color-mix(in srgb, var(--mc) 12%, white)); border-color: color-mix(in srgb, var(--mc) 30%, white); }
.quote blockquote { margin: 0; padding: 0; border: 0; background: none; font-family: 'Noto Sans JP', sans-serif; font-size: 17px; font-weight: 700; line-height: 1.6; color: color-mix(in srgb, var(--mc) 55%, #2a1030); }
.tr { margin: 8px 0 0 !important; font-size: 14px; color: #5a4060; }
figcaption { margin-top: 8px; font-size: 12.5px; color: #735779; }
.road ol { list-style: none; padding: 0 !important; margin: 0 !important; display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.road li { margin: 0 !important; padding: 12px; border-radius: 16px; background: color-mix(in srgb, var(--mc) 10%, white); border-top: 4px solid var(--mc); display: flex; flex-direction: column; gap: 2px; }
.road li span { font-size: 11px; font-weight: 800; color: #735779; font-variant-numeric: tabular-nums; }
.road li b { font-size: 13.5px; font-family: 'Noto Sans JP', sans-serif; }
.road li small { font-size: 12px; color: #5a4060; }
.more { display: inline-block; margin-top: 10px; font-size: 13px; font-weight: 700; color: #a33366 !important; }
.wl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.wd { display: flex; flex-direction: column; padding: 10px 12px; border-radius: 14px; background: #fdf3f6; }
.wd b { font-family: 'Noto Sans JP', sans-serif; font-size: 18px; }
.wd small { font-size: 12px; color: #a3122c; }
.wd span { font-size: 12.5px; color: #5a4060; margin-top: 2px; }
.add { display: flex; gap: 8px; flex-wrap: wrap; }
.add input { flex: 1; min-width: 200px; padding: 11px 14px; border-radius: 999px; border: 1.5px solid #f1d4e1; font-size: 14px; background: #fff; }
.add button, .add .x { padding: 10px 16px; border-radius: 999px; font-weight: 700; font-size: 13px; text-decoration: none !important; }
.add button { background: #b3122f; color: #fff; }
.add .x { background: #1f0f1a; color: #fff !important; }
.notes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.note { position: relative; width: 150px; min-height: 120px; padding: 14px 12px 12px; border-radius: 4px; background: color-mix(in srgb, var(--c) 30%, #fffdf4);
  box-shadow: 0 10px 20px -12px rgba(60, 20, 40, 0.5); transform: rotate(var(--r)); animation: stick 0.6s var(--spring); transition: transform 0.5s var(--spring); }
.note:hover { transform: rotate(0deg) scale(1.04); }
.note::before { content: ''; position: absolute; top: -8px; left: 50%; width: 46px; height: 16px; translate: -50% 0; background: rgba(255, 255, 255, 0.7); }
@keyframes stick { from { transform: translateY(-30px) rotate(calc(var(--r) * 4)) scale(0.8); opacity: 0; } }
.note p { margin: 0 !important; font-size: 13.5px; line-height: 1.55 !important; font-weight: 600; overflow-wrap: anywhere; }
.note button { position: absolute; right: 4px; top: 4px; width: 22px; height: 22px; border-radius: 50%; font-size: 10px; background: rgba(255, 255, 255, 0.7); }
.empty { font-size: 13px; color: #735779; }
@media (max-width: 760px) {
  .grid { grid-template-columns: 1fr; }
  .ttl { font-size: 72px !important; }
  .card { min-width: 58px; padding: 8px 6px; }
  .digit { font-size: 30px; }
  .flip { gap: 6px; }
  .road ol { grid-template-columns: 1fr 1fr; }
  .wl { grid-template-columns: 1fr 1fr; }
  .note { width: calc(50% - 6px); }
}
@media (prefers-reduced-motion: reduce) { .digit, .note, .dot { animation: none; } .note { transition: none; } }
</style>
