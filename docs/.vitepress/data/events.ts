// CUTIE STREET schedule (verified 2026-11-17)
// Sources: https://cutiestreet.asobisystem.com/live_information/schedule/list (Nov 2026)
//          https://cutiestreet.asobisystem.com/feature/autumntour (tour dates + OPEN/START)
//          album https://cutiestreet.asobisystem.com/discography/detail/8458/ · Kohaku news 2026-11-13
// time: JST start time when officially published (HH:MM), else omitted (all-day).

export type EventCat = 'live' | 'tv' | 'event' | 'release' | 'other'
export interface CsEvent {
  date: string // YYYY-MM-DD (JST)
  time?: string // HH:MM JST start
  cat: EventCat
  ja: string
  ko: string
  venue?: string
  url: string
  member?: string // member id for birthday shows
  featured?: boolean // shown in the home countdown
  short?: string // compact label for the home countdown
}

const O = 'https://cutiestreet.asobisystem.com'
const TOUR = 'CUTIE STREET JAPAN ARENA TOUR 2026 -AUTUMN- CUTIE LAND'
const tour = (date: string, time: string, venue: string, ko: string, id?: number): CsEvent => ({
  date, time, cat: 'live', ja: TOUR, ko, venue, url: id ? `${O}/live_information/detail/${id}` : `${O}/feature/autumntour`,
})

export const events: CsEvent[] = [
  tour('2026-09-23', '17:00', '横浜アリーナ', '첫 아레나 투어 개막 · 요코하마'),
  tour('2026-09-29', '18:00', '有明アリーナ', '아레나 투어 · 도쿄 DAY1'),
  tour('2026-09-30', '17:30', '有明アリーナ', '아레나 투어 · 도쿄 DAY2'),
  tour('2026-10-03', '18:00', 'セキスイハイムスーパーアリーナ', '아레나 투어 · 미야기 DAY1'),
  tour('2026-10-04', '17:00', 'セキスイハイムスーパーアリーナ', '아레나 투어 · 미야기 DAY2'),
  tour('2026-10-28', '18:00', 'マリンメッセ福岡A館', '아레나 투어 · 후쿠오카 DAY1'),
  tour('2026-10-29', '17:00', 'マリンメッセ福岡A館', '아레나 투어 · 후쿠오카 DAY2'),
  tour('2026-10-31', '18:00', '神戸ワールド記念ホール', '아레나 투어 · 고베 DAY1'),
  tour('2026-11-01', '16:30', '神戸ワールド記念ホール', '아레나 투어 · 고베 DAY2', 40365),
  { date: '2026-11-03', cat: 'event', ja: '大特典会 in 神奈川', ko: '대특전회 · 가나가와', venue: 'パシフィコ横浜 展示ホールD', url: `${O}/live_information/detail/45469` },
  { date: '2026-11-03', cat: 'tv', ja: 'テレビ朝日『musicるTV』', ko: 'TV 출연', url: `${O}/news/detail/94818` },
  { date: '2026-11-03', cat: 'tv', ja: '中京テレビ『オモウマい店』', ko: 'TV 출연', url: `${O}/news/detail/95014` },
  { date: '2026-11-05', cat: 'other', ja: 'Amazon Music presents『オトバズ』', ko: '음악 프로그램', url: `${O}/news/detail/94554` },
  { date: '2026-11-05', cat: 'tv', ja: 'TBS『ニンゲン観察バラエティ モニタリング』', ko: 'TV 출연', url: `${O}/news/detail/94640` },
  { date: '2026-11-06', cat: 'live', ja: 'KAWAII LAB. ファンクラブ限定フリーライブ', ko: 'FC 한정 프리 라이브', url: `${O}/live_information/detail/46742` },
  { date: '2026-11-07', cat: 'event', ja: "LARME FES'26", ko: '라르메 페스', venue: '東京ガーデンシアター', url: `${O}/live_information/detail/46327` },
  { date: '2026-11-08', cat: 'event', ja: 'ミニライブ＆お渡し会', ko: '미니 라이브 & 전달회', venue: 'イオンモール白山', url: `${O}/live_information/detail/45466` },
  { date: '2026-11-09', cat: 'live', ja: '古澤里紗 生誕祭 2026', ko: '후루사와 리사 생탄제', venue: 'SGCホール有明', url: `${O}/live_information/detail/46336`, member: 'risa' },
  { date: '2026-11-10', cat: 'tv', ja: 'テレビ朝日『musicるTV』', ko: 'TV 출연', url: `${O}/news/detail/95048` },
  { date: '2026-11-11', cat: 'live', ja: '板倉可奈 生誕祭 2026', ko: '이타쿠라 카나 생탄제', venue: 'SGCホール有明', url: `${O}/live_information/detail/46338`, member: 'kana' },
  { date: '2026-11-11', cat: 'other', ja: '小学館『週刊少年サンデー』', ko: '잡지 게재', url: `${O}/news/detail/95939` },
  tour('2026-11-14', '18:00', '広島グリーンアリーナ', '아레나 투어 · 히로시마 DAY1', 40366),
  tour('2026-11-15', '16:30', '広島グリーンアリーナ', '아레나 투어 · 히로시마 DAY2', 40367),
  { date: '2026-11-19', cat: 'tv', ja: 'TBS『ニンゲン観察バラエティ モニタリング』', ko: 'TV 출연', url: `${O}/news/detail/96460` },
  { date: '2026-11-20', cat: 'event', ja: '1st アルバム オンラインサイン会', ko: '1st 앨범 온라인 사인회', venue: 'CUTIE STREET YouTube', url: `${O}/live_information/detail/47537` },
  { date: '2026-11-20', cat: 'tv', ja: '関西テレビ『さんまのまんま』', ko: 'TV 출연', url: `${O}/news/detail/96005` },
  { date: '2026-11-21', cat: 'other', ja: '配信『ROCK IN JAPAN FESTIVAL 2026』', ko: '록 인 재팬 송출', url: `${O}/news/detail/96086` },
  { date: '2026-11-22', cat: 'tv', ja: 'フジテレビ『千鳥の鬼レンチャン』', ko: 'TV 출연', url: `${O}/news/detail/95695` },
  { date: '2026-11-23', cat: 'event', ja: '大特典会 in 北海道', ko: '대특전회 · 홋카이도', venue: 'アクセスサッポロ', url: `${O}/live_information/detail/47104`, featured: true },
  { date: '2026-11-26', cat: 'live', ja: '佐野愛花 生誕祭 2026', ko: '사노 아이카 생탄제', venue: 'SGCホール有明', url: `${O}/live_information/detail/46341`, member: 'aika' },
  { date: '2026-11-27', cat: 'live', ja: 'GIFT〜Girls Idol Festival Tokyo〜', ko: '아이돌 페스티벌 출연', venue: 'SGCホール有明', url: `${O}/live_information/detail/43800` },
  { ...tour('2026-11-28', '18:00', 'IGアリーナ', '아레나 투어 FINAL · 아이치 DAY1', 40368), featured: true, short: 'ARENA TOUR FINAL' },
  tour('2026-11-29', '16:30', 'IGアリーナ', '아레나 투어 FINAL · 아이치 DAY2', 40369),
  { date: '2026-11-29', cat: 'tv', ja: 'フジテレビ『千鳥の鬼レンチャン』', ko: 'TV 출연', url: `${O}/news/detail/95696` },
  { date: '2026-12-02', cat: 'release', ja: '1st ALBUM「CUTIE LAND」', ko: '첫 정규 앨범 발매', url: `${O}/discography/detail/8458/`, featured: true },
  { date: '2026-12-31', cat: 'tv', ja: '第77回 NHK紅白歌合戦', ko: '홍백가합전 첫 출장', url: `${O}/photo/331/detail/84978`, featured: true },
]

