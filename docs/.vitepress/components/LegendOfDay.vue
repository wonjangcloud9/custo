<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'
import { oshi as oshiState, loadOshi } from '../theme/oshi'
interface Post { id: string; title: string; kind: string; hq: boolean }
// loaded after mount (the pick depends on today's date anyway) so the home bundle stays small
const feeds = ref<Record<string, Post[]>>({})

const seed = ref<number | null>(null) // days since epoch in JST
const dateLabel = ref('')
const pickOffset = ref<Record<string, number>>({})
const mainId = ref('')
const developed = ref(false)
const root = ref<HTMLElement | null>(null)

function hash(n: number, salt: number) {
  let h = (n * 2654435761 + salt * 40503) >>> 0
  h ^= h >>> 13; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 16
  return h >>> 0
}
const picks = computed(() => {
  if (seed.value === null) return []
  return members.map((m, i) => {
    const list = feeds.value[m.id] || []
    const idx = (hash(seed.value!, i) + (pickOffset.value[m.id] || 0)) % Math.max(1, list.length)
    return { m, post: list[idx] }
  }).filter((p) => p.post)
})
const main = computed(() => picks.value.find((p) => p.m.id === mainId.value) ?? picks.value[0])
const others = computed(() => picks.value.filter((p) => p.m.id !== main.value?.m.id))

function withVT(fn: () => void) {
  const d = document as any
  if (!d.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(); return }
  d.startViewTransition(async () => { fn(); await nextTick() })
}
function choose(id: string) { withVT(() => { mainId.value = id }) }
function reroll() {
  if (!main.value) return
  const id = main.value.m.id
  developed.value = false
  withVT(() => { pickOffset.value = { ...pickOffset.value, [id]: (pickOffset.value[id] || 0) + 1 + Math.floor(Math.random() * 5) } })
  requestAnimationFrame(() => requestAnimationFrame(() => (developed.value = true)))
}

const caption = (t: string) => t.replace(/【[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍.*/, '').trim()

onMounted(async () => {
  feeds.value = (await import('../data/feeds.json')).default as Record<string, Post[]>
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 3600e3)
  seed.value = Math.floor(jst.getTime() / 86400000)
  const WD = ['日', '月', '火', '水', '木', '金', '土']
  dateLabel.value = `${jst.getUTCMonth() + 1}.${jst.getUTCDate()} (${WD[jst.getUTCDay()]})`
  loadOshi()
  mainId.value = oshiState.value && members.some((m) => m.id === oshiState.value) ? oshiState.value : members[seed.value % members.length].id // 최애 first
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { developed.value = true; io.disconnect() } }, { threshold: 0.35 })
  nextTick(() => root.value && io.observe(root.value))
})
</script>

<template>
  <section ref="root" class="lod">
    <div class="lod-head">
      <h2><span>TODAY'S</span> LEGEND CUT</h2>
      <p>{{ dateLabel || '오늘' }} · 매일 자정(JST) 멤버별 레전드 컷이 바뀌어요</p>
    </div>

    <div v-if="main" class="lod-body">
      <figure class="pola main" :class="{ dev: developed }" :style="{ '--mc': main.m.color }">
        <span class="tape" aria-hidden="true" />
        <a class="pola-img" :href="`https://www.youtube.com/watch?v=${main.post.id}`" target="_blank" rel="noopener"
          :style="{ viewTransitionName: 'lod-main' }" :aria-label="`${main.m.ko} — ${caption(main.post.title)} 영상 보기`">
          <img :key="main.post.id" :src="`https://i.ytimg.com/vi/${main.post.id}/maxresdefault.jpg`" alt="" />
          <span class="play" aria-hidden="true">▶</span>
        </a>
        <figcaption>
          <b>{{ main.m.ja }} <span>{{ main.m.emoji }}</span></b>
          <small>{{ caption(main.post.title) || main.m.ko }}</small>
        </figcaption>
        <div class="pola-act">
          <a :href="withBase(`/members/${main.m.id}`)">{{ main.m.ko.split(' ')[1] }} 페이지 →</a>
          <button type="button" @click="reroll">🎲 다른 컷</button>
        </div>
      </figure>

      <div class="fan" role="list" aria-label="다른 멤버의 오늘 컷">
        <button v-for="(p, i) in others" :key="p.m.id" type="button" role="listitem" class="pola mini"
          :style="{ '--mc': p.m.color, '--i': i, '--n': others.length }" :aria-label="`${p.m.ko}의 오늘 컷 보기`" @click="choose(p.m.id)">
          <span class="mini-img"><img :src="`https://i.ytimg.com/vi/${p.post.id}/mqdefault.jpg`" alt="" loading="lazy" /></span>
          <span class="mini-name">{{ p.m.ja.slice(-2) }}</span>
        </button>
      </div>
    </div>
    <div v-else class="lod-skel" aria-hidden="true" />
  </section>
</template>

