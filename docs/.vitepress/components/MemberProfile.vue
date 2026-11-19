<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { withBase, useRouter } from 'vitepress'
import { members, memberById, ageOn, daysToBirthday, prefectureKo, onColor } from '../data/members'
import MemberFeed from './MemberFeed.vue'
import BirthdayParty from './BirthdayParty.vue'
import BirthdayCard from './BirthdayCard.vue'
import { birthdaysIcs, downloadIcs } from '../data/birthdays'
import ShareButton from './ShareButton.vue'
import { useOshi, setOshi } from '../theme/oshi'
import { useToday, BUILD_TIME } from '../theme/today'
import { goingKey, loadGoing } from '../data/going'
import { events, startMs, catMeta, type CsEvent } from '../data/events'

const props = defineProps<{ id: string }>()
const m = computed(() => memberById[props.id])
const idx = computed(() => members.findIndex((x) => x.id === props.id))
const prev = computed(() => members[(idx.value + members.length - 1) % members.length])
const next = computed(() => members[(idx.value + 1) % members.length])


const now = useToday() // moves to the new day if left open past midnight
const age = computed(() => (now.value ? ageOn(m.value.birthday, now.value) : null))
const dday = computed(() => (now.value ? daysToBirthday(m.value.birthday, now.value) : null))
const bdayLabel = computed(() => {
  const [, mo, d] = m.value.birthday.split('-').map(Number)
  return `${mo}월 ${d}일`
})
const heights = computed(() => [...members].sort((a, b) => b.height - a.height))
const minH = 145, maxH = 163

// Holo card pointer tilt
const card = ref<HTMLElement | null>(null)
let reduce = false
function onMove(e: PointerEvent) {
  if (reduce || !card.value) return
  const r = card.value.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  card.value.style.setProperty('--px', `${px * 100}%`)
  card.value.style.setProperty('--py', `${py * 100}%`)
  card.value.style.setProperty('--rx', `${(0.5 - py) * 16}deg`)
  card.value.style.setProperty('--ry', `${(px - 0.5) * 20}deg`)
}
function onLeave() {
  if (!card.value) return
  card.value.style.setProperty('--rx', '0deg')
  card.value.style.setProperty('--ry', '0deg')
}

// just this member's birthday, every year, in your calendar
const bdIcs = ref(false)
function saveBirthday() {
  downloadIcs(birthdaysIcs([m.value], location.origin + withBase('/members/')), `cutiestreet-${m.value.id}-birthday.ics`)
  bdIcs.value = true; setTimeout(() => (bdIcs.value = false), 1800)
}
const copied = ref(false)
async function copyColor() {
  try { await navigator.clipboard.writeText(m.value.color) } catch { /* no clipboard */ }
  copied.value = true
  setTimeout(() => (copied.value = false), 1400)
}