export const catMeta: Record<EventCat, { ko: string; emoji: string; color: string }> = {
  live: { ko: 'LIVE', emoji: '🎤', color: '#ff6b9d' },
  tv: { ko: 'TV', emoji: '📺', color: '#4a90d9' },
  event: { ko: 'EVENT', emoji: '🎁', color: '#ff9f43' },
  release: { ko: 'RELEASE', emoji: '💿', color: '#a06cd5' },
  other: { ko: 'ETC', emoji: '✨', color: '#3ccfa8' },
}

/** Epoch ms of the event start in JST (00:00 JST when no time). */
export function startMs(e: CsEvent): number {
  return new Date(`${e.date}T${e.time ?? '00:00'}:00+09:00`).getTime()
}

function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** Minimal RFC5545 .ics for one event. */
export function toIcs(e: CsEvent): string {
  const d = e.date.replace(/-/g, '')
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => '\\' + c)
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//custo//cutie street fan hub//KO', 'BEGIN:VEVENT',
    `UID:${d}-${hash(e.ja + (e.time ?? ''))}@custo`, `DTSTAMP:${d}T000000Z`]
  if (e.time) {
    const t = e.time.replace(':', '') + '00'
    lines.push(`DTSTART;TZID=Asia/Tokyo:${d}T${t}`, `DURATION:PT3H`)
  } else {
    const next = new Date(`${e.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1)
    lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`)
  }
  lines.push(`SUMMARY:${esc('CUTIE STREET · ' + e.ja)}`, `DESCRIPTION:${esc(e.ko + ' — ' + e.url)}`)
  if (e.venue) lines.push(`LOCATION:${esc(e.venue)}`)
  lines.push(`URL:${e.url}`, 'END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function googleCalUrl(e: CsEvent): string {
  const d = e.date.replace(/-/g, '')
  let dates: string
  if (e.time) {
    const s = new Date(startMs(e)), en = new Date(startMs(e) + 3 * 3600e3)
    const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    dates = `${f(s)}/${f(en)}`
  } else {
    const next = new Date(`${e.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1)
    dates = `${d}/${next.toISOString().slice(0, 10).replace(/-/g, '')}`
  }
  const p = new URLSearchParams({ action: 'TEMPLATE', text: `CUTIE STREET · ${e.ja}`, dates, details: `${e.ko}\n${e.url}`, location: e.venue ?? '' })
  return `https://calendar.google.com/calendar/render?${p}`
}
