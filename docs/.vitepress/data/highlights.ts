// Hand-picked "today" highlights that don't come from the official feeds (e.g. appearances on
// other artists' channels). Every item must be verified (oEmbed / official description) — see ROADMAP.
export type HighlightKind = 'feature' | 'tv' | 'web' | 'press'
export interface Highlight {
  date: string // YYYY-MM-DD (JST) — the day it appeared
  kind: HighlightKind
  title: string // original title
  ko: string // Korean one-liner
  url: string
  video?: string // YouTube id → thumbnail
  source: string // where it was verified
}

export const highlights: Highlight[] = [
  {
    date: '2026-11-17', kind: 'feature',
    title: '[MV] YENA (최예나)_사쿠란보 (Sakuranbo) : J-POP REMAKE Vol.5',
    ko: '최예나 「사쿠란보」 J-POP 리메이크 MV에 큐티스트리트 출연! 🍒',
    url: 'https://www.youtube.com/watch?v=S5dTQf2y3iA', video: 'S5dTQf2y3iA',
    source: '동네친구 강나미 공식 채널 (설명란 #큐티스트리트 #CUTIESTREET)',
  },
]

export const kindMeta: Record<HighlightKind, { ko: string; emoji: string }> = {
  feature: { ko: '출연', emoji: '🌟' },
  tv: { ko: 'TV', emoji: '📺' },
  web: { ko: '웹', emoji: '🌐' },
  press: { ko: '기사', emoji: '📰' },
}