const oshi = useOshi()
// these two lists render from the build time until mount (#196): left empty, they popped in above the bento
// after hydration and pushed it ~500px down (desktop CLS 0.07–0.08)
const listNow = computed(() => now.value?.getTime() ?? BUILD_TIME)
const bdayShow = computed(() => events.find((e) => e.member === props.id && startMs({ ...e, time: undefined }) + 86400000 > listNow.value) ?? null)
// Her next official dates as compact date tiles: whole-group events, her own solo slots and her own birthday show.
// Left out: other members' birthday shows and solo slots she isn't in — we can't say she appears there.
const MO = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const WDJ = ['日', '月', '火', '水', '木', '金', '土']
const mine = (e: CsEvent) => (e.member ? e.member === props.id : e.with ? e.with.includes(props.id) : true)
// her own solo slots always make the list (up to 2), the nearest group dates fill the rest — four rows in all
const upcoming = computed(() => {
  const left = [...events].filter((e) => mine(e) && e !== bdayShow.value && startMs({ ...e, time: undefined }) + 86400000 > listNow.value)
    .sort((a, b) => startMs(a) - startMs(b))
  const solo = left.filter((e) => e.with).slice(0, 2)
  return [...left.filter((e) => !e.with).slice(0, 4 - solo.length), ...solo].sort((a, b) => startMs(a) - startMs(b))
})
// marks from the schedule's '갈 거예요' (this browser only)
const going = ref<Set<string>>(new Set())
onMounted(() => { going.value = loadGoing() })
const tileDays = (e: CsEvent) => Math.max(0, Math.ceil((new Date(`${e.date}T00:00:00+09:00`).getTime() - listNow.value) / 86400000))
const showDays = computed(() => (bdayShow.value ? Math.max(0, Math.ceil((new Date(`${bdayShow.value.date}T00:00:00+09:00`).getTime() - listNow.value) / 86400000)) : 0))
const forceBday = ref(false)
const isBday = computed(() => forceBday.value || dday.value === 0)
onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  forceBday.value = new URLSearchParams(location.search).get('bday') === props.id // preview: ?bday=<id>
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// Swipe (touch) on the hero and ← → keys move between members
const router = useRouter()
const swipeHint = ref<'prev' | 'next' | null>(null)
let sx = 0, sy = 0, tracking = false
function goMember(dir: 'prev' | 'next') {
  const target = dir === 'next' ? next.value : prev.value
  const url = withBase(`/members/${target.id}`)
  // where supported, the hero slides out the way you swiped and the next member slides in (View Transitions);
  // otherwise, or with reduced motion, the old nudge-then-navigate
  const d = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }
  if (d.startViewTransition && !reduce) {
    const root = document.documentElement
    root.dataset.mvDir = dir
    d.startViewTransition(async () => { await router.go(url); await nextTick() }).finished.finally(() => { delete root.dataset.mvDir })
    return
  }
  swipeHint.value = dir
  setTimeout(() => { swipeHint.value = null; router.go(url) }, reduce ? 0 : 160)
}
function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true
}
function onTouchEnd(e: TouchEvent) {
  if (!tracking) return
  tracking = false
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) goMember(dx < 0 ? 'next' : 'prev')
}
function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (e.altKey || e.metaKey || e.ctrlKey || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable))) return
  if (document.querySelector('dialog[open], .sp-backdrop')) return
  if (e.key === 'ArrowRight') goMember('next')
  else if (e.key === 'ArrowLeft') goMember('prev')
}

</script>

