<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { releases, cutieLand, MV, officialUrl, type Release, type RelType } from '../data/discography'
import { members } from '../data/members'
import videosRaw from '../data/videos.json'
import apRaw from '../data/appearances.json'
import { songs } from '../data/songs'

interface Video { id: string; title: string; duration: string; category: string; channel?: string }
const videos = videosRaw as Video[]

const TYPES: { id: 'ALL' | RelType; label: string }[] = [
  { id: 'ALL', label: '전체' }, { id: 'ALBUM', label: 'ALBUM' }, { id: 'SINGLE', label: 'CD SINGLE' }, { id: 'DIGITAL', label: 'DIGITAL' }, { id: 'VIDEO', label: 'LIVE FILM' },
]
const type = ref<'ALL' | RelType>('ALL')
const counts = computed(() => {
  const c: Record<string, number> = { ALL: releases.length }
  for (const r of releases) c[r.type] = (c[r.type] || 0) + 1
  return c
})
const years = computed(() => {
  const list = releases.filter((r) => type.value === 'ALL' || r.type === type.value)
  const out: { year: string; items: Release[] }[] = []
  for (const r of list) {
    const y = r.date.slice(0, 4)
    let g = out.find((x) => x.year === y)
    if (!g) { g = { year: y, items: [] }; out.push(g) }
    g.items.push(r)
  }
  return out
})

// deterministic sleeve palette from release id → 2 member colors
const palette = (r: Release) => [members[r.id % 8].color, members[(r.id * 7 + 3) % 8].color]
const sleeveImg = (r: Release) => (r.mv ? `https://i.ytimg.com/vi/${r.mv}/hqdefault.jpg` : '')

// detail dialog
const dialog = ref<HTMLDialogElement | null>(null)
const cur = ref<Release | null>(null)
const playing = ref(false)
const norm = (s: string) => s.replace(/[！!？?、。・\s『』「」（）()-]/g, '').toLowerCase()
// other titles the same song goes by (Korean versions / English titles used by Korean broadcasters)
const ALIAS: Record<string, string[]> = {
  'かわいいだけじゃだめですか？': ['귀엽기만 하면 안 되나요', "Isn't Being Cute Enough"],
  'キュートなキューたい': ['동글동글 동글이', 'CUTIE SPHERE'],
  'ぷりきゅきゅ': ['프리큐큐', 'Puri Cu Cu'],
  'きゅーすとのうた': ['큐스토의 노래'],
}
interface Rel { id: string; title: string; tab: string; sub: string }
const TABS = [
  { id: 'all', label: '전체' }, { id: 'mv', label: '🎬 MV' }, { id: 'dance', label: '💃 안무·FOCUS' }, { id: 'live', label: '🎤 라이브' },
  { id: 'tv', label: '📺 다른 채널' }, { id: 'etc', label: '✨ 기타' },
]
const tab = ref('all')
const shown = ref(8)
const related = computed<Rel[]>(() => {
  if (!cur.value) return []
  const keys = [cur.value.song, ...(ALIAS[cur.value.song] || [])].map(norm).filter((k) => k.length >= 2)
  if (!keys.length) return []
  const hit = (t: string) => { const n = norm(t); return keys.some((k) => n.includes(k)) }
  const own: Rel[] = videos.filter((v) => v.id !== cur.value!.mv && hit(v.title)).map((v) => ({
    id: v.id, title: clean(v.title), sub: v.duration || '',
    tab: v.category === 'mv' ? 'mv' : v.category === 'dance' ? 'dance' : v.category === 'live' ? 'live' : 'etc',
  }))
  const other: Rel[] = (apRaw as { id: string; title: string; ch: string }[]).filter((a) => a.id !== cur.value!.mv && hit(a.title))
    .map((a) => ({ id: a.id, title: a.title, sub: a.ch, tab: 'tv' }))
  return [...own, ...other]
})
const tabCount = (t: string) => (t === 'all' ? related.value.length : related.value.filter((r) => r.tab === t).length)
const relList = computed(() => (tab.value === 'all' ? related.value : related.value.filter((r) => r.tab === tab.value)))
const songPage = (title: string) => songs.find((s) => norm(s.title) === norm(title))?.id
function open(r: Release) { cur.value = r; playing.value = false; tab.value = 'all'; shown.value = 8; nextTick(() => dialog.value?.showModal()) }
function close() { dialog.value?.close() }

