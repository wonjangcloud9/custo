<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { members } from '../data/members'
import { events, startMs, catMeta } from '../data/events'

// Facts below are from the verified research notes in loop/ROADMAP.md (Wikipedia JA + official site).
const MUST_WATCH = [
  { id: 'jZqTz1G8G04', t: '데뷔곡 MV「かわいいだけじゃだめですか？」', why: '모든 것의 시작. 한 소절만 들어도 중독!' },
  { id: 'H4ZRCW5HamI', t: 'THE FIRST TAKE', why: '원테이크로 듣는 8명의 진짜 목소리' },
  { id: 'VQmdUnlNnds', t: 'MV「キュートなキューたい」', why: '오리콘 주간 1위를 차지한 3rd 싱글' },
  { id: 'aanKhmeCl-s', t: 'M COUNTDOWN 스페셜 스테이지', why: '한국 음방에서 한국어로 부른 무대' },
  { id: 'KGFOrSUL-uc', t: '「Top of the top」 @日本武道館', why: '첫 부도칸, 정상을 향한 노래' },
]
const ACCOUNTS = [
  { name: 'X (Twitter)', handle: '@CUTIE_STREET_', url: 'https://x.com/CUTIE_STREET_' },
  { name: 'Instagram', handle: '@cutie_street_', url: 'https://www.instagram.com/cutie_street_/' },
  { name: 'YouTube', handle: '@CUTIE_STREET', url: 'https://www.youtube.com/@CUTIE_STREET' },
  { name: 'TikTok', handle: '@cutie_street', url: 'https://www.tiktok.com/@cutie_street' },
  { name: '공식 사이트', handle: 'cutiestreet.asobisystem.com', url: 'https://cutiestreet.asobisystem.com/' },
]
const STEPS = ['intro', 'watch', 'members', 'follow', 'next', 'deeper'] as const

const done = ref<Set<string>>(new Set())
const watched = ref<Set<string>>(new Set())
const now = ref<number | null>(null)
const party = ref(false)
function save() { try { localStorage.setItem('custo-start', JSON.stringify([...done.value])) } catch { /* ignore */ } }
function toggle(id: string) {
  const s = new Set(done.value); s.has(id) ? s.delete(id) : s.add(id); done.value = s; save()
  if (s.size === STEPS.length) { party.value = true; setTimeout(() => (party.value = false), 3200) }
}
function markWatch(id: string) {
  const s = new Set(watched.value); s.add(id); watched.value = s
  if (s.size >= 3 && !done.value.has('watch')) toggle('watch')
}
const pct = computed(() => done.value.size / STEPS.length)
const upcoming = computed(() => (now.value === null ? [] : events.filter((e) => startMs(e) > now.value!).slice(0, 3)))
const confetti = Array.from({ length: 30 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 6) * 0.12, c: members[i % 8].color }))

onMounted(() => {
  now.value = Date.now()
  try { done.value = new Set(JSON.parse(localStorage.getItem('custo-start') || '[]')) } catch { /* private mode */ }
})
</script>

