import type { CsEvent } from './events'

// '갈 거예요 / 볼 거예요' marks, shared by the schedule and the home digest.
// Kept only in this browser (localStorage) and never sent anywhere; blocked storage → empty, nothing breaks.
export const GOING_KEY = 'custo-going'
export const goingKey = (e: CsEvent) => `${e.date}|${e.ja}`

export function loadGoing(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(GOING_KEY) || '[]')) } catch { return new Set() }
}
export function saveGoing(s: Set<string>): void {
  try { localStorage.setItem(GOING_KEY, JSON.stringify([...s])) } catch { /* private mode: marks last for this visit */ }
}
