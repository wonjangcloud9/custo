<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { members, memberById } from '../data/members'
import feedsRaw from '../data/feeds.json'

interface Post { id: string; title: string; kind: string; hq: boolean }
interface Item { post: Post; mid: string }
const feeds = feedsRaw as Record<string, Post[]>
const index = new Map<string, Item>()
for (const [mid, list] of Object.entries(feeds)) for (const p of list) if (!index.has(p.id)) index.set(p.id, { post: p, mid })

const ready = ref(false)
const likes = ref<string[]>([])
const shared = ref<string[] | null>(null) // album opened from a share link
const filter = ref('')
const removing = ref<string | null>(null)
const copied = ref(false)
const shareUrl = ref('')

const ids = computed(() => shared.value ?? likes.value)
const items = computed(() => ids.value.map((id) => index.get(id)).filter((x): x is Item => !!x))
const byMember = computed(() => {
  const c: Record<string, number> = {}
  for (const it of items.value) c[it.mid] = (c[it.mid] || 0) + 1
  return c
})
const shown = computed(() => items.value.filter((it) => !filter.value || it.mid === filter.value))
const topMember = computed(() => {
  const e = Object.entries(byMember.value).sort((a, b) => b[1] - a[1])[0]
  return e ? memberById[e[0]] : null
})

