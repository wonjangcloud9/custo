import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

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
