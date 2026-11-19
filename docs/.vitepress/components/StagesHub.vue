<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'

// Legend stages — every video id verified via YouTube oEmbed (official broadcaster / artist channels).
type Cat = 'kr' | 'special' | 'live'
interface Stage { id: string; date: string; show: string; song: string; ch: string; cat: Cat; note: string }
const STAGES: Stage[] = [
  { id: 'aanKhmeCl-s', date: '2026.03.26', show: 'Mnet 엠카운트다운 EP.921', song: '귀엽기만 하면 안 되나요?', ch: 'Mnet K-POP', cat: 'kr', note: '한국어 버전으로 꾸민 SPECIAL STAGE' },
  { id: 'g8BNn7sBdDg', date: '2026.05.07', show: 'Mnet 엠카운트다운 EP.927', song: '귀엽기만 하면 안 되나요?', ch: 'Mnet K-POP', cat: 'kr', note: '엠카 유치원 특집 무대' },
  { id: 'H7eA_BhHssM', date: '2026.06.05', show: 'KBS 뮤직뱅크', song: '프리큐큐 (ぷりきゅきゅ)', ch: 'KBS Kpop', cat: 'kr', note: '「ぷりきゅきゅ」 한국어 버전 무대' },
  { id: 'K8Ve15WbM_0', date: '2026.10.22', show: 'Mnet 엠카운트다운 EP.950', song: '동글동글 동글이', ch: 'Mnet K-POP', cat: 'kr', note: '포켓몬 한일 W 엔딩곡 한국어 버전' },
  { id: '4-t2sNCZIX4', date: '2026.10.24', show: 'MBC 쇼! 음악중심', song: 'CUTIE SPHERE (동글동글 동글이)', ch: 'MBCkpop', cat: 'kr', note: '「동글동글 동글이」 음악중심 무대' },
  { id: 'H4ZRCW5HamI', date: '2024.12.13', show: 'THE FIRST TAKE', song: 'かわいいだけじゃだめですか？', ch: 'THE FIRST TAKE', cat: 'special', note: '단 한 번의 테이크로 부른 데뷔곡' },
  { id: '4j2aQHAmvJs', date: '2024.10.07', show: '첫 단독 공연 · ヒューリックホール東京', song: 'ハッピー世界！', ch: 'CUTIE STREET', cat: 'live', note: '데뷔 두 달 만의 첫 단독 무대' },
  { id: 'KGFOrSUL-uc', date: '2026.08', show: '첫 日本武道館 공연', song: 'Top of the top', ch: 'CUTIE STREET', cat: 'live', note: '데뷔 2주년, 꿈의 무대 부도칸' },
  { id: 'CWFV3vJm5QA', date: '2026.11.15', show: '아레나 투어 · 広島グリーンアリーナ', song: 'Top of the top', ch: 'CUTIE STREET', cat: 'live', note: '紅白 첫 출장이 알려진 날의 눈물의 무대' },
]
const CATS: { id: 'all' | Cat; label: string }[] = [
  { id: 'all', label: '✨ 전체' }, { id: 'kr', label: '🇰🇷 한국 음악방송' }, { id: 'special', label: '🎙️ 스페셜' }, { id: 'live', label: '🏟️ 라이브' },
]
const cat = ref<'all' | Cat>('all')
const list = computed(() => STAGES.filter((s) => cat.value === 'all' || s.cat === cat.value))
const cur = ref(STAGES[0])
const playing = ref(false)
function pick(s: Stage) {
  cur.value = s; playing.value = false
  if (typeof window !== 'undefined') document.getElementById('stage-now')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
}
const MILESTONES = [
  { d: '2024.08.04', t: 'TOKYO IDOL FESTIVAL 2024', s: '데뷔 무대' },
  { d: '2024.10.07', t: 'ヒューリックホール東京', s: '첫 단독 공연' },
  { d: '2024.12.27', t: 'Mステ SUPER LIVE 2024', s: '첫 뮤직스테이션' },
  { d: '2025.02.02', t: 'CROSS STREET @豊洲PIT', s: '첫 원맨 라이브' },
  { d: '2025.08–10', t: '전국 투어 CAN\'T STOP CUTIE', s: '파이널 ぴあアリーナMM' },
  { d: '2026.03.26', t: 'Mnet 엠카운트다운', s: '한국 음악방송 무대' },
  { d: '2026.07.25–26', t: '세종대 대양홀', s: '한국 단독 공연' },
  { d: '2026.08.25–26', t: '日本武道館', s: '첫 부도칸 (2주년)' },
  { d: '2026.09–11', t: '아레나 투어 CUTIE LAND', s: '7도시 13공연' },
  { d: '2026.12.31', t: '第77回 NHK紅白歌合戦', s: '첫 출장' },
]
</script>

