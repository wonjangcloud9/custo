<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import ShareButton from './ShareButton.vue'
import { withBase } from 'vitepress'
import videosRaw from '../data/videos.json'
import { members, memberById } from '../data/members'

interface Video { id: string; title: string; duration: string; category: string; members: string[]; date: string; venue: string; channel?: string; published?: string }
const videos = videosRaw as Video[]

const CATS: { id: string; label: string; emoji: string }[] = [
  { id: 'all', label: '전체', emoji: '✨' },
  { id: 'live', label: '라이브', emoji: '🎤' },
  { id: 'dance', label: '안무 · FOCUS', emoji: '💃' },
  { id: 'mv', label: 'MV · 리릭', emoji: '🎬' },
  { id: 'making', label: '메이킹', emoji: '🎥' },
  { id: 'birthday', label: '생탄제', emoji: '🎂' },
  { id: 'digest', label: '다이제스트', emoji: '📼' },
  { id: 'vlog', label: '브이로그', emoji: '🧳' },
  { id: 'variety', label: '버라이어티', emoji: '🍬' },
]
const catLabel = Object.fromEntries(CATS.map((c) => [c.id, c]))

const cat = ref('all')
const member = ref('')
const q = ref('')
type Sort = 'new' | 'old' | 'long' | 'short'
const sort = ref<Sort>('new')
const SORTS: { id: Sort; label: string }[] = [{ id: 'new', label: '최신 업로드순' }, { id: 'old', label: '오래된 순' }, { id: 'long', label: '긴 영상순' }, { id: 'short', label: '짧은 영상순' }]
const order = new Map(videos.map((v, i) => [v.id, i]))
const secs = (d: string) => (d ? d.split(':').map(Number).reduce((a, n) => a * 60 + n, 0) : -1)
const unwatchedOnly = ref(false)
const PAGE = 24
const shown = ref(PAGE)
const watched = ref<Set<string>>(new Set())
const playing = ref<Video | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)

const counts = computed(() => {
  const c: Record<string, number> = { all: videos.length }
  for (const v of videos) c[v.category] = (c[v.category] || 0) + 1
  return c
})
const memberCounts = computed(() => {
  const c: Record<string, number> = {}
  for (const v of videos) for (const m of v.members) c[m] = (c[m] || 0) + 1
  return c
})

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return videos.filter((v) =>
    (cat.value === 'all' || v.category === cat.value) &&
    (!member.value || v.members.includes(member.value)) &&
    (!needle || v.title.toLowerCase().includes(needle) || v.venue.toLowerCase().includes(needle)) &&
    (!unwatchedOnly.value || !watched.value.has(v.id)),
  ).sort((a, b) => {
    const ia = order.get(a.id)!, ib = order.get(b.id)!
    if (sort.value === 'long' || sort.value === 'short') {
      const sa = secs(a.duration), sb = secs(b.duration)
      if (sa < 0 || sb < 0) return sa < 0 && sb < 0 ? ia - ib : sa < 0 ? 1 : -1 // unknown length last
      return sort.value === 'long' ? sb - sa : sa - sb
    }
    if (sort.value === 'old') return Number(!!a.channel) - Number(!!b.channel) || ib - ia
    return (cat.value === 'mv' ? Number(!!b.channel) - Number(!!a.channel) : 0) || ia - ib
  })
})
const visible = computed(() => filtered.value.slice(0, shown.value))
// Watch progress for the current scope (category/member/search), independent of 'unwatched only'
const scope = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return videos.filter((v) => (cat.value === 'all' || v.category === cat.value) && (!member.value || v.members.includes(member.value)) &&
    (!needle || v.title.toLowerCase().includes(needle) || v.venue.toLowerCase().includes(needle)))
})
const seenInScope = computed(() => scope.value.filter((v) => watched.value.has(v.id)).length)
const pct = computed(() => (scope.value.length ? Math.round((seenInScope.value / scope.value.length) * 100) : 0))
const complete = computed(() => scope.value.length > 0 && seenInScope.value === scope.value.length)

function withTransition(fn: () => void) {
  const d = document as any
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!d.startViewTransition || reduce) { fn(); return }
  d.startViewTransition(async () => { fn(); await nextTick() })
}
function setCat(id: string) { withTransition(() => { cat.value = id; shown.value = PAGE }) }
function setMember(id: string) { withTransition(() => { member.value = member.value === id ? '' : id; shown.value = PAGE }) }

