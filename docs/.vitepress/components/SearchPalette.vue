<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { withBase, useRouter } from 'vitepress'
import { members, memberById } from '../data/members'
import { releases } from '../data/discography'
import { events, catMeta } from '../data/events'
import videosRaw from '../data/videos.json'

interface Video { id: string; title: string; duration: string; category: string; date: string; members?: string[] }
type Kind = 'page' | 'member' | 'release' | 'event' | 'video'
interface Hit { kind: Kind; title: string; sub: string; href: string; ext?: boolean; color?: string; icon: string; hay: string }

const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s・·、。！!？?「」『』【】()（）\-_/]/g, '')

const PAGES: [string, string, string][] = [
  ['홈', '/', '🏠'], ['정상까지의 여정 (3D)', '/journey/', '🗻'], ['멤버 전체', '/members/', '💖'], ['유닛 & 케미', '/units/', '💞'],
  ['영상 아카이브', '/videos/', '🎬'], ['디스코그래피', '/discography/', '💿'], ['스케줄', '/schedule/', '🗓️'], ['나의 ♡ 앨범', '/likes/', '♡'], ['라이브 가이드 · 펜라이트', '/live-guide/', '🔦'], ['나와 닮은 멤버 테스트', '/which-member/', '🔮'],
  ['레전드 무대', '/stages/', '🎤'], ['히라가나 배우기', '/japanese/beginner/hiragana', '🔤'], ['현장 일본어', '/japanese/idol-japanese/live-terms', '📣'], ['덕질 용어 사전', '/japanese/dictionary', '📖'],
]
const index: Hit[] = [
  ...PAGES.map(([t, h, i]) => ({ kind: 'page' as const, title: t, sub: '페이지', href: withBase(h), icon: i, hay: norm(t) })),
  ...members.map((m) => ({ kind: 'member' as const, title: `${m.ja} ${m.ko}`, sub: `${m.colorName} · ${m.nickname} · ${m.birthplace}`, href: withBase(`/members/${m.id}`), color: m.color, icon: m.ja.slice(-2, -1),
    hay: norm([m.ja, m.ko, m.en, m.kana, m.nickname, m.nicknameKo, m.colorName, m.id].join(' ')) })),
  ...releases.map((r) => ({ kind: 'release' as const, title: r.title, sub: `${r.type} · ${r.date.replace(/-/g, '.')}`, href: withBase('/discography/'), icon: '💿', hay: norm(r.title + r.song) })),
  ...events.map((e) => ({ kind: 'event' as const, title: e.ja, sub: `${e.date.replace(/-/g, '.')} · ${catMeta[e.cat].ko}${e.venue ? ' · ' + e.venue : ''}`, href: e.url, ext: true, icon: catMeta[e.cat].emoji, hay: norm(e.ja + e.ko + (e.venue ?? '')) })),
  ...(videosRaw as Video[]).map((v) => ({ kind: 'video' as const, title: v.title.replace(/【CUTIE STREET[^】]*】/g, '').trim(), sub: `${v.duration || 'MV'}${v.date ? ' · ' + v.date.replace(/-/g, '.') : ''}`,
    href: `https://www.youtube.com/watch?v=${v.id}`, ext: true, icon: '▶',
    hay: norm(v.title + ' ' + (v.members ?? []).map((id) => `${memberById[id].ko} ${memberById[id].nicknameKo}`).join(' ')) })),
]
const LABEL: Record<Kind, string> = { page: '페이지', member: '멤버', release: '릴리즈', event: '스케줄', video: '영상' }
const LIMIT: Record<Kind, number> = { page: 4, member: 8, release: 5, event: 5, video: 8 }
const FILTERS: ('all' | Kind)[] = ['all', 'member', 'video', 'release', 'event', 'page']

const open = ref(false)
const q = ref('')
const filter = ref<'all' | Kind>('all')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const router = useRouter()

const results = computed(() => {
  const n = norm(q.value)
  const terms = q.value.trim().split(/\s+/).map(norm).filter(Boolean)
  const pool = index.filter((h) => filter.value === 'all' || h.kind === filter.value)
  const matched = n ? pool.filter((h) => terms.every((t) => h.hay.includes(t))) : pool.filter((h) => h.kind === 'page' || h.kind === 'member')
  const groups: { kind: Kind; items: Hit[] }[] = []
  for (const k of ['member', 'page', 'release', 'event', 'video'] as Kind[]) {
    const items = matched.filter((h) => h.kind === k).slice(0, filter.value === 'all' ? LIMIT[k] : 40)
    if (items.length) groups.push({ kind: k, items })
  }
  return groups
})
const flat = computed(() => results.value.flatMap((g) => g.items))
watch([q, filter], () => (active.value = 0))

