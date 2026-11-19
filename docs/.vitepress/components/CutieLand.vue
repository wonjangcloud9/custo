<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'
import { cutieLand, MV, releases } from '../data/discography'
import { members, memberById } from '../data/members'
import { units } from '../data/units'
import { songs } from '../data/songs'
import videosRaw from '../data/videos.json'

interface Video { id: string; title: string; duration: string; category: string; channel?: string }
const videos = videosRaw as Video[]
const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s・·、。！!？?「」『』【】()（）\-_/♡]/g, '')
const ORDER: Record<string, number> = { mv: 0, dance: 1, live: 2, making: 3 }

// where each album track was heard first (checked 2026-11-18): the official discography's releases;
// ひたむきシンデレラ！: no standalone release; a live recording is on the 2nd single's CUTIE STREET盤 (UtaTen / retailer listing);
// tracks in neither the 31 official releases nor the lyric sites' song lists are marked as album premieres.
const firstRel = (t: string) => releases.filter((r) => r.type !== 'ALBUM' && norm(r.song) === norm(t)).sort((a, b) => a.date.localeCompare(b.date))[0]
const ORIGIN_NOTE: Record<string, string> = { 'きゅーすとのうた': '일본어 원곡은 2025.08.27 배포 시작(보도자료 기준) — 공식 디스코그래피 목록에는 한국어 ver.만 있어요', 'ひたむきシンデレラ！': '2nd SINGLE CUTIE STREET盤(2025.07.23)에 라이브 음원으로 수록된 곡 · 공식 디스코그래피에 단독 발매는 없음' }
const KNOWN = new Set(['ひたむきシンデレラ！'])
const tracks = cutieLand.tracks.map((t, i) => {
  const key = norm(t)
  const rel = key.length < 3 || i === 0 ? [] : videos
    .filter((v) => norm(v.title).includes(key) && !/Teaser/i.test(v.title))
    .sort((a, b) => (ORDER[a.category] ?? 9) - (ORDER[b.category] ?? 9))
  const unit = units.find((u) => u.song === t)
  return {
    n: i + 1, title: t, mv: MV[t], unit,
    first: firstRel(t), note: ORIGIN_NOTE[t] || '', premiere: !firstRel(t) && !KNOWN.has(t),
    page: songs.find((s) => norm(s.title) === key)?.id,
    color: members[i % 8].color,
    thumbs: rel.filter((v) => v.id !== MV[t]).slice(0, 3),
    lives: rel.filter((v) => v.category === 'live').length,
    total: rel.length,
  }
})

const premieres = tracks.filter((t) => t.premiere).length
const released = tracks.filter((t) => t.first).length
const fmtD = (d: string) => d.replace(/-/g, '.')
const current = ref(0)
const days = ref<number | null>(null)
let io: IntersectionObserver | undefined
onMounted(() => {
  days.value = Math.ceil((new Date(`${cutieLand.date}T00:00:00+09:00`).getTime() - Date.now()) / 86400000)
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) current.value = Number((e.target as HTMLElement).dataset.i)
  }, { rootMargin: '-45% 0px -45% 0px' })
  document.querySelectorAll('.cl-track').forEach((el) => io!.observe(el))
})
onBeforeUnmount(() => io?.disconnect())
const cur = computed(() => tracks[current.value])
const clean = (t: string) => t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍[^【]*/, '').trim()
</script>

