<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClock } from '../theme/today'

// 1st ALBUM 「CUTIE LAND」 buyer's guide — editions with their extras, and the release-week timeline.
// Source: official feature page /feature/1stalbumcutieland + news 96630 (checked 2026-11-18).
const FEATURE = 'https://cutiestreet.asobisystem.com/feature/1stalbumcutieland'
const VIDEOS = ['daylight', 'ハッピー世界！', 'ハロハロミライ', 'Shooting Star', 'ナイスだね', 'ぷりきゅきゅ', 'でぃすこみゅーたんと！', 'きゅーすとのうた']
const EDS = [
  { name: '初回限定盤A', ko: '초회한정반 A', spec: 'CD + Blu-ray', code: 'KLC-90012/3', price: '¥6,600', c: '#FF6B9D', disc: 'Blu-ray', extras: ['랜덤 트레이딩 카드 (A 도안)', '시리얼 코드 (초회 프레스 한정)'], store: '단체 A사진 A4 클리어 파일' },
  { name: '初回限定盤B', ko: '초회한정반 B', spec: 'CD + DVD', code: 'KLC-90014/5', price: '¥6,600', c: '#A06CD5', disc: 'DVD', extras: ['랜덤 트레이딩 카드 (B 도안)', '시리얼 코드 (초회 프레스 한정)'], store: '단체 A사진 A4 클리어 파일' },
  { name: '通常盤', ko: '통상반', spec: 'CD', code: 'KLC-90016', price: '¥3,300', c: '#3CCFA8', disc: '', extras: ['시리얼 코드 (초회 프레스 한정)'], store: '단체 A사진 생사진 2장 (5종 중 랜덤)' },
]
// start/end in JST (ISO with +09:00)
const STEPS = [
  { s: '2026-11-17T17:00+09:00', e: '2026-11-25T23:59+09:00', d: '11.17 – 11.25', t: '楽天ブックス 온라인 예약 추첨회', sub: '구매 직후 추첨 — 직필 사인 아크릴 패널·솔로 체키 등', url: 'https://cutiestreet.asobisystem.com/news/detail/96630', ico: 'dice' },
  { s: '2026-11-23T10:00+09:00', e: '2026-11-23T18:50+09:00', d: '11.23 (月·祝)', t: '大特典会 · 홋카이도', sub: 'アクセスサッポロ · 10:00–18:50 (1~6부)', url: 'https://cutiestreet.asobisystem.com/live_information/detail/47104', ico: 'gift' },
  // news 96698 (2026-11-18): CD buyers at the venue get lottery tickets (3 per CD, max 30 per checkout); pickup after the show
  { s: '2026-11-26T14:00+09:00', e: '2026-11-26T23:59+09:00', d: '11.26 (木)', t: '아이카 생탄제 현장 특별 추첨회', sub: 'SGCホール有明 · CD 1장당 추첨권 3장 · 선행 판매 14:00–17:00 예정(티켓 없어도 가능) · A 전원 사인 단체 체키 / B 아이카+멤버 1명 투샷 체키 / C 포스트카드', url: 'https://cutiestreet.asobisystem.com/news/detail/96698', ico: 'cake' },
  // news 96912 (2026-11-21, checked 2026-11-25): CD pre-order lottery at the tour final; pre-sale hours are 予定 (planned)
  { s: '2026-11-28T12:00+09:00', e: '2026-11-29T16:30+09:00', d: '11.28 (土) – 11.29 (日)', t: '투어 FINAL IGアリーナ 현장 특별 추첨회', sub: 'CD 예약자 대상 · 선행 판매 11/28 12:00–18:00 · 11/29 11:30–16:30 예정 · SS 전원 체키 촬영회(5명) / S 배웅회 · 촬영 가능(100명) / 사인 OSHI API TOWEL·솔로 체키 등 · 참가상 메시지 포스트카드', url: 'https://cutiestreet.asobisystem.com/news/detail/96912', ico: 'dice' },
  { s: '2026-12-01T12:00+09:00', e: '2026-12-13T23:59+09:00', d: '12.01 – 12.13', t: '시리얼 추첨 응모 기간', sub: '「すきトーク」 영상 토크 · 멤버당 70명, 총 560명', url: FEATURE, ico: 'ticket' },
  { s: '2026-12-02T00:00+09:00', e: '2026-12-02T23:59+09:00', d: '12.02 (水)', t: '1st ALBUM 「CUTIE LAND」 발매', sub: '16곡 수록 · 3형태', url: FEATURE, ico: 'disc', key: true },
  { s: '2026-12-06T00:00+09:00', e: '2026-12-06T23:59+09:00', d: '12.06 (日)', t: '大特典会 · 오사카', sub: 'インテックス大阪 3号館', url: 'https://cutiestreet.asobisystem.com/news/detail/96353', ico: 'gift' },
  { s: '2026-12-15T00:00+09:00', e: '2026-12-15T23:59+09:00', d: '12.15 (火)', t: '시리얼 추첨 당첨 발표', sub: '', url: FEATURE, ico: 'bell' },
  { s: '2026-12-17T00:00+09:00', e: '2026-12-17T23:59+09:00', d: '12.17 (木)', t: '발매 기념 스페셜 추첨 이벤트', sub: '「すきトーク」 앱 영상 토크 (사전 설치 필요)', url: FEATURE, ico: 'camera' },
]
const now = useClock() // refreshed every minute: steps flip at their start time while the page is open
const state = (st: typeof STEPS[number]) => {
  if (!now.value) return ''
  const s = Date.parse(st.s), e = Date.parse(st.e)
  return now.value > e ? 'done' : now.value >= s ? 'now' : 'next'
}
const nextIdx = computed(() => STEPS.findIndex((x) => state(x) === 'now' || state(x) === 'next'))
// official links from the feature page (checked 2026-11-25): 'ご予約はこちら' store hub + 'Pre Add/Pre Save キャンペーン'
// (事前登録で限定スマホ壁紙プレゼント). After release the same smartlinks are the buy / listen links.
const RELEASE = Date.parse('2026-12-02T00:00+09:00')
const released = computed(() => !!now.value && now.value >= RELEASE)
const ACTS = computed(() => released.value
  ? [
      { url: 'https://lnk.to/CS_CUTIELAND_CD', ico: 'disc', k: 'CD', t: 'CD 구매처 모음', sub: 'Amazon · TOWER RECORDS · HMV · 楽天ブックス 등 공식 링크' },
      { url: 'https://kawaii-lab.lnk.to/CUTIE_LAND', ico: 'music', k: 'STREAM', t: '음원 서비스에서 듣기', sub: 'Spotify · Apple Music 등 공식 링크' },
    ]
  : [
      { url: 'https://lnk.to/CS_CUTIELAND_CD', ico: 'disc', k: 'PRE-ORDER', t: '공식 예약처 모음', sub: 'Amazon · TOWER RECORDS · HMV · TSUTAYA · 楽天ブックス · Sony Music Shop 등' },
      { url: 'https://kawaii-lab.lnk.to/CUTIE_LAND', ico: 'music', k: 'PRE-SAVE', t: 'Spotify Pre-Save · Apple Music Pre-Add', sub: '미리 등록하면 발매일에 라이브러리에 자동 추가', perk: '등록 특전 · 한정 폰 배경화면' },
    ])
