// CUTIE STREET schedule (verified 2026-11-17)
// Sources: https://cutiestreet.asobisystem.com/live_information/schedule/list (Nov 2026)
//          https://cutiestreet.asobisystem.com/feature/autumntour (tour dates + OPEN/START)
//          album https://cutiestreet.asobisystem.com/discography/detail/8458/ · Kohaku news 2026-11-13
//          Dec: news/detail/96353 (Osaka 12/6), 96002 (Christmas SESSION 12/12-13), 96078 (KAWAII CLOSET)
//          Times verified 2026-11-17 from each official detail page (TV: news/detail/96460, 96005, 95695, 95696; stream 96086; online sign 47537). GIFT (43800) & Sapporo (47104) list no start time.
//          Kohaku broadcast 19:20–23:45 JST: https://natalie.mu/music/news/697917
// time: JST start time when officially published (HH:MM), else omitted (all-day).

export type EventCat = 'live' | 'tv' | 'event' | 'release' | 'other'
export interface CsEvent {
  date: string // YYYY-MM-DD (JST)
  time?: string // HH:MM JST start
  end?: string // HH:MM JST end when officially published (calendar export)
  pin?: boolean // featured and always on the home countdown (the headline event), the rest fill by date
  icon?: string // Ico glyph name on the home countdown card (defaults to catMeta[cat].ico)
  through?: string // YYYY-MM-DD: a featured multi-day run (e.g. a two-day final) keeps its home card until the end of this date
  cat: EventCat
  ja: string
  ko: string
  venue?: string
  url: string
  member?: string // member id for birthday shows
  with?: string[] // member ids when only some members appear (e.g. runway)
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
  { date: '2026-11-19', time: '19:00', cat: 'tv', ja: 'TBS『ニンゲン観察バラエティ モニタリング』', ko: 'TV 출연 · 미유·리사 코너 (미유가 변장한 미즈타니 준을 알아챌까? 탁구 실력도) + 스튜디오 출연', url: `${O}/news/detail/96460` },
  { date: '2026-11-20', time: '12:00', cat: 'event', ja: '1st アルバム オンラインサイン会', ko: '1st 앨범 온라인 사인회 · 공식 유튜브 생방송 (빙고 추첨 포함 · 사인 상품 신청은 11/15 마감·유료 FC 한정)', venue: 'CUTIE STREET YouTube', url: `${O}/live_information/detail/47537` },
  { date: '2026-11-20', time: '21:00', end: '22:52', cat: 'tv', ja: '関西テレビ『さんまのまんま』', ko: 'TV 출연 · 8명 전원 · 「秋のさんまはしゃべりごろSP」 · 산마와 첫 공동 출연', url: `${O}/news/detail/96005` },
  { date: '2026-11-21', time: '17:00', cat: 'other', ja: '配信『ROCK IN JAPAN FESTIVAL 2026』', ko: '록 인 재팬 2026 무료 송출 (9/19 공연 · JフェスOFFICIAL 유튜브 · 아카이브 ~12/7 18:00)', url: `${O}/news/detail/96086` },
  { date: '2026-11-22', time: '19:00', end: '21:00', cat: 'tv', ja: 'フジテレビ『千鳥の鬼レンチャン』', ko: 'TV 출연 · 아야노·나기사 태그 (2주 연속 「カラオケタッグモード大会」 · 나기사 첫 출연, 아야노는 지난번 아쉬움의 눈물 설욕전)', with: ['ayano', 'nagisa'], url: `${O}/news/detail/95695` },
  { date: '2026-11-23', time: '10:00', end: '18:50', cat: 'event', ja: '大特典会 in 北海道', ko: '대특전회 · 홋카이도 (현장 특별 추첨회, 공지 96949)', venue: 'アクセスサッポロ', url: `${O}/live_information/detail/47104`, featured: true, icon: 'snow' },
  { date: '2026-11-24', time: '15:30', cat: 'event', ja: 'オンライン特典会', ko: '온라인 특전회 (빙고 추첨)', venue: 'CUTIE STREET YouTube', url: `${O}/live_information/detail/47626` },
  { date: '2026-11-26', time: '19:00', cat: 'live', ja: '佐野愛花 生誕祭 2026', ko: '사노 아이카 생탄제 · 현장 특별 추첨회(CUTIE LAND CD 구매자, 공지 96698)', venue: 'SGCホール有明', url: `${O}/live_information/detail/46341`, member: 'aika' },
  { date: '2026-11-27', time: '18:00', cat: 'live', ja: 'GIFT〜Girls Idol Festival Tokyo〜 DAY-1', ko: '아이돌 페스티벌 DAY-1 출연 (OPEN 17:00 · 출연 순서 미발표)', venue: 'SGCホール有明', url: `${O}/live_information/detail/43800` },
  { ...tour('2026-11-28', '18:00', 'IGアリーナ', '아레나 투어 FINAL · 아이치 DAY1', 40368), featured: true, short: 'ARENA TOUR FINAL', through: '2026-11-29', icon: 'ferris' },
  tour('2026-11-29', '16:30', 'IGアリーナ', '아레나 투어 FINAL · 아이치 DAY2', 40369),
  { date: '2026-11-29', time: '19:00', end: '21:00', cat: 'tv', ja: 'フジテレビ『千鳥の鬼レンチャン』', ko: 'TV 출연 · 아야노·나기사 태그 (2주 연속 「カラオケタッグモード大会」 · 나기사 첫 출연, 아야노는 지난번 아쉬움의 눈물 설욕전)', with: ['ayano', 'nagisa'], url: `${O}/news/detail/95696` },
  { date: '2026-12-02', cat: 'release', ja: '1st ALBUM「CUTIE LAND」', ko: '첫 정규 앨범 발매', url: `${O}/discography/detail/8458/`, featured: true },
  { date: '2026-12-05', time: '14:30', cat: 'live', ja: 'HIROSHIMA CONTI-NeW FeS 2026', ko: '히로시마 페스티벌 출연 (DAY1 · 14:30~ 출연 시간)', venue: '広島グリーンアリーナ', url: `${O}/live_information/detail/42404` },
  { date: '2026-12-06', time: '10:00', end: '18:50', cat: 'event', ja: '大特典会 in 大阪（1stアルバム発売記念）', ko: '대특전회 · 오사카', venue: 'インテックス大阪 3号館', url: `${O}/news/detail/96353`, featured: true, short: '大特典会 in 大阪', icon: 'gift' },
  { date: '2026-12-12', time: '17:00', cat: 'live', ja: 'KAWAII LAB. Christmas SESSION 2026 DAY1', ko: '카와이랩 크리스마스 세션 (합동)', venue: '有明アリーナ', url: `${O}/news/detail/96002`, featured: true, short: 'KAWAII LAB. Christmas SESSION', through: '2026-12-13', icon: 'tree' },
  { date: '2026-12-13', time: '16:00', cat: 'live', ja: 'KAWAII LAB. Christmas SESSION 2026 DAY2', ko: '카와이랩 크리스마스 세션 (합동)', venue: '有明アリーナ', url: `${O}/news/detail/96002` },
  { date: '2026-12-17', cat: 'event', ja: '1stアルバム発売記念 スペシャル抽選イベント（すきトーク）', ko: '앨범 발매 기념 영상 토크 추첨 이벤트', url: 'https://cutiestreet.asobisystem.com/feature/1stalbumcutieland' },
  { date: '2026-12-19', cat: 'other', ja: '〜KAWAII LAB. 衣装展〜 KAWAII CLOSET 2026（〜1/31）', ko: '의상 전시 · 시부야/사카에/난바 hmv museum', venue: 'hmv museum 渋谷・栄・なんば', url: `${O}/news/detail/96078` },
  { date: '2026-12-27', cat: 'live', ja: 'COUNTDOWN JAPAN 26/27', ko: '카운트다운 재팬 26/27 출연', venue: '幕張メッセ', url: `${O}/live_information/detail/46324`, featured: true, icon: 'firework' },
  { date: '2026-12-31', time: '19:20', end: '23:45', cat: 'tv', ja: '第77回 NHK紅白歌合戦', ko: '홍백가합전 첫 출장 (NHK 종합 생방송)', url: `${O}/news/detail/96337`, featured: true, pin: true, icon: 'fan' },
  // January 2027 — official schedule month page (year=2027&month=1), each detail page checked 2026-11-17
  { date: '2027-01-09', time: '14:00', end: '18:30', cat: 'other', ja: 'SDGs推進 TGC しずおか 2027', ko: 'TGC 시즈오카 런웨이 (카나·나기사 출연 · 개장 12:30, 종연 18:30 예정 · 출연 시각 미발표)', venue: 'ツインメッセ静岡', url: `${O}/live_information/detail/47476`, with: ['kana', 'nagisa'] },
  { date: '2027-01-10', time: '14:00', cat: 'event', ja: 'KAWAII LAB. COLLECTION SHIZUOKA 2027 produced by TGC', ko: '카와이랩 컬렉션 시즈오카 (합동)', venue: 'ツインメッセ静岡', url: `${O}/live_information/detail/47607` },
  { date: '2027-01-23', cat: 'live', time: '18:00', ja: 'CUTIE STREET Live in Korea 2027 WINTER', ko: '한국 공연 · 킨텍스 · 멜론티켓 예매 (135,000원)', venue: 'KINTEX Hall 9A', url: `${O}/live_information/detail/42855`, featured: true, short: 'Live in Korea 2027' },
  { date: '2027-01-29', time: '19:00', cat: 'live', ja: '桜庭遥花 生誕祭 2027', ko: '사쿠라바 하루카 생탄제 · 팬클럽 선행 11/20 12:00–11/29 23:59 (지정석 6,500엔, 공지 96701)', venue: 'SGCホール有明', url: `${O}/live_information/detail/46962`, member: 'haruka' },
  { date: '2027-01-30', time: '17:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 미야기 DAY1 (합동)', venue: 'セキスイハイムスーパーアリーナ', url: `${O}/live_information/detail/46247` },
  { date: '2027-01-31', time: '16:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 미야기 DAY2 (합동)', venue: 'セキスイハイムスーパーアリーナ', url: `${O}/live_information/detail/46315` },
  // February 2027 — official schedule month page (year=2027&month=2), detail pages checked 2026-11-17
  { date: '2027-02-13', time: '17:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 요코하마 DAY1 (합동)', venue: 'Kアリーナ横浜', url: `${O}/live_information/detail/46316` },
  { date: '2027-02-14', time: '16:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 요코하마 DAY2 (합동)', venue: 'Kアリーナ横浜', url: `${O}/live_information/detail/46317` },
  { date: '2027-02-20', time: '17:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 아이치 DAY1 (합동)', venue: 'IGアリーナ', url: `${O}/live_information/detail/46318` },
  { date: '2027-02-21', time: '16:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 아이치 DAY2 (합동)', venue: 'IGアリーナ', url: `${O}/live_information/detail/46319` },
  // March–April 2027 — official schedule month pages (month=3, 4), detail pages checked 2026-11-17
  { date: '2027-03-08', cat: 'live', ja: 'ASOBIEXPO HAWAII 2027 - Japanese Pop Culture Experience', ko: '첫 하와이 · ASOBIEXPO (시간 미발표 · 공식 FC 투어 3차 추첨 11/20–11/29, 일반 티켓 2026년 12월경 예정)', venue: 'TOM MOFFATT WAIKIKI SHELL', url: `${O}/live_information/detail/43881` },
  { date: '2027-03-20', time: '17:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 고베 DAY1 (합동 · 나기사 학업으로 불참, 7명 출연)', venue: 'GLION ARENA KOBE', url: `${O}/live_information/detail/46320` },
  { date: '2027-03-21', time: '16:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 고베 DAY2 (합동)', venue: 'GLION ARENA KOBE', url: `${O}/live_information/detail/46321` },
  { date: '2027-04-03', time: '17:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 후쿠오카 DAY1 (합동)', venue: 'マリンメッセ福岡A館', url: `${O}/live_information/detail/46322` },
  { date: '2027-04-04', time: '16:00', cat: 'live', ja: 'KAWAII LAB. 5th ANNIVERSARY TOUR', ko: '카와이랩 5주년 투어 · 후쿠오카 DAY2 (합동)', venue: 'マリンメッセ福岡A館', url: `${O}/live_information/detail/46323` },
]