<template>
  <section class="cl">
    <h2 class="sr-only">수록곡 가이드</h2>
    <aside class="cl-side">
      <div class="cl-stage" aria-hidden="true">
        <div class="cl-disc" :style="{ '--tc': cur.color }">
          <div class="cl-label"><b>{{ String(cur.n).padStart(2, '0') }}</b><span :lang="jaLang(cur.title)">{{ cur.title }}</span></div>
        </div>
        <div class="cl-sleeve"><span>CUTIE<br />LAND</span><small>1st ALBUM</small></div>
      </div>
      <div class="cl-info">
        <p class="eyebrow">2026.12.02 RELEASE</p>
        <p class="dday">{{ days === null ? '' : days > 0 ? `D-${days}` : days === 0 ? 'TODAY 🎉' : 'OUT NOW 💿' }}</p>
        <p class="now">Now spinning · <b :lang="jaLang(cur.title)">{{ cur.title }}</b></p>
        <div class="eds">
          <div v-for="e in cutieLand.editions" :key="e.code" class="ed"><b>{{ e.name }}</b><span>{{ e.spec }}</span><small>{{ e.code }} · {{ e.price }}</small></div>
        </div>
        <a class="cta" :href="cutieLand.url" target="_blank" rel="noopener">공식 특설 페이지 ↗</a>
      </div>
    </aside>

    <div class="cl-listwrap">
    <p class="cl-sum"><b>16곡</b> 중 <span class="s-new">✨ 앨범 첫 공개 {{ premieres }}곡</span> · <span class="s-rel">📀 이미 발매된 곡 {{ released }}곡</span> · 싱글 라이브 음원 수록 1곡<small>공식 디스코그래피·가사 사이트 곡 목록 기준 (2026.11.18 확인)</small></p>
    <ol class="cl-list">
      <li v-for="(t, i) in tracks" :key="t.title" class="cl-track" :class="{ on: current === i }" :data-i="i" :style="{ '--tc': t.color }">
        <span class="no">{{ String(t.n).padStart(2, '0') }}</span>
        <div class="body">
          <h3 lang="ja">{{ t.title }}</h3>
          <div class="tags">
            <span v-if="t.mv" class="tag mv">🎬 MV</span>
            <span v-if="t.unit" class="tag unit">💞 {{ t.unit.ja }}</span>
            <span v-if="t.lives" class="tag">🎤 라이브 영상 {{ t.lives }}</span>
            <span v-if="t.premiere" class="tag new">✨ 앨범 첫 공개</span>
            <span v-else-if="t.first" class="tag rel">📀 {{ fmtD(t.first.date) }} {{ t.first.type === 'SINGLE' ? 'CD 싱글' : '디지털' }}{{ /Korean/i.test(t.first.title) ? ' (한국어 ver.)' : '' }}</span>
          </div>
          <p v-if="t.note" class="origin">{{ t.note }}</p>
          <div v-if="t.unit" class="unit-av">
            <a v-for="id in t.unit.members" :key="id" :href="withBase(`/members/${id}`)" :style="{ '--mc': memberById[id].color }" :title="memberById[id].ko">{{ memberById[id].ja.slice(-2, -1) }}</a>
          </div>
          <div v-if="t.mv || t.thumbs.length" class="thumbs">
            <a v-if="t.mv" class="th main" :href="`https://www.youtube.com/watch?v=${t.mv}`" target="_blank" rel="noopener">
              <img :src="`https://i.ytimg.com/vi/${t.mv}/mqdefault.jpg`" alt="" loading="lazy" /><span>▶ MV</span>
            </a>
            <a v-for="v in t.thumbs" :key="v.id" class="th" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener" :title="clean(v.title)">
              <img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" /><span>{{ v.duration }}</span>
            </a>
          </div>
 <a v-if="t.page" class="more story" :href="withBase(`/discography/${t.page}`)">📖 곡 이야기 →</a>
          <a v-if="t.total > 3" class="more" :href="withBase(`/videos/?q=${encodeURIComponent(t.title)}`)">관련 영상 {{ t.total }}편 모두 보기 →</a>
        </div>
      </li>
    </ol>
    </div>
  </section>
</template>