<template>
  <section v-if="m" class="mp" :style="{ '--mc': m.color }">
    <BirthdayParty v-if="isBday" :m="m" :age="age === null ? null : age + (dday === 0 ? 0 : 1)" />
    <!-- HERO -->
    <div class="hero" :class="swipeHint ? `swipe-${swipeHint}` : ''" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div class="hero-bg" aria-hidden="true">
        <span class="blob b1" /><span class="blob b2" /><span class="blob b3" />
        <span class="marquee"><span v-for="n in 2" :key="n">{{ (m.en.toUpperCase() + ' ✦ ' + m.ja + ' ✦ ').repeat(3) }}</span></span>
      </div>

      <div class="hero-text">
        <p class="no">MEMBER {{ String(idx + 1).padStart(2, '0') }} / 08 · <i class="cdot" aria-hidden="true" />{{ m.colorName }}</p>
        <p class="kana" lang="ja">{{ m.kana }}</p>
        <h2 class="ja"><span v-for="(ch, i) in m.ja.split('')" :key="i" :style="{ '--i': i }">{{ ch }}</span></h2>
        <p class="ko">{{ m.ko }} <span>· {{ m.en }}</span></p>
        <div class="sns">
          <a :href="`https://x.com/${m.x}`" target="_blank" rel="noopener" class="sns-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 2.25h3.4l-7.4 8.47L23 21.75h-6.8l-5.3-6.95-6.1 6.95H1.4l7.9-9.06L.9 2.25h7l4.8 6.35 5.5-6.35Zm-1.2 17.5h1.9L7 4.13H5z" /></svg>@{{ m.x }}</a>
          <a :href="`https://www.instagram.com/${m.instagram}/`" target="_blank" rel="noopener" class="sns-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.1C4.3 2.3 2.3 4.3 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.2 3.6 2.2 5.6 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.6-.2 5.6-2.2 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.2-3.6-2.2-5.6-5.8-5.8C15 2 14.7 2 12 2Z" /></svg>Instagram</a>
          <button type="button" class="sns-btn oshi-btn" :class="{ on: oshi === m.id }" :aria-pressed="oshi === m.id" @click="setOshi(m.id)">
            <span class="oshi-heart" aria-hidden="true"><Ico n="heart" :duo="oshi === m.id" size="16" /></span>{{ oshi === m.id ? '내 최애' : '최애로 설정' }}
          </button>
          <ShareButton :title="`${m.ja} (${m.ko}) — CUTIE STREET 팬허브`" :text="`${m.ko} 프로필·레전드 컷 모음`" label="공유" />
          <a :href="`https://www.tiktok.com/@${m.tiktok}`" target="_blank" rel="noopener" class="sns-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2-2.7V9.3a6.2 6.2 0 1 0 5.3 6.1V8.6a7.9 7.9 0 0 0 4.6 1.5V6.8a4.6 4.6 0 0 1-4.6-4.8Z" /></svg>TikTok</a>
        </div>
      </div>

      <div ref="card" class="holo" @pointermove="onMove" @pointerleave="onLeave">
        <div class="holo-inner">
          <div class="holo-top"><span>CUTIE STREET</span><span>KAWAII LAB.</span></div>
          <div class="holo-face" aria-hidden="true" :style="{ '--face-ink': onColor(m.color) }">{{ m.ja.slice(-2, -1) }}</div>
          <div class="holo-name" lang="ja">{{ m.ja }}</div>
          <div class="holo-row"><span>BIRTH</span><b>{{ m.birthday.replace(/-/g, '.') }}</b></div>
          <div class="holo-row"><span>FROM</span><b>{{ m.birthplace }}</b></div>
          <div class="holo-row"><span>HEIGHT</span><b>{{ m.height }}cm</b></div>
          <div class="holo-bar" aria-hidden="true"><i v-for="n in 28" :key="n" :style="{ width: ((n * 7) % 4) + 1 + 'px' }" /></div>
          <span class="holo-sheen" aria-hidden="true" />
        </div>
      </div>
    </div>

    <p class="swipe-tip"><Ico n="swipe" size="15" /> 좌우로 밀면 다른 멤버로</p>
    <!-- UPCOMING BIRTHDAY SHOW (from the official schedule) -->
    <a v-if="bdayShow" class="show" :href="bdayShow.url" target="_blank" rel="noopener">
      <span class="show-ic" aria-hidden="true"><Ico n="cake" duo size="26" /></span>
      <span class="show-txt"><small>다가오는 생탄제<template v-if="going.has(goingKey(bdayShow))"> · <Ico n="heart" duo size="12" /> 내 일정</template></small><b lang="ja">{{ bdayShow.ja }}</b>
        <span>{{ bdayShow.date.replace(/-/g, '.') }}<template v-if="bdayShow.time"> {{ bdayShow.time }} <span lang="ja">開演</span></template><template v-if="bdayShow.venue"> · <Ico n="pin" duo size="13" /> <span lang="ja">{{ bdayShow.venue }}</span></template></span></span>
      <span class="show-dd">{{ showDays === 0 ? 'TODAY' : 'D-' + showDays }}</span>
    </a>

    <!-- UPCOMING: date tiles (Apple Music-style concert list) -->
    <section v-if="upcoming.length" class="up" aria-labelledby="up-h">
      <h3 id="up-h" class="up-h">다가오는 일정 <a :href="withBase('/schedule/')">전체 스케줄 →</a></h3>
      <ol class="up-list">
        <li v-for="e in upcoming" :key="e.date + e.ja">
          <a class="up-row" :href="e.url" target="_blank" rel="noopener">
            <span class="up-tile" aria-hidden="true"><small>{{ MO[+e.date.slice(5, 7) - 1] }}</small><b>{{ +e.date.slice(8) }}</b></span>
            <span class="up-txt">
              <b lang="ja">{{ e.ja }}</b>
              <span>{{ WDJ[new Date(`${e.date}T12:00:00+09:00`).getUTCDay()] }}{{ e.time ? ' · ' + e.time : '' }}{{ e.venue ? ' · ' + e.venue : '' }}</span>
            </span>
            <span class="up-tag">
              <i v-if="going.has(goingKey(e))" class="mine"><Ico n="heart" duo size="12" /> 내 일정</i>
              <i v-else-if="e.with" class="solo"><Ico n="sparkle" duo size="12" /> 개인 출연</i>
              <i v-else><Ico :n="catMeta[e.cat].ico" duo size="12" /> {{ catMeta[e.cat].ko }}</i>
              <em>{{ tileDays(e) === 0 ? 'TODAY' : 'D-' + tileDays(e) }}</em>
            </span>
            <span class="sr-only">{{ e.date }}</span>
          </a>
        </li>
      </ol>
    </section>

    <!-- BENTO -->
    <div class="bento">
      <div class="tile t-age">
        <span class="lbl">나이</span>
        <b class="big">{{ age ?? '··' }}<small>세</small></b>
        <span class="sub">만 나이 · {{ m.birthday.slice(0, 4) }}년생</span>
      </div>
      <div class="tile t-bday" :class="{ today: dday === 0 }">
        <span class="lbl">생일 {{ bdayLabel }}</span>
        <b class="big"><template v-if="dday === 0"><Ico n="cake" duo size="0.8em" /> TODAY</template><template v-else>{{ dday === null ? 'D-··' : 'D-' + dday }}</template></b>
        <span class="sub">{{ dday === 0 ? 'おたんじょうびおめでとう！' : '다음 생일까지' }}</span>
        <div class="bd-acts">
          <BirthdayCard :id="m.id" :dday="dday" />
          <button type="button" class="bd-ics" @click="saveBirthday"><template v-if="bdIcs">✓ 받았어요</template><template v-else><Ico n="bell" duo size="14" /> 매년 알림</template></button>
        </div>
      </div>
      <div class="tile t-from">
        <span class="lbl">출신</span>
        <b class="mid"><span class="pin" aria-hidden="true"><Ico n="pin" duo size="0.9em" /></span><span lang="ja">{{ m.birthplace }}</span></b>
        <span class="sub">{{ prefectureKo[m.birthplace] }}</span>
      </div>
      <div class="tile t-color">
        <span class="lbl">멤버 컬러</span>
        <button type="button" class="swatch" @click="copyColor" :aria-label="`컬러 코드 ${m.color} 복사`">
          <span class="sw" /><b>{{ m.colorName }}</b><code>{{ copied ? '복사됨 ✓' : m.color }}</code>
        </button>
      </div>
      <div class="tile t-nick">
        <span class="lbl">닉네임</span>
        <b class="mid" lang="ja">{{ m.nickname }}</b>
        <span class="sub">{{ m.nicknameKo }}</span>
      </div>
      <div class="tile t-likes">
        <span class="lbl">특기 · 취미</span>
        <div class="tags">
          <span v-for="s in m.skills" :key="'s' + s" class="tag skill">✦ {{ s }}</span>
          <span v-for="h in m.hobbies" :key="'h' + h" class="tag">♡ {{ h }}</span>
        </div>
      </div>
      <div class="tile t-height">
        <span class="lbl">키 {{ m.height }}cm · 8명 중 {{ heights.findIndex((x) => x.id === m.id) + 1 }}번째<template v-if="m.heightNote"> ({{ m.heightNote }})</template></span>
        <div class="ruler">
          <a v-for="x in heights" :key="x.id" :href="withBase(`/members/${x.id}`)" class="bar" :class="{ me: x.id === m.id }"
            :style="{ '--h': ((x.height - minH) / (maxH - minH)) * 100 + '%', '--bc': x.color }" :title="`${x.ko} ${x.height}cm`">
            <span class="bar-fill" /><span class="bar-cm">{{ x.height }}</span><span class="bar-nm" lang="ja">{{ x.ja.slice(-2, -1) }}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- LEGEND FEED (Instagram-style) -->
    <MemberFeed :id="m.id" />

    <!-- PREV / NEXT -->
    <nav class="pn" aria-label="다른 멤버 (← → 키로도 이동)" aria-keyshortcuts="ArrowLeft ArrowRight">
      <a :href="withBase(`/members/${prev.id}`)" :style="{ '--pc': prev.color }"><small>← 이전 멤버</small><b><i class="cdot" aria-hidden="true" />{{ prev.ko }}</b></a>
      <a :href="withBase(`/members/${next.id}`)" :style="{ '--pc': next.color }" class="nx"><small>다음 멤버 →</small><b>{{ next.ko }}<i class="cdot r" aria-hidden="true" /></b></a>
    </nav>
  </section>
