import { ref, computed, onMounted } from 'vue'

// '최애' (oshi) — one member the visitor picks; persisted locally and reflected as
// <html data-oshi="id"> so CSS can retint the site accent. Module-level ref = shared state.
const KEY = 'custo-oshi'
export const oshi = ref<string>('')
let loaded = false

function apply(id: string) {
  if (typeof document === 'undefined') return
  if (id) document.documentElement.dataset.oshi = id
  else delete document.documentElement.dataset.oshi
}

export function loadOshi() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try { oshi.value = localStorage.getItem(KEY) || '' } catch { /* private mode */ }
  apply(oshi.value)
}

export function setOshi(id: string) {
  oshi.value = oshi.value === id ? '' : id
  try { oshi.value ? localStorage.setItem(KEY, oshi.value) : localStorage.removeItem(KEY) } catch { /* ignore */ }
  apply(oshi.value)
}

/** Oshi for templates: '' until this component has mounted, so server HTML and the
 *  hydrating render match (async components hydrate after GlobalFx has loaded the value). */
export function useOshi() {
  const mounted = ref(false)
  onMounted(() => { loadOshi(); mounted.value = true })
  return computed(() => (mounted.value ? oshi.value : ''))
}