function save() { try { localStorage.setItem('custo-likes', JSON.stringify(likes.value)) } catch { /* ignore */ } }
function remove(id: string) {
  removing.value = id
  setTimeout(() => { likes.value = likes.value.filter((x) => x !== id); save(); removing.value = null }, 380)
}
function importShared() {
  if (!shared.value) return
  likes.value = [...new Set([...likes.value, ...shared.value])]; save()
  shared.value = null
  history.replaceState(history.state, '', location.pathname)
}
async function share() {
  const url = `${location.origin}${location.pathname}?ids=${likes.value.join(',')}`
  try { await navigator.clipboard.writeText(url); copied.value = true; setTimeout(() => (copied.value = false), 1600) } catch { shareUrl.value = url }
}
// deterministic tilt per photo
const tilt = (id: string) => ((id.charCodeAt(0) * 7 + id.charCodeAt(5)) % 9) - 4
const caption = (t: string) => t.replace(/【[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍.*/, '').trim()

onMounted(() => {
  try { likes.value = JSON.parse(localStorage.getItem('custo-likes') || '[]') } catch { /* private mode */ }
  const q = new URLSearchParams(location.search).get('ids')
  if (q) shared.value = q.split(',').filter((x) => /^[\w-]{11}$/.test(x)).slice(0, 200)
  ready.value = true
})
</script>

<template>
  <section class="la">
    <header class="la-head">
      <p v-if="shared" class="eyebrow">SHARED ALBUM</p>
      <h2>{{ shared ? '친구가 공유한 레전드 컷' : '나만의 레전드 앨범' }} <small>{{ items.length }}컷</small></h2>
      <p v-if="topMember && !shared" class="sub">최애 지수 1위: <b class="top" :style="{ '--mc': topMember.color }">{{ topMember.emoji }} {{ topMember.ko }}</b> ({{ byMember[topMember.id] }}컷)</p>
      <div class="acts">
        <button v-if="shared" type="button" class="btn primary" @click="importShared">내 앨범에 모두 담기 ♡</button>
        <button v-else-if="likes.length" type="button" class="btn primary" @click="share">{{ copied ? '링크 복사됨 ✓' : '앨범 공유 링크 복사' }}</button>
      </div>
      <input v-if="shareUrl" class="share-url" :value="shareUrl" readonly aria-label="공유 링크" @focus="($event.target as HTMLInputElement).select()" />
    </header>

    <div v-if="items.length" class="chips" role="toolbar" aria-label="멤버별">
      <button type="button" class="chip" :aria-pressed="!filter" @click="filter = ''">전체 <small>{{ items.length }}</small></button>
      <button v-for="m in members.filter((x) => byMember[x.id])" :key="m.id" type="button" class="chip" :aria-pressed="filter === m.id"
        :style="{ '--mc': m.color }" @click="filter = m.id">{{ m.emoji }} {{ m.ko.split(' ')[1] }} <small>{{ byMember[m.id] }}</small></button>
    </div>

    <div v-if="items.length" class="board">
      <figure v-for="it in shown" :key="it.post.id" class="snap" :class="{ out: removing === it.post.id }"
        :style="{ '--mc': memberById[it.mid].color, '--t': tilt(it.post.id) + 'deg' }">
        <span class="tape" aria-hidden="true" />
        <a :href="`https://www.youtube.com/watch?v=${it.post.id}`" target="_blank" rel="noopener" class="ph" :aria-label="`${memberById[it.mid].ja} — ${caption(it.post.title)} (YouTube)`">
          <img :src="`https://i.ytimg.com/vi/${it.post.id}/${it.post.hq ? 'maxresdefault' : 'hqdefault'}.jpg`" alt="" loading="lazy" />
        </a>
        <figcaption>
          <b>{{ memberById[it.mid].ja }}</b>
          <small>{{ caption(it.post.title) }}</small>
        </figcaption>
        <button v-if="!shared" type="button" class="rm" :aria-label="`${memberById[it.mid].ko} 컷 앨범에서 빼기`" @click="remove(it.post.id)">♥</button>
      </figure>
    </div>

    <div v-else-if="ready" class="empty">
      <div class="empty-art" aria-hidden="true"><span v-for="(m, i) in members" :key="m.id" :style="{ '--mc': m.color, '--i': i }">♡</span></div>
      <p><b>아직 담은 컷이 없어요</b><br />멤버 페이지 레전드 피드에서 사진을 <b>더블탭</b>하면 여기에 모여요!</p>
      <a class="btn primary" :href="withBase('/members/')">멤버 만나러 가기 →</a>
    </div>
  </section>
</template>

<style scoped>
.la { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px 0 40px; }
.la-head { padding: 26px 28px; border-radius: 28px; background: linear-gradient(150deg, #fff0f7, #f3ebff); border: 1.5px dashed #f2c6db; }
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 800; letter-spacing: 0.22em; color: #c2457a; }
.la-head h2 { margin: 6px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(26px, 4vw, 38px) !important; }
.la-head h2 small { font-size: 16px; color: #e8558a; margin-left: 6px; }
.sub { margin: 6px 0 0 !important; font-size: 14px; }
.acts { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
.btn { display: inline-block; padding: 11px 18px; border-radius: 999px; font-weight: 700; font-size: 14px; background: #fff; color: var(--ink) !important; text-decoration: none !important; border: 1.5px solid #f3cfe0; transition: transform 0.45s var(--spring); }
.btn.primary { background: var(--ink); color: #fff !important; border-color: var(--ink); }
.btn:hover { transform: translateY(-2px) rotate(-1deg); }
.share-url { width: 100%; margin-top: 10px; padding: 10px 12px; border-radius: 12px; border: 1.5px solid #f1dce7; font-size: 12px; background: #fff; }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 20px 0 6px; }
.chips::-webkit-scrollbar { display: none; }
.chip { flex: none; padding: 8px 13px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #fff; border: 1.5px solid #f1dce7; color: var(--ink); transition: transform 0.45s var(--spring); }
.chip small { opacity: 0.55; }
.chip[aria-pressed='true'] { background: color-mix(in srgb, var(--mc, #3a2340) 62%, #2a1030); border-color: transparent; color: #fff; }

.board { columns: 4 220px; column-gap: 22px; margin-top: 18px; }
.snap { position: relative; break-inside: avoid; margin: 0 0 26px; padding: 10px 10px 14px; background: #fff; border-radius: 4px;
  box-shadow: 0 2px 0 #f2e4ec, 0 18px 30px -18px rgba(90, 30, 70, 0.45); transform: rotate(var(--t)); transition: transform 0.6s var(--spring), opacity 0.35s, scale 0.35s;
  animation: drop 0.7s var(--spring) both; }
@keyframes drop { from { opacity: 0; transform: translateY(-30px) rotate(calc(var(--t) * 3)); } }
.snap:hover { transform: rotate(0deg) scale(1.03); z-index: 2; }
.snap.out { opacity: 0; scale: 0.6; }
.tape { position: absolute; top: -10px; left: 50%; width: 70px; height: 20px; translate: -50% 0; rotate: -4deg; background: color-mix(in srgb, var(--mc) 50%, rgba(255, 255, 255, 0.5)); opacity: 0.85; }
.ph { display: block; aspect-ratio: 4 / 5; overflow: hidden; background: color-mix(in srgb, var(--mc) 15%, white); }
.ph img { width: 100%; height: 100%; object-fit: cover; }
figcaption { display: flex; flex-direction: column; padding: 8px 2px 0; }
figcaption b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 15px; color: color-mix(in srgb, var(--mc) min(65%, var(--ink-mix, 100%)), #2a1030); }
figcaption small { font-size: 11.5px; color: #735779; font-family: 'Noto Sans JP', sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rm { position: absolute; right: 16px; top: 16px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); color: #ff3b6f; font-size: 18px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); transition: transform 0.4s var(--spring); }
.rm:hover { transform: scale(1.15) rotate(-12deg); }

.empty { text-align: center; padding: 50px 16px; }
.empty-art { display: flex; justify-content: center; gap: 6px; font-size: 30px; margin-bottom: 14px; }
.empty-art span { color: var(--mc); animation: bob 1.8s var(--spring) infinite; animation-delay: calc(var(--i) * 120ms); }
@keyframes bob { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } }
.empty p { font-size: 15px; line-height: 1.8; margin-bottom: 18px !important; }
@media (max-width: 640px) { .board { columns: 2; column-gap: 12px; } .la-head { padding: 20px; } }
@media (prefers-reduced-motion: reduce) { .snap, .empty-art span { animation: none; } .snap, .rm, .btn, .chip { transition: none; } }
.la-head .top { color: color-mix(in srgb, var(--mc) 50%, #2a1030); }
</style>
