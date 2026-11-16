<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { memberById } from '../data/members'
import feedsRaw from '../data/feeds.json'

interface Post { id: string; title: string; kind: string; hq: boolean }
const props = defineProps<{ id: string }>()
const m = computed(() => memberById[props.id])
const all = computed(() => ((feedsRaw as Record<string, Post[]>)[props.id] || []))

const KINDS = [
  { id: 'all', label: '전체', icon: '✦' },
  { id: 'teaser', label: 'MV 티저', icon: '🎬' },
  { id: 'fancam', label: '직캠', icon: '📸' },
  { id: 'birthday', label: '생탄제', icon: '🎂' },
  { id: 'live', label: 'LIVE', icon: '🎤' },
  { id: 'vlog', label: 'VLOG', icon: '🧳' },
  { id: 'moment', label: '모먼트', icon: '🍬' },
]
const kindOf = Object.fromEntries(KINDS.map((k) => [k.id, k]))
const counts = computed(() => {
  const c: Record<string, number> = { all: all.value.length }
  for (const p of all.value) c[p.kind] = (c[p.kind] || 0) + 1
  return c
})
const highlights = computed(() => KINDS.filter((k) => k.id === 'all' || counts.value[k.id]))

const kind = ref('all')
const PAGE = 12
const shown = ref(PAGE)
const posts = computed(() => all.value.filter((p) => kind.value === 'all' || p.kind === kind.value))
const visible = computed(() => posts.value.slice(0, shown.value))

const likes = ref<Set<string>>(new Set())
const burst = ref<string | null>(null)
function saveLikes() { try { localStorage.setItem('custo-likes', JSON.stringify([...likes.value])) } catch { /* ignore */ } }
function toggleLike(id: string, force?: boolean) {
  const s = new Set(likes.value)
  const on = force ?? !s.has(id)
  on ? s.add(id) : s.delete(id)
  likes.value = s; saveLikes()
  if (on) { burst.value = id; setTimeout(() => { if (burst.value === id) burst.value = null }, 900) }
}
const myLikes = computed(() => all.value.filter((p) => likes.value.has(p.id)).length)

// click = open, double-click = like (Instagram gesture)
let clickTimer: number | undefined
function onTile(p: Post, i: number) {
  clearTimeout(clickTimer)
  clickTimer = window.setTimeout(() => open(i), 230)
}
function onTileDbl(p: Post) { clearTimeout(clickTimer); toggleLike(p.id, true) }

// lightbox
const dialog = ref<HTMLDialogElement | null>(null)
const cur = ref(-1)
const playing = ref(false)
const post = computed(() => (cur.value >= 0 ? posts.value[cur.value] : null))
function open(i: number) { cur.value = i; playing.value = false; nextTick(() => dialog.value?.showModal()) }
function close() { dialog.value?.close() }
function step(d: number) { const n = posts.value.length; cur.value = (cur.value + d + n) % n; playing.value = false }
function onKey(e: KeyboardEvent) { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1) }
let touchX = 0
function onTouchStart(e: TouchEvent) { touchX = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) { const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1) }

const img = (p: Post, size: 'max' | 'hq' = 'max') => `https://i.ytimg.com/vi/${p.id}/${size === 'max' && p.hq ? 'maxresdefault' : 'hqdefault'}.jpg`
function caption(t: string) {
  return t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/\s+/g, ' ').trim()
}

onMounted(() => {
  try { likes.value = new Set(JSON.parse(localStorage.getItem('custo-likes') || '[]')) } catch { /* private mode */ }
})
</script>

