<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import raw from '../data/appearances.json'
import { members, memberById } from '../data/members'
import { events, startMs, endMs, isOnNow, nowWord, toIcs, googleCalUrl, type CsEvent } from '../data/events'
import { BUILD_TIME } from '../theme/today'

// Off-channel appearances: videos uploaded by other official channels (TV, music shows,
// brands, media, other artists). Data + verification: loop/appearances.py
interface Ap { id: string; kind: string; title: string; ch: string; date: string; secs: number; members: string[] }
const all = raw as Ap[]
const DEBUT = '2024-08-04'
// upcoming TV appearances from the official schedule (client clock; hidden once aired — published end, else start + 3 h)
const now = ref(0)
let nowTick: number | undefined
onBeforeUnmount(() => clearInterval(nowTick))
// rendered from the build time until mount (#196): an empty list that filled in after hydration pushed the
// player down 316px on phones (CLS 0.118)
const onAir = computed(() => { const t = now.value || BUILD_TIME; return events.filter((e) => e.cat === 'tv' && endMs(e) > t).sort((a, b) => startMs(a) - startMs(b)).slice(0, 6) })
const dLabel = (e: CsEvent) => {
  const t = now.value || BUILD_TIME
  if (isOnNow(e, t)) return nowWord(e)
  const d = Math.round((Date.parse(e.date + 'T00:00:00+09:00') - Date.parse(new Date(t + 9 * 3600e3).toISOString().slice(0, 10) + 'T00:00:00+09:00')) / 86400000)
  return d <= 0 ? 'TODAY' : d === 1 ? '내일' : `D-${d}`
}
const WD = ['日', '月', '火', '水', '木', '金', '土']
function saveIcs(e: CsEvent | CsEvent[]) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([toIcs(e)], { type: 'text/calendar;charset=utf-8' }))
  a.download = Array.isArray(e) ? 'cutiestreet-tv.ics' : `cutiestreet-tv-${e.date}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
const dayJa = (d: string) => `${+d.slice(5, 7)}/${+d.slice(8, 10)} (${WD[new Date(d + 'T00:00:00Z').getUTCDay()]})`

const KINDS: { id: string; label: string; emoji: string; c: string }[] = [
  { id: 'stage', label: '무대', emoji: '🎤', c: '#FF6B9D' },
  { id: 'fancam', label: '직캠', emoji: '📸', c: '#A06CD5' },
  { id: 'variety', label: '예능·토크', emoji: '📺', c: '#FF9F43' },
  { id: 'unit', label: '유닛·솔로', emoji: '🍑', c: '#3CCFA8' },
  { id: 'event', label: '이벤트·패션쇼', emoji: '🎪', c: '#4A90D9' },
  { id: 'news', label: '인터뷰·뉴스', emoji: '🗞️', c: '#5DC8F5' },
  { id: 'collab', label: 'CM·콜라보', emoji: '🤝', c: '#FFC93C' },
]
const kindById = Object.fromEntries(KINDS.map((k) => [k.id, k]))

const kind = ref('')
const who = ref('')
const withGroup = ref(true) // with a member picked, also show whole-group appearances (no member named in the title)
const ch = ref('')
const q = ref('')
const cur = ref<Ap>(all[0])
const panel = ref<HTMLElement | null>(null)
const playing = ref(false)

const count = (k: string) => all.filter((a) => a.kind === k).length
const memberCount = (id: string) => all.filter((a) => a.members.includes(id)).length
const groupCount = all.filter((a) => !a.members.length).length
const channels = computed(() => {
  const m = new Map<string, number>()
  all.forEach((a) => m.set(a.ch, (m.get(a.ch) || 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
})
const list = computed(() => {
  const s = q.value.trim().toLowerCase()
  return all.filter((a) =>
    (!kind.value || a.kind === kind.value) &&
    (!who.value || a.members.includes(who.value) || (withGroup.value && !a.members.length)) &&
    (!ch.value || a.ch === ch.value) &&
    (!s || (a.title + ' ' + a.ch).toLowerCase().includes(s)))
})
const groups = computed(() => {
  const g: { key: string; label: string; items: Ap[] }[] = []
  for (const a of list.value) {
    const key = a.date.slice(0, 7)
    let last = g[g.length - 1]
    if (!last || last.key !== key) { last = { key, label: `${key.slice(0, 4)}년 ${+key.slice(5)}월`, items: [] }; g.push(last) }
    last.items.push(a)
  }
  return g
})
const anyFilter = computed(() => !!(kind.value || who.value || ch.value || q.value))

const fmtDate = (d: string) => d.replace(/-/g, '.')
const fmtLen = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}` : `${Math.floor(s / 60)}`) + ':' + String(s % 60).padStart(2, '0')
const pre = (a: Ap) => a.date < DEBUT
const whoLabel = (a: Ap) => (a.members.length ? a.members.map((m) => memberById[m]?.ko.split(' ')[1]).join(' · ') : 'CUTIE STREET')

