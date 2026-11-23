<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { songById } from '../data/songs'
import SongList from './SongList.vue'

const props = defineProps<{ id: string }>()
const s = computed(() => songById[props.id])
const vi = ref(0)
const vid = computed(() => s.value.videos[vi.value])
</script>

<template>
  <article v-if="s" class="ss" :style="{ '--g1': s.grad[0], '--g2': s.grad[1], '--g3': s.grad[2] }">
    <!-- HERO: typographic cover + meta -->
    <header class="hero">
      <div class="cover" aria-hidden="true">
        <span class="cv-brand">CUTIE STREET</span>
        <span class="cv-title" lang="ja">{{ s.title }}</span>
        <span class="cv-disc" />
      </div>
      <div class="meta">
        <p class="eyebrow">SONG SPOTLIGHT</p>
        <h1 lang="ja">{{ s.title }}</h1>
        <p class="read">{{ s.read }} · <b>{{ s.meaning }}</b></p>
        <p class="tagline">{{ s.tagline }}</p>
        <ul class="badges"><li v-for="b in s.badges" :key="b">{{ b }}</li></ul>
        <dl class="facts">
          <div v-for="f in s.facts" :key="f.k"><dt>{{ f.k }}</dt><dd :lang="/[ぁ-んァ-ン一-龯]/.test(f.v) ? 'ja' : undefined">{{ f.v }}</dd></div>
        </dl>
      </div>
    </header>

    <!-- WATCH -->
    <section class="watch" aria-labelledby="w-h">
      <h2 id="w-h">영상으로 보기</h2>
      <div class="tabs" role="tablist" aria-label="영상 선택">
        <button v-for="(v, i) in s.videos" :key="v.id" type="button" role="tab" :aria-selected="i === vi" @click="vi = i">{{ v.label }}</button>
      </div>
      <div class="player"><YtLite :key="vid.id" :id="vid.id" :title="`${s.title} — ${vid.label}`" /></div>
    </section>

    <!-- STORY + QUIZ -->
    <div class="two">
      <section class="story" aria-labelledby="st-h">
        <h2 id="st-h">곡 이야기</h2>
        <p v-for="(p, i) in s.story" :key="i">{{ p }}</p>
        <p class="src"><Ico n="book" /> {{ s.id === 'kyu-ni-stop' ? '발매일: 공식 디스코그래피 · 작사·작곡: j-lyric (공식 상세 페이지엔 크레딧 미기재) · 차트: Wikipedia(일본어)' : s.id === 'kyuutai' ? '발매일: 공식 디스코그래피 · 크레딧: pocketmonsters.net 곡 DB / j-lyric (공식 상세 페이지엔 크레딧 미기재) · 차트: 오리콘 / Billboard JAPAN' : '크레딧·발매일: 공식 디스코그래피 · 차트: Wikipedia(일본어)' }}</p>
      </section>
      <section class="quiz" aria-labelledby="q-h">
        <h2 id="q-h">팬 퀴즈</h2>
        <Quiz :quiz-id="`disco-${s.id}`" :questions="s.quiz" />
      </section>
    </div>

    <!-- MORE -->
    <section class="more" aria-labelledby="m-h">
      <h2 id="m-h">다른 곡 이야기</h2>
      <SongList :exclude="s.id" />
      <p class="back"><a :href="withBase('/discography/')"><Ico n="disc" /> 디스코그래피 전체 →</a><a :href="withBase('/cutie-land/')">1st ALBUM CUTIE LAND →</a></p>
    </section>
  </article>
</template>