<template>
  <section v-if="m" class="feed" :style="{ '--mc': m.color }">
    <!-- profile header -->
    <header class="ig-head">
      <div class="ig-avatar"><span>{{ m.ja.slice(-2, -1) }}</span></div>
      <div class="ig-meta">
        <div class="ig-row">
          <b class="ig-handle">{{ m.instagram }}</b>
          <a class="ig-btn" :href="`https://www.instagram.com/${m.instagram}/`" target="_blank" rel="noopener">Instagram ↗</a>
        </div>
        <ul class="ig-stats">
          <li><b>{{ all.length }}</b> 레전드 컷</li>
          <li><b>{{ counts.teaser || 0 }}</b> MV 티저</li>
          <li><b>{{ myLikes }}</b> 내 ♡</li>
        </ul>
        <p class="ig-bio"><b>{{ m.ja }}</b> {{ m.emoji }} {{ m.nickname }}<br />CUTIE STREET · {{ m.colorName }} · 더블탭으로 ♡</p>
      </div>
    </header>

    <!-- story highlights as filters -->
    <div class="hl" role="tablist" aria-label="카테고리">
      <button v-for="k in highlights" :key="k.id" type="button" role="tab" class="hl-item" :aria-selected="kind === k.id"
        @click="kind = k.id; shown = PAGE">
        <span class="hl-ring"><span class="hl-in">{{ k.icon }}</span></span>
        <small>{{ k.label }}</small>
      </button>
    </div>

    <!-- grid -->
    <div class="grid">
      <button v-for="(p, i) in visible" :key="p.id" type="button" class="tile" :aria-label="caption(p.title)"
        :style="{ '--i': i % PAGE }" @click="onTile(p, i)" @dblclick.prevent="onTileDbl(p)">
        <img :src="img(p)" :alt="''" loading="lazy" decoding="async" />
        <span class="kind" aria-hidden="true">{{ kindOf[p.kind]?.icon }}</span>
        <span class="ov" aria-hidden="true"><span>{{ likes.has(p.id) ? '♥' : '♡' }}</span><span>▶</span></span>
        <span v-if="likes.has(p.id)" class="liked" aria-hidden="true">♥</span>
        <span v-if="burst === p.id" class="burst" aria-hidden="true">♥</span>
      </button>
    </div>
    <div class="feed-foot">
      <button v-if="shown < posts.length" type="button" class="more" @click="shown += PAGE">더 보기 ({{ posts.length - shown }})</button>
      <a class="arch" :href="withBase(`/videos/?m=${m.id}`)">영상 아카이브에서 보기 →</a>
    </div>

    <!-- lightbox -->
    <dialog ref="dialog" class="lb" aria-label="레전드 컷 보기" @close="cur = -1; playing = false" @keydown="onKey"
      @click="(e) => e.target === dialog && close()">
      <div v-if="post" class="lb-card" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <div class="lb-top">
          <span class="lb-av">{{ m.ja.slice(-2, -1) }}</span>
          <b>{{ m.instagram }}</b>
          <small>{{ kindOf[post.kind]?.icon }} {{ kindOf[post.kind]?.label }}</small>
          <button type="button" class="lb-x" aria-label="닫기" @click="close">✕</button>
        </div>
        <div class="lb-media" @dblclick="toggleLike(post.id, true)">
          <iframe v-if="playing" :src="`https://www.youtube-nocookie.com/embed/${post.id}?autoplay=1&rel=0`" :title="post.title"
            allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen />
          <template v-else>
            <img :key="post.id" :src="img(post)" alt="" />
            <button type="button" class="lb-play" @click="playing = true">▶ 영상 재생</button>
            <span v-if="burst === post.id" class="burst big" aria-hidden="true">♥</span>
          </template>
          <button type="button" class="nav prev" aria-label="이전" @click="step(-1)">‹</button>
          <button type="button" class="nav next" aria-label="다음" @click="step(1)">›</button>
        </div>
        <div class="lb-bar">
          <button type="button" class="heart" :class="{ on: likes.has(post.id) }" :aria-pressed="likes.has(post.id)" @click="toggleLike(post.id)">
            {{ likes.has(post.id) ? '♥' : '♡' }}
          </button>
          <a :href="`https://www.youtube.com/watch?v=${post.id}`" target="_blank" rel="noopener" class="yt">YouTube ↗</a>
          <span class="pos">{{ cur + 1 }} / {{ posts.length }}</span>
        </div>
        <p class="lb-cap"><b>{{ m.instagram }}</b> {{ caption(post.title) }}</p>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.feed {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #2a1730;
  --ring: conic-gradient(from 200deg, var(--mc), #ffd36e, #ff6b9d, color-mix(in srgb, var(--mc) 60%, #a06cd5), var(--mc));
  margin-top: 28px; padding: 22px 0 6px; border-radius: 28px; background: #fff;
  border: 1.5px solid color-mix(in srgb, var(--mc) 18%, white); color: var(--ink);
}
.ig-head { display: flex; gap: 28px; align-items: center; padding: 0 24px 18px; }
.ig-avatar { flex: none; width: 104px; height: 104px; border-radius: 50%; padding: 4px; background: var(--ring); animation: ringspin 6s linear infinite; }
.ig-avatar span {
  display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; border: 4px solid #fff;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--mc) 40%, white), var(--mc));
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 40px; color: #fff; animation: ringspin 6s linear infinite reverse;
}
@keyframes ringspin { to { transform: rotate(360deg); } }
.ig-meta { min-width: 0; flex: 1; }
.ig-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ig-handle { font-size: 20px; font-weight: 600; }
.ig-btn { font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 10px; background: var(--mc); color: #fff !important; text-decoration: none !important; transition: transform 0.4s var(--spring); }
.ig-btn:hover { transform: translateY(-2px); }
.ig-stats { display: flex; gap: 22px; list-style: none; padding: 0 !important; margin: 12px 0 !important; }
.ig-stats li { margin: 0 !important; font-size: 14px; }
.ig-stats b { font-size: 16px; }
.ig-bio { margin: 0 !important; font-size: 13.5px; line-height: 1.6 !important; color: #5a4060; }

.hl { display: flex; gap: 18px; overflow-x: auto; padding: 8px 24px 18px; scrollbar-width: none; border-bottom: 1px solid #f3e6ee; }
.hl::-webkit-scrollbar { display: none; }
.hl-item { flex: none; display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; padding: 0; }
.hl-ring { width: 66px; height: 66px; border-radius: 50%; padding: 2.5px; background: #e9dde6; transition: transform 0.5s var(--spring); }
.hl-item[aria-selected='true'] .hl-ring { background: var(--ring); transform: scale(1.06); }
.hl-item:active .hl-ring { transform: scale(0.9); }
.hl-in { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; border: 3px solid #fff; background: #fbf4f8; font-size: 24px; }
.hl-item small { font-size: 12px; font-weight: 600; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; }
.tile {
  position: relative; aspect-ratio: 4 / 5; overflow: hidden; padding: 0; background: color-mix(in srgb, var(--mc) 15%, white);
  cursor: pointer; animation: tileIn 0.6s var(--spring) both; animation-delay: calc(var(--i) * 35ms);
}
@keyframes tileIn { from { opacity: 0; transform: scale(0.9); } }
.tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.7s cubic-bezier(.2, .8, .2, 1); }
.tile:hover img { transform: scale(1.06); }
.kind { position: absolute; top: 8px; right: 8px; font-size: 16px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5)); }
.ov { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 22px; color: #fff; font-size: 22px; font-weight: 700; background: rgba(30, 10, 30, 0.32); opacity: 0; transition: opacity 0.2s; }
.tile:hover .ov, .tile:focus-visible .ov { opacity: 1; }
.liked { position: absolute; left: 8px; bottom: 6px; color: #ff4f8b; font-size: 18px; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)); }
.burst {
  position: absolute; left: 50%; top: 50%; translate: -50% -50%; font-size: 72px; color: #fff; pointer-events: none;
  text-shadow: 0 6px 30px rgba(255, 79, 139, 0.9); animation: burst 0.9s var(--spring) forwards;
}
.burst.big { font-size: 120px; }
@keyframes burst { 0% { transform: scale(0); opacity: 0; } 15% { transform: scale(1.2); opacity: 1; } 30% { transform: scale(0.95); } 45%, 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.6) translateY(-20px); opacity: 0; } }
.feed-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px 10px; flex-wrap: wrap; }
.more { padding: 10px 20px; border-radius: 999px; background: var(--ink); color: #fff; font-weight: 700; font-size: 13px; transition: transform 0.4s var(--spring); }
.more:hover { transform: translateY(-2px); }
.arch { font-size: 13px; font-weight: 700; color: color-mix(in srgb, var(--mc) 65%, #2a1730) !important; margin-left: auto; }

/* lightbox */
.lb {
  border: 0; padding: 0; background: transparent; width: min(760px, 96vw); max-width: none; max-height: 96dvh; overflow: visible;
  transition: opacity 0.25s, scale 0.45s var(--spring), display 0.25s allow-discrete, overlay 0.25s allow-discrete;
}
.lb::backdrop { background: rgba(20, 5, 20, 0.72); backdrop-filter: blur(8px); }
@starting-style { .lb[open] { opacity: 0; scale: 0.9; } }
.lb-card { background: #fff; border-radius: 22px; overflow: hidden; color: var(--ink); }
.lb-top { display: flex; align-items: center; gap: 10px; padding: 10px 14px; }
.lb-av { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--mc); color: #fff; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--mc); }
.lb-top b { font-size: 14px; }
.lb-top small { font-size: 12px; color: #8a6a90; }
.lb-x { margin-left: auto; width: 32px; height: 32px; border-radius: 50%; background: #f6eef3; font-size: 13px; }
.lb-media { position: relative; aspect-ratio: 16 / 9; background: #12060f; }
.lb-media img, .lb-media iframe { width: 100%; height: 100%; object-fit: cover; border: 0; display: block; }
.lb-media img { animation: fadeImg 0.35s ease; }
@keyframes fadeImg { from { opacity: 0.2; } }
.lb-play { position: absolute; left: 50%; bottom: 16px; translate: -50% 0; padding: 10px 18px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); font-weight: 800; font-size: 14px; color: var(--ink); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3); transition: transform 0.4s var(--spring); }
.lb-play:hover { transform: scale(1.06); }
.nav { position: absolute; top: 50%; translate: 0 -50%; width: 38px; height: 38px; border-radius: 50%; background: rgba(255, 255, 255, 0.85); font-size: 24px; line-height: 1; color: var(--ink); }
.prev { left: 10px; } .next { right: 10px; }
.lb-bar { display: flex; align-items: center; gap: 14px; padding: 10px 14px 0; }
.heart { font-size: 28px; line-height: 1; background: none; color: var(--ink); transition: transform 0.4s var(--spring); }
.heart.on { color: #ff3b6f; animation: pulse 0.5s var(--spring); }
@keyframes pulse { 40% { transform: scale(1.35); } }
.yt { font-size: 13px; font-weight: 700; color: var(--ink) !important; }
.pos { margin-left: auto; font-size: 12px; color: #8a6a90; font-variant-numeric: tabular-nums; }
.lb-cap { margin: 0 !important; padding: 8px 14px 16px; font-size: 13.5px; line-height: 1.6 !important; font-family: 'Noto Sans JP', 'Noto Sans KR', sans-serif; }

@media (max-width: 640px) {
  .feed { border-radius: 22px; }
  .ig-head { gap: 16px; padding: 0 16px 14px; align-items: flex-start; }
  .ig-avatar { width: 78px; height: 78px; }
  .ig-avatar span { font-size: 30px; border-width: 3px; }
  .ig-handle { font-size: 17px; }
  .ig-stats { gap: 14px; }
  .ig-stats li { font-size: 12px; display: flex; flex-direction: column; align-items: center; line-height: 1.25; white-space: nowrap; }
  .hl { gap: 12px; padding: 6px 16px 14px; }
  .hl-ring { width: 58px; height: 58px; }
  .lb-media { aspect-ratio: 4 / 5; }
}
@media (prefers-reduced-motion: reduce) {
  .ig-avatar, .ig-avatar span, .tile, .burst, .heart.on, .lb-media img { animation: none !important; }
}
</style>