// album countdown
const days = ref<number | null>(null)
onMounted(() => {
  days.value = Math.ceil((new Date(`${cutieLand.date}T00:00:00+09:00`).getTime() - Date.now()) / 86400000)
})
const fmt = (d: string) => d.replace(/-/g, '.')
const clean = (t: string) => t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍[^【]*/, '').trim()
</script>

<template>
  <section class="ds">
    <!-- CUTIE LAND hero -->
    <div class="hero">
      <div class="hero-art" aria-hidden="true">
        <div class="sleeve big"><span class="sleeve-title">CUTIE<br />LAND</span><span class="sleeve-sub">CUTIE STREET 1st ALBUM</span></div>
        <div class="disc big"><span class="disc-label">CUTIE<br />LAND</span></div>
      </div>
      <div class="hero-info">
        <p class="eyebrow">1st ALBUM · {{ fmt(cutieLand.date) }} RELEASE</p>
        <h2 class="hero-title">CUTIE LAND</h2>
        <p class="hero-d">{{ days === null ? '' : days > 0 ? `발매까지 D-${days}` : days === 0 ? '오늘 발매! 🎉' : '발매 중 💿' }}</p>
        <ol class="tracks">
          <li v-for="(t, i) in cutieLand.tracks" :key="t" :style="{ '--tc': members[i % 8].color }">
            <span class="tn">{{ String(i + 1).padStart(2, '0') }}</span>
            <a v-if="MV[t]" :href="`https://www.youtube.com/watch?v=${MV[t]}`" target="_blank" rel="noopener">{{ t }} <small>▶ MV</small></a>
            <span v-else>{{ t }}</span>
          </li>
        </ol>
        <div class="eds">
          <span v-for="e in cutieLand.editions" :key="e.code" class="ed"><b>{{ e.name }}</b> {{ e.spec }} · {{ e.price }}</span>
        </div>
        <a class="cta" :href="withBase('/cutie-land/')">트랙별 가이드 보기 →</a> <a class="cta" :href="cutieLand.url" target="_blank" rel="noopener">공식 앨범 특설 페이지 ↗</a>
      </div>
    </div>

    <!-- filters -->
    <div class="chips" role="toolbar" aria-label="릴리즈 종류">
      <button v-for="t in TYPES" :key="t.id" type="button" class="chip" :aria-pressed="type === t.id" @click="type = t.id">
        {{ t.label }} <small>{{ counts[t.id] || 0 }}</small>
      </button>
    </div>

    <!-- shelves -->
    <div v-for="g in years" :key="g.year" class="year">
      <h3 class="yr">{{ g.year }}</h3>
      <div class="shelf">
        <button v-for="r in g.items" :key="r.id" type="button" class="rec" :class="r.type.toLowerCase()" :aria-label="`${r.title} 상세 보기`"
          :style="{ '--c1': palette(r)[0], '--c2': palette(r)[1] }" @click="open(r)">
          <span class="disc" aria-hidden="true"><span class="disc-label">{{ r.song.slice(0, 6) }}</span></span>
          <span class="sleeve">
            <img v-if="sleeveImg(r)" :src="sleeveImg(r)" alt="" loading="lazy" />
            <span v-else class="sleeve-title sm">{{ r.song }}</span>
            <span class="type">{{ r.type }}</span>
            <span v-if="r.mv" class="has-mv">▶ {{ r.mvKind }}</span>
          </span>
          <span class="meta"><b>{{ r.title }}</b><small>{{ fmt(r.date) }}<template v-if="r.note"> · {{ r.note }}</template></small></span>
        </button>
      </div>
    </div>

    <!-- detail -->
    <dialog ref="dialog" class="dlg" aria-label="릴리즈 상세" @close="cur = null; playing = false" @click="(e) => e.target === dialog && close()">
      <div v-if="cur" class="dlg-card" :style="{ '--c1': palette(cur)[0], '--c2': palette(cur)[1] }">
        <div class="dlg-top">
          <span class="type">{{ cur.type }}</span>
          <b>{{ cur.title }}</b>
          <button type="button" class="x" aria-label="닫기" @click="close">✕</button>
        </div>
        <div v-if="cur.mv" class="dlg-media">
          <iframe v-if="playing" :src="`https://www.youtube-nocookie.com/embed/${cur.mv}?autoplay=1&rel=0`" :title="cur.title" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen />
          <button v-else type="button" class="poster" @click="playing = true">
            <img :src="`https://i.ytimg.com/vi/${cur.mv}/maxresdefault.jpg`" alt="" /><span>▶ {{ cur.mvKind }} 재생</span>
          </button>
        </div>
        <div class="dlg-body">
          <p class="dlg-meta">{{ fmt(cur.date) }} 릴리즈<template v-if="cur.note"> · {{ cur.note }}</template> · <a :href="officialUrl(cur.id)" target="_blank" rel="noopener">공식 상세 ↗</a></p>
          <a v-if="songPage(cur.song)" class="story-link" :href="withBase(`/discography/${songPage(cur.song)}`)">📖 「{{ cur.song }}」 곡 이야기 보기 →</a>
          <template v-if="related.length">
            <h4>관련 영상 {{ related.length }}</h4>
            <div class="rtabs" role="tablist" aria-label="관련 영상 종류">
              <template v-for="t in TABS" :key="t.id">
                <button v-if="tabCount(t.id)" type="button" role="tab" class="rtab" :aria-selected="tab === t.id" @click="tab = t.id; shown = 8">{{ t.label }} <small>{{ tabCount(t.id) }}</small></button>
              </template>
            </div>
            <div class="rel">
              <a v-for="v in relList.slice(0, shown)" :key="v.id" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener" class="rv">
                <img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" />
                <span>{{ v.title }}</span>
                <small v-if="v.sub" class="rv-sub">{{ v.tab === 'tv' ? '📺 ' : '' }}{{ v.sub }}</small>
              </a>
            </div>
            <button v-if="relList.length > shown" type="button" class="more" @click="shown += 12">더 보기 ({{ relList.length - shown }}) ↓</button>
          </template>
        </div>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.ds {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px 0 32px;
}
/* HERO */
.hero { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 36px; align-items: center; padding: 28px; border-radius: 32px; background: linear-gradient(150deg, #fff0f7, #f1e8ff 60%, #fff8f0); border: 1.5px solid #f3d9e8; }
.hero-art { position: relative; aspect-ratio: 1.25; }
.sleeve.big { position: absolute; left: 0; top: 6%; width: 78%; aspect-ratio: 1; border-radius: 14px; z-index: 2;
  background: conic-gradient(from 210deg at 30% 30%, #ffc93c, #ff4757, #3ccfa8, #4a90d9, #ff9f43, #5dc8f5, #a06cd5, #ff6b9d, #ffc93c);
  box-shadow: 0 30px 50px -24px rgba(90, 30, 70, 0.6); display: flex; flex-direction: column; justify-content: flex-end; padding: 22px; overflow: hidden; }
.sleeve.big::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.65), transparent 45%), repeating-radial-gradient(circle at 70% 120%, rgba(255, 255, 255, 0.08) 0 8px, transparent 8px 16px); }
.sleeve-title { position: relative; z-index: 1; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; color: #fff; font-size: clamp(40px, 6vw, 72px); line-height: 0.92; text-shadow: 0 4px 0 rgba(0, 0, 0, 0.12); }
.sleeve-sub { position: relative; z-index: 1; color: #fff; font-size: 12px; letter-spacing: 0.2em; font-weight: 800; margin-top: 10px; }
.disc { border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle, #fff 0 7%, #e9e2ee 7.5% 9%, transparent 9.5%), repeating-radial-gradient(circle, #241a28 0 1px, #2f2234 1px 3px), conic-gradient(from 30deg, rgba(255, 255, 255, 0.25), transparent 20%, rgba(255, 255, 255, 0.18) 50%, transparent 70%);
  background-blend-mode: normal, normal, screen; box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5); }
.disc-label { width: 38%; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; text-align: center; font-size: 9px; font-weight: 800; line-height: 1.05; color: #fff; overflow: hidden;
  background: linear-gradient(135deg, var(--c1, #ff6b9d), var(--c2, #a06cd5)); }
.disc.big { position: absolute; right: 0; top: 10%; width: 72%; aspect-ratio: 1; z-index: 1; animation: spin 6s linear infinite; }
.disc.big .disc-label { font-size: clamp(12px, 1.6vw, 18px); font-family: 'Zen Maru Gothic', sans-serif; background: conic-gradient(#ff6b9d, #a06cd5, #4a90d9, #3ccfa8, #ffc93c, #ff6b9d); }
@keyframes spin { to { transform: rotate(360deg); } }
.eyebrow { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.2em; color: #c2457a; }
.hero-title { margin: 6px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(40px, 6vw, 64px) !important; line-height: 1 !important; }
.hero-d { margin: 6px 0 0 !important; font-weight: 800; color: #e8558a; font-size: 18px; min-height: 1.5em; }
.tracks { columns: 2; column-gap: 18px; margin: 14px 0 0 !important; padding: 0 !important; list-style: none; }
.tracks li { break-inside: avoid; display: flex; gap: 8px; align-items: baseline; font-size: 13px; margin: 0 0 6px !important; font-family: 'Noto Sans JP', sans-serif; }
.tn { font-size: 11px; font-weight: 800; color: var(--tc); font-variant-numeric: tabular-nums; }
.tracks a { color: var(--ink) !important; text-decoration: none !important; border-bottom: 2px solid color-mix(in srgb, var(--tc) 50%, transparent); }
.tracks a small { font-size: 10px; color: var(--tc); font-weight: 800; }
.eds { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.ed { font-size: 11.5px; padding: 5px 10px; border-radius: 999px; background: #fff; border: 1px solid #f0dbe7; }
.cta { display: inline-block; margin-top: 14px; padding: 10px 18px; border-radius: 999px; background: var(--ink); color: #fff !important; font-weight: 700; font-size: 13px; text-decoration: none !important; transition: transform 0.45s var(--spring); }
.cta:hover { transform: translateY(-2px) rotate(-1deg); }

.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 28px 0 4px; }
.chips::-webkit-scrollbar { display: none; }
.chip { flex: none; padding: 8px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; border: 1.5px solid #f1dce7; color: var(--ink); transition: transform 0.45s var(--spring); }
.chip small { opacity: 0.55; }
.chip:active { transform: scale(0.9); }
.chip[aria-pressed='true'] { background: var(--ink); color: #fff; border-color: var(--ink); }

.year { margin-top: 22px; }
.yr { margin: 0 0 6px !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 34px !important; color: #b07a98; letter-spacing: 0.04em; }
.shelf { display: flex; gap: 22px; overflow-x: auto; padding: 14px 6px 22px; scroll-snap-type: x proximity; scrollbar-width: thin; }
.rec { position: relative; flex: none; width: 168px; scroll-snap-align: start; background: none; padding: 0; text-align: left; cursor: pointer; }
.rec .disc { position: absolute; top: 8px; left: 8px; width: 152px; aspect-ratio: 1; transition: transform 0.8s var(--spring); }
.rec { display: flex; flex-direction: column; align-items: stretch; }
.rec .sleeve { position: relative; display: block; width: 168px; aspect-ratio: 1; border-radius: 10px; overflow: hidden; z-index: 1;
  background: linear-gradient(140deg, var(--c1), var(--c2)); box-shadow: 0 16px 26px -16px rgba(90, 30, 70, 0.7); transition: transform 0.6s var(--spring); }
.rec .sleeve img { width: 100%; height: 100%; object-fit: cover; }
.sleeve-title.sm { position: absolute; inset: auto 12px 14px 12px; font-size: 22px; line-height: 1.05; word-break: break-word; }
.type { position: absolute; top: 8px; left: 8px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.14em; padding: 3px 7px; border-radius: 6px; background: rgba(255, 255, 255, 0.92); color: var(--ink); }
.album .type { background: #c92f69; color: #fff; }
.single .type { background: #7a3fb0; color: #fff; }
.has-mv { position: absolute; right: 8px; bottom: 8px; font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 6px; background: rgba(30, 10, 30, 0.75); color: #fff; }
.rec:hover .disc, .rec:focus-visible .disc { transform: translateX(62px) rotate(200deg); }
.rec:hover .sleeve, .rec:focus-visible .sleeve { transform: translateX(-8px) rotate(-3deg); }
.meta { display: flex; flex-direction: column; gap: 2px; margin-top: 12px; padding-right: 8px; }
.meta b { font-size: 13px; line-height: 1.35; font-family: 'Noto Sans JP', 'Noto Sans KR', sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.meta small { font-size: 11.5px; color: #735779; }
.shelf { padding-right: 70px; }

.dlg { border: 0; padding: 0; background: transparent; width: min(760px, 96vw); max-width: none; max-height: 92dvh;
  transition: opacity 0.25s, scale 0.45s var(--spring), display 0.25s allow-discrete, overlay 0.25s allow-discrete; }
.dlg::backdrop { background: rgba(20, 5, 20, 0.7); backdrop-filter: blur(8px); }
@starting-style { .dlg[open] { opacity: 0; scale: 0.9; } }
.dlg-card { background: #fff; border-radius: 22px; overflow: hidden; color: var(--ink); }
.dlg-top { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: linear-gradient(120deg, color-mix(in srgb, var(--c1) 25%, white), color-mix(in srgb, var(--c2) 25%, white)); }
.dlg-top .type { position: static; }
.dlg-top b { font-size: 15px; font-family: 'Noto Sans JP', sans-serif; }
.x { margin-left: auto; width: 32px; height: 32px; border-radius: 50%; background: rgba(255, 255, 255, 0.8); flex: none; }
.dlg-media { aspect-ratio: 16 / 9; background: #12060f; }
.dlg-media iframe { width: 100%; height: 100%; border: 0; display: block; }
.poster { position: relative; width: 100%; height: 100%; padding: 0; display: block; }
.poster img { width: 100%; height: 100%; object-fit: cover; }
.poster span { position: absolute; left: 50%; bottom: 16px; translate: -50% 0; padding: 10px 18px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); font-weight: 800; font-size: 14px; transition: transform 0.4s var(--spring); }
.poster:hover span { transform: scale(1.06); }
.dlg-body { padding: 14px 16px 18px; max-height: 40dvh; overflow: auto; }
.dlg-meta { margin: 0 !important; font-size: 13px; color: #735779; }
.story-link { display: inline-block; margin-top: 10px; padding: 7px 14px; border-radius: 999px; background: #2f1a35; color: #fff !important; font-size: 13px; font-weight: 800; text-decoration: none !important; }
.dlg-body h4 { margin: 14px 0 8px !important; font-size: 14px; }
.rtabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.rtab { padding: 5px 11px; border-radius: 999px; font-size: 12.5px; font-weight: 700; background: #faf1f6; color: #2f1a35; transition: background 0.2s, transform 0.35s cubic-bezier(.34, 1.56, .64, 1); }
.rtab small { color: #735779; }
.rtab:hover { transform: translateY(-1px); }
.rtab[aria-selected='true'] { background: #2f1a35; color: #fff; }
.rtab[aria-selected='true'] small { color: #f3dbe7; }
.rv-sub { display: block; font-size: 11.5px; color: #6a4f70; }
.more { display: block; margin: 12px auto 0; padding: 8px 18px; border-radius: 999px; font-size: 13px; font-weight: 800; background: #fff; color: #a33366; box-shadow: inset 0 0 0 1.5px #f1d4e1; }
.rel { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr)); gap: 10px; }
.rv { text-decoration: none !important; color: var(--ink) !important; font-size: 12px; line-height: 1.4; }
.rv img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 10px; display: block; margin-bottom: 4px; }
.rv span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Noto Sans JP', sans-serif; }

@media (max-width: 760px) {
  .hero { grid-template-columns: 1fr; padding: 20px; gap: 18px; }
  .hero-art { max-width: 320px; }
  .tracks { columns: 1; }
  .rec, .rec .sleeve { width: 136px; }
  .rec .disc { width: 120px; }
  .rec:hover .disc { transform: translateX(44px) rotate(200deg); }
}
@media (prefers-reduced-motion: reduce) {
  .disc.big { animation: none; }
  .rec .disc, .rec .sleeve, .chip, .cta { transition: none; }
}
</style>