<template>
  <div class="st">
    <header class="st-hero">
      <p class="eyebrow">LEGEND STAGES</p>
      <h1>레전드 무대</h1>
      <p class="lead">한국 음악방송부터 THE FIRST TAKE, 부도칸까지 — 큐스트의 명장면을 한곳에 모았어요.</p>
      <div class="chips" role="toolbar" aria-label="무대 종류">
        <button v-for="c in CATS" :key="c.id" type="button" :aria-pressed="cat === c.id" @click="cat = c.id">{{ c.label }}</button>
      </div>
    </header>

    <!-- NOW SHOWING -->
    <section id="stage-now" class="now" aria-label="지금 보는 무대">
      <div class="screen">
        <div class="spot" aria-hidden="true" />
        <YtLite :key="cur.id" :id="cur.id" :title="`${cur.show} — ${cur.song}`" />
      </div>
      <div class="now-info">
        <p class="now-tag">NOW SHOWING</p>
        <h2 :lang="jaLang(cur.song)">{{ cur.song }}</h2>
        <p class="now-show">{{ cur.show }}</p>
        <p class="now-note">{{ cur.note }}</p>
        <p class="now-meta"><span>📅 {{ cur.date }}</span><span>📺 <span :lang="jaLang(cur.ch)">{{ cur.ch }}</span></span></p>
        <a class="yt" :href="`https://www.youtube.com/watch?v=${cur.id}`" target="_blank" rel="noopener">YouTube에서 보기 ↗</a>
      </div>
    </section>

    <!-- GRID -->
    <h2 class="sr-only">무대 목록</h2>
    <TransitionGroup tag="div" name="card" class="grid">
      <button v-for="s in list" :key="s.id" type="button" class="card" :class="[s.cat, { on: cur.id === s.id }]" :aria-pressed="cur.id === s.id" @click="pick(s)">
        <span class="th"><img :src="`https://i.ytimg.com/vi/${s.id}/mqdefault.jpg`" alt="" loading="lazy" /><span class="play" aria-hidden="true">▶</span><b class="badge">{{ s.cat === 'kr' ? '🇰🇷 음악방송' : s.cat === 'special' ? '🎙️ 스페셜' : '🏟️ 라이브' }}</b></span>
        <span class="body"><small>{{ s.date }} · {{ s.show }}</small><strong :lang="jaLang(s.song)">{{ s.song }}</strong></span>
      </button>
    </TransitionGroup>

    <!-- MILESTONES -->
    <section class="ms" aria-labelledby="ms-h">
      <h2 id="ms-h">무대로 보는 큐스트 <span>주요 무대 연표</span></h2>
      <ol>
        <li v-for="(m, i) in MILESTONES" :key="m.d" :style="{ '--i': i }"><span class="d">{{ m.d }}</span><b>{{ m.t }}</b><small>{{ m.s }}</small></li>
      </ol>
      <p class="more"><a :href="withBase('/korea/')">🇰🇷 큐스트 in KOREA →</a><a :href="withBase('/videos/?cat=live')">🎬 라이브 영상 전체 →</a></p>
    </section>
  </div>
</template>