export const catMeta: Record<EventCat, { ko: string; emoji: string; ico: string; color: string }> = {
  live: { ico: 'mic', ko: 'LIVE', emoji: '🎤', color: '#ff6b9d' },
  tv: { ico: 'tv', ko: 'TV', emoji: '📺', color: '#4a90d9' },
  event: { ico: 'gift', ko: 'EVENT', emoji: '🎁', color: '#ff9f43' },
  release: { ico: 'disc', ko: 'RELEASE', emoji: '💿', color: '#a06cd5' },
  other: { ico: 'sparkle', ko: 'ETC', emoji: '✨', color: '#3ccfa8' },
}

/** Epoch ms of the event start in JST (00:00 JST when no time). */
export function startMs(e: CsEvent): number {
  return new Date(`${e.date}T${e.time ?? '00:00'}:00+09:00`).getTime()
}

/** Epoch ms of the end: the published end (past midnight → next day), else start + 3 h for timed events,
 *  else the next JST midnight for all-day ones. Used for calendar exports and 'hide once aired'. */
export function endMs(e: CsEvent): number {
  if (!e.time) return new Date(`${e.date}T00:00:00+09:00`).getTime() + 86400e3
  if (!e.end) return startMs(e) + 3 * 3600e3
  const t = new Date(`${e.date}T${e.end}:00+09:00`).getTime()
  return t > startMs(e) ? t : t + 86400e3
}