<template>
  <section class="sq">
    <h2 class="sr-only">입문 퀘스트 단계</h2>
    <div class="prog" :style="{ '--p': pct }">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" class="track" />
        <circle cx="60" cy="60" r="52" class="fill" />
      </svg>
      <div class="prog-txt"><b>{{ done.size }}/{{ STEPS.length }}</b><small>입문 퀘스트</small></div>
    </div>
    <p v-if="done.size === STEPS.length" class="badge">🎓 큐티스트리트 입문 완료! 이제 당신도 팬이에요 💖</p>
    <div v-if="party" class="party" aria-hidden="true"><i v-for="(c, i) in confetti" :key="i" :style="{ left: c.x + '%', background: c.c, animationDelay: c.d + 's' }" /></div>

    <ol class="steps">
      <li class="step" :class="{ ok: done.has('intro') }">
        <header><span class="n">1</span><h3>3줄로 알아보는 큐티스트리트</h3><button type="button" class="chk" :aria-pressed="done.has('intro')" @click="toggle('intro')">{{ done.has('intro') ? '✓ 완료' : '읽었어요' }}</button></header>
        <ul class="facts">
          <li>💖 아소비시스템의 아이돌 프로젝트 <b>KAWAII LAB.</b>에서 탄생한 <b>8인조</b> (2024년 8월 TIF에서 데뷔)</li>
          <li>🌏 콘셉트는 <b>“KAWAII MAKER”</b> — 하라주쿠에서 세계로 KAWAII를 전하는 그룹</li>
          <li>🏆 데뷔곡이 신드롬이 되어 <b>레코드대상 신인상</b>, 2026년 <b>부도칸·아레나 투어</b>, 그리고 <b>紅白 첫 출장</b>까지</li>
        </ul>
        <a class="link" :href="withBase('/journey/')">🗻 3D로 보는 정상까지의 여정 →</a>
      </li>

      <li class="step" :class="{ ok: done.has('watch') }">
        <header><span class="n">2</span><h3>먼저 볼 영상 5편</h3><button type="button" class="chk" :aria-pressed="done.has('watch')" @click="toggle('watch')">{{ done.has('watch') ? '✓ 완료' : '봤어요' }}</button></header>
        <p class="hint">3편 이상 보면 자동 완료 ✨</p>
        <div class="vids">
          <a v-for="v in MUST_WATCH" :key="v.id" class="vid" :class="{ seen: watched.has(v.id) }" :href="`https://www.youtube.com/watch?v=${v.id}`" target="_blank" rel="noopener" @click="markWatch(v.id)">
            <span class="th"><img :src="`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`" alt="" loading="lazy" /><i v-if="watched.has(v.id)">✓</i></span>
            <b>{{ v.t }}</b><small>{{ v.why }}</small>
          </a>
        </div>
      </li>

      <li class="step" :class="{ ok: done.has('members') }">
        <header><span class="n">3</span><h3>멤버 8명 한눈에</h3><button type="button" class="chk" :aria-pressed="done.has('members')" @click="toggle('members')">{{ done.has('members') ? '✓ 완료' : '외웠어요' }}</button></header>
        <div class="mem">
          <a v-for="m in members" :key="m.id" :href="withBase(`/members/${m.id}`)" :style="{ '--mc': m.color }">
            <span class="face">{{ m.ja.slice(-2, -1) }}</span><b>{{ m.ko }}</b><small>{{ m.emoji }} {{ m.colorName }}</small>
          </a>
        </div>
        <a class="link" :href="withBase('/which-member/')">🔮 나와 닮은 멤버 테스트로 최애 찾기 →</a>
      </li>

      <li class="step" :class="{ ok: done.has('follow') }">
        <header><span class="n">4</span><h3>공식 계정 팔로우</h3><button type="button" class="chk" :aria-pressed="done.has('follow')" @click="toggle('follow')">{{ done.has('follow') ? '✓ 완료' : '팔로우했어요' }}</button></header>
        <div class="acc">
          <a v-for="a in ACCOUNTS" :key="a.url" :href="a.url" target="_blank" rel="noopener"><b>{{ a.name }}</b><small>{{ a.handle }}</small></a>
        </div>
      </li>

      <li class="step" :class="{ ok: done.has('next') }">
        <header><span class="n">5</span><h3>다가오는 일정 체크</h3><button type="button" class="chk" :aria-pressed="done.has('next')" @click="toggle('next')">{{ done.has('next') ? '✓ 완료' : '확인했어요' }}</button></header>
        <ul class="ev">
          <li v-for="e in upcoming" :key="e.date + e.ja"><span>{{ catMeta[e.cat].emoji }} {{ e.date.slice(5).replace('-', '/') }}</span><b lang="ja">{{ e.ja }}</b></li>
        </ul>
        <a class="link" :href="withBase('/schedule/')">🗓️ 전체 스케줄 · 캘린더 추가 →</a>
      </li>

      <li class="step" :class="{ ok: done.has('deeper') }">
        <header><span class="n">6</span><h3>더 깊이 빠져들기</h3><button type="button" class="chk" :aria-pressed="done.has('deeper')" @click="toggle('deeper')">{{ done.has('deeper') ? '✓ 완료' : '둘러봤어요' }}</button></header>
        <div class="deep">
          <a :href="withBase('/videos/')">🎬 영상 아카이브</a>
          <a :href="withBase('/cutie-land/')">💿 CUTIE LAND</a>
          <a :href="withBase('/units/')">💞 유닛 & 케미</a>
          <a :href="withBase('/live-guide/')">🔦 펜라이트 가이드</a>
          <a :href="withBase('/japanese/beginner/hiragana')">🔤 멤버 이름으로 일본어</a>
          <a :href="withBase('/news/')">📰 공식 소식</a>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.sq { --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340; color: var(--ink); margin: 8px auto 40px; max-width: 860px; position: relative; }