const open = ref<string>('初回限定盤A')
</script>

<template>
  <section class="ag" aria-labelledby="ag-h">
    <header class="ag-head">
      <p class="eb">BUYER'S GUIDE</p>
      <h2 id="ag-h">어떤 반을 살까? <Ico n="disc" duo /></h2>
      <p class="lead">세 형태 모두 같은 16곡이 들어 있어요. 차이는 영상 디스크와 특전이에요.</p>
    </header>

    <div class="eds">
      <article v-for="e in EDS" :key="e.code" class="ed" :class="{ open: open === e.name }" :style="{ '--c': e.c }">
        <button type="button" class="ed-top" :aria-expanded="open === e.name" @click="open = open === e.name ? '' : e.name">
          <span class="ed-disc" aria-hidden="true"><i /></span>
          <span class="ed-name"><b lang="ja">{{ e.name }}</b><small>{{ e.ko }} · {{ e.spec }}</small></span>
          <span class="ed-price">{{ e.price }}</span>
        </button>
        <div class="ed-body">
          <p class="code">{{ e.code }}</p>
          <div v-if="e.disc" class="blk">
            <p class="blk-h"><Ico n="film" /> {{ e.disc }} 수록 영상 {{ VIDEOS.length }}곡</p>
            <ul class="vids"><li v-for="v in VIDEOS" :key="v" lang="ja">{{ v }}</li></ul>
          </div>
          <div class="blk">
            <p class="blk-h"><Ico n="gift" /> 봉입 특전</p>
            <ul class="ex"><li v-for="x in e.extras" :key="x">{{ x }}</li></ul>
          </div>
          <div class="blk">
            <p class="blk-h"><Ico n="pin" /> 응원점 공통 특전</p>
            <p class="st">{{ e.store }}</p>
          </div>
        </div>
      </article>
    </div>
    <p class="fine">응원점 목록은 공식 발표 예정이며, 매장 특전은 소진 시 종료돼요. 일부 온라인숍은 특전 포함/미포함 상품 페이지가 따로 있어요.</p>

    <div class="acts" :aria-label="released ? '구매·듣기 공식 링크' : '예약·사전 등록 공식 링크'" role="group">
      <a v-for="a in ACTS" :key="a.url" :href="a.url" target="_blank" rel="noopener" class="act">
        <span class="act-i" aria-hidden="true"><Ico :n="a.ico" duo size="24" /></span>
        <span class="act-t">
          <em>{{ a.k }}</em>
          <b><JaText :t="a.t" /></b>
          <small><JaText :t="a.sub" /></small>
          <span v-if="a.perk" class="perk"><Ico n="sparkle" /> {{ a.perk }}</span>
        </span>
        <Ico n="link" class="act-go" />
      </a>
    </div>

    <h3 class="tl-h">발매 전후 캘린더 <Ico n="calendar" duo /></h3>
    <ol class="tl">
      <li v-for="(st, i) in STEPS" :key="st.t" :class="[state(st), { key: st.key, nx: i === nextIdx }]" :style="{ '--i': i }">
        <span class="dot" aria-hidden="true"><Ico :n="st.ico" duo size="20" /></span>
        <a :href="st.url" target="_blank" rel="noopener" class="tl-card">
          <span class="d">{{ st.d }}<em v-if="state(st) === 'now'" class="badge now">진행 중</em><em v-else-if="i === nextIdx" class="badge">다음</em><em v-else-if="state(st) === 'done'" class="badge done">종료</em></span>
          <b><JaText :t="st.t" /></b>
          <small v-if="st.sub"><JaText :t="st.sub" /></small>
        </a>
      </li>
    </ol>
    <p class="src"><Ico n="book" /> 출처: <a :href="FEATURE" target="_blank" rel="noopener">공식 1st ALBUM 특설 페이지</a> · <a href="https://cutiestreet.asobisystem.com/news/detail/96630" target="_blank" rel="noopener"><span lang="ja">楽天ブックス</span> 예약 추첨회 공지</a> (2026.11.18 확인 · 예약·Pre-Save 링크 2026.11.25 확인)</p>
  </section>