/** Happening right now: from the start until the published end — or, when no end is published, only for the
 *  first hour (we can't know the real end). Shared by the home ON AIR bar, schedule cards and the on-air strip. */
export function isOnNow(e: CsEvent, t: number): boolean {
  return !!e.time && startMs(e) <= t && t < (e.end ? endMs(e) : startMs(e) + 3600e3)
}
/** Label for something happening now: ON AIR for TV, NOW otherwise. */
export const nowWord = (e: CsEvent) => (e.cat === 'tv' ? 'ON AIR' : 'NOW')

function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** Minimal RFC5545 .ics for one event. */
const icsUtc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
function vevent(e: CsEvent, stamp: string): string[] {
  const d = e.date.replace(/-/g, '')
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => '\\' + c)
  const lines = ['BEGIN:VEVENT', `UID:${d}-${hash(e.ja + (e.time ?? ''))}@custo`, `DTSTAMP:${stamp}`]
  if (e.time) {
    // explicit UTC so every calendar app places it correctly (no VTIMEZONE needed)
    lines.push(`DTSTART:${icsUtc(startMs(e))}`, `DTEND:${icsUtc(endMs(e))}`)
  } else {
    const next = new Date(`${e.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1)
    lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`)
  }
  lines.push(`SUMMARY:${esc('CUTIE STREET · ' + e.ja)}`, `DESCRIPTION:${esc(e.ko + ' — ' + e.url)}`)
  if (e.venue) lines.push(`LOCATION:${esc(e.venue)}`)
  // reminders (RFC 5545 VALARM): a day before and an hour before; all-day items at 09:00 the day before
  const alarm = (trigger: string, when: string) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`${when} · CUTIE STREET · ${e.ja}`)}`, `TRIGGER:${trigger}`, 'END:VALARM']
  if (e.time) lines.push(...alarm('-P1D', '내일'), ...alarm('-PT1H', '1시간 뒤'))
  else lines.push(...alarm('-PT15H', '내일'))
  lines.push(`URL:${e.url}`, 'END:VEVENT')
  return lines
}
/** One calendar file for one or many events. */
export function toIcs(e: CsEvent | CsEvent[]): string {
  const list = Array.isArray(e) ? e : [e]
  const stamp = icsUtc(Date.now())
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//custo//cutie street fan hub//KO', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:CUTIE STREET (Custo)',
    ...list.flatMap((x) => vevent(x, stamp)), 'END:VCALENDAR'].join('\r\n')
}

export function googleCalUrl(e: CsEvent): string {
  const d = e.date.replace(/-/g, '')
  let dates: string
  if (e.time) {
    const s = new Date(startMs(e)), en = new Date(endMs(e))
    const f = (x: Date) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    dates = `${f(s)}/${f(en)}`
  } else {
    const next = new Date(`${e.date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1)
    dates = `${d}/${next.toISOString().slice(0, 10).replace(/-/g, '')}`
  }
  const p = new URLSearchParams({ action: 'TEMPLATE', text: `CUTIE STREET · ${e.ja}`, dates, details: `${e.ko}\n${e.url}`, location: e.venue ?? '' })
  return `https://calendar.google.com/calendar/render?${p}`
}