function play(a: Ap) {
  cur.value = a
  playing.value = true
  nextTick(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const top = (panel.value?.getBoundingClientRect().top || 0) + scrollY - 80
    if (Math.abs(top - scrollY) > 120) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  })
}
function reset() { kind.value = ''; who.value = ''; ch.value = ''; q.value = ''; withGroup.value = true }

onMounted(() => {
  now.value = Date.now()
  nowTick = window.setInterval(() => { now.value = Date.now() }, 60000) // on-air labels change while the page is open
  const p = new URLSearchParams(location.search)
  const m = p.get('m'), k = p.get('k')
  if (m && memberById[m]) who.value = m
  if (k && kindById[k]) kind.value = k
  if (who.value || kind.value) { const f = list.value[0]; if (f) cur.value = f }
})
</script>

<template>
  <section class="aa">
    <!-- stats -->
    <div class="stats">
      <div><b>{{ all.length }}</b><span>출연 영상</span></div>
      <div><b>{{ channels.length }}</b><span>채널</span></div>
      <div><b>{{ fmtDate(all[all.length - 1].date).slice(0, 7) }}</b><span>가장 오래된 기록<template v-if="pre(all[all.length - 1])"> · 데뷔 전 멤버 활동</template></span></div>
      <div><b>{{ fmtDate(all[0].date) }}</b><span>최근 출연</span></div>
    </div>

    <!-- upcoming broadcasts -->
    <section v-if="onAir.length" class="soon" aria-labelledby="soon-h">
      <h2 id="soon-h" class="soon-h">📡 방송 예정 <small>방송 후 공식 클립이 올라오면 아래 아카이브에 추가돼요</small></h2>
      <div class="soon-row">
        <div v-for="e in onAir" :key="e.date + e.ja" class="sn" :class="{ big: e.featured }">
          <span class="sn-d"><b :class="{ live: isOnNow(e, now || BUILD_TIME) }">{{ dLabel(e) }}</b>{{ dayJa(e.date) }}{{ e.time ? ' ' + e.time : '' }}</span>
          <a class="sn-t" lang="ja" :href="e.url" target="_blank" rel="noopener">{{ e.ja }}</a>
          <span class="sn-k">{{ e.ko }}</span>
          <span class="sn-act">
            <button type="button" :aria-label="`${e.ja} 캘린더 파일(.ics) 저장`" @click="saveIcs(e)">📅 .ics</button>
            <a :href="googleCalUrl(e)" target="_blank" rel="noopener" :aria-label="`${e.ja} Google 캘린더에 추가`">Google</a>
          </span>
        </div>
      </div>
      <button v-if="onAir.length > 1" type="button" class="sn-all" @click="saveIcs(onAir)">📅 방송 예정 {{ onAir.length }}개 한 번에 캘린더에 넣기</button>
    </section>

    <!-- ON AIR panel -->
    <div ref="panel" class="onair" :style="{ '--k': kindById[cur.kind].c }">
      <div class="oa-player">
        <YtLite :key="cur.id" :id="cur.id" :title="cur.title" />
      </div>
      <div class="oa-meta">
        <p class="oa-live"><i aria-hidden="true" />{{ playing ? 'NOW PLAYING' : 'LATEST' }}</p>
        <p class="oa-kind">{{ kindById[cur.kind].emoji }} {{ kindById[cur.kind].label }}<span v-if="pre(cur)" class="pre">데뷔 전</span></p>
        <h2 class="oa-title" :lang="jaLang(cur.title)">{{ cur.title }}</h2>
        <dl>
          <div><dt>채널</dt><dd :lang="jaLang(cur.ch)">{{ cur.ch }}</dd></div>
          <div><dt>업로드</dt><dd>{{ fmtDate(cur.date) }}</dd></div>
          <div><dt>출연</dt><dd>{{ whoLabel(cur) }}</dd></div>
        </dl>
        <a class="oa-yt" :href="`https://www.youtube.com/watch?v=${cur.id}`" target="_blank" rel="noopener">YouTube에서 보기 ↗</a>
      </div>
    </div>

    <!-- filters -->
    <div class="filters">
      <div class="kinds" role="toolbar" aria-label="종류">
        <button type="button" class="chip" :aria-pressed="!kind" @click="kind = ''">전체 <small>{{ all.length }}</small></button>
        <button v-for="k in KINDS" :key="k.id" type="button" class="chip" :style="{ '--c': k.c }" :aria-pressed="kind === k.id" @click="kind = kind === k.id ? '' : k.id">
          {{ k.emoji }} {{ k.label }} <small>{{ count(k.id) }}</small>
        </button>
      </div>
      <div class="row2">
        <div class="who" role="toolbar" aria-label="멤버">
          <button v-for="m in members" :key="m.id" type="button" class="mb" :style="{ '--mc': m.color }" :aria-pressed="who === m.id"
            :aria-label="`${m.ko} — 이름이 나온 출연 ${memberCount(m.id)}개`" :title="m.ko" @click="who = who === m.id ? '' : m.id">
            <span aria-hidden="true">{{ m.ja.slice(2, 3) }}</span><small aria-hidden="true">{{ memberCount(m.id) }}</small>
          </button>
        </div>
        <label class="search"><span aria-hidden="true">🔍</span><input v-model="q" type="search" placeholder="프로그램·채널·곡 검색" aria-label="출연 영상 검색" /></label>
      </div>
      <div class="chs" role="toolbar" aria-label="자주 출연한 채널">
        <span class="chs-h">자주 만난 채널</span>
        <button v-for="[c, n] in channels.slice(0, 8)" :key="c" type="button" class="chp" :aria-pressed="ch === c" @click="ch = ch === c ? '' : c"><span :lang="jaLang(c)">{{ c }}</span> <small>{{ n }}</small></button>
      </div>
      <label v-if="who" class="grp"><input v-model="withGroup" type="checkbox" /> 그룹 전체 출연도 함께 보기 <small>+{{ groupCount }}</small></label>
      <p class="result" aria-live="polite">
        <b>{{ list.length }}</b>개의 출연 영상
        <button v-if="anyFilter" type="button" class="clear" @click="reset">필터 초기화 ✕</button>
      </p>
    </div>

    <!-- timeline -->
    <div v-for="g in groups" :key="g.key" class="month">
      <h3 class="m-h"><span>{{ g.label }}</span><small>{{ g.items.length }}</small></h3>
      <TransitionGroup tag="div" name="card" class="grid">
        <button v-for="a in g.items" :key="a.id" type="button" class="card" :class="{ on: a.id === cur.id }" :style="{ '--k': kindById[a.kind].c }" @click="play(a)">
          <span class="th">
            <img :src="`https://i.ytimg.com/vi/${a.id}/mqdefault.jpg`" alt="" loading="lazy" width="320" height="180" />
            <span class="len">{{ fmtLen(a.secs) }}</span>
            <span class="kb">{{ kindById[a.kind].emoji }} {{ kindById[a.kind].label }}</span>
            <span v-if="pre(a)" class="pre on-th">데뷔 전</span>
          </span>
          <span class="tx">
            <b class="tt" :lang="jaLang(a.title)">{{ a.title }}</b>
            <span class="meta"><span class="chn" :lang="jaLang(a.ch)">{{ a.ch }}</span> · {{ fmtDate(a.date).slice(5) }}</span>
            <span v-if="a.members.length" class="dots" :aria-label="`출연: ${whoLabel(a)}`">
              <i v-for="m in a.members" :key="m" :style="{ background: memberById[m].color }" />
            </span>
          </span>
        </button>
      </TransitionGroup>
    </div>
    <p v-if="!list.length" class="empty">조건에 맞는 출연 영상이 없어요 🥲 <button type="button" class="clear" @click="reset">필터 초기화</button></p>

    <p class="note">📌 다른 공식 채널(방송국·음악방송·브랜드·언론·아티스트)이 올린 영상만 모았어요. 팬 재업로드·클립 채널·다른 가수의 커버는 넣지 않아요. 공식 채널 영상은 → <a href="../videos/">영상 아카이브</a></p>
  </section>
