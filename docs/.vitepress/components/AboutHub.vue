<script setup lang="ts">
import { withBase } from 'vitepress'
import { members } from '../data/members'

// Group introduction — every fact below comes from the official site / Wikipedia JA (see loop/ROADMAP.md).
const FACTS = [
  { k: '그룹명', v: 'CUTIE STREET', sub: 'キューティーストリート' },
  { k: '애칭', v: '큐스트', sub: 'きゅーすと' },
  { k: '데뷔', v: '2024.08.04', sub: 'TOKYO IDOL FESTIVAL 2024' },
  { k: '멤버', v: '8명', sub: '멤버마다 고유 컬러' },
  { k: '소속', v: 'ASOBISYSTEM', sub: 'KAWAII LAB.' },
  { k: '프로듀서', v: '木村ミサ', sub: 'KAWAII LAB. 총괄 프로듀서' },
  { k: '컨셉', v: 'KAWAII MAKER', sub: '하라주쿠에서 세계로 KAWAII를' },
  { k: '데뷔곡', v: 'かわいいだけじゃだめですか？', sub: '2024.09.09 디지털' },
]
const LINKS = [
  { t: '공식 사이트', h: 'https://cutiestreet.asobisystem.com/', i: 'home' },
  { t: 'X', h: 'https://x.com/CUTIE_STREET_', i: '𝕏' },
  { t: 'Instagram', h: 'https://www.instagram.com/cutie_street_/', i: 'camera' },
  { t: 'YouTube', h: 'https://www.youtube.com/@CUTIE_STREET', i: 'play' },
  { t: 'TikTok', h: 'https://www.tiktok.com/@cutie_street', i: 'music' },
]
type T = { d: string; t: string; s?: string; i: string; key?: boolean; link?: string }
const YEARS: { y: string; items: T[] }[] = [
  { y: '2024', items: [
    { d: '07.30', t: '멤버·그룹명 공개', i: 'sparkle' },
    { d: '08.04', t: 'TOKYO IDOL FESTIVAL 2024에서 데뷔', i: 'mic', key: true },
    { d: '09.09', t: '데뷔곡 「かわいいだけじゃだめですか？」', s: '디지털 릴리즈', i: 'music', link: '/discography/kawaii-dake' },
    { d: '11.13', t: '1st 싱글 CD 발매', s: '「かわいいだけじゃだめですか？」', i: 'disc' },
    { d: '12.27', t: '뮤직스테이션 SUPER LIVE 2024 출연', i: 'tv' },
  ] },
  { y: '2025', items: [
    { d: '02.02', t: '첫 원맨 라이브 「CROSS STREET」', s: '豊洲PIT', i: 'ticket' },
    { d: '07.23', t: '2nd 싱글 CD', s: '「キューにストップできません！ / ちきゅーめいくあっぷ計画」', i: 'disc' },
    { d: '08–10', t: '첫 전국 투어 「CAN\'T STOP CUTIE」', s: '파이널 ぴあアリーナMM', i: 'bus' },
    { d: '11.21', t: '제67회 일본 레코드대상 신인상', i: 'trophy', key: true },
  ] },
  { y: '2026', items: [
    { d: '03.26', t: '한국 Mnet 「M COUNTDOWN」 출연', i: 'tv', link: '/korea/' },
    { d: '05.27', t: '3rd 싱글 「キュートなキューたい / ナイスだね」', s: '오리콘 주간 싱글·합산 싱글 첫 1위 · 애니 『포켓몬스터』 엔딩', i: 'medal', key: true },
    { d: '08.25–26', t: '첫 日本武道館 공연', s: '데뷔 2주년', i: 'castle', key: true },
    { d: '09–11', t: '첫 아레나 투어 「CUTIE LAND」', s: '7도시 13공연', i: 'ferris', link: '/cutie-land/' },
    { d: '10.21', t: '한국어 버전 「동글동글 동글이」', s: '포켓몬 애니 첫 한일 W 엔딩', i: 'heart', link: '/korea/' },
    { d: '11.21', t: '제68회 일본 레코드대상 특별국제음악상', s: '신인상에 이어 2년 연속 수상', i: 'trophy', key: true },
    { d: '12.02', t: '1st 앨범 「CUTIE LAND」', i: 'disc', link: '/cutie-land/' },
    { d: '12.31', t: '제77회 NHK 홍백가합전 첫 출장', i: 'firework', key: true, link: '/kohaku/' },
  ] },
  { y: '2027', items: [
    { d: '01.23', t: 'CUTIE STREET Live in Korea 2027 WINTER', s: '킨텍스 Hall 9A', i: 'tv', link: '/korea/' },
  ] },
]
const AWARDS = [
  { t: '일본 레코드대상', s: '제67회 신인상 · 제68회 특별국제음악상', y: '2025 · 2026', big: true },
  { t: 'MTV', s: 'Breakthrough Song 2025', y: '2025' },
  { t: 'Yahoo! 검색대상', s: '곡 부문 「かわいいだけじゃだめですか？」', y: '2025' },
  { t: 'TikTok 상반기 트렌드 대상', s: '음악 부문', y: '2025' },
  { t: '일본 골드디스크 대상', s: '제40회 베스트 5 뉴 아티스트 (방화)', y: '2026' },
  { t: 'ASIA STAR ENTERTAINER AWARDS', s: '「THE PLATINUM」「HOT ICON」', y: '2026' },
]
const WORDS = ['CUTIE', 'STREET']
const QUIZ = [
  { q: '큐티스트리트의 소속사는?', options: ['SM', 'HYBE', 'ASOBISYSTEM', 'JYP'], answer: 2 },
  { q: '큐티스트리트가 데뷔한 무대는?', options: ['M COUNTDOWN', 'TOKYO IDOL FESTIVAL 2024', '日本武道館', 'THE FIRST TAKE'], answer: 1 },
  { q: '2025년 일본 레코드대상에서 받은 상은?', options: ['대상', '최우수 신인상', '신인상', '작곡상'], answer: 2 },
  { q: '멤버는 총 몇 명?', options: ['6명', '7명', '8명', '9명'], answer: 2 },
  { q: '2026년 부도칸 공연은 몇 주년 기념?', options: ['1주년', '2주년', '3주년', '5주년'], answer: 1 },
  { q: '큐티스트리트의 애칭은?', options: ['큐티', '큐스트', 'CS', '스트릿'], answer: 1 }
]

