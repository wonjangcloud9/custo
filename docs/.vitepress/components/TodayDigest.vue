<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { news, tagMeta } from '../data/news'
import { events, catMeta } from '../data/events'
import { members, ageOn } from '../data/members'
import { highlights, kindMeta } from '../data/highlights'
import homeVideos from '../data/home-videos.json'
import apRaw from '../data/appearances.json'

// "오늘의 큐스트" — everything that happened on one JST day, gathered from the official data
// (news.ts, events.ts, YouTube publish dates) plus verified highlights.ts. Client-only (needs today's date).
interface V { id: string; title: string; published?: string; duration?: string }
const latest = (homeVideos as { latest: V[] }).latest
interface Ap { id: string; title: string; ch: string; date: string; secs: number }
const aps = apRaw as Ap[]
const fmtLen = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const WD = ['日', '月', '火', '水', '木', '金', '土']
const jstDay = (ms: number) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10)

const day = ref('') // the day being shown
const isToday = ref(true)
const clean = (t: string) => t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/\s+/g, ' ').trim()

function itemsFor(d: string) {
  const md = d.slice(5)
  return {
    feats: highlights.filter((h) => h.date === d),
    videos: latest.filter((v) => v.published === d),
    // other official channels' uploads that day (minus ones already shown as a highlight)
    aps: aps.filter((x) => x.date === d && !highlights.some((h) => h.date === d && h.video === x.id)),
    news: news.filter((n) => n.date === d),
    events: events.filter((e) => e.date === d),
    bdays: members.filter((m) => m.birthday.slice(5) === md),
  }
}
const count = (x: ReturnType<typeof itemsFor>) => x.feats.length + x.videos.length + x.aps.length + x.news.length + x.events.length + x.bdays.length
const data = computed(() => (day.value ? itemsFor(day.value) : null))
const label = computed(() => {
  if (!day.value) return ''
  const d = new Date(`${day.value}T00:00:00Z`)
  return `${day.value.slice(5).replace('-', '.')} (${WD[d.getUTCDay()]})`
})

onMounted(() => {
  const now = Date.now()
  const today = jstDay(now)
  // today if anything happened, otherwise the most recent day (≤ 3 days back) that had something
  for (let i = 0; i <= 3; i++) {
    const d = jstDay(now - i * 86400000)
    if (count(itemsFor(d)) || i === 3) { day.value = count(itemsFor(d)) ? d : today; isToday.value = day.value === today; break }
  }
})
</script>

<template>
  <section id="today" class="td" aria-labelledby="td-h">
    <header class="td-head">
      <p class="td-kicker"><span class="td-dot" aria-hidden="true" />{{ isToday ? 'TODAY' : 'LATEST' }}</p>
      <h2 id="td-h">{{ isToday ? '오늘의 큐스트' : '최근 큐스트 소식' }} <span v-if="label" class="td-date">{{ label }}</span></h2>
    </header>

    <div v-if="!data" class="td-skel" aria-hidden="true"><i /><i /><i /></div>
    <template v-else>
      <div class="td-grid" :class="{ solo: !data.bdays.length && !data.feats.length && !data.videos.length && !data.aps.length }">
        <!-- big cards: highlights and today's uploads -->
        <div v-if="data.bdays.length || data.feats.length || data.videos.length || data.aps.length" class="td-feats">
          <a v-for="m in data.bdays" :key="m.id" class="bcard" :href="withBase(`/members/${m.id}`)" :style="{ '--mc': m.color }">
            <span class="b-hearts" aria-hidden="true"><i v-for="k in 9" :key="k" :style="{ '--k': k }">{{ k % 3 ? '♥' : '✦' }}</i></span>
            <span class="b-kanji" aria-hidden="true">{{ m.ja.slice(2, 3) }}</span>
            <span class="b-body">
              <small>HAPPY BIRTHDAY {{ m.emoji }}</small>
              <strong>오늘은 {{ m.ko }}의 {{ ageOn(m.birthday, new Date(`${day}T12:00:00+09:00`)) }}번째 생일!</strong>
              <em lang="ja">{{ m.ja }}さん、お誕生日おめでとう！</em>
              <span class="b-go">멤버 페이지에서 축하하기 →</span>
            </span>
          </a>
          <a v-for="h in data.feats" :key="h.url" class="feat" :href="h.url" target="_blank" rel="noopener">
            <span class="feat-th"><img v-if="h.video" :src="`https://i.ytimg.com/vi/${h.video}/hqdefault.jpg`" alt="" loading="lazy" /><b class="feat-tag">{{ kindMeta[h.kind].emoji }} {{ kindMeta[h.kind].ko }}</b></span>
            <span class="feat-body"><strong>{{ h.ko }}</strong><small>{{ h.title }}</small><em>출처 · {{ h.source }}</em></span>
          </a>
          <a v-for="v in data.videos" :key="v.id" class="feat vid" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener">
            <span class="feat-th"><img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" /><b class="feat-tag">🎬 새 영상</b><i v-if="v.duration" class="dur">{{ v.duration }}</i></span>
            <span class="feat-body"><strong>{{ clean(v.title) }}</strong><small>CUTIE STREET 공식 YouTube</small></span>
          </a>
          <a v-for="x in data.aps.slice(0, 3)" :key="x.id" class="feat vid" :href="`https://www.youtube.com/watch?v=${x.id}`" target="_blank" rel="noopener">
            <span class="feat-th"><img :src="`https://i.ytimg.com/vi/${x.id}/mqdefault.jpg`" alt="" loading="lazy" /><b class="feat-tag">📺 다른 채널 출연</b><i v-if="x.secs" class="dur">{{ fmtLen(x.secs) }}</i></span>
            <span class="feat-body"><strong>{{ x.title }}</strong><small>{{ x.ch }}</small></span>
          </a>
          <a v-if="data.aps.length > 3" class="td-more" :href="withBase('/appearances/')">📺 이날 다른 채널 출연 {{ data.aps.length - 3 }}편 더 보기 →</a>
        </div>

        <!-- list: news, schedule, birthdays -->
        <ul class="td-list">
          <li v-for="e in data.events" :key="e.ja + e.date">
            <a :href="e.url" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">{{ catMeta[e.cat].emoji }}</span>
              <span><b lang="ja">{{ e.ja }}</b><small>{{ e.ko }}{{ e.time ? ` · ${e.time}` : '' }}{{ e.venue ? ` · ${e.venue}` : '' }}</small></span><i class="pill">일정</i></a>
          </li>
          <li v-for="n in data.news" :key="n.url">
            <a :href="n.url" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">{{ tagMeta[n.tag].emoji }}</span>
              <span><b>{{ n.ko }}</b><small lang="ja">{{ n.ja }}</small></span><i class="pill">공식 소식</i></a>
          </li>
          <li v-if="!data.events.length && !data.news.length" class="empty">오늘은 공식 일정·소식이 아직 없어요. 아래 카운트다운에서 다음 일정을 확인하세요 ✨</li>
        </ul>
      </div>
      <p class="td-foot"><a :href="withBase('/news/')">공식 소식 전체 →</a><a :href="withBase('/schedule/')">스케줄 →</a><a :href="withBase('/videos/')">영상 아카이브 →</a><a :href="withBase('/appearances/')">출연 아카이브 →</a></p>
    </template>
  </section>
