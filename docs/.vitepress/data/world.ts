// Where CUTIE STREET has been — every stop comes from official sources (schedule pages, official
// YouTube titles/descriptions). Coordinates are city-level [lon, lat]. See loop/ROADMAP.md research notes.
export interface Pin { name: string; ll: [number, number] }
export interface Chapter {
  date: string // display date
  iso: string // YYYY-MM-DD used for "done vs upcoming"
  title: string
  sub: string
  country: 'JP' | 'TW' | 'KR' | 'US'
  pins: Pin[]
  link?: string
  video?: string
}

export const COUNTRY: Record<Chapter['country'], { id: string; ko: string; flag: string; color: string }> = {
  JP: { id: '392', ko: '일본', flag: '🇯🇵', color: '#FF6B9D' },
  TW: { id: '158', ko: '대만', flag: '🇹🇼', color: '#3CCFA8' },
  KR: { id: '410', ko: '한국', flag: '🇰🇷', color: '#4A90D9' },
  US: { id: '840', ko: '미국 (하와이)', flag: '🇺🇸', color: '#A06CD5' },
}

const TOKYO: [number, number] = [139.77, 35.68]
export const HOME = TOKYO

export const CHAPTERS: Chapter[] = [
  { date: '2024.08.04', iso: '2024-08-04', country: 'JP', title: '도쿄에서 데뷔', sub: 'TOKYO IDOL FESTIVAL 2024 · 오다이바', pins: [{ name: '도쿄', ll: TOKYO }], link: '/journey/' },
  { date: '2025.04.19', iso: '2025-04-19', country: 'TW', title: '첫 해외 공연 — 대만', sub: '『114年全国中等学校運動会』 개막식 · 타이난', pins: [{ name: '타이난', ll: [120.21, 22.99] }], video: 'AYFavSVm3vY' },
  {
    date: '2025.08–10', iso: '2025-08-27', country: 'JP', title: '첫 전국 투어 「CAN\'T STOP CUTIE」', sub: '12도시 · 파이널 ぴあアリーナMM (요코하마)',
    pins: [
      { name: '사이타마', ll: [139.61, 35.78] }, { name: '센다이', ll: [140.87, 38.27] }, { name: '나고야', ll: [136.91, 35.18] },
      { name: '오사카', ll: [135.5, 34.69] }, { name: '교토', ll: [135.77, 35.01] }, { name: '고베', ll: [135.2, 34.69] },
      { name: '치토세 (홋카이도)', ll: [141.65, 42.82] }, { name: '히로시마', ll: [132.46, 34.39] }, { name: '후쿠오카', ll: [130.4, 33.59] },
      { name: '구마모토', ll: [130.71, 32.8] }, { name: '요코하마', ll: [139.64, 35.44] },
    ],
  },
  { date: '2025.11.15', iso: '2025-11-15', country: 'KR', title: '한국 첫 무대', sub: '『WONDERLIVET 2025』 · 고양 킨텍스', pins: [{ name: '고양 (킨텍스)', ll: [126.75, 37.67] }], link: '/korea/', video: 'ooHpGc-pTSs' },
  { date: '2026.03', iso: '2026-03-26', country: 'KR', title: '엠카운트다운 · 서울 공연', sub: 'Mnet M COUNTDOWN · YES24 WANDERLOCH HALL', pins: [{ name: '서울', ll: [126.98, 37.57] }], link: '/korea/', video: 'aanKhmeCl-s' },
  { date: '2026.07.25–26', iso: '2026-07-25', country: 'KR', title: '서울 단독 공연', sub: '세종대학교 대양홀', pins: [{ name: '서울 (세종대)', ll: [127.07, 37.55] }], link: '/korea/', video: 'Jyd_CyxbDeA' },
  { date: '2026.08.25–26', iso: '2026-08-25', country: 'JP', title: '첫 日本武道館', sub: '데뷔 2주년 · 도쿄', pins: [{ name: '日本武道館', ll: [139.75, 35.69] }], video: 'KGFOrSUL-uc' },
  {
    date: '2026.09–11', iso: '2026-09-23', country: 'JP', title: '첫 아레나 투어 「CUTIE LAND」', sub: '7도시 13공연', link: '/cutie-land/',
    pins: [
      { name: '요코하마 아레나', ll: [139.62, 35.51] }, { name: '아리아케 아레나', ll: [139.79, 35.64] }, { name: '미야기', ll: [140.99, 38.33] },
      { name: '후쿠오카', ll: [130.4, 33.6] }, { name: '고베', ll: [135.22, 34.66] }, { name: '히로시마', ll: [132.45, 34.4] }, { name: '아이치 (IG아레나)', ll: [136.9, 35.19] },
    ],
  },
  { date: '2026.12.31', iso: '2026-12-31', country: 'JP', title: 'NHK 紅白歌合戦 첫 출장', sub: 'NHK홀 · 도쿄', pins: [{ name: 'NHK홀', ll: [139.7, 35.66] }], link: '/kohaku/' },
  { date: '2027.01.23', iso: '2027-01-23', country: 'KR', title: 'Live in Korea 2027 WINTER', sub: '고양 킨텍스 Hall 9A', pins: [{ name: '고양 (킨텍스)', ll: [126.75, 37.67] }], link: '/korea/' },
  { date: '2027.03.08', iso: '2027-03-08', country: 'US', title: '첫 하와이 — ASOBIEXPO HAWAII 2027', sub: 'TOM MOFFATT WAIKIKI SHELL · 호놀룰루', pins: [{ name: '호놀룰루', ll: [-157.82, 21.27] }], link: '/schedule/' },
]
