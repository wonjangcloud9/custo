<script setup lang="ts">
import { jaLang } from '../theme/lang'
import { ref, shallowRef, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { withBase, useRouter } from 'vitepress'
import type { Hit, Kind } from '../data/searchIndex'

import Ico from './Ico.vue'
let searchFn: ((idx: Hit[], q: string, k: 'all' | Kind) => Hit[]) | null = null
const index = shallowRef<Hit[]>([])
async function ensureIndex() {
  if (index.value.length) return
  const mod = await import('../data/searchIndex')
  searchFn = mod.search
  index.value = mod.buildIndex(withBase)
}
// one-tap examples (also shown when nothing matched) — each one exercises a different way fans type
const EXAMPLES = ['하루카', 'ㅅㄴㅇㅇㅋ', '엠카', '귀엽기만', '武道館', '생탄제', '직캠 나기사']
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
  const pool = index.value
  const typed = q.value.trim()
  // ranked hits; with nothing typed, pages + members as a starting menu
  const ranked = typed && searchFn ? searchFn(pool, typed, filter.value) : pool.filter((h) => (filter.value === 'all' ? h.kind === 'page' || h.kind === 'member' : h.kind === filter.value))
  // groups appear in the order of their best hit, so the most relevant kind comes first
  const order: Kind[] = []
  for (const h of ranked) if (!order.includes(h.kind)) order.push(h.kind)
  if (!typed) order.sort((a, b) => ['member', 'page', 'release', 'event', 'video'].indexOf(a) - ['member', 'page', 'release', 'event', 'video'].indexOf(b))
  return order.map((k) => ({ kind: k, items: ranked.filter((h) => h.kind === k).slice(0, filter.value === 'all' ? LIMIT[k] : 40) }))
})
const flat = computed(() => results.value.flatMap((g) => g.items))
watch([q, filter], () => (active.value = 0))