<style scoped>
.cl { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 40px; margin: 8px 0 60px; align-items: start; }
.cl-sum { margin: 0 0 14px !important; padding: 12px 16px; border-radius: 18px; background: #fff; box-shadow: inset 0 0 0 1.5px #f6e0ea; font-size: 14px; line-height: 1.7; }
.cl-sum small { display: block; font-size: 11.5px; color: #735779; }
.s-new { font-weight: 800; color: #a33366; }
.s-rel { font-weight: 700; }
.tag.new { background: linear-gradient(100deg, #ffe1ee, #efe2ff); color: #8a1f55; font-weight: 800; animation: shimmer 2.4s ease-in-out infinite; background-size: 200% 100%; }
@keyframes shimmer { 50% { background-position: 100% 0; } }
.tag.rel { background: #f3eef6; color: #4a3550; }
.origin { margin: 4px 0 0 !important; font-size: 12.5px; color: #6a4f70; }
@media (prefers-reduced-motion: reduce) { .tag.new { animation: none; } }
.cl-side { position: sticky; top: calc(var(--vp-nav-height, 64px) + 20px); }
.cl-stage { position: relative; aspect-ratio: 1.15; }
.cl-sleeve { position: absolute; left: 0; top: 4%; width: 62%; aspect-ratio: 1; border-radius: 14px; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; overflow: hidden;
  background: conic-gradient(from 210deg at 30% 30%, #ffc93c, #ff4757, #3ccfa8, #4a90d9, #ff9f43, #5dc8f5, #a06cd5, #ff6b9d, #ffc93c); box-shadow: 0 30px 50px -24px rgba(90, 30, 70, 0.6); }
.cl-sleeve::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.6), transparent 45%); }
.cl-sleeve span { position: relative; z-index: 1; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: clamp(36px, 5vw, 64px); line-height: 0.92; color: #fff; text-shadow: 0 3px 12px rgba(40, 10, 40, 0.35); }
.cl-sleeve small { position: relative; z-index: 1; color: #fff; font-size: 11px; letter-spacing: 0.24em; font-weight: 800; margin-top: 8px; text-shadow: 0 1px 6px rgba(40, 10, 40, 0.4); }
.cl-disc { position: absolute; right: -4%; top: 6%; width: 70%; aspect-ratio: 1; border-radius: 50%; z-index: 1; display: grid; place-items: center;
  background: repeating-radial-gradient(circle, #241a28 0 1px, #30223a 1px 3px); box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5); animation: spin 8s linear infinite; }
@supports (animation-timeline: scroll()) {
  .cl-disc { animation: spinScroll linear both; animation-timeline: scroll(root block); }
  @keyframes spinScroll { to { transform: rotate(1440deg); } }
}
@keyframes spin { to { transform: rotate(360deg); } }
.cl-label { width: 40%; aspect-ratio: 1; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8px;
  background: radial-gradient(circle, #fff 0 9%, var(--tc) 10%); color: #fff; transition: background 0.5s; overflow: hidden; }
.cl-label b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 18px; line-height: 1; margin-top: 18%; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35); }
.cl-label span { font-size: 8px; font-weight: 700; line-height: 1.15; margin-top: 4px; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4); }
.cl-info { margin-top: 14px; }
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 800; letter-spacing: 0.22em; color: #a33366; }
.dday { margin: 2px 0 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 40px; font-weight: 700; color: #c92f69; line-height: 1.1; }
.now { margin: 4px 0 0 !important; font-size: 13px; color: #735779; }
.now b { color: var(--ink); font-family: 'Noto Sans JP', sans-serif; }
.eds { display: grid; gap: 6px; margin-top: 12px; }
.ed { display: grid; grid-template-columns: auto 1fr; column-gap: 10px; padding: 8px 12px; border-radius: 14px; background: #fff; border: 1.5px solid #f3dbe8; font-size: 13px; }
.ed b { font-family: 'Noto Sans JP', sans-serif; }
.ed small { grid-column: 1 / -1; font-size: 11.5px; color: #735779; }
.cta { display: inline-block; margin-top: 12px; padding: 10px 18px; border-radius: 999px; background: var(--ink); color: #fff !important; font-weight: 700; font-size: 13px; text-decoration: none !important; }

.cl-list { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; gap: 14px; }
.cl-track { margin: 0 !important; display: grid; grid-template-columns: 58px 1fr; gap: 12px; padding: 16px; border-radius: 24px; background: #fff;
  border: 1.5px solid color-mix(in srgb, var(--tc) 22%, white); transition: transform 0.6s var(--spring), box-shadow 0.4s, border-color 0.3s; }
.cl-track.on { transform: translateX(-6px) scale(1.015); border-color: var(--tc); box-shadow: 0 22px 40px -26px color-mix(in srgb, var(--tc) 90%, #000); }
.no { font-family: 'Zen Maru Gothic', sans-serif; font-size: 34px; font-weight: 700; line-height: 1; color: color-mix(in srgb, var(--tc) 60%, #2a1030); }
.body { min-width: 0; }
.body h3 { margin: 2px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Noto Sans JP', sans-serif; font-size: 18px !important; line-height: 1.35 !important; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag { font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #faf2f6; color: #5a4060; }
.tag.mv { background: #3a2340; color: #fff; }
.tag.unit { background: color-mix(in srgb, var(--tc) 14%, white); color: color-mix(in srgb, var(--tc) 55%, #2a1030); }
.tag.soft { color: #735779; }
.unit-av { display: flex; margin-top: 10px; }
.unit-av a { width: 34px; height: 34px; margin-right: -8px; border-radius: 50%; display: grid; place-items: center; border: 2.5px solid #fff; background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030);
  color: #fff !important; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; text-decoration: none !important; font-size: 14px; transition: transform 0.4s var(--spring); }
.unit-av a:hover { transform: translateY(-4px); }
.thumbs { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 6px; margin-top: 12px; }
.th { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; background: #fbe9f1; }
.th img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(.2, .8, .2, 1); }
.th:hover img { transform: scale(1.08); }
.th span { position: absolute; right: 4px; bottom: 4px; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 5px; background: rgba(30, 10, 30, 0.75); color: #fff; }
.th.main span { left: 4px; right: auto; background: #c92f69; }
.more { display: inline-block; margin-top: 10px; font-size: 12.5px; font-weight: 700; color: #a33366 !important; }
.more.story { margin-right: 14px; }
@media (max-width: 860px) {
  .cl { grid-template-columns: 1fr; gap: 18px; }
  .cl-side { position: relative; top: 0; }
  .cl-stage { max-width: 340px; }
  .thumbs { grid-template-columns: repeat(2, 1fr); }
  .cl-track.on { transform: none; }
}
@media (prefers-reduced-motion: reduce) { .cl-disc { animation: none !important; } .cl-track { transition: none; } }
</style>
