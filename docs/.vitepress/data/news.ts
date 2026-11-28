// Official news digest with Korean summaries.
// Source: https://cutiestreet.asobisystem.com/news/1 (titles in `ja`, lightly shortened) — refreshed by the loop.
// The Kohaku item links to 音楽ナタリー because the official post is FC-members-only.
// The Record Award item links to TBS's own award list (the group's site has no post about it; checked 2026-11-22).
// Korean text summarizes the official title only; details live on the linked official page.

export type NewsTag = 'ticket' | 'event' | 'release' | 'tv' | 'info'
export interface News {
  date: string; ja: string; ko: string; tag: NewsTag; url: string; internal?: string
  /** when a fan action closes (JST, 'YYYY-MM-DDTHH:MM'), copied from the official post's 受付期間 — feeds the home '마감 임박' strip */
  deadline?: string
  /** short name for that action, e.g. '하루카 생탄제 FC 선행' */
  dl?: string
}

const O = 'https://cutiestreet.asobisystem.com'
export const news: News[] = [
  { date: '2026-11-28', tag: 'ticket', ja: '11/28(土) CUTIE STREET JAPAN ARENA TOUR 2026 -AUTUMN- 『CUTIE LAND』愛知公演 Day1 当日券販売のお知らせ', ko: '오늘 아레나 투어 FINAL 아이치 DAY1(IG아레나) 좌석 개방 당일권 판매 · 12:00 줄서기, 13:00부터 선착순 (일반 지정석 10,500엔 · 현금만 · 1인 1장 · 신분증 원본 필요)', url: `${O}/news/detail/97948`, internal: '/schedule/', deadline: '2026-11-28T18:00', dl: '아이치 DAY1 당일권 (현장 판매)' },
  { date: '2026-11-26', tag: 'ticket', ja: '「KAWAII LAB. COLLECTION SHIZUOKA 2027 produced by TGC」@ツインメッセ静岡 北館大展示場 開催決定！FC先行開始！', ko: '2027.1.10 카와이랩 컬렉션 시즈오카(트윈메세 시즈오카) 개최 결정 · 유료 FC 선행 11/29 23:59까지 (지정석 11,000엔 · OPEN 12:00 / START 14:00)', url: `${O}/news/detail/96506`, internal: '/schedule/', deadline: '2026-11-29T23:59', dl: '카와이랩 컬렉션 시즈오카(1/10) FC 선행' },
  { date: '2026-11-25', tag: 'event', ja: '1st アルバム オンラインサイン会 @ CUTIE STREET YouTube（12/2 13:30〜）', ko: '12/2 발매일 13:30 온라인 사인회 결정 · 공식 유튜브 (미유 불참 · 사인 생사진 등 추첨 판매는 유료 FC 한정, 11/26 23:59 마감)', url: `${O}/live_information/detail/47877`, internal: '/cutie-land/', deadline: '2026-11-26T23:59', dl: '발매일 온라인 사인회 추첨 신청' },
  { date: '2026-11-23', tag: 'ticket', ja: '『CUTIE STREET 佐野愛花 生誕祭 2026』公演 リセールサービスのお知らせ', ko: '11/26 아이카 생탄제 공연 리세일(공식 티켓 재판매) 서비스 안내', url: `${O}/news/detail/96162`, internal: '/members/aika', deadline: '2026-11-25T23:59', dl: '아이카 생탄제 리세일 접수' },
  { date: '2026-11-21', tag: 'info', ja: 'CUTIE STREETが「第68回 輝く！日本レコード大賞」特別国際音楽賞を受賞（TBS 各賞発表）', ko: '제68회 일본 레코드대상 특별국제음악상 수상 (작년 신인상에 이어 2년 연속 수상 · 시상식은 12/30 17:30 TBS 생방송)', url: 'https://www.tbs.co.jp/recordaward/', internal: '/about' },
  { date: '2026-11-21', tag: 'event', ja: 'CUTIE STREET JAPAN ARENA TOUR 2026 -AUTUMN- CUTIE LAND ＠愛知県 IGアリーナにて特別抽選会開催が決定！', ko: '아레나 투어 FINAL 아이치 IG아레나(11/28·29) 현장 특별 추첨회 결정 (CD 예약자 대상 · 전원 체키 촬영회·배웅회 참가권 등)', url: `${O}/news/detail/96912`, internal: '/schedule/' },
  { date: '2026-11-21', tag: 'event', ja: '11/26（木）佐野愛花 生誕祭 2026 物販情報', ko: '11/26 아이카 생탄제 물판(굿즈 판매) 정보 · 선행 판매 14:00–17:00 예정 (SGC홀 아리아케)', url: `${O}/news/detail/96840`, internal: '/members/aika' },
  { date: '2026-11-20', tag: 'ticket', ja: '11/23(月・祝) CUTIE STREET大特典会@アクセスサッポロ 特典会参加券当日販売決定！', ko: '11/23 삿포로 대특전회 특전회 참가권 당일 판매 결정 (라쿠텐북스 당일 예약 · 2·4·5부 대상, 1·3·6부는 FC 한정)', url: `${O}/news/detail/96950`, internal: '/schedule/' },
  { date: '2026-11-20', tag: 'event', ja: '11/23(月・祝) CUTIE STREET大特典会@アクセスサッポロにて特別抽選会開催決定！', ko: '11/23 삿포로 대특전회 현장 특별 추첨회 (라쿠텐북스 『CUTIE LAND』 CD 구매 1장당 1회, 꽝 없음 · TikTok 촬영회·사인 체키 등)', url: `${O}/news/detail/96949`, internal: '/schedule/' },
  { date: '2026-11-20', tag: 'ticket', ja: '「ASOBIEXPO HAWAII 2027」JTBオフィシャルファンクラブツアー3次募集決定！', ko: '하와이 ASOBIEXPO(2027.3.8) JTB 공식 팬클럽 투어 3차 모집 · 11/20 15:00–11/29 23:59 추첨 (현지 집합 플랜, VVIP 코스 신설)', url: `${O}/news/detail/96621`, internal: '/world/', deadline: '2026-11-29T23:59', dl: '하와이 ASOBIEXPO JTB 팬클럽 투어 3차 추첨' },
  { date: '2026-11-20', tag: 'ticket', ja: '2027年1月29日(金)「CUTIE STREET 桜庭遥花 生誕祭 2027」開催決定！OFFICIAL FANCLUB会員先行開始！', ko: '2027.1.29 하루카 생탄제(SGC홀 아리아케, 19시 개연) 개최 결정 · 팬클럽 선행 11/29 23:59까지 (지정석 6,500엔)', url: `${O}/news/detail/96701`, internal: '/members/haruka', deadline: '2026-11-29T23:59', dl: '하루카 생탄제(1/29) FC 선행 추첨' },
  { date: '2026-11-18', tag: 'event', ja: '2026/11/26(木)開催CUTIE STREET佐野愛花 生誕祭 2026にて特別抽選会開催決定！', ko: '11/26 아이카 생탄제 현장 특별 추첨회 (CUTIE LAND CD 구매자 대상, 선행 판매 14–17시 예정)', url: `${O}/news/detail/96698`, internal: '/members/aika' },
  { date: '2026-11-17', tag: 'release', ja: 'CUTIE STREET 1st アルバム『CUTIE LAND』リリース記念 楽天ブックスオンライン予約抽選会の開催が決定！', ko: '1st 앨범 발매 기념 라쿠텐북스 온라인 예약 추첨회 (11/25 23:59까지)', url: `${O}/news/detail/96630`, internal: '/cutie-land/', deadline: '2026-11-25T23:59', dl: '라쿠텐북스 앨범 예약 추첨회' },
  { date: '2026-11-17', tag: 'event', ja: '11/23（月・祝）CUTIE STREET 大特典会 物販情報', ko: '11/23 삿포로 대특전회 물판(굿즈 판매) 정보', url: `${O}/news/detail/96574`, internal: '/schedule/' },
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

export const tagMeta: Record<NewsTag, { ko: string; emoji: string; ico: string; color: string }> = {
  ticket: { ico: 'ticket', ko: '티켓', emoji: '🎫', color: '#c92f69' },
  event: { ico: 'gift', ko: '이벤트', emoji: '🎁', color: '#b4560f' },
  release: { ico: 'disc', ko: '릴리즈', emoji: '💿', color: '#7a3fb0' },
  tv: { ico: 'tv', ko: 'TV', emoji: '📺', color: '#2b5ea8' },
  info: { ico: 'sparkle', ko: '소식', emoji: '✨', color: '#136b53' },
}
