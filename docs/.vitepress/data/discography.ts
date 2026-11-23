// Official discography (verified 2026-11-17 from https://cutiestreet.asobisystem.com/discography/ pages 1–4)
// CUTIE LAND tracklist/editions: https://cutiestreet.asobisystem.com/news/detail/95941
// mv: official MV video IDs (KAWAII LAB. / CUTIE STREET channels, verified via oEmbed — see loop/mvs.tsv)

export type RelType = 'ALBUM' | 'SINGLE' | 'DIGITAL' | 'VIDEO'
export interface Release {
  id: number // official detail id
  type: RelType
  date: string // YYYY-MM-DD
  title: string
  song: string // primary song title used for video matching
  mv?: string
  mvKind?: 'MV' | 'Animated MV' | 'LIVE'
  note?: string
}

export const MV: Record<string, string> = {
  'かわいいだけじゃだめですか？': 'jZqTz1G8G04',
  'ラブトレ': '0DkagMiDNf0',
  'ちきゅーめいくあっぷ計画': 'nB2qTzs2HTk',
  'キューにストップできません！': '_gfwU-heIkA',
  'かわいいさがしてくれますか？': '4mPtFbzszCk',
  'ぷりきゅきゅ': '65u0ucGOkiI',
  'ゆめみるプリマドンナ': 'xwAQL_BSfxo',
  'でぃすこみゅーたんと！': 'a-F6kP71dk0',
  'ナイスだね': 'gf6ycMwbBSs',
  'キュートなキューたい': 'VQmdUnlNnds',
  'Error404♡': 'eAFzQwArpFM',
  'ご褒美しよっ！': '4P1atWgZfAg',
  'I Amai Me Mind': '6PdFLmbZAjs',
  'Crush on you': '_LbnAnoHOFQ',
  'ひたむきシンデレラ！': 'AtDErGSpfYQ',
}

const r = (id: number, type: RelType, date: string, title: string, song = title, extra: Partial<Release> = {}): Release => ({
  id, type, date, title, song, mv: MV[song], mvKind: MV[song] ? (song === 'でぃすこみゅーたんと！' ? 'Animated MV' : 'MV') : undefined, ...extra,
})

export const releases: Release[] = [
  r(8458, 'ALBUM', '2026-12-02', 'CUTIE LAND', 'CUTIE LAND', { note: '1st ALBUM · 16曲' }),
  r(8211, 'DIGITAL', '2026-09-23', 'ご褒美しよっ！'),
  r(8047, 'DIGITAL', '2026-08-25', 'Top of the top', 'Top of the top', { mv: 'KGFOrSUL-uc', mvKind: 'LIVE', note: '武道館 LIVE 영상' }),
  r(8049, 'DIGITAL', '2026-07-26', '큐스토의 노래（きゅーすとのうた）Korean ver', 'きゅーすとのうた'),
  r(7827, 'DIGITAL', '2026-07-10', 'Error404♡'),
  r(7736, 'DIGITAL', '2026-06-17', 'ホメマクリズム'),
  r(7591, 'DIGITAL', '2026-06-06', '프리큐큐（ぷりきゅきゅ）Korean ver', 'ぷりきゅきゅ', { mv: 'xF8hmrm6DaA', mvKind: 'MV', note: '韓国版MV' }),
  r(7526, 'SINGLE', '2026-05-27', '3rd SINGLE『キュートなキューたい / ナイスだね』', 'キュートなキューたい', { note: 'オリコン週間1位' }),
  r(7527, 'DIGITAL', '2026-05-15', 'キュートなキューたい -TV size-', 'キュートなキューたい'),
  r(7529, 'DIGITAL', '2026-04-21', 'ちーむすとりーと『Crush on you』', 'Crush on you', { note: '5인 유닛' }),
  r(7528, 'DIGITAL', '2026-04-21', 'ちーむきゅーてぃー『I Amai Me Mind』', 'I Amai Me Mind', { note: '3인 유닛' }),
  r(7256, 'DIGITAL', '2026-04-10', '귀엽기만 하면 안 되나요? / かわいいだけじゃだめですか？', 'かわいいだけじゃだめですか？', { mv: 'sB1Mr-eXR3c', mvKind: 'MV', note: '韓国語ver.' }),
  r(7081, 'DIGITAL', '2026-03-25', 'ナイスだね'),
  r(6671, 'DIGITAL', '2026-02-18', 'でぃすこみゅーたんと！'),
  r(6470, 'DIGITAL', '2026-02-04', 'ゆめみるプリマドンナ'),
  r(6386, 'DIGITAL', '2026-01-10', 'ぷりきゅきゅ'),
  r(5751, 'VIDEO', '2025-12-03', '1st LIVE FILM at 豊洲PIT -CROSS STREET-', 'CROSS STREET', { mv: 'E_WBxfXU1BA', mvKind: 'LIVE', note: 'Blu-ray / DVD' }),
  r(5939, 'DIGITAL', '2025-10-14', 'Shooting Star'),
  r(5891, 'DIGITAL', '2025-09-29', '多元幸福論'),
  r(5749, 'DIGITAL', '2025-08-27', 'かわいいさがしてくれますか？'),
  r(5690, 'DIGITAL', '2025-08-13', 'モアベリサマー'),
  r(5360, 'SINGLE', '2025-07-23', '2nd SINGLE『キューにストップできません！ / ちきゅーめいくあっぷ計画』', 'キューにストップできません！'),
  r(5641, 'DIGITAL', '2025-06-25', 'チョットヒトサジ'),
  r(5359, 'DIGITAL', '2025-05-07', 'キューにストップできません！'),
  r(5642, 'DIGITAL', '2025-04-16', 'ちきゅーめいくあっぷ計画'),
  r(5639, 'DIGITAL', '2025-03-26', 'ハルフレーク'),
  r(5358, 'DIGITAL', '2025-02-26', 'ラブトレ'),
  r(5091, 'DIGITAL', '2025-01-24', 'ハッピー世界！'),
  r(4308, 'SINGLE', '2024-11-13', '1st SINGLE『かわいいだけじゃだめですか？』', 'かわいいだけじゃだめですか？'),
  r(5640, 'DIGITAL', '2024-10-21', 'ハロハロミライ'),
  r(3685, 'DIGITAL', '2024-09-09', 'かわいいだけじゃだめですか？', 'かわいいだけじゃだめですか？', { note: 'デビュー曲' }),
]

export const cutieLand = {
  date: '2026-12-02',
  url: 'https://cutiestreet.asobisystem.com/feature/1stalbumcutieland',
  tracks: [
    'Overture -Welcome to CUTIE LAND-', 'きゅーすとのうた', 'ひたむきシンデレラ！', 'かわいいだけじゃだめですか？',
    'かわいいさがしてくれますか？', 'ご褒美しよっ！', 'キュートなキューたい', 'PARTY TIME', 'でぃすこみゅーたんと！',
    'ぷりきゅきゅ', 'おやすみサイレンナイト', 'どんどんどん！', '君なんだ', 'ハロハロミライ', 'TREASURES', 'Shooting Star',
  ],
  editions: [
    { name: '初回限定盤A', spec: 'CD + Blu-ray', code: 'KLC_90012/3', price: '¥6,600' },
    { name: '初回限定盤B', spec: 'CD + DVD', code: 'KLC_90014/5', price: '¥6,600' },
    { name: '通常盤', spec: 'CD', code: 'KLC_90016', price: '¥3,300' },
  ],
}

export const officialUrl = (id: number) => `https://cutiestreet.asobisystem.com/discography/detail/${id}/`