<style scoped>
.st { --ink: #2f1a35; --spring: cubic-bezier(.34, 1.56, .64, 1); color: var(--ink); }
.st-hero { padding: 26px 0 8px; }
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #c92f69; }
.st-hero h1 { margin: 4px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(38px, 6vw, 64px) !important; line-height: 1.05; letter-spacing: -0.02em; }
.lead { margin: 10px 0 0 !important; font-size: 16px; color: #4a3050; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
.chips button { padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; color: var(--ink); background: #fff; border: 1.5px solid #f1d4e1; transition: transform 0.4s var(--spring), background 0.2s; }
.chips button:hover { transform: translateY(-2px); }
.chips button[aria-pressed='true'] { background: var(--ink); color: #fff; border-color: var(--ink); }
/* NOW SHOWING — dark stage */
.now { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 0; margin-top: 22px; border-radius: 30px; overflow: hidden; background: #1c0f21; color: #fff; box-shadow: 0 30px 60px -36px rgba(42, 16, 48, 0.8); }
.screen { position: relative; padding: 18px; }
.spot { position: absolute; inset: -30% -10% auto; height: 120%; background: radial-gradient(45% 40% at 50% 0%, rgba(255, 140, 190, 0.35), transparent 70%); pointer-events: none; animation: sway 6s ease-in-out infinite; }
@keyframes sway { 50% { translate: 8% 0; } }
.screen :deep(.yt) { position: relative; margin: 0; border-radius: 18px; }
.now-info { display: flex; flex-direction: column; gap: 6px; padding: 26px 26px 26px 8px; justify-content: center; }
.now-tag { margin: 0 !important; font-size: 11px; font-weight: 900; letter-spacing: 0.24em; color: #ff8fbd; }
.now-info h2 { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(22px, 2.6vw, 30px) !important; line-height: 1.25; color: #fff; }
.now-show { margin: 0 !important; font-size: 15px; font-weight: 700; color: #ffd6e7; }
.now-note { margin: 4px 0 0 !important; font-size: 14px; color: #e9d9ee; line-height: 1.6; }
.now-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 6px 0 0 !important; font-size: 12.5px; color: #cdb8d3; }
.yt { align-self: flex-start; margin-top: 10px; padding: 9px 16px; border-radius: 999px; background: #fff; color: #2f1a35 !important; font-size: 13px; font-weight: 800; text-decoration: none !important; transition: transform 0.4s var(--spring); }
.yt:hover { transform: translateY(-2px); }
/* GRID */
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 22px; }
.card { display: flex; flex-direction: column; gap: 10px; padding: 10px 10px 14px; border-radius: 22px; background: #fff; border: 1.5px solid #f6e0ea; text-align: left; color: var(--ink); cursor: pointer; transition: transform 0.45s var(--spring), box-shadow 0.3s, border-color 0.2s; }
.card:hover { transform: translateY(-4px) rotate(-0.5deg); box-shadow: 0 20px 34px -24px rgba(90, 30, 70, 0.55); }
.card.on { border-color: #c92f69; box-shadow: 0 0 0 3px rgba(201, 47, 105, 0.18); }
.th { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #fbe9f1; }
.th img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease, filter 0.3s; }
.card:hover .th img { transform: scale(1.05); filter: brightness(0.85); }
.play { position: absolute; inset: 0; margin: auto; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; background: rgba(255, 255, 255, 0.92); color: #c92f69; font-size: 16px; opacity: 0; scale: 0.7; transition: opacity 0.2s, scale 0.4s var(--spring); }
.card:hover .play, .card:focus-visible .play { opacity: 1; scale: 1; }
.badge { position: absolute; left: 8px; top: 8px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 800; color: #fff; background: rgba(28, 15, 33, 0.82); }
.body { display: flex; flex-direction: column; gap: 3px; padding: 0 4px; }
.body small { font-size: 12px; color: #6a4f70; }
.body strong { font-size: 15.5px; line-height: 1.35; }
.card-move { transition: transform 0.5s var(--spring); }
.card-enter-active { transition: opacity 0.3s, transform 0.5s var(--spring); }
.card-enter-from { opacity: 0; transform: scale(0.9); }
.card-leave-active { display: none; }
/* MILESTONES */
.ms { margin-top: 40px; padding: 24px; border-radius: 28px; background: #fff; border: 1.5px solid #f3d6e4; }
.ms h2 { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 24px !important; }
.ms h2 span { font-size: 13px; font-weight: 700; color: #735779; margin-left: 6px; font-family: inherit; }
.ms ol { list-style: none; margin: 16px 0 0 !important; padding: 0 !important; display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px !important; }
.ms li { flex: 0 0 180px; margin: 0 !important; scroll-snap-align: start; display: flex; flex-direction: column; gap: 3px; padding: 14px; border-radius: 18px; background: linear-gradient(160deg, #fff6fa, #f6f0ff); border: 1.5px dashed #ecc3d6; }
.ms .d { font-size: 12px; font-weight: 800; color: #a33366; font-variant-numeric: tabular-nums; }
.ms b { font-size: 14.5px; line-height: 1.35; }
.ms small { font-size: 12.5px; color: #5a4060; }
.more { display: flex; gap: 16px; flex-wrap: wrap; justify-content: flex-end; margin: 14px 0 0 !important; font-size: 13px; font-weight: 700; }
.more a { color: #a33366 !important; }
@media (max-width: 900px) {
  .now { grid-template-columns: 1fr; }
  .now-info { padding: 4px 22px 24px; }
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .grid { grid-template-columns: 1fr; }
  .screen { padding: 12px; }
  .now { border-radius: 24px; }
  .ms { padding: 18px 14px; }
}
@media (prefers-reduced-motion: reduce) { .spot { animation: none; } .card, .chips button, .yt, .play, .th img { transition: none; } }
</style>