</template>

<style scoped>
.ag { --ink: #2f1a35; --spring: cubic-bezier(.34, 1.56, .64, 1); margin: 40px 0 10px; color: var(--ink); }
.eb { margin: 0 !important; font-size: 12px; font-weight: 900; letter-spacing: 0.22em; color: #c92f69; }
.ag-head h2 { margin: 6px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(24px, 3vw, 32px) !important; }
.lead { margin: 6px 0 16px !important; color: #5a4060; }
.eds { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
.ed { border-radius: 24px; background: #fff; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c) 30%, white); overflow: hidden; transition: box-shadow 0.3s, transform 0.45s var(--spring); }
.ed.open { box-shadow: inset 0 0 0 2px var(--c), 0 22px 40px -30px color-mix(in srgb, var(--c) 80%, #2a1030); }
.ed-top { width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px; text-align: left; color: var(--ink);
  background: radial-gradient(130% 120% at 0% 0%, color-mix(in srgb, var(--c) 20%, white), transparent 60%); }
.ed-disc { flex: none; position: relative; width: 46px; height: 46px; border-radius: 50%; background: repeating-radial-gradient(circle, color-mix(in srgb, var(--c) 70%, #2a1030) 0 2px, color-mix(in srgb, var(--c) 55%, #2a1030) 2px 4px); box-shadow: 0 6px 14px -8px #2a1030; }
.ed-disc i { position: absolute; inset: 36%; border-radius: 50%; background: #fff; }
.ed.open .ed-disc { animation: spin 3s linear infinite; }
@keyframes spin { to { rotate: 360deg; } }
.ed-name { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ed-name b { font-size: 17px; }
.ed-name small { font-size: 12.5px; color: #5a4060; }
.ed-price { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 900; font-size: 17px; color: color-mix(in srgb, var(--c) 50%, #2a1030); }
.ed-body { padding: 0 16px; }
.ed.open .ed-body { padding-bottom: 16px; }
.ed-body { display: block; max-height: 0; overflow: hidden; transition: max-height 0.5s ease, padding 0.3s; }
.ed.open .ed-body { max-height: 640px; }
.code { margin: 0 0 8px !important; font-size: 12px; color: #6a4f70; font-variant-numeric: tabular-nums; }
.blk { margin-top: 10px; }
.blk-h { margin: 0 0 6px !important; font-size: 13px; font-weight: 800; color: color-mix(in srgb, var(--c) 45%, #2a1030); }
.vids { list-style: none; margin: 0 !important; padding: 0 !important; display: flex; flex-wrap: wrap; gap: 6px; }
.vids li { margin: 0 !important; padding: 4px 10px; border-radius: 999px; font-size: 12.5px; background: color-mix(in srgb, var(--c) 10%, white); }
.ex { margin: 0 !important; padding-left: 18px !important; font-size: 13.5px; }
.ex li { margin: 2px 0 !important; }
.st { margin: 0 !important; font-size: 13.5px; }
.fine { margin: 12px 0 0 !important; font-size: 12.5px; color: #6a4f70; }
.acts { margin-top: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.act { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 22px; text-decoration: none !important; color: var(--ink) !important;
  background: linear-gradient(110deg, #fff0f6, #f4ecff); box-shadow: inset 0 0 0 1.5px #f3c6da; transition: transform 0.45s var(--spring), box-shadow 0.3s; }
.act:hover, .act:focus-visible { transform: translateY(-3px); box-shadow: inset 0 0 0 2px #ff6b9d, 0 18px 30px -24px #a33366; }
.act-i { flex: none; width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: #fff; color: #c92f69; box-shadow: 0 6px 14px -10px #a33366; }
.act-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.act-t em { font-style: normal; font-size: 11px; font-weight: 900; letter-spacing: 0.18em; color: #a33366; }
.act-t b { font-size: 15.5px; line-height: 1.35; }
.act-t small { font-size: 12.5px; color: #5a4060; }
.perk { align-self: flex-start; margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #2f1a35; color: #fff; }
.act-go { flex: none; color: #a33366; }

.tl-h { margin: 30px 0 14px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px !important; }
.tl { list-style: none; margin: 0 !important; padding: 0 0 0 4px !important; position: relative; display: grid; gap: 10px; }
.tl::before { content: ''; position: absolute; left: 22px; top: 18px; bottom: 18px; width: 3px; border-radius: 3px; background: linear-gradient(#ffc2d9, #d9c4f5); }
.tl li { margin: 0 !important; position: relative; display: flex; gap: 14px; align-items: center; animation: rise both linear; animation-timeline: view(); animation-range: entry 0% entry 50%; }
@keyframes rise { from { opacity: 0; translate: 0 14px; } }
.dot { color: #c92f69; position: relative; z-index: 1; flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; background: #fff; box-shadow: 0 0 0 3px #ffd6e6; }
.tl li.key .dot { box-shadow: 0 0 0 3px #ff6b9d, 0 0 0 8px rgba(255, 107, 157, 0.18); }
.tl li.nx .dot { animation: pulse 1.8s ease-out infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 3px #ff6b9d, 0 0 0 0 rgba(255, 107, 157, 0.45); } 100% { box-shadow: 0 0 0 3px #ff6b9d, 0 0 0 14px rgba(255, 107, 157, 0); } }
.tl-card { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-radius: 18px; background: #fff; box-shadow: inset 0 0 0 1.5px #f6e0ea; text-decoration: none !important; color: var(--ink) !important; transition: transform 0.4s var(--spring); }
.tl-card:hover { transform: translateX(4px); }
.tl li.key .tl-card { background: linear-gradient(100deg, #fff0f6, #f4ecff); box-shadow: inset 0 0 0 2px #ffb3cf; }
.tl li.done { opacity: 0.6; }
.d { font-size: 12.5px; font-weight: 800; color: #a33366; display: flex; gap: 8px; align-items: center; }
.tl-card b { font-size: 15px; }
.tl-card small { font-size: 12.5px; color: #6a4f70; }
.badge { font-style: normal; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; background: #2f1a35; color: #fff; }
.badge.now { background: #c92f69; }
.badge.done { background: #e9dde4; color: #5a4060; }
.src { margin: 16px 0 0 !important; font-size: 12.5px; color: #6a4f70; }
.src a { color: #a33366 !important; }
@media (max-width: 860px) { .eds, .acts { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) {
  .ed, .ed-body, .tl-card, .act { transition: none; }
  .ed.open .ed-disc, .tl li, .tl li.nx .dot { animation: none; }
}
</style>
