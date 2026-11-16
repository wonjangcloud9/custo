// Official news digest with Korean summaries.
// Source: https://cutiestreet.asobisystem.com/news/1 (titles in `ja`, lightly shortened) — refreshed by the loop.
// The Kohaku item links to 音楽ナタリー because the official post is FC-members-only.
// Korean text summarizes the official title only; details live on the linked official page.

export type NewsTag = 'ticket' | 'event' | 'release' | 'tv' | 'info'
export interface News { date: string; ja: string; ko: string; tag: NewsTag; url: string; internal?: string }

const O = 'https://cutiestreet.asobisystem.com'
export const news: News[] = [
  { date: '2026-11-15', tag: 'ticket', ja: '11/15(日) JAPAN ARENA TOUR 2026 -AUTUMN-『CUTIE LAND』広島公演 Day2 当日券販売のお知らせ', ko: '아레나 투어 히로시마 DAY2 당일권 판매 안내', url: `${O}/news/detail/96456`, internal: '/schedule/' },
  { date: '2026-11-14', tag: 'ticket', ja: '11/14(土) JAPAN ARENA TOUR 2026 -AUTUMN-『CUTIE LAND』広島公演 Day1 当日券販売のお知らせ', ko: '아레나 투어 히로시마 DAY1 당일권 판매 안내', url: `${O}/news/detail/96381`, internal: '/schedule/' },
  { date: '2026-11-14', tag: 'event', ja: '11/23(月・祝) CUTIE STREET大特典会＠アクセスサッポロのファンクラブ限定部 2次応募の抽選受付が決定！', ko: '11/23 삿포로 대특전회 FC 한정부 2차 추첨 접수 결정', url: `${O}/news/detail/96375`, internal: '/schedule/' },
  { date: '2026-11-14', tag: 'event', ja: '1stアルバム発売記念！12/6(日) CUTIE STREET大特典会をインテックス大阪 3号館にて開催決定！', ko: '1st 앨범 발매 기념 12/6 오사카(인텍스 오사카 3호관) 대특전회 개최 결정', url: `${O}/news/detail/96353`, internal: '/schedule/' },
  { date: '2026-11-13', tag: 'tv', ja: 'CUTIE STREETが「NHK紅白歌合戦」初出場決定！（音楽ナタリー 会見レポート）', ko: '제77회 NHK 홍백가합전 첫 출장 결정! (출장자 발표 회견)', url: 'https://natalie.mu/music/news/697917', internal: '/journey/' },
  { date: '2026-11-13', tag: 'event', ja: '12/6(日)開催 大特典会＠インテックス大阪 3号館 私物サイン会・直筆お名前入りCUTIE LANDシールお渡し会 事前抽選会開催決定！', ko: '12/6 오사카 대특전회 사인회·이름 스티커 전달회 사전 추첨 결정', url: `${O}/news/detail/96212` },
  { date: '2026-11-13', tag: 'event', ja: '11/23(月・祝)開催 大特典会＠アクセスサッポロ 私物サイン会・直筆お名前入りCUTIE LANDシールお渡し会 事前抽選会開催決定！', ko: '11/23 삿포로 대특전회 사인회·이름 스티커 전달회 사전 추첨 결정', url: `${O}/news/detail/96209` },
  { date: '2026-11-12', tag: 'info', ja: '『～KAWAII LAB. 衣装展～ KAWAII CLOSET 2026』開催決定！', ko: '카와이랩 의상전 「KAWAII CLOSET 2026」 개최 결정 (12/19~)', url: `${O}/news/detail/96078`, internal: '/schedule/' },
  { date: '2026-11-12', tag: 'ticket', ja: '1stアルバム発売記念！11/23(月・祝) 大特典会@アクセスサッポロ 特典会参加券2次販売が決定！', ko: '11/23 삿포로 대특전회 참가권 2차 판매 결정', url: `${O}/news/detail/96191` },
  { date: '2026-11-12', tag: 'ticket', ja: '「KAWAII LAB. Christmas SESSION 2026」@有明アリーナ アップグレード2次抽選受付のお知らせ', ko: '크리스마스 세션(아리아케 아레나) 업그레이드 2차 추첨 접수', url: `${O}/news/detail/96002`, internal: '/schedule/' },
  { date: '2026-11-11', tag: 'release', ja: 'CUTIE STREET 1st アルバム『CUTIE LAND』収録曲公開！', ko: '1st 앨범 「CUTIE LAND」 수록곡 16곡 공개', url: `${O}/news/detail/95941`, internal: '/discography/' },
]

export const tagMeta: Record<NewsTag, { ko: string; emoji: string; color: string }> = {
  ticket: { ko: '티켓', emoji: '🎫', color: '#c92f69' },
  event: { ko: '이벤트', emoji: '🎁', color: '#b4560f' },
  release: { ko: '릴리즈', emoji: '💿', color: '#7a3fb0' },
  tv: { ko: 'TV', emoji: '📺', color: '#2b5ea8' },
  info: { ko: '소식', emoji: '✨', color: '#136b53' },
}
