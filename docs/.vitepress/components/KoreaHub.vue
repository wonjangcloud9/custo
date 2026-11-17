<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import koreaVideos from '../data/korea-videos.json'
import { events } from '../data/events'

// Everything here is sourced from official uploads/pages (see loop/ROADMAP.md research notes, #101).

const korea = events.find((e) => e.ja.includes('Live in Korea'))!
const now = ref<number | null>(null)
onMounted(() => { now.value = Date.now() })
const days = computed(() => (now.value === null ? null : Math.ceil((new Date(`${korea.date}T00:00:00+09:00`).getTime() - now.value) / 86400000)))

const SONGS = [
  { ko: '귀엽기만 하면 안 되나요?', ja: 'かわいいだけじゃだめですか？', date: '2026.04.10', mv: 'sB1Mr-eXR3c' },
  { ko: '프리큐큐', ja: 'ぷりきゅきゅ', date: '2026.06.06', mv: 'xF8hmrm6DaA' },
  { ko: '큐스토의 노래', ja: 'きゅーすとのうた', date: '2026.07.26', mv: '' },
  { ko: '동글동글 동글이', ja: 'キュートなキューたい', date: '2026.10.21', mv: 'J7osyzGsxZs', note: 'JEI 재능TV 『포켓몬스터』 엔딩 (11/3~)' },
]
const TIMELINE = [
  { d: '2025.11.15', t: '『WONDERLIVET 2025』 출연', p: 'KINTEX HALL 7·8·10', v: 'ooHpGc-pTSs' },
  { d: '2026.03.26', t: 'Mnet 「M COUNTDOWN」 출연', p: '한국어 버전 「귀엽기만 하면 안 되나요?」', v: 'aanKhmeCl-s' },
  { d: '2026.03.28–29', t: 'CUTIE STREET in KOREA', p: 'YES24 WANDERLOCH HALL', v: 'zlj9Ec3h6qI' },
  { d: '2026.07.25–26', t: '한국 단독 공연', p: '세종대학교 대양홀', v: 'Jyd_CyxbDeA' },
  { d: '2026.10.21', t: '「동글동글 동글이」 — 포켓몬 첫 한일 W 엔딩', p: 'JEI 재능TV 11/3~', v: 'J7osyzGsxZs' },
  { d: '2027.01.23', t: 'CUTIE STREET Live in Korea 2027 WINTER', p: 'KINTEX Hall 9A · 시간·티켓 추후 공지', v: '' },
]
const krVideos = koreaVideos as { id: string; title: string }[] // pre-filtered by loop/build_videos.py
const shown = ref(8)
const clean = (t: string) => t.replace(/【CUTIE STREET】/g, '').trim()
const watch = (id: string) => `https://www.youtube.com/watch?v=${id}`
</script>

<template>
  <div class="kh">
    <a class="kh-hero" :href="korea.url" target="_blank" rel="noopener">
      <span class="kh-flag" aria-hidden="true">🇰🇷</span>
      <span class="kh-txt"><small>NEXT IN KOREA</small><b>{{ korea.ja }}</b><span>{{ korea.date.replace(/-/g, '.') }} (토) · {{ korea.venue }} · 시간·티켓 추후 공지</span></span>
      <span class="kh-dd">{{ days === null ? '' : days > 0 ? 'D-' + days : days === 0 ? 'TODAY' : 'THANK YOU' }}</span>
    </a>

    <h2 id="songs">한국어 버전 곡 🎤</h2>
    <div class="songs">
      <article v-for="s in SONGS" :key="s.ko" class="song">
        <YtLite v-if="s.mv" :id="s.mv" :title="`${s.ko} MV`" />
        <div v-else class="nomv" aria-hidden="true">🎶</div>
        <b>{{ s.ko }}</b><small lang="ja">{{ s.ja }} · {{ s.date }}</small>
        <em v-if="s.note">{{ s.note }}</em>
      </article>
    </div>

    <h2 id="history">한국 활동 기록 🗺️</h2>
    <ol class="tl">
      <li v-for="(x, i) in TIMELINE" :key="x.d" :style="{ '--i': i }" :class="{ next: !x.v }">
        <span class="tl-d">{{ x.d }}</span>
        <span class="tl-b"><b>{{ x.t }}</b><small>{{ x.p }}</small></span>
        <a v-if="x.v" class="tl-v" :href="watch(x.v)" target="_blank" rel="noopener" :aria-label="`${x.t} 영상`">▶</a>
      </li>
    </ol>

    <h2 id="videos">한국 관련 영상 {{ krVideos.length }}편 📺</h2>
    <div class="vids">
      <a v-for="v in krVideos.slice(0, shown)" :key="v.id" class="vid" :href="watch(v.id)" target="_blank" rel="noopener">
        <img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" decoding="async" />
        <span>{{ clean(v.title) }}</span>
      </a>
    </div>
    <div class="more-row">
      <button v-if="shown < krVideos.length" type="button" class="more" @click="shown += 8">더 보기 ({{ krVideos.length - shown }})</button>
      <a class="arch" :href="withBase('/videos/?q=韓国')">영상 아카이브에서 보기 →</a>
    </div>
  </div>