<style scoped>
.lod {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin-top: 64px;
}
.lod-head h2 { margin: 0; border: 0; padding: 0; font-family: 'Zen Maru Gothic', sans-serif; font-size: clamp(26px, 4vw, 40px); line-height: 1.1; }
.lod-head h2 span { color: #d63d78; }
.lod-head p { margin: 6px 0 0; font-size: 13.5px; color: #735779; }
.lod-body { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 36px; align-items: center; margin-top: 24px; }
.lod-skel { height: 420px; border-radius: 24px; background: #fbeef4; margin-top: 24px; }

.pola { position: relative; background: #fff; padding: 14px 14px 18px; border-radius: 6px; box-shadow: 0 2px 0 #f2e4ec, 0 26px 50px -24px rgba(90, 30, 70, 0.45); }
.pola.main { transform: rotate(-2.2deg); transition: transform 0.7s var(--spring); max-width: 560px; justify-self: center; width: 100%; }
.pola.main:hover { transform: rotate(0deg) translateY(-4px); }
.tape { position: absolute; top: -14px; left: 50%; width: 120px; height: 30px; translate: -50% 0; rotate: 3deg; background: color-mix(in srgb, var(--mc) 45%, rgba(255, 255, 255, 0.6)); opacity: 0.85; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); clip-path: polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 50%); }
.pola-img { position: relative; display: block; aspect-ratio: 4 / 3.4; overflow: hidden; background: #1c0f1a; }
.pola-img img { width: 100%; height: 100%; object-fit: cover; filter: blur(10px) brightness(1.9) sepia(0.7) saturate(0.4); transform: scale(1.06); transition: filter 2.6s cubic-bezier(.3, .1, .2, 1), transform 2.6s cubic-bezier(.3, .1, .2, 1); }
.dev .pola-img img { filter: none; transform: none; }
.play { position: absolute; right: 12px; bottom: 12px; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.9); color: var(--mc); font-size: 16px; padding-left: 3px; transition: transform 0.5s var(--spring); }
.pola-img:hover .play { transform: scale(1.15); }
figcaption { display: flex; flex-direction: column; gap: 2px; padding: 14px 4px 0; }
figcaption b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 26px; color: color-mix(in srgb, var(--mc) min(65%, var(--ink-mix, 100%)), #2a1030); }
figcaption small { font-family: 'Noto Sans JP', sans-serif; font-size: 13px; color: #735779; }
.pola-act { display: flex; gap: 8px; margin-top: 12px; padding: 0 4px; flex-wrap: wrap; }
.pola-act a, .pola-act button { font-size: 13px; font-weight: 700; padding: 8px 14px; border-radius: 999px; text-decoration: none !important; transition: transform 0.45s var(--spring); }
.pola-act a { background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); color: #fff !important; }
.pola-act button { background: #f8eef4; color: var(--ink); }
.pola-act a:hover, .pola-act button:hover { transform: translateY(-2px) rotate(-2deg); }
.pola-act button:active { transform: scale(0.9) rotate(8deg); }

.fan { position: relative; height: 380px; }
.pola.mini {
  position: absolute; left: 46%; top: 50%; width: 40%; padding: 8px 8px 10px; cursor: pointer;
  --rot: calc((var(--i) - (var(--n) - 1) / 2) * 7deg);
  --x: calc((var(--i) - (var(--n) - 1) / 2) * 16%);
  transform: translate(-50%, -50%) translateX(var(--x)) rotate(var(--rot));
  transform-origin: 50% 120%;
  transition: transform 0.6s var(--spring), box-shadow 0.3s, z-index 0s;
  animation: fanIn 0.9s var(--spring) both; animation-delay: calc(var(--i) * 70ms);
}
@keyframes fanIn { from { opacity: 0; transform: translate(-50%, -20%) rotate(0deg) scale(0.6); } }
.pola.mini:hover, .pola.mini:focus-visible { z-index: 10; transform: translate(-50%, -62%) translateX(var(--x)) rotate(calc(var(--rot) * 0.4)) scale(1.12); box-shadow: 0 30px 50px -20px color-mix(in srgb, var(--mc) 80%, #000); }
.mini-img { display: block; aspect-ratio: 1; overflow: hidden; background: color-mix(in srgb, var(--mc) 20%, white); }
.mini-img img { width: 100%; height: 100%; object-fit: cover; }
.mini-name { display: block; margin-top: 6px; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 14px; color: color-mix(in srgb, var(--mc) min(65%, var(--ink-mix, 100%)), #2a1030); text-align: center; }

@media (max-width: 860px) {
  .lod-body { grid-template-columns: 1fr; gap: 12px; }
  .fan { height: auto; display: flex; gap: 10px; overflow-x: auto; padding: 18px 4px 8px; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .fan::-webkit-scrollbar { display: none; }
  .pola.mini { position: relative; left: auto; top: auto; flex: none; width: 112px; transform: rotate(calc((var(--i) % 2 - 0.5) * 6deg)); scroll-snap-align: start; animation: none; }
  .pola.mini:hover { transform: translateY(-6px) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .pola-img img { transition: none; filter: none; transform: none; }
  .pola.mini { animation: none; }
  .pola, .pola.mini { transition: none; }
}
</style>