function syncUrl() {
  const p = new URLSearchParams()
  if (cat.value !== 'all') p.set('cat', cat.value)
  if (member.value) p.set('m', member.value)
  if (q.value) p.set('q', q.value)
  if (sort.value !== 'new') p.set('sort', sort.value)
  const s = p.toString()
  history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash)
}

function loadWatched() {
  try { watched.value = new Set(JSON.parse(localStorage.getItem('custo-watched') || '[]')) } catch { /* private mode */ }
}
function saveWatched() {
  try { localStorage.setItem('custo-watched', JSON.stringify([...watched.value])) } catch { /* ignore */ }
}

function play(v: Video) {
  playing.value = v
  const s = new Set(watched.value); s.add(v.id); watched.value = s; saveWatched()
  nextTick(() => { if (!dialog.value?.open) dialog.value?.showModal() })
}
// Continuous play: listen to the YouTube embed's state via postMessage (enablejsapi=1)
const autoNext = ref(true)
const frame = ref<HTMLIFrameElement | null>(null)
const queue = computed(() => (playing.value ? filtered.value : []))
const nextVideo = computed(() => {
  if (!playing.value) return null
  const i = queue.value.findIndex((v) => v.id === playing.value!.id)
  return i >= 0 && i < queue.value.length - 1 ? queue.value[i + 1] : null
})
function playNext() { if (nextVideo.value) play(nextVideo.value) }
function subscribe() {
  const w = frame.value?.contentWindow
  if (!w) return
  w.postMessage(JSON.stringify({ event: 'listening', id: 'va', channel: 'widget' }), '*')
  w.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'], id: 'va', channel: 'widget' }), '*')
}
function onYtMessage(e: MessageEvent) {
  let host = ''
  try { host = new URL(e.origin).hostname } catch { return }
  if (!/youtube(-nocookie)?\.com$/.test(host)) return
  let d: any
  try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch { return }
  const ended = (d?.event === 'onStateChange' && d.info === 0) || (d?.event === 'infoDelivery' && d.info?.playerState === 0)
  if (ended && autoNext.value && nextVideo.value) playNext()
}
function close() { dialog.value?.close() }
function onDialogClose() { playing.value = null }
function onBackdrop(e: MouseEvent) { if (e.target === dialog.value) close() }
function randomPick() {
  const pool = filtered.value.length ? filtered.value : videos
  play(pool[Math.floor(Math.random() * pool.length)])
}

const nowMs = ref(0)
const isNew = (v: Video) => !!v.published && nowMs.value > 0 && nowMs.value - new Date(v.published + 'T00:00:00Z').getTime() < 7 * 86400000
function fmtDate(d: string) { return d ? d.replace(/-/g, '.') : '' }
function cleanTitle(t: string) {
  return t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍[^【]*/, '').trim()
}

onMounted(() => {
  const p = new URLSearchParams(location.search)
  if (p.get('cat') && catLabel[p.get('cat')!]) cat.value = p.get('cat')!
  if (p.get('m') && memberById[p.get('m')!]) member.value = p.get('m')!
  if (p.get('q')) q.value = p.get('q')!
  const so = p.get('sort'); if (so && SORTS.some((x) => x.id === so)) sort.value = so as Sort
  loadWatched()
  nowMs.value = Date.now()
  watch([cat, member, q, sort], syncUrl)
  window.addEventListener('message', onYtMessage)
})
onBeforeUnmount(() => window.removeEventListener('message', onYtMessage))
</script>