</template>

<style scoped>
.mp {
  --spring: linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077 20.4%, 1.121, 1.149 24.3%, 1.159, 1.163 27%, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1);
  --ink: #3a2340;
  --mc-soft: color-mix(in srgb, var(--mc) 16%, white);
  --mc-deep: color-mix(in srgb, var(--mc) min(65%, var(--ink-mix, 100%)), #2a1030);
  margin: 8px 0 40px;
  color: var(--ink);
}

/* HERO */
.hero { view-transition-name: mp-hero;
  position: relative; overflow: hidden; border-radius: 32px;
  display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; align-items: center;
  padding: 40px 36px; min-height: 380px;
  background: linear-gradient(140deg, var(--mc-soft), #fff 60%, color-mix(in srgb, var(--mc) 10%, #fff8f0));
  border: 1.5px solid color-mix(in srgb, var(--mc) 25%, white);
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(40px); opacity: 0.55; background: var(--mc); animation: drift 14s ease-in-out infinite alternate; }
.b1 { width: 260px; height: 260px; left: -60px; top: -80px; }
.b2 { width: 200px; height: 200px; right: 10%; bottom: -90px; opacity: 0.35; animation-delay: -5s; }
.b3 { width: 120px; height: 120px; left: 45%; top: 20%; opacity: 0.25; background: #fff; animation-delay: -9s; }
@keyframes drift { to { transform: translate(40px, 30px) scale(1.15); } }
.marquee {
  position: absolute; bottom: 14px; left: 0; white-space: nowrap; display: flex;
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.2em;
  color: color-mix(in srgb, var(--mc) 55%, white); animation: marq 30s linear infinite;
}
.marquee span { padding-right: 1em; }
@keyframes marq { to { transform: translateX(-50%); } }

.hero-text { position: relative; z-index: 1; }
.no { font-size: 12px; font-weight: 700; letter-spacing: 0.18em; color: color-mix(in srgb, var(--mc-deep) 55%, #2a1030); /* sits on the hero's member-colour glow: 2.9–4.4:1 before (#199) */ margin: 0 0 18px; }
.kana { margin: 0; font-size: 15px; letter-spacing: 0.3em; color: #4a2f50; }
.ja {
  margin: 4px 0 6px !important; padding: 0 !important; border: 0 !important;
  font-family: 'Zen Maru Gothic', var(--cs-sans); font-weight: 700;
  font-size: clamp(52px, 8vw, 96px) !important; line-height: 1.05 !important; letter-spacing: 0.02em;
}
.ja span {
  display: inline-block; color: var(--mc-deep);
  text-shadow: 3px 3px 0 color-mix(in srgb, var(--mc) 40%, white);
  animation: pop 0.9s var(--spring) both; animation-delay: calc(var(--i) * 90ms);
}
@keyframes pop { from { opacity: 0; transform: translateY(0.4em) scale(0.6) rotate(-8deg); } }
.ko { margin: 0; font-size: 18px; font-weight: 700; }
.ko span { font-weight: 400; color: #735779; font-size: 15px; }
.sns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.sns-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px;
  background: #fff; color: var(--ink) !important; font-size: 13px; font-weight: 700; text-decoration: none !important;
  border: 1.5px solid color-mix(in srgb, var(--mc) 35%, white);
  transition: transform 0.45s var(--spring), background 0.2s, color 0.2s;
}
.oshi-btn { cursor: pointer; }
.oshi-btn.on { background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); color: #fff !important; border-color: transparent; }
.oshi-btn.on .oshi-heart { display: inline-block; animation: oshi-pop 0.6s cubic-bezier(.34, 1.56, .64, 1); }
@keyframes oshi-pop { 0% { scale: 0.3; rotate: -30deg; } 100% { scale: 1; rotate: 0deg; } }
@media (prefers-reduced-motion: reduce) { .oshi-btn.on .oshi-heart { animation: none; } }
.sns-btn svg { width: 15px; height: 15px; fill: currentColor; }
.sns-btn:hover { background: var(--mc); color: #fff !important; transform: translateY(-3px) rotate(-2deg); border-color: var(--mc); }

/* HOLO CARD */
.holo { position: relative; z-index: 1; perspective: 900px; container-type: inline-size; justify-self: center; width: min(280px, 100%); --rx: 0deg; --ry: 0deg; --px: 50%; --py: 30%; }
.holo-inner {
  position: relative; aspect-ratio: 5 / 7; border-radius: 22px; padding: 18px; overflow: hidden;
  background: linear-gradient(160deg, #fff, var(--mc-soft));
  box-shadow: 0 30px 60px -25px color-mix(in srgb, var(--mc) 70%, #000), inset 0 0 0 1.5px rgba(255, 255, 255, 0.8);
  transform: rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform 0.6s var(--spring);
  display: flex; flex-direction: column; gap: 6px;
  animation: float 6s ease-in-out infinite;
}
@keyframes float { 50% { translate: 0 -8px; } }
.holo-top { display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; letter-spacing: 0.16em; color: var(--mc-deep); }
.holo-face {
  flex: 1; display: grid; place-items: center; margin: 6px 0; border-radius: 16px;
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 110px; font-size: 40cqi; line-height: 1; color: var(--face-ink, #fff); /* dark on bright member colours */
  background: radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--mc) 50%, white), var(--mc));
  text-shadow: 0 6px 22px color-mix(in srgb, var(--mc) 70%, transparent);
}
.holo-name { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 20px; text-align: center; color: var(--mc-deep); }
.holo-row { display: flex; justify-content: space-between; font-size: 11px; border-top: 1px dashed color-mix(in srgb, var(--mc) 35%, white); padding-top: 4px; }
.holo-row span { letter-spacing: 0.14em; font-weight: 700; color: #7d6083; }
.holo-bar { display: flex; gap: 2px; height: 18px; margin-top: 4px; }
.holo-bar i { background: var(--ink); opacity: 0.75; }
.holo-sheen {
  position: absolute; inset: 0; pointer-events: none; mix-blend-mode: color-dodge; opacity: 0.55;
  background:
    radial-gradient(circle at var(--px) var(--py), rgba(255, 255, 255, 0.9), transparent 40%),
    linear-gradient(115deg, transparent 20%, #ff9ad5 35%, #9ef0ff 45%, #fff59e 55%, #c3a6ff 65%, transparent 80%);
  background-size: 100% 100%, 250% 250%;
  background-position: 0 0, var(--px) var(--py);
  transition: background-position 0.2s;
}

/* BENTO */
.bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
.tile {
  background: #fff; border-radius: 22px; padding: 16px 18px; display: flex; flex-direction: column; gap: 4px;
  border: 1.5px solid color-mix(in srgb, var(--mc) 18%, white);
  transition: transform 0.5s var(--spring), box-shadow 0.3s;
  min-width: 0;
}
.tile:hover { transform: translateY(-4px); box-shadow: 0 16px 30px -18px color-mix(in srgb, var(--mc) 80%, transparent); }
@supports (animation-timeline: view()) {
  .tile { animation: tin linear both; animation-timeline: view(); animation-range: entry 0% entry 60%; }
  @keyframes tin { from { opacity: 0; transform: translateY(30px) scale(0.96); } }
}
.lbl { font-size: 12px; font-weight: 700; color: #7d6083; letter-spacing: 0.04em; }
.big { font-family: 'Zen Maru Gothic', sans-serif; font-size: 44px; line-height: 1.1; color: var(--mc-deep); font-variant-numeric: tabular-nums; }
.big small { font-size: 18px; margin-left: 2px; }
.mid { font-family: 'Zen Maru Gothic', var(--cs-sans); font-size: 24px; color: var(--mc-deep); }
.pin { display: inline-block; animation: bob 2s var(--spring) infinite; margin-right: 4px; }
@keyframes bob { 0%, 70%, 100% { transform: translateY(0); } 35% { transform: translateY(-6px); } }
.sub { font-size: 12.5px; color: #735779; }
.t-bday { background: linear-gradient(150deg, var(--mc-soft), #fff); }
.bd-acts { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
/* the bento tile is narrow on phones: keep both pills on one line each */
.bd-acts :deep(.bc), .bd-acts .bd-ics { white-space: nowrap; font-size: 11.5px; padding: 5px 10px; }
.bd-ics { margin-top: 8px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; background: #fff; color: var(--mc-deep, #6b1d43); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--mc, #ff6b9d) 40%, white); }
.t-bday.today .bd-ics { background: rgba(255, 255, 255, 0.92); }
.t-bday.today { background: color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030); }
.t-bday.today .big, .t-bday.today .sub, .t-bday.today .lbl { color: #fff; }
.swatch { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 6px 0 0; background: none; text-align: left; cursor: copy; }
.sw { width: 44px; height: 44px; border-radius: 14px; background: var(--mc); box-shadow: inset 0 -6px 0 rgba(0, 0, 0, 0.08); flex: none; transition: transform 0.5s var(--spring), border-radius 0.5s var(--spring); }
.swatch:hover .sw { transform: rotate(-12deg) scale(1.08); border-radius: 50%; }
.swatch b { font-size: 16px; display: block; }
.swatch code { font-size: 12px; background: var(--mc-soft); color: var(--mc-deep); padding: 2px 6px; border-radius: 6px; }
.t-likes { grid-column: span 3; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.tag { font-size: 13px; font-weight: 600; padding: 5px 11px; border-radius: 999px; background: #fdf3f8; color: #6a4a70; }
.tag.skill { background: var(--mc-soft); color: var(--mc-deep); }
.t-height { grid-column: span 4; }
.ruler { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; height: 150px; align-items: end; margin-top: 8px; }
.bar { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; text-decoration: none !important; }
.bar-fill {
  width: 100%; max-width: 46px; height: calc(18% + var(--h) * 0.7); border-radius: 14px 14px 6px 6px;
  background: color-mix(in srgb, var(--bc) 30%, white); transform-origin: bottom;
  transition: transform 0.6s var(--spring), background 0.3s;
}
@supports (animation-timeline: view()) {
  .bar-fill { animation: grow linear both; animation-timeline: view(); animation-range: entry 10% cover 35%; }
  @keyframes grow { from { transform: scaleY(0.05); } }
}
.bar:hover .bar-fill { transform: scaleY(1.05); }
.bar.me .bar-fill { background: var(--bc); box-shadow: 0 10px 20px -8px var(--bc); }
.bar-cm { position: absolute; font-size: 11px; font-weight: 700; color: #735779; bottom: calc(18% + var(--h) * 0.7 + 22px); }
.bar.me .bar-cm { color: var(--mc-deep); font-size: 13px; }
.bar-nm { font-size: 13px; font-weight: 700; margin-top: 4px; color: color-mix(in srgb, var(--bc) 42%, #2a1030); }

/* PREV/NEXT */
.hero { transition: transform 0.16s ease-in, opacity 0.16s ease-in; }
.hero.swipe-next { transform: translateX(-28px); opacity: 0.6; }
.hero.swipe-prev { transform: translateX(28px); opacity: 0.6; }
.swipe-tip { display: none; margin: 10px 0 0; text-align: center; font-size: 12px; color: #735779; }
@media (hover: none) and (pointer: coarse) { .swipe-tip { display: flex; align-items: center; justify-content: center; gap: 6px; } }
.show { display: flex; align-items: center; gap: 14px; margin-top: 16px; padding: 16px 20px; border-radius: 24px; text-decoration: none !important; color: #fff !important;
  background: linear-gradient(120deg, color-mix(in srgb, var(--mc) min(62%, var(--ink-mix, 100%)), #2a1030), color-mix(in srgb, var(--mc) min(78%, var(--ink-mix, 100%)), #2a1030)); box-shadow: 0 18px 36px -22px var(--mc); transition: transform 0.5s var(--spring); }
.show:hover { transform: translateY(-3px); }
.show-ic { font-size: 30px; animation: wob 1.8s ease-in-out infinite; }
@keyframes wob { 50% { transform: rotate(-12deg) scale(1.12); } }
.show-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.show-txt small { font-size: 11.5px; letter-spacing: 0.08em; opacity: 0.9; font-weight: 700; }
.show-txt b { font-size: 17px; font-family: var(--cs-sans); }
.show-txt span { font-size: 13px; opacity: 0.95; }
.show-dd { margin-left: auto; flex: none; font-family: 'Zen Maru Gothic', sans-serif; font-size: 26px; font-weight: 700; padding: 6px 14px; border-radius: 16px; background: rgba(255, 255, 255, 0.18); }
.app { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; padding: 12px 18px; border-radius: 18px; text-decoration: none !important; color: #3a2340 !important;
  background: color-mix(in srgb, var(--mc) 10%, white); border: 1.5px dashed color-mix(in srgb, var(--mc) 45%, white); transition: transform 0.45s var(--spring); }
.app:hover { transform: translateY(-2px); }
.up { margin-top: 18px; }
.up-h { display: flex; align-items: baseline; gap: 10px; margin: 0 0 8px !important; padding: 0 !important; border: 0 !important; font-size: 16px !important; }
.up-h a { margin-left: auto; font-size: 12.5px; font-weight: 700; color: var(--mc-deep) !important; }
.up-list { list-style: none; margin: 0 !important; padding: 0 !important; display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; } /* the auto track grew to the nowrap meta line's width: rows 26px wider than the card on phones, tags clipped (#209) */
.up-list li { margin: 0 !important; }
.up-row { display: flex; align-items: center; gap: 12px; padding: 8px 12px 8px 8px; border-radius: 18px; background: #fff; border: 1.5px solid var(--mc-soft); text-decoration: none !important; color: var(--ink) !important; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1), border-color 0.2s; }
.up-row:hover { transform: translateX(4px); border-color: color-mix(in srgb, var(--mc) 45%, white); }
.up-tile { flex: none; width: 50px; height: 54px; border-radius: 14px; display: grid; place-content: center; text-align: center; background: var(--mc-soft); color: var(--mc-deep); line-height: 1; }
.up-tile small { font-size: 10.5px; font-weight: 900; letter-spacing: 0.08em; }
.up-tile b { font-family: 'Zen Maru Gothic', sans-serif; font-size: 22px; margin-top: 3px; }
.up-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.up-txt b { font-size: 14px; line-height: 1.35; overflow-wrap: anywhere; }
.up-txt span { font-size: 12.5px; color: #5a4060; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.up-tag { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.up-tag i { font-style: normal; font-size: 11px; font-weight: 800; color: #5a4060; }
.up-tag i.solo, .up-tag i.mine { color: var(--mc-deep); }
.up-tag em { font-style: normal; font-size: 12px; font-weight: 900; color: #fff; background: var(--mc-deep); padding: 2px 8px; border-radius: 999px; font-variant-numeric: tabular-nums; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 480px) { .up-tag i:not(.solo):not(.mine) { display: none; } } /* phones: drop the category, keep '개인 출연' */
@media (prefers-reduced-motion: reduce) { .up-row { transition: none; } }
.app small { font-size: 11.5px; font-weight: 800; letter-spacing: 0.06em; color: color-mix(in srgb, var(--mc) min(60%, var(--ink-mix, 100%)), #2a1030); }
.app b { font-size: 14.5px; }
.app-meta { font-size: 12.5px; color: #5a4060; }
.pn { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 28px; }
.pn a {
  display: flex; flex-direction: column; gap: 2px; padding: 16px 20px; border-radius: 20px; text-decoration: none !important;
  background: color-mix(in srgb, var(--pc) 12%, white); color: var(--ink) !important;
  border: 1.5px solid color-mix(in srgb, var(--pc) 30%, white);
  transition: transform 0.5s var(--spring), background 0.25s;
}
.pn a:hover { transform: translateY(-3px); background: color-mix(in srgb, var(--pc) 24%, white); }
.pn .nx { text-align: right; }
.pn small { font-size: 12px; color: #735779; }
.pn b { font-size: 16px; }

@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; padding: 28px 22px 48px; }
  .holo { width: 220px; }
  .bento { grid-template-columns: repeat(2, 1fr); }
  .t-likes, .t-height, .t-nick { grid-column: span 2; }
  .ruler { gap: 4px; height: 130px; }
}
@media (max-width: 420px) {
  .big { font-size: 36px; }
  .mid { font-size: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .blob, .marquee, .ja span, .holo-inner, .pin, .tile, .bar-fill, .show-ic { animation: none !important; }
  .holo-inner { transform: none; }
  .hero { transition: none; }
}
.cdot { display: inline-block; width: 0.62em; height: 0.62em; margin-right: 0.35em; border-radius: 50%; background: var(--pc, var(--mc)); box-shadow: 0 0 0 1.5px #fff; vertical-align: 0.02em; font-style: normal; }
.cdot.r { margin: 0 0 0 0.35em; }
</style>