</script>

<template>
  <div class="ab">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-txt">
        <p class="eyebrow">ABOUT · KAWAII LAB.</p>
        <h1 class="wordmark" aria-label="CUTIE STREET란?">
          <span v-for="(w, wi) in WORDS" :key="w" class="word" aria-hidden="true"><span v-for="(ch, i) in w.split('')" :key="i" :style="{ '--c': members[(wi * 5 + i) % 8].color, '--i': wi * 5 + i }">{{ ch }}</span></span>
        </h1>
        <p class="kana" lang="ja">キューティーストリート · きゅーすと</p>
        <p class="lead">하라주쿠에서 세계로 <b>KAWAII</b>를 발신하는 8인조, <b>큐티스트리트</b>.<br />데뷔 2년 만에 <span lang="ja">日本武道館</span>과 <span lang="ja">紅白</span>까지 — <span class="motto" lang="ja">かわいいで、世界へ。</span></p>
        <nav class="links" aria-label="공식 채널">
          <a v-for="l in LINKS" :key="l.t" :href="l.h" target="_blank" rel="noopener"><span v-if="l.i.length > 2" class="li-ico" aria-hidden="true"><Ico :n="l.i" duo /></span><span v-else aria-hidden="true">{{ l.i }}</span>{{ l.t }}</a>
        </nav>
      </div>
      <nav class="palette" aria-label="멤버 컬러">
        <a v-for="(m, i) in members" :key="m.id" :href="withBase(`/members/${m.id}`)" class="sw" :style="{ '--mc': m.color, '--i': i }" :aria-label="`${m.ko} — ${m.colorName}`">
          <b aria-hidden="true">{{ m.ja.slice(-2, -1) }}</b><span>{{ m.ko.split(' ')[1] }}</span><small>{{ m.colorName }}</small>
        </a>
      </nav>
    </section>

    <!-- 01 PROFILE -->
    <section class="sec">
      <header class="sec-l"><span class="no">01</span><h2>프로필</h2><p>그룹 기본 정보</p></header>
      <div class="facts">
        <div v-for="f in FACTS" :key="f.k" class="fact"><small>{{ f.k }}</small><b><JaText :t="f.v" /></b><span><JaText :t="f.sub" /></span></div>
      </div>
    </section>

    <!-- 02 HISTORY -->
    <section class="sec">
      <header class="sec-l"><span class="no">02</span><h2>활동 연혁</h2><p>데뷔부터 紅白, 그리고 한국까지 · <a :href="withBase('/journey/')">3D로 보기 →</a> · <a :href="withBase('/world/')"><Ico n="globe" duo /> 월드맵 →</a></p></header>
      <div class="years">
        <div v-for="y in YEARS" :key="y.y" class="year">
          <div class="y-num">{{ y.y }}</div>
          <ol class="y-list">
            <li v-for="it in y.items" :key="it.d + it.t" :class="{ key: it.key }">
              <span class="ic" aria-hidden="true"><Ico :n="it.i" duo size="20" /></span>
              <span class="when">{{ it.d }}</span>
              <span class="what">
                <component :is="it.link ? 'a' : 'span'" :href="it.link ? withBase(it.link) : undefined" class="tt"><JaText :t="it.t" /><template v-if="it.link"> →</template></component>
                <small v-if="it.s"><JaText :t="it.s" /></small>
              </span>
              <i v-if="it.key" class="star" aria-label="주요 이정표">★</i>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- 03 AWARDS -->
    <section class="sec">
      <header class="sec-l"><span class="no">03</span><h2>수상</h2><p>신인상부터 차트까지</p></header>
      <div class="awards">
        <div v-for="(a, i) in AWARDS" :key="a.t" class="aw" :class="{ big: a.big }" :style="{ '--i': i }">
          <span class="cup" aria-hidden="true"><Ico n="trophy" duo size="26" /></span><small>{{ a.y }}</small><b><JaText :t="a.t" /></b><span><JaText :t="a.s" /></span>
        </div>
      </div>
    </section>

    <!-- 05 QUIZ -->
    <section class="sec">
      <header class="sec-l"><span class="no">04</span><h2>팬 퀴즈</h2><p>큐스트, 얼마나 알고 있나요? ♡</p></header>
      <div class="sec-r quiz"><Quiz quiz-id="about" :questions="QUIZ" /></div>
    </section>

    <p class="src"><Ico n="book" duo /> 출처: <a href="https://cutiestreet.asobisystem.com/" target="_blank" rel="noopener">CUTIE STREET 공식 사이트</a> · <a href="https://ja.wikipedia.org/wiki/CUTIE_STREET" target="_blank" rel="noopener">Wikipedia(일본어)</a> 등 공식·주요 매체에서 확인한 정보만 담았어요.</p>
  </div>