function show() { open.value = true; q.value = ''; filter.value = 'all'; nextTick(() => input.value?.focus()) }
function hide() { open.value = false }
function go(h: Hit | undefined) {
  if (!h) return
  hide()
  if (h.ext) window.open(h.href, '_blank', 'noopener')
  else router.go(h.href)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(flat.value.length - 1, active.value + 1); scrollActive() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(0, active.value - 1); scrollActive() }
  else if (e.key === 'Enter') { e.preventDefault(); go(flat.value[active.value]) }
  else if (e.key === 'Escape') hide()
}
function scrollActive() { nextTick(() => document.querySelector('.sp-item.on')?.scrollIntoView({ block: 'nearest' })) }
function globalKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); open.value ? hide() : show() }
}
onMounted(() => window.addEventListener('keydown', globalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', globalKey))
const isMac = ref(true)
onMounted(() => { isMac.value = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) })
</script>

<template>
  <button type="button" class="sp-trigger" aria-label="통합 검색 열기" @click="show">
    <span aria-hidden="true">🔍</span><span class="sp-t-label">검색</span><kbd>{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
  </button>
  <Teleport to="body">
    <Transition name="sp">
      <div v-if="open" class="sp-backdrop" @click.self="hide">
        <div class="sp" role="dialog" aria-modal="true" aria-label="통합 검색">
          <div class="sp-input">
            <span aria-hidden="true">🔍</span>
            <input ref="input" v-model="q" type="search" placeholder="멤버, 곡, 영상, 일정 검색 (예: 하루카, 武道館, ぷりきゅきゅ)" aria-controls="sp-list" @keydown="onKey" />
            <kbd @click="hide">esc</kbd>
          </div>
          <div class="sp-filters" role="toolbar" aria-label="범위">
            <button v-for="f in FILTERS" :key="f" type="button" :aria-pressed="filter === f" @click="filter = f; input?.focus()">{{ f === 'all' ? '전체' : LABEL[f] }}</button>
          </div>
          <div id="sp-list" class="sp-list" role="listbox">
            <template v-for="g in results" :key="g.kind">
              <p class="sp-group">{{ LABEL[g.kind] }}</p>
              <button v-for="h in g.items" :key="g.kind + h.href + h.title" type="button" role="option" class="sp-item"
                :class="{ on: flat[active] === h }" :aria-selected="flat[active] === h" @mousemove="active = flat.indexOf(h)" @click="go(h)">
                <span class="sp-ic" :style="h.color ? { background: h.color, color: '#fff' } : {}">{{ h.icon }}</span>
                <span class="sp-txt"><b>{{ h.title }}</b><small>{{ h.sub }}</small></span>
                <span v-if="h.ext" class="sp-ext" aria-hidden="true">↗</span>
              </button>
            </template>
            <p v-if="!flat.length" class="sp-empty">검색 결과가 없어요 🥲</p>
          </div>
          <div class="sp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 이동</span><span><kbd>↵</kbd> 열기</span><span><kbd>/</kbd> 언제든 검색</span></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sp-trigger { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px 0 12px; margin-right: 8px; border-radius: 999px; font-size: 13px; font-weight: 600;
  background: #fff; border: 1.5px solid #f3d6e4; color: #6a4a70; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1), border-color 0.2s; }
.sp-trigger:hover { transform: translateY(-1px); border-color: #ff9ec0; }
.sp-trigger kbd, .sp kbd { font-family: inherit; font-size: 11px; padding: 1px 6px; border-radius: 6px; background: #f8eef4; border: 1px solid #efdbe6; color: #8a6a90; }
.sp-backdrop { position: fixed; inset: 0; z-index: 200; background: rgba(40, 10, 40, 0.42); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 16px; }
.sp { width: min(640px, 100%); max-height: 72vh; display: flex; flex-direction: column; background: #fff; border-radius: 22px; overflow: hidden; color: #3a2340;
  box-shadow: 0 40px 80px -24px rgba(60, 10, 50, 0.55), 0 0 0 1px rgba(255, 107, 157, 0.15); }
.sp-input { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #f6e6ee; }
.sp-input input { flex: 1; min-width: 0; border: 0; outline: 0; font-size: 16px; background: transparent; color: inherit; }
.sp-input kbd { cursor: pointer; }
.sp-filters { display: flex; gap: 6px; padding: 10px 14px 4px; overflow-x: auto; scrollbar-width: none; }
.sp-filters button { flex: none; font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 999px; background: #faf2f6; color: #6a4a70; }
.sp-filters button[aria-pressed='true'] { background: #3a2340; color: #fff; }
.sp-list { overflow-y: auto; padding: 6px 8px 10px; }
.sp-group { margin: 10px 8px 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #b89bb8; }
.sp-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 10px; border-radius: 12px; text-align: left; background: none; color: inherit; }
.sp-item.on { background: #fff0f6; }
.sp-ic { flex: none; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: #f6eef3; font-size: 14px; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; }
.sp-txt { display: flex; flex-direction: column; min-width: 0; }
.sp-txt b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Noto Sans JP', 'Noto Sans KR', sans-serif; }
.sp-txt small { font-size: 12px; color: #9a7aa0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-ext { margin-left: auto; color: #c5aac9; }
.sp-empty { text-align: center; padding: 30px 0; color: #9a7aa0; }
.sp-foot { display: flex; gap: 16px; padding: 10px 16px; border-top: 1px solid #f6e6ee; font-size: 12px; color: #9a7aa0; }
.sp-foot kbd { margin-right: 3px; }
.sp-enter-active, .sp-leave-active { transition: opacity 0.2s; }
.sp-enter-active .sp { transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1), opacity 0.2s; }
.sp-enter-from, .sp-leave-to { opacity: 0; }
.sp-enter-from .sp { transform: translateY(-14px) scale(0.96); opacity: 0; }
@media (max-width: 960px) { .sp-t-label, .sp-trigger kbd { display: none; } .sp-trigger { width: 34px; padding: 0; justify-content: center; margin-right: 0; } }
@media (max-width: 640px) { .sp-backdrop { padding-top: 8vh; } .sp-foot { display: none; } }
@media (prefers-reduced-motion: reduce) { .sp-enter-active .sp, .sp-trigger { transition: none; } }
</style>
