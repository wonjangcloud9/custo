import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

declare const __BUILD_TIME__: number
/**
 * When the site was built (epoch ms). Same value in the server render and in the browser until mount, so a
 * list computed from it hydrates without a mismatch; swap in the real 'now' once mounted. Use it only where
 * a layout would otherwise jump (upcoming lists) — the deploy is at most a few hours old, and the list is
 * corrected the moment the page mounts.
 */
export const BUILD_TIME: number = typeof __BUILD_TIME__ === 'number' ? __BUILD_TIME__ : Date.now()

/**
 * 'Now' for day-level things (ages, birthday D-days, upcoming lists): null during SSR, set on mount, and
 * replaced only when the calendar date changes while the page stays open — so a page left open past
 * midnight moves to the new day without re-rendering every minute.
 */
export function useToday(checkMs = 60000): Ref<Date | null> {
  const now = ref<Date | null>(null)
  let timer: number | undefined
  const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  onMounted(() => {
    now.value = new Date()
    timer = window.setInterval(() => {
      const d = new Date()
      if (!now.value || ymd(d) !== ymd(now.value)) now.value = d
    }, checkMs)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return now
}

/**
 * Epoch ms for time-of-day things (event steps that start at 14:00, D-days, 'new' badges): null during SSR,
 * set on mount and refreshed every minute while the page stays open.
 */
export function useClock(stepMs = 60000): Ref<number | null> {
  const now = ref<number | null>(null)
  let timer: number | undefined
  onMounted(() => {
    now.value = Date.now()
    timer = window.setInterval(() => { now.value = Date.now() }, stepMs)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return now
}