</template>

<style scoped>
.ab { --ink: #2f1a35; color: var(--ink); --spring: cubic-bezier(.34, 1.56, .64, 1); }
/* HERO */
.hero { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 36px; align-items: center; padding: 30px 0 46px; border-bottom: 1.5px solid #f1dce7; }
.eyebrow { margin: 0 0 6px !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #c92f69; }
.wordmark { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 900; font-size: clamp(52px, 8.4vw, 104px) !important; line-height: 0.95 !important; letter-spacing: -0.03em; }
.wordmark span { display: inline-block; color: var(--ink); animation: drop 0.9s var(--spring) both; animation-delay: calc(var(--i) * 45ms); transition: color 0.25s, translate 0.35s var(--spring); }
.wordmark span:hover { color: color-mix(in srgb, var(--c) min(70%, var(--ink-mix, 100%)), #2a1030); translate: 0 -6px; }
.wordmark .word { display: block; white-space: nowrap; }
.wordmark .word:last-child { padding-left: 0.5em; }
@keyframes drop { from { opacity: 0; translate: 0 -0.4em; rotate: -8deg; } }
.kana { margin: 10px 0 0 !important; font-size: 14px; font-weight: 700; color: #735779; letter-spacing: 0.04em; }
.lead { margin: 18px 0 0 !important; font-size: 17px; line-height: 1.8; color: #4a3050; }
.lead b { color: var(--ink); }
.motto { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; color: #c92f69; white-space: nowrap; }
.links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.links a { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: #fff; border: 1.5px solid #f1d4e1; font-size: 13.5px; font-weight: 700; color: var(--ink) !important; text-decoration: none !important; transition: transform 0.4s var(--spring), background 0.2s; }
.links a:hover { transform: translateY(-2px); background: #fff2f8; }
.palette { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.sw { position: relative; aspect-ratio: 3 / 4; border-radius: 22px; padding: 12px; display: flex; flex-direction: column; justify-content: flex-end; gap: 1px; overflow: hidden; text-decoration: none !important;
  color: #fff !important; background: linear-gradient(to top, rgba(42, 16, 48, 0.78), rgba(42, 16, 48, 0) 64%), linear-gradient(160deg, var(--mc), color-mix(in srgb, var(--mc) min(70%, var(--ink-mix, 100%)), #2a1030)); /* scrim under the white name */
  box-shadow: 0 14px 26px -18px var(--mc); animation: tile 0.8s var(--spring) both; animation-delay: calc(240ms + var(--i) * 55ms); transition: transform 0.45s var(--spring); }
.sw:nth-child(odd) { transform: translateY(14px); }
.sw:hover { transform: translateY(-4px) rotate(-2deg) scale(1.03); }
@keyframes tile { from { opacity: 0; scale: 0.7; } }
.sw b { position: absolute; top: 8px; right: 12px; font-family: 'Zen Maru Gothic', sans-serif; font-size: 40px; line-height: 1; opacity: 0.35; }
.sw span { font-size: 15px; font-weight: 800; text-shadow: 0 1px 6px rgba(42, 16, 48, 0.35); }
.sw small { font-size: 11px; font-weight: 700; opacity: 0.92; text-shadow: 0 1px 6px rgba(42, 16, 48, 0.35); }
/* SECTIONS */
.sec { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 28px; padding: 44px 0; border-bottom: 1.5px solid #f1dce7; }
.sec-l { position: sticky; top: calc(var(--vp-nav-height, 64px) + 20px); align-self: start; }
.no { display: block; font-family: 'Zen Maru Gothic', sans-serif; font-size: 15px; font-weight: 800; color: #c92f69; letter-spacing: 0.1em; }
.sec-l h2 { margin: 4px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 30px !important; line-height: 1.2; }
.sec-l p { margin: 6px 0 0 !important; font-size: 13.5px; color: #735779; }
.sec-l a { color: #a33366 !important; font-weight: 700; }
.facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.fact { display: flex; flex-direction: column; gap: 2px; padding: 16px 18px; border-radius: 20px; background: #fff; border: 1.5px solid #f6e0ea; animation: rise both linear; animation-timeline: view(); animation-range: entry 0% entry 50%; }
.fact small { font-size: 11.5px; font-weight: 800; letter-spacing: 0.08em; color: #a33366; }
.fact b { font-size: 19px; line-height: 1.3; word-break: keep-all; }
.fact b:lang(ja) { font-family: var(--cs-sans); font-size: 16px; }
.fact span { font-size: 12.5px; color: #5a4060; }
@keyframes rise { from { opacity: 0; translate: 0 18px; } }
.years { display: grid; gap: 28px; }
.year { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 18px; }
.y-num { font-family: 'Zen Maru Gothic', sans-serif; font-size: 34px; font-weight: 900; color: #c47a9c; line-height: 1; position: sticky; top: calc(var(--vp-nav-height, 64px) + 20px); align-self: start; }
.y-list { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; gap: 8px; border-left: 2px dashed #f0c6d9; padding-left: 18px !important; }
.y-list li { position: relative; margin: 0 !important; display: grid; grid-template-columns: 36px 84px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 18px; background: #fff; border: 1.5px solid #f6e0ea;
  animation: slide both linear; animation-timeline: view(); animation-range: entry 0% entry 55%; }
@keyframes slide { from { opacity: 0; translate: 22px 0; } }
.y-list li::before { content: ''; position: absolute; left: -26px; top: 50%; width: 12px; height: 12px; margin-top: -6px; border-radius: 50%; background: #f0c6d9; box-shadow: 0 0 0 3px #fffaf4; }
.y-list li.key { background: linear-gradient(110deg, #fff, #fff3f8); border-color: #f2b9d1; }
.y-list li.key::before { background: #ff4d8d; }
.y-list li.key .ic { background: linear-gradient(140deg, #ff6fa3, #e0457f); color: #fff; box-shadow: 0 6px 12px -6px #e0457f; --ico-fill: rgba(255, 255, 255, 0.28); }
.li-ico { display: inline-grid; color: #c2185b; }
.ic { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 12px; background: #fdf3f8; font-size: 18px; color: #c2185b; }
.when { font-size: 12.5px; font-weight: 800; color: #735779; font-variant-numeric: tabular-nums; }
.what { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.tt { font-size: 15px; font-weight: 700; color: var(--ink) !important; text-decoration: none !important; }
a.tt:hover { color: #c92f69 !important; }
.what small { font-size: 12.5px; color: #5a4060; }
.star { font-style: normal; font-size: 13px; color: #c92f69; }
.awards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.aw { position: relative; display: flex; flex-direction: column; gap: 2px; padding: 18px; border-radius: 22px; background: #fff; border: 1.5px solid #f6e0ea; overflow: hidden; animation: rise both linear; animation-timeline: view(); animation-range: entry 0% entry 50%; }
.aw.big { background: radial-gradient(120% 120% at 100% 0%, #fff1c9, transparent 60%), #fff; border-color: #f3d58a; }
.cup { display: inline-grid; color: #c9921a; font-size: 26px; transition: transform 0.5s var(--spring); }
.aw:hover .cup { transform: rotate(-14deg) scale(1.2); }
.aw small { font-size: 11.5px; font-weight: 800; color: #a33366; }
.aw b { font-size: 16px; }
.aw.big b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 24px; }
.aw span { font-size: 13px; color: #5a4060; }
.sec-r { min-width: 0; }
.quiz :deep(.quiz-container) { margin: 0 !important; max-width: 640px; }
.src { margin: 26px 0 0 !important; font-size: 12.5px; color: #735779; }
.src a { color: #a33366 !important; }
@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; gap: 26px; }
  .sec { grid-template-columns: 1fr; gap: 16px; padding: 34px 0; }
  .sec-l { position: static; }
  .awards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .palette { gap: 8px; }
  .sw { border-radius: 16px; padding: 8px; }
  .sw b { font-size: 26px; }
  .sw span { font-size: 12.5px; } .sw small { display: none; }
  .year { grid-template-columns: 1fr; gap: 8px; }
  .y-num { position: static; font-size: 28px; }
  .y-list li { grid-template-columns: 32px minmax(0, 1fr) auto; }
  .y-list li .when { grid-column: 2; grid-row: 1; }
  .y-list li .what { grid-column: 2; grid-row: 2; }
  .y-list li .ic { grid-row: span 2; width: 32px; height: 32px; }
  .y-list li .star { grid-row: span 2; grid-column: 3; }
  .awards { grid-template-columns: 1fr; gap: 8px; }
  .aw { padding: 12px 16px; flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 8px; }
  .aw .cup { font-size: 18px; } .aw .cup :deep(svg) { width: 20px; height: 20px; } .aw b { font-size: 15px; } .aw.big b { font-size: 18px; } .aw span { flex-basis: 100%; }
  .facts { grid-template-columns: 1fr 1fr; } .fact b { font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) { .wordmark span, .sw, .fact, .y-list li, .aw { animation: none; } .sw, .links a, .cup { transition: none; } }
</style>
