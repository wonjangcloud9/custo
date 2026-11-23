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
    date: '2026-11-21', kind: 'web',
    title: '【裏側密着】ランウェイでとんでもないことが起きました…CUTIE STREETとのマル秘コラボも！',
    ko: 'TVQ 규슈 오카다 모모카 아나운서의 KAWAII LAB. COLLECTION(기타큐슈) 무대 뒤 밀착 — 큐티스트리트와의 비밀 콜라보도!',
    url: 'https://www.youtube.com/watch?v=JQV5Xi0av4M', video: 'JQV5Xi0av4M',
    source: '岡田桃佳アナの【モモック】チャンネル (TVQ 공식 아나운서 페이지 tvq.co.jp/ana 에 링크된 채널 · 설명란 #cutiestreet)',
  },
  {
    date: '2026-11-19', kind: 'web',
    title: 'オトバズ収録現場に10時間密着したら…チョコプラ、CUTIE STREET、マルシィ、GENERATIONS、こっちのけんと、ICEx、GENTA YAMAGUCHI、ME:Iに遭遇しました…#281',
    ko: '키타야마 히로미츠가 「オトバズ」 녹화 현장 10시간 밀착 — 큐티스트리트도 등장!',
    url: 'https://www.youtube.com/watch?v=C3lx7V1_L2s', video: 'C3lx7V1_L2s',
    source: '北山宏光 공식 채널 @k_hiro_mitsu917 (TOBE 공식 채널 설명란에 기재된 핸들)',
  },
  {
    date: '2026-11-17', kind: 'feature',
    title: '[MV] YENA (최예나)_사쿠란보 (Sakuranbo) : J-POP REMAKE Vol.5',
    ko: '최예나 「사쿠란보」 J-POP 리메이크 MV에 큐티스트리트 출연!',
    url: 'https://www.youtube.com/watch?v=S5dTQf2y3iA', video: 'S5dTQf2y3iA',
    source: '동네친구 강나미 공식 채널 (설명란 #큐티스트리트 #CUTIESTREET)',
  },
]

export const kindMeta: Record<HighlightKind, { ko: string; emoji: string; ico: string }> = {
  feature: { ico: 'sparkle', ko: '출연', emoji: '🌟' },
  tv: { ico: 'tv', ko: 'TV', emoji: '📺' },
  web: { ico: 'globe', ko: '웹', emoji: '🌐' },
  press: { ico: 'news', ko: '기사', emoji: '📰' },
}
