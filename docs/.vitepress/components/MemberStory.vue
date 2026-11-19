<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { computed } from 'vue'
import { memberById } from '../data/members'
import { stories } from '../data/memberStories'
import { withBase } from 'vitepress'
import apRaw from '../data/appearances.json'
import { units } from '../data/units'
import { songs } from '../data/songs'

// Member page body: charm points, career path and fan quiz in the member's colour.
const props = defineProps<{ id: string }>()
const m = computed(() => memberById[props.id])
const st = computed(() => stories[props.id])
// units this member belongs to, with the unit song (song page when there is one)
const myUnits = computed(() => units.filter((u) => u.members.includes(props.id)).map((u) => ({ ...u, page: songs.find((x) => x.title === u.song)?.id, mates: u.members.filter((x) => x !== props.id) })))
// latest off-channel appearances featuring this member (by name in the title)
const groupN = (apRaw as { members: string[] }[]).filter((a) => !a.members.length).length
const aps = computed(() => (apRaw as { id: string; title: string; ch: string; date: string; members: string[] }[]).filter((a) => a.members.includes(props.id)))
// tiny **bold** renderer (content is ours)
const segs = (t: string) => t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((x) => (x.startsWith('**') ? { b: true, t: x.slice(2, -2) } : { b: false, t: x }))
</script>

<template>
  <div v-if="m && st" class="ms" :style="{ '--mc': m.color }">
    <!-- CHARM -->
    <section class="charm" aria-labelledby="ch-h">
      <header class="sh"><span class="no">01</span><h2 id="ch-h">매력 포인트</h2><span class="em" aria-hidden="true"><Ico n="sparkle" duo size="22" /></span></header>
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
      <p class="src"><Ico n="news" size="14" /> 출처: <a href="https://www.ticket.co.jp/entx/?p=5758" target="_blank" rel="noopener">ticket.co.jp 멤버 프로필</a> · <a href="https://ja.wikipedia.org/wiki/CUTIE_STREET" target="_blank" rel="noopener">Wikipedia(일본어)</a> · <a href="https://ciatr.jp/topics/336201" target="_blank" rel="noopener">ciatr</a></p>
    </section>

    <!-- UNITS -->
    <section v-if="myUnits.length" class="mu" aria-labelledby="mu-h">
      <header class="sh"><span class="no"><Ico n="hearts" duo size="18" /></span><h2 id="mu-h">유닛</h2></header>
      <div class="mu-row">
        <div v-for="u in myUnits" :key="u.id" class="mu-card">
          <b lang="ja">{{ u.ja }}</b>
          <span class="mu-mates">with <template v-for="(id, i) in u.mates" :key="id"><a :href="withBase(`/members/${id}`)" :style="{ '--c': memberById[id].color }">{{ memberById[id].ko.split(' ')[1] }}</a><template v-if="i < u.mates.length - 1"> · </template></template></span>
          <a v-if="u.song" class="mu-song" :href="withBase(u.page ? `/discography/${u.page}` : '/units/')"><span lang="ja"><Ico n="music" duo size="14" /> {{ u.song }}</span><small>{{ u.page ? '곡 이야기 →' : '유닛 페이지 →' }}</small></a>
        </div>
      </div>
    </section>

    <!-- APPEARANCES -->
    <section v-if="aps.length" class="aps" aria-labelledby="ap-h">
      <header class="sh"><span class="no">03</span><h2 id="ap-h">다른 채널 출연</h2><span class="em" aria-hidden="true"><Ico n="tv" duo size="22" /></span></header>
      <div class="ap-row">
        <a v-for="a in aps.slice(0, 4)" :key="a.id" class="ap" :href="`https://www.youtube.com/watch?v=${a.id}`" target="_blank" rel="noopener">
          <img :src="`https://i.ytimg.com/vi/${a.id}/mqdefault.jpg`" alt="" loading="lazy" width="320" height="180" />
          <b :lang="jaLang(a.title)">{{ a.title }}</b><small>{{ a.ch }} · {{ a.date.replace(/-/g, '.') }}</small>
        </a>
      </div>
      <a class="ap-more" :href="withBase(`/appearances/?m=${m.id}`)">{{ m.ko.split(' ')[1] }} 출연 {{ aps.length }}편 + 그룹 출연 {{ groupN }}편 모두 보기 →</a>
    </section>

    <!-- QUIZ -->
    <section class="quiz" aria-labelledby="qz-h">
      <header class="sh"><span class="no">{{ aps.length ? '04' : '03' }}</span><h2 id="qz-h">{{ m.ko.split(' ')[1] }} 팬 퀴즈</h2><span class="em" aria-hidden="true"><Ico n="heart" duo size="22" /></span></header>
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
.em { display: inline-flex; font-size: 22px; color: var(--mc-deep, #c92f69); --ico-fill: var(--mc-soft, #ffd3e4); }
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
.mu-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.mu-card { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 20px; background: #fff; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--mc) 26%, white); }
.mu-card b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 17px; }
.mu-mates { font-size: 13px; color: #5a4060; }
.mu-mates a { font-weight: 800; color: color-mix(in srgb, var(--c) 45%, #2a1030) !important; text-decoration: none !important; }
.mu-song { margin-top: auto; display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 8px 12px; border-radius: 14px; background: color-mix(in srgb, var(--mc) 10%, white); color: #2f1a35 !important; text-decoration: none !important; font-size: 14px; font-weight: 700; }
.mu-song small { flex: none; font-size: 12px; color: var(--deep); }
.ap-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ap { display: flex; flex-direction: column; gap: 6px; border-radius: 18px; overflow: hidden; padding-bottom: 12px; background: #fff; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--mc) 24%, white); text-decoration: none !important; color: var(--ink) !important; transition: transform 0.45s var(--spring); }
.ap:hover { transform: translateY(-3px) rotate(-0.5deg); }
.ap img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.ap b { padding: 0 12px; font-size: 13.5px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.ap small { padding: 0 12px; font-size: 12px; color: #6a4f70; }
.ap-more { display: inline-block; margin-top: 12px; padding: 9px 16px; border-radius: 999px; font-size: 13.5px; font-weight: 800; background: var(--deep); color: #fff !important; text-decoration: none !important; }
.quiz :deep(.quiz-container) { margin: 0 !important; max-width: 680px; }
@media (max-width: 760px) {
  .path { grid-auto-flow: row; gap: 14px; padding-left: 28px !important; }
  .path::before { left: 7px; right: auto; top: 6px; bottom: 6px; width: 3px; height: auto; background: linear-gradient(180deg, color-mix(in srgb, var(--mc) 25%, white), var(--mc)); }
  .path li { padding: 0; }
  .path li::before { left: -28px; top: 2px; }
  .lead { padding: 22px 18px 20px 46px !important; font-size: 16px; }
  .q { left: 10px; font-size: 56px; }
  .ap-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (prefers-reduced-motion: reduce) { .paras p, .path li { animation: none; } .ap { transition: none; } }
</style>