</template>

<style scoped>
.td { position: relative; margin: 8px 0 34px; padding: 22px 24px 18px; border-radius: 30px; color: #3a2340; overflow: hidden;
  background: radial-gradient(110% 120% at 0% 0%, #ffe4ef 0%, transparent 55%), radial-gradient(110% 120% at 100% 100%, #efe6ff 0%, transparent 55%), #fff;
  border: 1.5px solid #f3d6e4; box-shadow: 0 24px 50px -36px rgba(201, 47, 105, 0.45); }
.td-head { display: flex; flex-direction: column; gap: 2px; }
.td-kicker { margin: 0 !important; display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 900; letter-spacing: 0.2em; color: #c92f69; }
.td-dot { width: 9px; height: 9px; border-radius: 50%; background: #ff4d8d; box-shadow: 0 0 0 0 rgba(255, 77, 141, 0.6); animation: ping 1.8s ease-out infinite; }
@keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(255, 77, 141, 0.55); } 100% { box-shadow: 0 0 0 12px rgba(255, 77, 141, 0); } }
.td-head h2 { margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(24px, 3.4vw, 34px) !important; line-height: 1.2; letter-spacing: -0.01em; }
.td-date { font-size: 0.55em; font-weight: 700; color: #735779; margin-left: 6px; font-variant-numeric: tabular-nums; }
.td-skel { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-top: 16px; }
.td-skel i { height: 120px; border-radius: 20px; background: linear-gradient(90deg, #faf0f5, #fff, #faf0f5); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
.td-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; align-items: start; }
.td-grid > * { min-width: 0; }
.td-grid.solo { grid-template-columns: minmax(0, 1fr); }
.td-feats { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
.feat { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 10px 10px 14px; border-radius: 22px; background: #fff; border: 1.5px solid #f6e0ea;
  text-decoration: none !important; color: #3a2340 !important; transition: transform 0.5s cubic-bezier(.34, 1.56, .64, 1), box-shadow 0.3s; animation: rise 0.7s cubic-bezier(.34, 1.56, .64, 1) both; }
.feat:nth-child(2) { animation-delay: 0.08s; } .feat:nth-child(3) { animation-delay: 0.16s; }
@keyframes rise { from { opacity: 0; translate: 0 14px; } }
.feat:hover { transform: translateY(-3px) rotate(-0.4deg); box-shadow: 0 18px 30px -22px rgba(90, 30, 70, 0.5); }
.feat-th { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden; background: #fbe9f1; }
.feat-th img { width: 100%; height: 100%; object-fit: cover; }
.feat-tag { position: absolute; left: 8px; top: 8px; padding: 3px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 800; color: #fff; background: rgba(42, 16, 48, 0.82); }
.dur { position: absolute; right: 8px; bottom: 8px; padding: 2px 7px; border-radius: 8px; font-style: normal; font-size: 11px; font-weight: 700; color: #fff; background: rgba(0, 0, 0, 0.72); }
.feat-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 0 4px; }
.feat-body strong { font-size: 17px; line-height: 1.4; }
.feat-body small { font-size: 12.5px; color: #5a4060; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.feat-body em { font-style: normal; font-size: 11.5px; color: #735779; }
.td-list { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.td-list li { margin: 0 !important; animation: rise 0.6s cubic-bezier(.34, 1.56, .64, 1) both; }
.td-list li:nth-child(2) { animation-delay: 0.06s; } .td-list li:nth-child(3) { animation-delay: 0.12s; } .td-list li:nth-child(4) { animation-delay: 0.18s; }
.td-list a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 18px; background: #fdf6fa; text-decoration: none !important; color: #3a2340 !important; transition: background 0.2s, transform 0.4s cubic-bezier(.34, 1.56, .64, 1); }
.td-list a:hover { background: #fbe8f1; transform: translateX(3px); }
.td-list .ic { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 12px; background: #fff; font-size: 18px; }
.td-list a > span:nth-child(2) { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.td-list b { font-size: 14.5px; line-height: 1.35; }
.td-list small { font-size: 12px; color: #5a4060; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pill { flex: none; font-style: normal; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 999px; color: #8a2350; background: #fde3ee; }
.bd a { background: color-mix(in srgb, var(--mc) 16%, white); }
.empty { padding: 14px; border-radius: 18px; background: #fdf6fa; font-size: 13.5px; color: #5a4060; }
.td-foot { display: flex; gap: 16px; flex-wrap: wrap; justify-content: flex-end; margin: 14px 0 0 !important; font-size: 13px; font-weight: 700; }
.td-foot a { color: #a33366 !important; }
.feat.vid .feat-body strong { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.bcard { position: relative; overflow: hidden; display: flex; align-items: center; gap: 16px; padding: 20px 22px; border-radius: 24px; color: #fff !important; text-decoration: none !important;
  background: radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--mc) 70%, white), transparent 60%), linear-gradient(135deg, color-mix(in srgb, var(--mc) 62%, #2a1030), color-mix(in srgb, var(--mc) 40%, #2a1030));
  box-shadow: 0 24px 40px -26px color-mix(in srgb, var(--mc) 80%, #2a1030); animation: bpop 0.8s cubic-bezier(.34, 1.56, .64, 1) both; }
@keyframes bpop { from { opacity: 0; transform: scale(0.94) rotate(-1.5deg); } }
.b-kanji { flex: none; display: grid; place-items: center; width: 64px; height: 64px; border-radius: 22px; background: #fff; color: color-mix(in srgb, var(--mc) 55%, #2a1030); font-family: 'Zen Maru Gothic', sans-serif; font-size: 34px; font-weight: 900; transform: rotate(-6deg); animation: wob 2.8s ease-in-out infinite; }
@keyframes wob { 50% { transform: rotate(6deg) translateY(-3px); } }
.b-body { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.b-body small { font-size: 11.5px; font-weight: 900; letter-spacing: 0.18em; opacity: 0.92; }
.b-body strong { font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px; line-height: 1.3; }
.b-body em { font-style: normal; font-size: 13px; opacity: 0.92; }
.b-go { margin-top: 6px; align-self: flex-start; padding: 5px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.95); color: color-mix(in srgb, var(--mc) 50%, #2a1030); font-size: 12.5px; font-weight: 800; }
.b-hearts { position: absolute; inset: 0; pointer-events: none; }
.b-hearts i { position: absolute; bottom: -20px; left: calc(var(--k) * 10% + 2%); font-style: normal; font-size: calc(12px + var(--k) * 1.5px); color: rgba(255, 255, 255, 0.55); animation: float calc(3.2s + var(--k) * 0.35s) ease-in infinite; animation-delay: calc(var(--k) * -0.7s); }
@keyframes float { to { transform: translateY(-190px) rotate(25deg); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bcard, .b-kanji, .b-hearts i { animation: none; } .b-hearts { display: none; } }
@media (max-width: 520px) { .bcard { padding: 16px; gap: 12px; align-items: flex-start; } .b-kanji { width: 44px; height: 44px; font-size: 24px; border-radius: 14px; } .b-body strong { font-size: 17px; } .b-go { white-space: nowrap; } }
.td-more { align-self: start; display: block; padding: 10px 14px; border-radius: 16px; background: #fdf6fa; font-size: 13px; font-weight: 800; color: #a33366 !important; text-decoration: none !important; }
@media (max-width: 860px) {
  .td-grid { grid-template-columns: minmax(0, 1fr); }
  .td { padding: 18px 14px 14px; border-radius: 24px; }
  .td-skel { grid-template-columns: 1fr; }
}
@media (max-width: 520px) { .pill { display: none; } }
@media (prefers-reduced-motion: reduce) { .td-dot, .feat, .td-list li, .td-skel i { animation: none; } .feat, .td-list a { transition: none; } }
</style>