function show() { lastFocus = document.activeElement as HTMLElement | null; open.value = true; q.value = ''; filter.value = 'all'; ensureIndex(); nextTick(() => input.value?.focus()) }
function hide() { open.value = false; nextTick(() => lastFocus?.focus?.()) }
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
// keep keyboard focus inside the palette while it is open
function trap(e: KeyboardEvent) {
  const box = (e.currentTarget as HTMLElement)
  const f = [...box.querySelectorAll<HTMLElement>('input, button')].filter((x) => x.offsetParent !== null)
  if (!f.length) return
  const first = f[0], last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
let lastFocus: HTMLElement | null = null
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
    <Ico n="search" size="15" /><span class="sp-t-label">검색</span><kbd>{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
  </button>
  <Teleport to="body">
    <Transition name="sp">
      <div v-if="open" class="sp-backdrop" @click.self="hide">
        <div class="sp" role="dialog" aria-modal="true" aria-label="통합 검색" @keydown.tab="trap">
          <div class="sp-input">
            <Ico n="search" size="18" class="sp-glass" />
            <input ref="input" v-model="q" type="search" placeholder="멤버·곡·영상·일정 — 한글·일본어·초성 다 돼요" aria-controls="sp-list" @keydown="onKey" />
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
                <span class="sp-ic" :style="h.color ? { background: h.color, color: '#fff' } : {}"><Ico v-if="h.ico" :n="h.ico" size="17" /><template v-else>{{ h.icon }}</template></span>
                <span class="sp-txt"><b :lang="jaLang(h.title)">{{ h.title }}</b><small>{{ h.sub }}</small></span>
                <span v-if="h.ext" class="sp-ext" aria-hidden="true">↗</span>
              </button>
            </template>
            <div v-if="!flat.length || !q.trim()" class="sp-empty" :class="{ tips: flat.length }">
              <p v-if="!flat.length">‘{{ q.trim() }}’에 맞는 결과가 없어요. 이렇게도 찾아보세요</p>
              <p v-else>이렇게 검색해 보세요</p>
              <div class="sp-ex"><button v-for="x in EXAMPLES" :key="x" type="button" @click="q = x; input?.focus()">{{ x }}</button></div>
            </div>
          </div>
          <div class="sp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 이동</span><span><kbd>↵</kbd> 열기</span><span><kbd>/</kbd> 언제든 검색</span></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sp-trigger { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px 0 12px; margin: 0 8px 0 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
  background: #fff; border: 1.5px solid #f3d6e4; color: #6a4a70; transition: transform 0.4s cubic-bezier(.34, 1.56, .64, 1), border-color 0.2s; }
.sp-trigger:hover { transform: translateY(-1px); border-color: #ff9ec0; }
.sp-trigger kbd, .sp kbd { font-family: inherit; font-size: 11px; padding: 1px 6px; border-radius: 6px; background: #f8eef4; border: 1px solid #efdbe6; color: #735779; }
.sp-backdrop { position: fixed; inset: 0; z-index: 200; background: rgba(40, 10, 40, 0.42); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 16px; }
.sp { width: min(640px, 100%); max-height: 72vh; display: flex; flex-direction: column; background: #fff; border-radius: 22px; overflow: hidden; color: #3a2340;
  box-shadow: 0 40px 80px -24px rgba(60, 10, 50, 0.55), 0 0 0 1px rgba(255, 107, 157, 0.15); }
.sp-input { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #f6e6ee; }
.sp-input input { flex: 1; min-width: 0; border: 0; outline: 0; font-size: 16px; background: transparent; color: inherit; }
.sp-input kbd { cursor: pointer; }
.sp-filters { display: flex; gap: 6px; padding: 10px 14px 4px; overflow-x: auto; scrollbar-width: none; }
.sp-filters button { flex: none; font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 999px; background: #faf2f6; color: #6a4a70; }
.sp-filters button[aria-pressed='true'] { background: #3a2340; color: #fff; }
.sp-input, .sp-filters, .sp-foot { flex: none; }
.sp-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 6px 8px 10px; }
.sp-group { margin: 10px 8px 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #7d6083; }
.sp-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 10px; border-radius: 12px; text-align: left; background: none; color: inherit; }
.sp-item.on { background: #fff0f6; }
.sp-ic { flex: none; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: #f6eef3; color: #a3245a; font-size: 14px; font-weight: 700; font-family: 'Zen Maru Gothic', sans-serif; }
.sp-txt { display: flex; flex-direction: column; min-width: 0; }
.sp-txt b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--cs-sans); }
.sp-txt small { font-size: 12px; color: #735779; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-ext { margin-left: auto; color: #7d6083; }
.sp-empty { text-align: center; padding: 26px 8px 12px; color: #735779; font-size: 13px; }
.sp-empty.tips { padding-top: 10px; border-top: 1px dashed #f3dce7; margin-top: 8px; }
.sp-empty p { margin: 0 0 10px; }
.sp-ex { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.sp-ex button { font-size: 12.5px; font-weight: 700; padding: 6px 12px; border-radius: 999px; background: #fff0f6; color: #a3245a; border: 1px solid #f7d3e2; transition: transform 0.35s cubic-bezier(.34, 1.56, .64, 1), background 0.2s; }
.sp-ex button:hover { transform: translateY(-2px); background: #ffe3ef; }
.sp-glass { color: #c2457a; }
.sp-foot { display: flex; gap: 16px; padding: 10px 16px; border-top: 1px solid #f6e6ee; font-size: 12px; color: #735779; }
.sp-foot kbd { margin-right: 3px; }
.sp-enter-active, .sp-leave-active { transition: opacity 0.2s; }
.sp-enter-active .sp { transition: transform 0.45s cubic-bezier(.34, 1.56, .64, 1), opacity 0.2s; }
.sp-enter-from, .sp-leave-to { opacity: 0; }
.sp-enter-from .sp { transform: translateY(-14px) scale(0.96); opacity: 0; }
@media (max-width: 960px) { .sp-t-label, .sp-trigger kbd { display: none; } .sp-trigger { width: 34px; padding: 0; justify-content: center; margin-right: 0; } }
@media (max-width: 640px) { .sp-backdrop { padding-top: 8vh; } .sp-foot { display: none; } }
@media (prefers-reduced-motion: reduce) { .sp-enter-active .sp, .sp-trigger { transition: none; } }
</style>
