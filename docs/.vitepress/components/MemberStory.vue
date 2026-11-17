<script setup lang="ts">
import { computed } from 'vue'
import { memberById } from '../data/members'
import { stories } from '../data/memberStories'

// Member page body: charm points, career path and fan quiz in the member's colour.
const props = defineProps<{ id: string }>()
const m = computed(() => memberById[props.id])
const st = computed(() => stories[props.id])
// tiny **bold** renderer (content is ours)
const segs = (t: string) => t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((x) => (x.startsWith('**') ? { b: true, t: x.slice(2, -2) } : { b: false, t: x }))
</script>

<template>
  <div v-if="m && st" class="ms" :style="{ '--mc': m.color }">
    <!-- CHARM -->
    <section class="charm" aria-labelledby="ch-h">
      <header class="sh"><span class="no">01</span><h2 id="ch-h">매력 포인트</h2><span class="em" aria-hidden="true">{{ m.emoji }}</span></header>
      <blockquote class="lead"><span class="q" aria-hidden="true">“</span>
        <template v-for="(s, i) in segs(st.charm[0])" :key="i"><mark v-if="s.b">{{ s.t }}</mark><template v-else>{{ s.t }}</template></template>
      </blockquote>
      <div class="paras">
        <p v-for="(p, pi) in st.charm.slice(1)" :key="pi" :style="{ '--i': pi }">
          <template v-for="(s, i) in segs(p)" :key="i"><mark v-if="s.b">{{ s.t }}</mark><template v-else>{{ s.t }}</template></template>
        </p>
      </div>
    </section>

    <!-- CAREER -->
    <section class="career" aria-labelledby="ca-h">
      <header class="sh"><span class="no">02</span><h2 id="ca-h">활동 이력</h2></header>
      <ol class="path">
        <li v-for="(r, i) in st.career" :key="i" :class="{ now: i === st.career.length - 1 }" :style="{ '--i': i }">
          <span class="when">{{ r[0] }}</span><span class="what">{{ r[1] }}</span>
        </li>
      </ol>
      <p class="src">📚 출처: <a href="https://www.ticket.co.jp/entx/?p=5758" target="_blank" rel="noopener">ticket.co.jp 멤버 프로필</a> · <a href="https://ja.wikipedia.org/wiki/CUTIE_STREET" target="_blank" rel="noopener">Wikipedia(일본어)</a> · <a href="https://ciatr.jp/topics/336201" target="_blank" rel="noopener">ciatr</a></p>
    </section>

    <!-- QUIZ -->
    <section class="quiz" aria-labelledby="qz-h">
      <header class="sh"><span class="no">03</span><h2 id="qz-h">{{ m.ko.split(' ')[1] }} 팬 퀴즈</h2><span class="em" aria-hidden="true">💖</span></header>
      <Quiz :quiz-id="`member-${m.id}`" :questions="st.quiz" />
    </section>
  </div>
</template>

<style scoped>
.ms { --ink: #2f1a35; --deep: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); --spring: cubic-bezier(.34, 1.56, .64, 1); color: var(--ink); margin-top: 18px; }
section { margin-top: 34px; }
.sh { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
.no { font-family: 'Zen Maru Gothic', sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 0.1em; color: var(--deep); }
.sh h2 { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 26px !important; line-height: 1.2; }
.em { font-size: 22px; }
/* charm */
.lead { position: relative; margin: 0 !important; padding: 26px 28px 24px 64px !important; border: 0 !important; border-radius: 26px; font-size: 18px; line-height: 1.85; font-weight: 600; color: var(--ink);
  background: radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--mc) 22%, white), transparent 60%), #fff; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--mc) 30%, white); }
.q { position: absolute; left: 18px; top: 4px; font-family: Georgia, serif; font-size: 72px; line-height: 1; color: color-mix(in srgb, var(--mc) 70%, white); }
mark { background: linear-gradient(transparent 58%, color-mix(in srgb, var(--mc) 38%, transparent) 58%); color: inherit; font-weight: 800; padding: 0 2px; }
.paras { display: grid; gap: 12px; margin-top: 12px; }
.paras p { margin: 0 !important; padding: 18px 22px; border-radius: 22px; background: #fff; border: 1.5px solid color-mix(in srgb, var(--mc) 22%, white); font-size: 15.5px; line-height: 1.85;
  animation: rise both linear; animation-timeline: view(); animation-range: entry 0% entry 55%; }
@keyframes rise { from { opacity: 0; translate: 0 18px; } }
/* career path */
.path { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 0; position: relative; }
.path::before { content: ''; position: absolute; left: 0; right: 0; top: 13px; height: 3px; border-radius: 3px; background: linear-gradient(90deg, color-mix(in srgb, var(--mc) 25%, white), var(--mc)); }
.path li { position: relative; margin: 0 !important; padding: 34px 10px 0 0; display: flex; flex-direction: column; gap: 6px; animation: rise both linear; animation-timeline: view(); animation-range: entry 0% entry 60%; }
.path li::before { content: ''; position: absolute; left: 0; top: 6px; width: 17px; height: 17px; border-radius: 50%; background: #fff; border: 3px solid var(--mc); box-sizing: border-box; }
.path li.now::before { background: var(--mc); box-shadow: 0 0 0 5px color-mix(in srgb, var(--mc) 25%, transparent); }
.when { font-size: 12.5px; font-weight: 800; color: var(--deep); }
.what { font-size: 14.5px; line-height: 1.55; font-weight: 600; }
.now .what { padding: 8px 12px; border-radius: 14px; background: var(--deep); color: #fff; align-self: flex-start; }
.src { margin: 16px 0 0 !important; font-size: 12.5px; color: #735779; }
.src a { color: var(--deep) !important; }
.quiz :deep(.quiz-container) { margin: 0 !important; max-width: 680px; }
@media (max-width: 760px) {
  .path { grid-auto-flow: row; gap: 14px; padding-left: 28px !important; }
  .path::before { left: 7px; right: auto; top: 6px; bottom: 6px; width: 3px; height: auto; background: linear-gradient(180deg, color-mix(in srgb, var(--mc) 25%, white), var(--mc)); }
  .path li { padding: 0; }
  .path li::before { left: -28px; top: 2px; }
  .lead { padding: 22px 18px 20px 46px !important; font-size: 16px; }
  .q { left: 10px; font-size: 56px; }
}
@media (prefers-reduced-motion: reduce) { .paras p, .path li { animation: none; } }
</style>