<template>
  <section class="va">
    <header class="va-head">
      <p class="va-eyebrow">OFFICIAL YOUTUBE · @CUTIE_STREET</p>
      <h1 class="va-title">
        <span v-for="(ch, i) in 'VIDEO ARCHIVE'.split('')" :key="i" class="va-ch" :style="{ '--i': i }">{{ ch === ' ' ? ' ' : ch }}</span>
      </h1>
      <p class="va-sub">공식 채널 + KAWAII LAB. MV 영상 <b>{{ videos.length }}</b>개를 무대·안무·메이킹·생탄제별로. 본 영상은 <b>{{ watched.size }}</b>개예요. <a class="va-stats" :href="withBase('/videos/stats/')">📊 통계 보기</a></p>
    </header>

    <div class="va-toolbar">
      <label class="va-search">
        <span aria-hidden="true">🔍</span>
        <input v-model="q" type="search" placeholder="곡명, 공연장, 키워드 (예: 武道館, ぷりきゅきゅ)" @input="shown = PAGE" />
      </label>
      <button class="va-dice" type="button" @click="randomPick" title="지금 필터에서 랜덤 재생">🎲 랜덤 재생</button>
    </div>

    <div class="va-chips" role="toolbar" aria-label="카테고리">
      <button v-for="c in CATS" :key="c.id" type="button" class="chip" :aria-pressed="cat === c.id" @click="setCat(c.id)">
        <span aria-hidden="true">{{ c.emoji }}</span>{{ c.label }}<small>{{ counts[c.id] || 0 }}</small>
      </button>
    </div>

    <div class="va-members" role="toolbar" aria-label="멤버별">
      <button v-for="m in members" :key="m.id" type="button" class="mchip" :aria-pressed="member === m.id"
        :style="{ '--mc': m.color }" :title="`${m.ko} (${m.ja})`" @click="setMember(m.id)">
        <span class="mchip-ring"><span class="mchip-face">{{ m.ja.slice(-2, -1) }}</span></span>
        <span class="mchip-name">{{ m.ko.split(' ')[1] }}</span>
        <small>{{ memberCounts[m.id] || 0 }}</small>
      </button>
      <label class="va-sort"><select v-model="sort" aria-label="정렬" @change="shown = PAGE"><option v-for="o in SORTS" :key="o.id" :value="o.id">{{ o.label }}</option></select></label>
      <label class="va-toggle"><input v-model="unwatchedOnly" type="checkbox" /> 안 본 영상만</label>
    </div>

    <div class="va-meta">
      <p class="va-count" aria-live="polite">{{ filtered.length }}개의 영상</p>
      <div v-if="watched.size" class="va-prog" :class="{ done: complete }" role="progressbar" :aria-valuenow="seenInScope" aria-valuemin="0" :aria-valuemax="scope.length"
        :aria-label="`이 목록에서 ${scope.length}편 중 ${seenInScope}편 봤어요`">
        <span class="va-prog-track"><i :style="{ width: pct + '%' }" /></span>
        <span class="va-prog-txt">{{ complete ? '🎉 이 목록 완주!' : `${seenInScope}/${scope.length}편 봤어요 · ${pct}%` }}</span>
      </div>
    </div>

    <h2 class="sr-only">영상 목록</h2>
    <div v-if="filtered.length" class="va-grid">
      <article v-for="v in visible" :key="v.id" class="card" :style="{ viewTransitionName: 'v-' + v.id.replace(/[^\w]/g, '_') }"
        :data-cat="v.category">
        <button type="button" class="thumb" :aria-label="`${cleanTitle(v.title)} 재생`" @click="play(v)">
          <img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" :alt="''" loading="lazy" decoding="async" width="320" height="180" />
          <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg></span>
          <span v-if="v.duration" class="dur">{{ v.duration }}</span>
          <span v-if="watched.has(v.id)" class="seen">✓ 봤어요</span>
          <span v-if="v.channel" class="official">OFFICIAL MV</span>
          <span v-else-if="isNew(v)" class="official new">NEW</span>
        </button>
        <div class="body">
          <span class="pill" :data-cat="v.category">{{ catLabel[v.category]?.emoji }} {{ catLabel[v.category]?.label }}</span>
          <h3 class="ttl">{{ cleanTitle(v.title) }}</h3>
          <p class="meta">
            <span v-if="v.venue">📍 {{ v.venue }}</span>
            <span v-if="v.date">{{ fmtDate(v.date) }}</span>
          </p>
          <div v-if="v.members.length" class="dots">
            <span v-for="m in v.members" :key="m" class="dot" :style="{ '--mc': memberById[m].color }">{{ memberById[m].ko.split(' ')[1] }}</span>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="va-empty">조건에 맞는 영상이 없어요 🥲 필터를 바꿔보세요.</p>

    <div v-if="shown < filtered.length" class="va-more">
      <button type="button" @click="shown += PAGE">더 보기 <small>({{ filtered.length - shown }}개 남음)</small></button>
    </div>

    <dialog ref="dialog" class="va-dialog" aria-label="영상 플레이어" @close="onDialogClose" @click="onBackdrop">
      <div v-if="playing" class="va-player">
        <div class="frame">
          <iframe ref="frame" :key="playing.id" :src="`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&enablejsapi=1`" :title="playing.title"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen @load="subscribe" />
        </div>
        <div class="va-player-bar">
          <p>{{ playing.title }}</p>
          <a :href="`https://www.youtube.com/watch?v=${playing.id}`" target="_blank" rel="noopener">YouTube에서 보기 ↗</a>
          <button type="button" class="x" aria-label="닫기" @click="close">✕</button>
        </div>
        <div class="va-queue">
          <label class="auto"><input v-model="autoNext" type="checkbox" /> 연속 재생</label>
          <button v-if="nextVideo" type="button" class="next" @click="playNext">
            <img :src="`https://i.ytimg.com/vi/${nextVideo.id}/default.jpg`" alt="" /><span><small>다음 영상</small>{{ cleanTitle(nextVideo.title) }}</span><b>▶</b>
          </button>
          <ShareButton :title="playing.title" :url="`https://www.youtube.com/watch?v=${playing.id}`" label="공유" dark />
        </div>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.va {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340;
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 24px 96px;
  color: var(--ink);
}
.va-head { text-align: center; margin-bottom: 28px; }
.va-eyebrow { font-size: 12px; letter-spacing: 0.24em; color: #a33d72; font-weight: 700; margin: 0 0 8px; }
.va-title {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: clamp(40px, 8vw, 88px);
  line-height: 1;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.va-ch {
  display: inline-block;
  background: linear-gradient(180deg, #ff6b9d, #c49cff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: hop 2.8s var(--spring) calc(var(--i) * 70ms) infinite;
}
@keyframes hop {
  0%, 60%, 100% { transform: translateY(0) rotate(0); }
  20% { transform: translateY(-0.12em) rotate(-4deg); }
}
.va-sub { margin: 14px 0 0; color: #7a5a80; }
.va-sub b { color: #c92f69; }
.va-stats { display: inline-block; margin-left: 6px; font-weight: 700; color: #a33366 !important; white-space: nowrap; }

.va-toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.va-search {
  flex: 1; display: flex; align-items: center; gap: 8px;
  background: #fff; border: 2px solid #ffd6e6; border-radius: 999px; padding: 0 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.va-search:focus-within { border-color: #ff6b9d; box-shadow: 0 0 0 5px rgba(255, 107, 157, 0.15); }
.va-search input { flex: 1; border: 0; outline: 0; background: transparent; height: 46px; font-size: 15px; color: var(--ink); min-width: 0; }
.va-dice {
  border-radius: 999px; padding: 0 18px; font-weight: 700; background: var(--ink); color: #fff;
  transition: transform 0.5s var(--spring);
  white-space: nowrap;
}
.va-dice:hover { transform: rotate(-6deg) scale(1.05); }
.va-dice:active { transform: scale(0.92); }

.va-chips, .va-members { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 10px; scrollbar-width: none; scroll-snap-type: x proximity; }
.va-chips::-webkit-scrollbar, .va-members::-webkit-scrollbar { display: none; }
.chip {
  flex: none; scroll-snap-align: start;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 999px; font-size: 14px; font-weight: 600;
  background: #fff; border: 1.5px solid #f3d9e6; color: var(--ink);
  transition: transform 0.45s var(--spring), background 0.2s, color 0.2s, border-color 0.2s;
}
.chip small { font-size: 11px; opacity: 0.55; font-weight: 700; }
.chip:hover { transform: translateY(-2px); border-color: #ff9ec0; }
.chip:active { transform: scale(0.9); }
.chip[aria-pressed='true'] { background: var(--ink); color: #fff; border-color: var(--ink); }
.chip[aria-pressed='true'] small { opacity: 0.8; }

.va-members { align-items: center; }
.mchip {
  flex: none; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 6px;
  background: none; transition: transform 0.45s var(--spring);
}
.mchip-ring {
  width: 54px; height: 54px; border-radius: 50%; padding: 3px; display: grid; place-items: center;
  background: conic-gradient(from 210deg, var(--mc), color-mix(in srgb, var(--mc) 35%, white), var(--mc));
  transition: transform 0.6s var(--spring), box-shadow 0.3s;
}
.mchip-face {
  width: 100%; height: 100%; border-radius: 50%; display: grid; place-items: center;
  background: #fff; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 20px;
  color: color-mix(in srgb, var(--mc) 70%, #3a2340);
  transition: background 0.25s, color 0.25s;
}
.mchip-name { font-size: 12px; font-weight: 700; }
.mchip small { font-size: 10px; opacity: 0.55; margin-top: -4px; }
.mchip:hover .mchip-ring { transform: rotate(-12deg) scale(1.08); }
.mchip:active .mchip-ring { transform: scale(0.88); }
.mchip[aria-pressed='true'] .mchip-ring { box-shadow: 0 6px 18px color-mix(in srgb, var(--mc) 55%, transparent); transform: scale(1.1); }
.mchip[aria-pressed='true'] .mchip-face { background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); color: #fff; }
.va-sort { margin-left: auto; flex: none; padding-left: 12px; }
.va-sort select { appearance: none; padding: 7px 30px 7px 12px; border-radius: 999px; border: 1.5px solid #f1d4e1; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23735779'/%3E%3C/svg%3E") no-repeat right 12px center; font-size: 13px; font-weight: 700; color: #3a2340; cursor: pointer; }
.va-toggle { margin-left: 4px; flex: none; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #7a5a80; cursor: pointer; padding-left: 12px; }
.va-toggle input { accent-color: #ff6b9d; width: 16px; height: 16px; }

.va-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 6px 0 16px; }
.va-count { font-size: 13px; color: #735779; margin: 0 !important; font-weight: 600; }
.va-prog { display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 700; color: #5a4060; }
.va-prog-track { width: 140px; height: 8px; border-radius: 999px; background: #f6e7ef; overflow: hidden; }
.va-prog-track i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #ff6b9d, #c92f69); transition: width 0.6s cubic-bezier(.34, 1.56, .64, 1); }
.va-prog.done .va-prog-txt { color: #c92f69; animation: va-pop 0.6s cubic-bezier(.34, 1.56, .64, 1); }
@keyframes va-pop { 0% { transform: scale(0.6); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .va-prog-track i { transition: none; } .va-prog.done .va-prog-txt { animation: none; } }

.va-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 22px 18px; }
.card {
  background: #fff; border-radius: 22px; overflow: hidden;
  box-shadow: 0 1px 0 #f6e3ec, 0 10px 30px -18px rgba(150, 60, 110, 0.35);
  transition: transform 0.5s var(--spring), box-shadow 0.3s;
  display: flex; flex-direction: column;
}
.card:hover { transform: translateY(-6px) rotate(-0.6deg); box-shadow: 0 1px 0 #f6e3ec, 0 22px 40px -20px rgba(150, 60, 110, 0.5); }
.card:nth-child(even):hover { transform: translateY(-6px) rotate(0.6deg); }
@supports (animation-timeline: view()) {
  .card { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  @keyframes rise { from { opacity: 0; transform: translateY(40px) scale(0.94); } to { opacity: 1; transform: none; } }
}
.thumb { position: relative; display: block; width: 100%; aspect-ratio: 16 / 9; padding: 0; background: #fbe9f1; overflow: hidden; cursor: pointer; }
.thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s cubic-bezier(.2,.8,.2,1), filter 0.4s; }
.card:hover .thumb img { transform: scale(1.06); filter: saturate(1.15); }
.play {
  position: absolute; left: 50%; top: 50%; width: 58px; height: 58px; translate: -50% -50%;
  display: grid; place-items: center; color: #fff;
  background: rgba(255, 107, 157, 0.92);
  border-radius: 42% 58% 61% 39% / 45% 41% 59% 55%;
  scale: 0.6; opacity: 0;
  transition: scale 0.5s var(--spring), opacity 0.25s;
  animation: blob 4s ease-in-out infinite;
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.5);
}
.play svg { width: 26px; height: 26px; fill: currentColor; margin-left: 3px; }
.card:hover .play, .thumb:focus-visible .play { scale: 1; opacity: 1; }
@keyframes blob {
  0%, 100% { border-radius: 42% 58% 61% 39% / 45% 41% 59% 55%; }
  50% { border-radius: 58% 42% 38% 62% / 55% 60% 40% 45%; }
}
.dur, .seen {
  position: absolute; bottom: 8px; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 8px;
  background: rgba(30, 10, 30, 0.72); color: #fff; backdrop-filter: blur(4px);
}
.dur { right: 8px; font-variant-numeric: tabular-nums; }
.seen { left: 8px; background: rgba(255, 107, 157, 0.9); }
.official.new { background: linear-gradient(135deg, #ff4757, #ff9f43); animation: newPulse 1.6s ease-in-out infinite; }
@keyframes newPulse { 50% { transform: scale(1.08); } }
.official { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; padding: 4px 8px; border-radius: 8px; color: #fff; background: linear-gradient(135deg, #ff6b9d, #a06cd5); box-shadow: 0 4px 12px rgba(160, 108, 213, 0.5); }
.body { padding: 12px 14px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.pill { align-self: flex-start; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #fff0f6; color: #a33366; }
.pill[data-cat='live'] { background: #ffefe3; color: #9c4510; }
.pill[data-cat='dance'] { background: #e9f8f3; color: #136b53; }
.pill[data-cat='making'] { background: #eef1ff; color: #4b55c9; }
.pill[data-cat='birthday'] { background: #fff6d8; color: #735600; }
.pill[data-cat='vlog'] { background: #e7f6fd; color: #12628a; }
.pill[data-cat='mv'] { background: #f4ecff; color: #7a3fc4; }
.ttl {
  font-family: 'Noto Sans JP', 'Noto Sans KR', sans-serif; font-size: 14.5px; line-height: 1.45; margin: 0; font-weight: 700;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  border: 0; padding: 0;
}
.meta { display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 0; font-size: 12px; color: #735779; }
.dots { display: flex; flex-wrap: wrap; gap: 4px; margin-top: auto; padding-top: 4px; }
.dot { font-size: 11px; font-weight: 700; padding: 2px 8px 2px 18px; border-radius: 999px; position: relative; background: color-mix(in srgb, var(--mc) 14%, white); color: color-mix(in srgb, var(--mc) min(60%, var(--ink-mix, 100%)), #2a1030); }
.dot::before { content: ''; position: absolute; left: 7px; top: 50%; width: 7px; height: 7px; border-radius: 50%; background: var(--mc); translate: 0 -50%; }

.va-empty { text-align: center; padding: 80px 0; color: #735779; }
.va-more { display: flex; justify-content: center; margin-top: 36px; }
.va-more button {
  padding: 14px 28px; border-radius: 999px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #ff6b9d, #c49cff); box-shadow: 0 12px 30px -12px rgba(255, 107, 157, 0.8);
  transition: transform 0.5s var(--spring);
}
.va-more button:hover { transform: translateY(-3px) scale(1.03); }
.va-more small { opacity: 0.85; font-weight: 500; }

.va-dialog {
  border: 0; padding: 0; background: transparent; width: min(1080px, 94vw); max-width: none; overflow: visible;
  opacity: 1; scale: 1;
  transition: opacity 0.3s, scale 0.45s var(--spring), display 0.3s allow-discrete, overlay 0.3s allow-discrete;
}
.va-dialog::backdrop { background: rgba(40, 10, 40, 0.6); backdrop-filter: blur(10px); }
@starting-style { .va-dialog[open] { opacity: 0; scale: 0.85; } }
.va-player { border-radius: 24px; overflow: hidden; background: #1b0f1d; box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6); }
.frame { aspect-ratio: 16 / 9; }
.frame iframe { width: 100%; height: 100%; border: 0; display: block; }
.va-player-bar { display: flex; align-items: center; gap: 14px; padding: 12px 16px; color: #fff; }
.va-player-bar p { flex: 1; margin: 0; font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.va-queue { display: flex; align-items: center; gap: 10px; padding: 0 16px 14px; color: #fff; }
.auto { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; white-space: nowrap; }
.auto input { accent-color: #ff6b9d; }
.next { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 14px; background: rgba(255, 255, 255, 0.1); color: #fff; text-align: left; transition: background 0.2s; }
.next:hover { background: rgba(255, 255, 255, 0.18); }
.next img { width: 56px; height: 42px; object-fit: cover; border-radius: 8px; flex: none; }
.next span { min-width: 0; display: flex; flex-direction: column; font-size: 13px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.next small { font-size: 11px; color: #ffb3cf; }
.next b { margin-left: auto; color: #ffb3cf; }
.va-player-bar a { color: #ffb3cf; font-size: 13px; font-weight: 700; white-space: nowrap; }
.x { width: 36px; height: 36px; border-radius: 50%; background: rgba(255, 255, 255, 0.12); color: #fff; font-size: 14px; flex: none; }

@media (max-width: 640px) {
  .va { padding: 24px 16px 72px; }
  .va-toolbar { flex-direction: column; }
  .va-dice { height: 44px; }
  .va-grid { grid-template-columns: 1fr; gap: 16px; }
  .va-toggle { margin-left: 0; }
  .va-sort { margin-left: 0; padding-left: 4px; }
  .va-player-bar a { display: none; }
  .va-queue { flex-wrap: wrap; }
  .next { flex-basis: 100%; order: 3; }
}
@media (prefers-reduced-motion: reduce) {
  .va-ch, .play, .official.new { animation: none; }
  .card { animation: none !important; }
  .card, .chip, .mchip-ring, .va-dice, .va-more button { transition: none; }
}
</style>