</template>

<style scoped>
.kh { color: #3a2340; }
.kh-hero { display: flex; align-items: center; gap: 16px; margin: 8px 0 8px; padding: 22px 24px; border-radius: 28px; text-decoration: none !important; color: #3a2340 !important;
  background: radial-gradient(120% 140% at 0% 0%, #ffe3ee 0%, transparent 55%), radial-gradient(120% 140% at 100% 100%, #e3ecff 0%, transparent 55%), #fff; border: 1.5px solid #f1d4e1; transition: transform 0.5s cubic-bezier(.34, 1.56, .64, 1); }
.kh-hero:hover { transform: translateY(-3px) rotate(-0.4deg); }
.kh-flag { font-size: 44px; line-height: 1; animation: wave 2.6s ease-in-out infinite; transform-origin: 20% 90%; }
@keyframes wave { 0%, 60%, 100% { rotate: 0deg; } 20% { rotate: -10deg; } 40% { rotate: 8deg; } }
.kh-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kh-txt small { font-size: 11.5px; font-weight: 800; letter-spacing: 0.12em; color: #c92f69; }
.kh-txt b { font-size: clamp(17px, 2.4vw, 22px); font-family: 'Zen Maru Gothic', sans-serif; }
.kh-txt span { font-size: 13px; color: #5a4060; }
.kh-dd { margin-left: auto; flex: none; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(26px, 4vw, 38px); font-weight: 700; color: #2b5ea8; }
.songs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.song { display: flex; flex-direction: column; gap: 2px; }
.song :deep(.yt) { margin: 0 0 8px; }
.nomv { aspect-ratio: 16 / 9; border-radius: 18px; display: grid; place-items: center; font-size: 40px; background: linear-gradient(135deg, #fff0f6, #eef3ff); margin-bottom: 8px; }
.song b { font-size: 16px; }
.song small { font-size: 12.5px; color: #735779; }
.song em { font-style: normal; font-size: 12px; font-weight: 700; color: #2b5ea8; }
.tl { list-style: none; margin: 12px 0 0 !important; padding: 0 0 0 18px !important; border-left: 2px dashed #f1c9db; display: grid; gap: 10px; }
.tl li { position: relative; margin: 0 !important; display: grid; grid-template-columns: 112px 1fr auto; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 18px; background: #fff; border: 1.5px solid #f6e0ea;
  animation: pop-in both linear; animation-timeline: view(); animation-range: entry 0% entry 60%; }
@keyframes pop-in { from { opacity: 0; translate: 16px 0; } to { opacity: 1; translate: 0 0; } }
.tl li::before { content: ''; position: absolute; left: -26px; top: 50%; width: 12px; height: 12px; margin-top: -6px; border-radius: 50%; background: #ff6b9d; box-shadow: 0 0 0 3px #fff; }
.tl li:nth-child(even)::before { background: #4a90d9; }
.tl li.next { background: linear-gradient(110deg, #fff4f8, #eef4ff); border-style: dashed; }
.tl-d { font-size: 12.5px; font-weight: 800; font-variant-numeric: tabular-nums; color: #735779; }
.tl-b { display: flex; flex-direction: column; min-width: 0; }
.tl-b b { font-size: 14.5px; }
.tl-b small { font-size: 12.5px; color: #735779; }
.tl-v { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: #3a2340; color: #fff !important; text-decoration: none !important; font-size: 12px; }
.vids { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.vid { display: flex; flex-direction: column; gap: 6px; text-decoration: none !important; color: #3a2340 !important; font-size: 12.5px; font-weight: 600; line-height: 1.35; }
.vid img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 14px; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.vid:hover img { transform: translateY(-3px); }
.vid span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.more-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
.more { padding: 10px 18px; border-radius: 999px; background: #3a2340; color: #fff; font-weight: 700; font-size: 13px; }
.arch { margin-left: auto; font-size: 13px; font-weight: 700; color: #a33366 !important; }
@media (max-width: 760px) {
  .songs { grid-template-columns: 1fr; }
  .vids { grid-template-columns: repeat(2, 1fr); }
  .tl li { grid-template-columns: 1fr auto; }
  .tl-d { grid-column: 1 / -1; }
  .kh-hero { padding: 18px; gap: 12px; }
  .kh-flag { font-size: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  .kh-flag { animation: none; }
  .tl li { animation: none; }
  .kh-hero, .vid img { transition: none; }
}
</style>