<style scoped>
.ss { --ink: #2f1a35; --spring: cubic-bezier(.34, 1.56, .64, 1); color: var(--ink); }
.hero { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 36px; align-items: center; padding: 26px 0 34px; }
.cover { position: relative; aspect-ratio: 1; border-radius: 30px; overflow: hidden; padding: 26px; display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(to top, rgba(42, 16, 48, 0.5), rgba(42, 16, 48, 0) 55%), radial-gradient(120% 120% at 0% 0%, var(--g1), transparent 60%), radial-gradient(120% 120% at 100% 100%, var(--g3), transparent 60%), var(--g2);
  box-shadow: 0 40px 70px -40px color-mix(in srgb, var(--g1) 70%, #2a1030); animation: pop 0.9s var(--spring) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.92) rotate(-2deg); } }
.cv-brand { position: relative; z-index: 1; font-size: 13px; font-weight: 900; letter-spacing: 0.24em; color: rgba(255, 255, 255, 0.92); }
.cv-title { position: relative; z-index: 1; font-family: 'Zen Maru Gothic', var(--cs-sans); font-weight: 900; font-size: clamp(30px, 4.4vw, 50px); line-height: 1.12; color: #fff; text-shadow: 0 4px 24px rgba(42, 16, 48, 0.25); word-break: normal; overflow-wrap: anywhere; max-width: 92%; }
.cv-disc { position: absolute; right: -18%; bottom: -18%; width: 70%; aspect-ratio: 1; border-radius: 50%;
  background: repeating-radial-gradient(circle, rgba(255, 255, 255, 0.18) 0 2px, transparent 2px 7px), radial-gradient(circle, #fff 0 9%, rgba(42, 16, 48, 0.55) 9.5% 30%, rgba(42, 16, 48, 0.35) 30% 100%);
  animation: spin 14s linear infinite; }
@keyframes spin { to { rotate: 360deg; } }
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #c92f69; }
.meta h1 { margin: 6px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', var(--cs-sans); font-size: clamp(26px, 3.4vw, 42px) !important; line-height: 1.2; word-break: normal; overflow-wrap: anywhere; }
.read { margin: 8px 0 0 !important; font-size: 15px; color: #5a4060; }
.read b { color: var(--ink); }
.tagline { margin: 4px 0 0 !important; font-size: 15px; color: #6a4f70; }
.badges { list-style: none; margin: 14px 0 0 !important; padding: 0 !important; display: flex; flex-wrap: wrap; gap: 6px; }
.badges li { margin: 0 !important; padding: 5px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 800; background: #fff; border: 1.5px solid color-mix(in srgb, var(--g1) 45%, white); color: color-mix(in srgb, var(--g1) min(45%, var(--ink-mix, 100%)), #2a1030); }
.facts { margin: 16px 0 0 !important; display: grid; gap: 0; border-top: 1.5px solid #f1dce7; }
.facts div { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 12px; padding: 10px 0; border-bottom: 1.5px solid #f6e8ef; }
.facts dt { font-size: 12.5px; font-weight: 800; color: #a33366; }
.facts dd { margin: 0; font-size: 14.5px; }
.watch, .story, .quiz, .more { margin-top: 10px; }
h2 { margin: 26px 0 12px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 24px !important; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tabs button { padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; color: var(--ink); background: #fff; border: 1.5px solid #f1d4e1; transition: transform 0.4s var(--spring); }
.tabs button:hover { transform: translateY(-2px); }
.tabs button[aria-selected='true'] { background: var(--ink); border-color: var(--ink); color: #fff; }
.player { margin-top: 12px; max-width: 860px; }
.player :deep(.yt) { margin: 0; border-radius: 22px; }
.two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
.story p { margin: 0 0 10px !important; font-size: 15.5px; line-height: 1.8; }
.story .src { font-size: 12px; color: #735779; }
.quiz :deep(.quiz-container) { margin: 0 !important; --mc: var(--g1); --ink-mix: 44%; }
.back { display: flex; gap: 16px; flex-wrap: wrap; justify-content: flex-end; margin: 14px 0 0 !important; font-size: 13px; font-weight: 700; }
.back a { color: #a33366 !important; }
@media (max-width: 860px) {
  .hero { grid-template-columns: minmax(0, 1fr); gap: 22px; }
  .cover { max-width: 420px; }
  .two { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .cover, .cv-disc { animation: none; } .tabs button { transition: none; } }
</style>