.prog { position: sticky; top: calc(var(--vp-nav-height, 64px) + 12px); z-index: 4; width: 96px; height: 96px; margin-left: auto; margin-bottom: -96px; filter: drop-shadow(0 10px 20px rgba(150, 60, 110, 0.25)); }
.prog svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.prog circle { fill: #fff; stroke-width: 10; }
.track { stroke: #f6e3ec; }
.fill { fill: none !important; stroke: #c92f69; stroke-linecap: round; stroke-dasharray: 327; stroke-dashoffset: calc(327 * (1 - var(--p))); transition: stroke-dashoffset 0.8s var(--spring); }
.prog-txt { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.prog-txt b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px; line-height: 1; }
.prog-txt small { font-size: 10px; color: #735779; font-weight: 700; }
.badge { margin: 0 110px 16px 0 !important; padding: 12px 16px; border-radius: 16px; background: linear-gradient(90deg, #fff0f6, #f3ebff); font-weight: 800; color: #a33366; animation: pop 0.6s var(--spring); }
@keyframes pop { from { transform: scale(0.8); opacity: 0; } }
.party { position: fixed; inset: 0; pointer-events: none; z-index: 50; }
.party i { position: absolute; top: -20px; width: 10px; height: 16px; border-radius: 3px; animation: fall 2.6s cubic-bezier(.2, .6, .4, 1) forwards; }
@keyframes fall { to { transform: translateY(110vh) rotate(720deg); } }
.steps { list-style: none; padding: 0 !important; margin: 0 !important; display: grid; gap: 16px; }
.step { margin: 0 !important; padding: 20px; border-radius: 26px; background: #fff; border: 1.5px solid #f3dbe8; transition: border-color 0.3s, background 0.3s; }
.step.ok { border-color: #3ccfa8; background: linear-gradient(160deg, #fff, #effcf7); }
.step header { display: flex; align-items: center; gap: 12px; padding-right: 100px; }
.step:not(:first-child) header { padding-right: 0; }
.n { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #fff; background: #c92f69; font-family: 'Zen Maru Gothic', sans-serif; transition: background 0.3s, transform 0.5s var(--spring); }
.step.ok .n { background: #13866a; transform: rotate(-10deg) scale(1.05); }
.step h3 { flex: 1; margin: 0 !important; padding: 0 !important; border: 0 !important; font-family: 'Zen Maru Gothic', sans-serif; font-size: 20px !important; }
.chk { flex: none; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; background: #faf2f6; color: var(--ink); border: 1.5px solid #f1dce7; transition: transform 0.45s var(--spring), background 0.2s; }
.chk[aria-pressed='true'] { background: #13866a; color: #fff; border-color: #13866a; }
.chk:active { transform: scale(0.9); }
.facts { margin: 14px 0 0 !important; padding: 0 !important; list-style: none; display: grid; gap: 8px; }
.facts li { margin: 0 !important; font-size: 15px; line-height: 1.7; }
.hint { margin: 8px 0 0 !important; font-size: 12.5px; color: #735779; }
.link { display: inline-block; margin-top: 12px; font-size: 13.5px; font-weight: 700; color: #a33366 !important; }
.vids { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-top: 12px; }
.vid { display: flex; flex-direction: column; gap: 4px; text-decoration: none !important; color: var(--ink) !important; transition: transform 0.45s var(--spring); }
.vid:hover { transform: translateY(-3px); }
.th { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #fbe9f1; }
.th img { width: 100%; height: 100%; object-fit: cover; }
.th i { position: absolute; inset: 0; display: grid; place-items: center; font-style: normal; font-size: 28px; color: #fff; background: rgba(19, 134, 106, 0.65); }
.vid b { font-size: 13px; line-height: 1.35; font-family: 'Noto Sans JP', 'Noto Sans KR', sans-serif; }
.vid small { font-size: 11.5px; color: #735779; }
.mem { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
.mem a { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 6px; border-radius: 16px; background: color-mix(in srgb, var(--mc) 10%, white); text-decoration: none !important; color: var(--ink) !important; transition: transform 0.45s var(--spring); }
.mem a:hover { transform: translateY(-3px) rotate(-2deg); }
.face { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--mc) 62%, #2a1030); color: #fff; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; }
.mem b { font-size: 12.5px; }
.mem small { font-size: 11px; color: #5a4060; }
.acc { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-top: 12px; }
.acc a { display: flex; flex-direction: column; padding: 10px 12px; border-radius: 14px; background: #faf3f7; text-decoration: none !important; color: var(--ink) !important; transition: transform 0.45s var(--spring); }
.acc a:hover { transform: translateY(-2px); }
.acc b { font-size: 13px; }
.acc small { font-size: 12px; color: #735779; overflow-wrap: anywhere; }
.ev { list-style: none; padding: 0 !important; margin: 12px 0 0 !important; display: grid; gap: 6px; }
.ev li { margin: 0 !important; display: flex; gap: 10px; align-items: baseline; font-size: 14px; }
.ev span { flex: none; font-weight: 800; color: #a33366; font-variant-numeric: tabular-nums; }
.ev b { font-weight: 600; font-family: 'Noto Sans JP', sans-serif; }
.deep { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.deep a { padding: 9px 14px; border-radius: 999px; background: #faf3f7; color: var(--ink) !important; font-size: 13.5px; font-weight: 700; text-decoration: none !important; transition: transform 0.45s var(--spring); }
.deep a:hover { transform: translateY(-2px) rotate(-1deg); }
@media (max-width: 640px) {
  .prog { width: 72px; height: 72px; margin-bottom: -72px; }
  .prog-txt b { font-size: 17px; }
  .step { padding: 16px; }
  .step header { flex-wrap: wrap; padding-right: 76px; }
  .step:not(:first-child) header { padding-right: 0; }
  .mem { grid-template-columns: repeat(2, 1fr); }
  .vids { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .badge { margin-right: 84px !important; }
}
@media (prefers-reduced-motion: reduce) { .party { display: none; } .fill, .n, .chk, .vid, .mem a { transition: none; } .badge { animation: none; } }
</style>