</template>

<style scoped>
.aa { --ink: #2f1a35; --spring: cubic-bezier(.34, 1.56, .64, 1); color: var(--ink); }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
.stats div { padding: 14px 16px; border-radius: 20px; background: #fff; box-shadow: inset 0 0 0 1.5px #f6dde8; display: flex; flex-direction: column; gap: 2px; }
.stats b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 24px; line-height: 1.2; color: #a33366; }
.stats span { font-size: 12.5px; color: #6a4f70; }

.soon { margin: 0 0 18px; }
.soon-h { margin: 0 0 10px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 18px !important; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
.soon-h small { font-family: inherit; font-size: 12.5px; font-weight: 600; color: #6a4f70; }
.soon-row { display: flex; gap: 10px; overflow-x: auto; padding: 2px 2px 8px; scroll-snap-type: x mandatory; scrollbar-width: thin; }
.sn { flex: 0 0 auto; width: 220px; scroll-snap-align: start; display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: 18px; background: #fff; box-shadow: inset 0 0 0 1.5px #f1d4e1; text-decoration: none !important; color: #2f1a35 !important; transition: transform 0.4s var(--spring); }
.sn:hover { transform: translateY(-3px); }
.sn { color: #2f1a35; }
.sn.big { background: linear-gradient(120deg, #fff0f3, #fff); box-shadow: inset 0 0 0 2px #ff8fa8; }
.sn-d { font-size: 12.5px; color: #6a4f70; display: flex; gap: 8px; align-items: center; }
.sn-d b { padding: 2px 8px; border-radius: 999px; background: #2f1a35; color: #fff; font-size: 11.5px; }
.sn-d b.live { background: #c2185b; letter-spacing: 0.04em; }
.sn-t { min-width: 0; font-size: 14px; font-weight: 800; line-height: 1.45; color: #2f1a35 !important; text-decoration: none !important; word-break: normal; overflow-wrap: anywhere; line-break: loose; }
.sn-t:hover { text-decoration: underline !important; }
.sn-act { display: flex; gap: 6px; margin-top: auto; padding-top: 4px; }
.sn-act button, .sn-act a { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #faf1f6; color: #2f1a35 !important; text-decoration: none !important; }
.sn-act button:hover, .sn-act a:hover { background: #f3dbe7; }
.sn-all { margin-top: 4px; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 800; background: #2f1a35; color: #fff; }
.sn-k { font-size: 12px; color: #6a4f70; }
@media (prefers-reduced-motion: reduce) { .sn { transition: none; } }
.onair { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 22px; padding: 18px; border-radius: 28px; color: #fff; scroll-margin-top: 80px;
  background: radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--k) 45%, #1d0f24), transparent 60%), #1d0f24; transition: background 0.6s; }
.oa-player :deep(.yt) { margin: 0; border-radius: 18px; }
.oa-meta { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 4px 4px 4px 0; }
.oa-live { margin: 0 !important; display: inline-flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 900; letter-spacing: 0.2em; color: #ffd1e3; }
.oa-live i { width: 8px; height: 8px; border-radius: 50%; background: #ff4f8b; box-shadow: 0 0 0 0 #ff4f8b; animation: rec 1.6s ease-out infinite; }
@keyframes rec { 70% { box-shadow: 0 0 0 8px transparent; } }
.oa-kind { margin: 0 !important; font-size: 13px; font-weight: 800; color: #fff; display: flex; gap: 8px; align-items: center; }
.oa-title { margin: 0 !important; padding: 0 !important; border: 0 !important; font-size: 18px !important; line-height: 1.45 !important; font-weight: 800; color: #fff; overflow-wrap: anywhere; }
.oa-meta dl { margin: 4px 0 0; display: grid; gap: 6px; }
.oa-meta dl div { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 8px; font-size: 13.5px; }
.oa-meta dt { color: #e3c8d8; font-weight: 700; }
.oa-meta dd { margin: 0; color: #fff; overflow-wrap: anywhere; }
.oa-yt { margin-top: auto; align-self: flex-start; padding: 8px 14px; border-radius: 999px; background: #fff; color: #1d0f24 !important; font-size: 13px; font-weight: 800; text-decoration: none !important; }
.pre { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; background: #fff3c4; color: #6b4a00; }

.filters { margin: 22px 0 6px; display: grid; gap: 12px; }
.kinds, .chs { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 8px 14px; border-radius: 999px; font-size: 13.5px; font-weight: 700; background: #fff; color: var(--ink); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c, #FF6B9D) 30%, white); transition: transform 0.4s var(--spring), background 0.2s; }
.chip small { font-weight: 600; opacity: 0.75; margin-left: 2px; }
.chip:hover { transform: translateY(-2px); }
.chip[aria-pressed='true'] { background: var(--ink); color: #fff; box-shadow: none; }
.row2 { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
.who { display: flex; gap: 6px; flex-wrap: wrap; }
.mb { position: relative; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #fff; box-shadow: inset 0 0 0 2.5px color-mix(in srgb, var(--mc) 60%, white);
  font-family: 'Zen Maru Gothic', sans-serif; font-size: 17px; font-weight: 900; color: color-mix(in srgb, var(--mc) min(55%, var(--ink-mix, 100%)), #2a1030); transition: transform 0.45s var(--spring), background 0.2s; }
.mb small { position: absolute; right: -4px; bottom: -4px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 999px; font-size: 10.5px; font-weight: 800; line-height: 18px; background: #2f1a35; color: #fff; }
.mb:hover { transform: translateY(-3px) rotate(-6deg); }
.mb[aria-pressed='true'] { background: var(--mc); color: #fff; transform: scale(1.08); }
.search { flex: 1 1 220px; max-width: 360px; display: flex; align-items: center; gap: 8px; padding: 0 14px; height: 42px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1.5px #f1d4e1; }
.search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font-size: 14px; color: var(--ink); }
.search:focus-within { box-shadow: inset 0 0 0 2px #e05592; }
.chs-h { align-self: center; font-size: 12.5px; font-weight: 800; color: #6a4f70; margin-right: 2px; }
.chp { padding: 5px 11px; border-radius: 999px; font-size: 12.5px; font-weight: 700; background: #faf1f6; color: var(--ink); transition: background 0.2s; }
.chp small { color: #735779; }
.chp[aria-pressed='true'] { background: #a33366; color: #fff; }
.chp[aria-pressed='true'] small { color: #ffe0ee; }
.grp { display: inline-flex; align-items: center; gap: 8px; justify-self: start; padding: 7px 14px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1.5px #f1d4e1; font-size: 13px; font-weight: 700; cursor: pointer; }
.grp input { accent-color: #c92f69; width: 16px; height: 16px; }
.grp small { color: #735779; }
.result { margin: 0 !important; font-size: 14px; color: #5a4060; display: flex; gap: 10px; align-items: center; }
.clear { font-size: 13px; font-weight: 700; color: #a33366; text-decoration: underline; }

.month { margin-top: 26px; }
.m-h { display: flex; align-items: baseline; gap: 8px; margin: 0 0 12px !important; padding: 0 0 6px !important; border: 0 !important; border-bottom: 1.5px dashed #f1d4e1 !important;
  position: sticky; top: var(--pin-top, 64px); z-index: 2; background: color-mix(in srgb, var(--vp-c-bg, #fff8f3) 92%, transparent); backdrop-filter: blur(6px); font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px !important; }
.m-h small { font-size: 13px; color: #735779; font-family: inherit; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 14px; }
.card { display: flex; flex-direction: column; text-align: left; border-radius: 20px; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 1.5px #f6e0ea; color: var(--ink);
  transition: transform 0.45s var(--spring), box-shadow 0.3s; animation: rise both linear; animation-timeline: view(); animation-range: entry 0% entry 40%; }
@keyframes rise { from { opacity: 0; translate: 0 16px; } }
.card:hover { transform: translateY(-4px); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--k) 55%, white), 0 20px 32px -24px color-mix(in srgb, var(--k) 70%, #2a1030); }
.card.on { box-shadow: inset 0 0 0 3px var(--k), 0 20px 32px -24px color-mix(in srgb, var(--k) 70%, #2a1030); }
.th { position: relative; display: block; aspect-ratio: 16 / 9; background: #f3e6ee; overflow: hidden; }
.th img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
.card:hover .th img { transform: scale(1.05); }
.len { position: absolute; right: 8px; bottom: 8px; padding: 2px 6px; border-radius: 6px; font-size: 11.5px; font-weight: 700; background: rgba(20, 8, 24, 0.82); color: #fff; }
.kb { position: absolute; left: 8px; top: 8px; padding: 3px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 800; background: rgba(255, 255, 255, 0.94); color: var(--ink); }
.pre.on-th { position: absolute; left: 8px; bottom: 8px; }
.tx { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px 14px; flex: 1; }
.tt { font-size: 14px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.meta { font-size: 12.5px; color: #6a4f70; }
.chn { font-weight: 700; color: #5a4060; }
.dots { display: flex; gap: 4px; margin-top: auto; }
.dots i { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(47, 26, 53, 0.08); }
.card-enter-active { transition: opacity 0.35s, transform 0.45s var(--spring); }
.card-enter-from { opacity: 0; transform: scale(0.94); }
.card-leave-active { display: none; transition: none !important; animation: none !important; }
.empty { margin: 24px 0 !important; text-align: center; color: #5a4060; }
.note { margin: 30px 0 0 !important; padding: 14px 16px; border-radius: 16px; background: #fff; box-shadow: inset 0 0 0 1.5px #f6e0ea; font-size: 13px; line-height: 1.7; color: #5a4060; }
.note a { color: #a33366 !important; font-weight: 700; }

@media (max-width: 860px) {
  .onair { grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 12px; border-radius: 22px; }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .search { max-width: none; }
}
@media (max-width: 520px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .tx { padding: 10px 10px 12px; }
  .tt { font-size: 13px; }
  .kb { font-size: 10.5px; padding: 2px 7px; }
  .mb { width: 36px; height: 36px; font-size: 14.5px; }
  .who { gap: 5px; }
}
@media (prefers-reduced-motion: reduce) {
  .card, .chip, .mb, .th img, .onair { transition: none; animation: none; }
  .oa-live i { animation: none; }
  .card-enter-active { transition: none; }
}
</style>
