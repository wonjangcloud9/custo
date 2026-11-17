<script setup lang="ts">
import { ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { members, memberById } from '../data/members'
import { units } from '../data/units'
import videosRaw from '../data/videos.json'

interface Video { id: string; title: string; members: string[]; duration: string }
const videos = videosRaw as Video[]

const picked = ref<string[]>([])
function toggle(id: string) {
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]
}
const matches = (u: { members: string[] }) => picked.value.length > 0 && picked.value.every((p) => u.members.includes(p))
const matchedUnits = computed(() => units.filter(matches))
const together = computed(() => (picked.value.length < 2 ? [] : videos.filter((v) => picked.value.every((p) => v.members.includes(p)))))
const mesh = (ids: string[]) => {
  const spots = ['20% 20%', '80% 25%', '30% 80%', '85% 85%', '50% 50%']
  return ids.map((id, i) => `radial-gradient(circle at ${spots[i % spots.length]}, color-mix(in srgb, ${memberById[id].color} 70%, transparent), transparent 60%)`).join(',')
}
const clean = (t: string) => t.replace(/【CUTIE STREET[^】]*】/g, '').replace(/\s*CUTIE STREET\s*/g, ' ').replace(/📍[^【]*/, '').trim()
</script>

<template>
  <section class="ul">
    <!-- chemistry finder -->
    <div class="finder">
      <p class="eyebrow">CHEMISTRY FINDER</p>
      <h2>최애 조합을 골라보세요</h2>
      <p class="hint">멤버를 탭하면 같은 유닛과 함께 나온 공식 영상을 찾아줘요</p>
      <div class="picks" role="group" aria-label="멤버 선택">
        <button v-for="m in members" :key="m.id" type="button" class="pick" :aria-pressed="picked.includes(m.id)" :style="{ '--mc': m.color }" @click="toggle(m.id)">
          <span class="pick-face">{{ m.ja.slice(-2, -1) }}</span>
          <small>{{ m.ko.split(' ')[1] }}</small>
        </button>
      </div>
      <div class="result" aria-live="polite">
        <template v-if="!picked.length">✨ 2명 이상 고르면 '케미 영상'이 나타나요</template>
        <template v-else>
          <span v-if="matchedUnits.length">💞 같은 유닛: <b v-for="u in matchedUnits" :key="u.id" class="u-tag">{{ u.ja }}</b></span>
          <span v-else-if="picked.length > 1">🔍 공식 유닛은 없지만…</span>
          <span v-if="picked.length > 1"> · 함께 나온 영상 <b>{{ together.length }}</b>편</span>
          <button type="button" class="reset" @click="picked = []">초기화</button>
        </template>
      </div>
      <div v-if="together.length" class="tg">
        <a v-for="v in together.slice(0, 12)" :key="v.id" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener" class="tg-v">
          <img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" />
          <span>{{ clean(v.title) }}</span>
        </a>
      </div>
    </div>

    <!-- unit cards -->
    <div class="cards">
      <article v-for="u in units" :key="u.id" class="card" :class="{ hit: matches(u), dim: picked.length && !matches(u) }" :style="{ backgroundImage: mesh(u.members) }">
        <div class="stack" :style="{ '--n': u.members.length }">
          <a v-for="(id, i) in u.members" :key="id" :href="withBase(`/members/${id}`)" class="av" :style="{ '--mc': memberById[id].color, '--i': i }" :title="memberById[id].ko">
            {{ memberById[id].ja.slice(-2, -1) }}
          </a>
        </div>
        <h3 class="u-ja">{{ u.ja }}</h3>
        <p class="u-ko">{{ u.ko }} · {{ u.members.length }}인</p>
        <p class="u-names">{{ u.members.map((id) => memberById[id].ko.split(' ')[1]).join(' · ') }}</p>
        <div v-if="u.song" class="song">
          <span>🎵 {{ u.song }}</span>
          <a v-if="u.mv" :href="`https://www.youtube.com/watch?v=${u.mv}`" target="_blank" rel="noopener" class="mv">▶ MV</a>
        </div>
        <div class="vids">
          <a v-for="v in u.videos" :key="v.id" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener">▶ {{ v.label }}</a>
        </div>
        <p class="note">{{ u.note }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.ul { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px 0 40px; }
.finder { padding: 24px; border-radius: 28px; background: #fff; border: 1.5px solid #f3dbe8; box-shadow: 0 20px 40px -30px rgba(150, 60, 110, 0.5); }
.eyebrow { margin: 0 !important; font-size: 12px; font-weight: 800; letter-spacing: 0.22em; color: #c2457a; }
.finder h2 { margin: 4px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 28px !important; }
.hint { margin: 4px 0 0 !important; font-size: 13px; color: #735779; }
.picks { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.pick { display: flex; flex-direction: column; align-items: center; gap: 4px; background: none; padding: 0; }
.pick-face { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 20px;
  background: #fff; color: color-mix(in srgb, var(--mc) 70%, #3a2340); border: 3px solid color-mix(in srgb, var(--mc) 45%, white); transition: transform 0.5s var(--spring), background 0.2s, color 0.2s; }
.pick small { font-size: 12px; font-weight: 700; }
.pick:hover .pick-face { transform: translateY(-3px) rotate(-8deg); }
.pick[aria-pressed='true'] .pick-face { background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); color: #fff; border-color: #fff; box-shadow: 0 0 0 3px var(--mc), 0 10px 20px -8px var(--mc); transform: scale(1.08); }
.result { margin-top: 16px; padding: 12px 14px; border-radius: 16px; background: #fdf3f8; font-size: 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.u-tag { padding: 2px 9px; border-radius: 999px; background: #3a2340; color: #fff; font-size: 12px; margin-left: 4px; }
.reset { margin-left: auto; font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 999px; background: #fff; border: 1px solid #f0d6e3; }
.tg { display: flex; gap: 12px; overflow-x: auto; padding: 14px 2px 4px; scroll-snap-type: x mandatory; }
.tg-v { flex: none; width: 200px; scroll-snap-align: start; color: var(--ink) !important; text-decoration: none !important; font-size: 12px; line-height: 1.4; animation: pop 0.5s var(--spring) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.85); } }
.tg-v img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 12px; display: block; margin-bottom: 4px; }
.tg-v span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-family: 'Noto Sans JP', sans-serif; }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 22px; }
.card { position: relative; padding: 22px; border-radius: 28px; background-color: #fff; border: 1.5px solid #f3e0ea; transition: transform 0.6s var(--spring), opacity 0.3s, filter 0.3s, box-shadow 0.3s; }
.card:hover { transform: translateY(-5px); }
.card.hit { box-shadow: 0 0 0 3px #3a2340, 0 24px 40px -24px rgba(58, 35, 64, 0.7); transform: translateY(-5px) scale(1.02); }
.card.dim { opacity: 0.45; filter: saturate(0.4); }
.stack { display: flex; height: 58px; }
.av { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; margin-left: -16px; background: var(--mc); color: #fff !important; text-decoration: none !important;
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 20px; border: 3px solid #fff; box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.3);
  transition: margin 0.6s var(--spring), transform 0.6s var(--spring); transition-delay: calc(var(--i) * 30ms); }
.av:first-child { margin-left: 0; }
.card:hover .av { margin-left: 6px; }
.card:hover .av:first-child { margin-left: 0; }
.av:hover { transform: translateY(-6px) rotate(-10deg); }
.u-ja { margin: 14px 0 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', 'Noto Sans JP', sans-serif; font-size: 24px !important; }
.u-ko { margin: 2px 0 0 !important; font-size: 13px; font-weight: 700; color: #6a4a70; }
.u-names { margin: 6px 0 0 !important; font-size: 13px; color: #6a4a70; }
.song { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-weight: 700; font-family: 'Noto Sans JP', sans-serif; }
.mv { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: #3a2340; color: #fff !important; text-decoration: none !important; }
.vids { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.vids a { font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.85); color: var(--ink) !important; text-decoration: none !important; transition: transform 0.4s var(--spring); }
.vids a:hover { transform: translateY(-2px); }
.note { margin: 12px 0 0 !important; font-size: 12px; color: #735779; }
@media (max-width: 640px) { .finder { padding: 18px; } .pick-face { width: 46px; height: 46px; font-size: 17px; } .picks { gap: 6px; } }
@media (prefers-reduced-motion: reduce) { .card, .av, .pick-face, .tg-v { transition: none; animation: none; } }
</style>
