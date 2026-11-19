// Search index for the ⌘K palette — dynamically imported on first open so the
// full video dataset isn't part of every page's bundle.
import { members, memberById } from './members'
import { releases } from './discography'
import { events, catMeta } from './events'
import videosRaw from './videos.json'
import appearancesRaw from './appearances.json'
import { songs } from './songs'

interface Video { id: string; title: string; duration: string; category: string; date: string; members?: string[] }
export type Kind = 'page' | 'member' | 'release' | 'event' | 'video'
export interface Hit { kind: Kind; title: string; sub: string; href: string; ext?: boolean; color?: string; icon: string; ico?: string; hay: string; t?: string; tj?: string; hj?: string; cho?: string; words?: string[]; date?: string }

// ── normalisation ─────────────────────────────────────────────
// lower-case, full/half-width folded, katakana → hiragana (キュー = きゅー), long-vowel marks and punctuation dropped
const kata2hira = (s: string) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
export const norm = (s: string) => kata2hira(s.toLowerCase().normalize('NFKC')).replace(/[\s・·、。！!？?「」『』【】()（）\-_/~〜ー'’"“”.,:;#&+*♡♥☆★…|]/g, '')

// Hangul → compatibility jamo, so a syllable that is still being typed ('산' on the way to '사노') and partial input
// match: '사노' → ㅅㅏㄴㅗ contains ㅅㅏㄴ. Double finals split into their two consonants.
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ']
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
const CLUSTER: Record<string, string> = { ㄳ: 'ㄱㅅ', ㄵ: 'ㄴㅈ', ㄶ: 'ㄴㅎ', ㄺ: 'ㄹㄱ', ㄻ: 'ㄹㅁ', ㄼ: 'ㄹㅂ', ㄽ: 'ㄹㅅ', ㄾ: 'ㄹㅌ', ㄿ: 'ㄹㅍ', ㅀ: 'ㄹㅎ', ㅄ: 'ㅂㅅ', ㅘ: 'ㅗㅏ', ㅙ: 'ㅗㅐ', ㅚ: 'ㅗㅣ', ㅝ: 'ㅜㅓ', ㅞ: 'ㅜㅔ', ㅟ: 'ㅜㅣ', ㅢ: 'ㅡㅣ' }
export function jamo(s: string) {
  let o = ''
  for (const ch of s) {
    const c = ch.charCodeAt(0) - 0xac00
    if (c >= 0 && c < 11172) o += CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + JONG[c % 28]
    else o += CLUSTER[ch] ?? ch
  }
  return o
}
// initials only ('사노아이카' → 'ㅅㄴㅇㅇㅋ'); non-Hangul characters are dropped
const chosung = (s: string) => { let o = ''; for (const ch of s) { const c = ch.charCodeAt(0) - 0xac00; if (c >= 0 && c < 11172) o += CHO[Math.floor(c / 588)] } return o }
const ONLY_CHO = /^[ㄱ-ㅎ]+$/

// ── what fans actually type: the same thing in Korean / Japanese / English / slang ──
const SYN: string[][] = [
  ['큐티스트리트', '큐스트', '큐스토', '큐티', 'cutiestreet', 'cutie street', 'キューティーストリート', 'きゅーすと', 'キュースト'],
  ['홍백', '홍백가합전', '紅白', '紅白歌合戦', 'kohaku', 'nhk'],
  ['엠카', '엠카운트다운', 'mcountdown', 'm countdown', 'エムカ'],
  ['뮤직뱅크', '뮤뱅', 'musicbank'], ['음악중심', '음중', 'musiccore'], ['음방', '음악방송', '音楽番組'],
  ['부도칸', '무도관', '武道館', 'budokan'],
  ['생일', '생탄제', '생탄', '생일축하', '生誕祭', 'birthday', 'お誕生日'],
  ['뮤비', '뮤직비디오', 'mv', 'music video', 'musicvideo'],
  ['직캠', '개인캠', '推しカメラ', '推しカメ', 'fancam', 'focus', 'kawaiifocus', 'ソロ'],
  ['안무', '안무영상', '연습영상', '댄스', 'dance', 'dancepractice', 'ダンス', '踊ってみた', '振り付け'],
  ['라이브', '공연', '콘서트', 'live', 'ライブ', 'コンサート'],
  ['투어', 'tour', 'ツアー', '아레나', 'arena', 'アリーナ'],
  ['예능', 'variety', 'バラエティ', '방송', 'tv', 'テレビ'],
  ['브이로그', 'vlog'], ['메이킹', '비하인드', 'making', 'behind', 'メイキング', 'オフショット'],
  ['앨범', 'album', 'アルバム'], ['큐티랜드', 'cutieland', 'cutie land'],
  ['한국', '한국어', 'korea', 'korean', '韓国', '韓国語'], ['대만', 'taiwan', '台湾'], ['하와이', 'hawaii', 'ハワイ'],
  ['일정', '스케줄', '스케쥴', 'schedule', 'スケジュール', '달력', '캘린더'],
  ['퀴즈', 'quiz', '게임', 'クイズ'], ['펜라이트', '응원봉', 'penlight', 'ペンライト'],
  ['퍼스트테이크', 'thefirsttake', 'firsttake', 'first take'], ['특전회', '사인회', '특전', '特典会', 'サイン会', 'お渡し会'],
  ['노래', '곡', '가사', 'song', '曲', '歌'], ['소식', '뉴스', 'news', 'お知らせ', 'information'],
  ['멤버', '프로필', 'member', 'profile', 'メンバー'], ['유닛', 'unit', 'ユニット'], ['여정', '역사', '연혁', 'history', 'journey'],
  ['지도', '월드맵', '세계', 'map', 'world', '地図'], ['입문', '처음', '초보', '뉴비', 'start', 'beginner'],
  ['귀엽기만하면안되나요', 'かわいいだけじゃだめですか', '카와이이다케', 'kawaiidake', '카와다메'],
  ['동글동글', '큐트한구체', 'キュートなキューたい', 'cutiesphere', '큐타이'], ['프리큐큐', 'ぷりきゅきゅ', 'puricucu', 'purikyukyu'],
]
// colour words in Korean for each member colour
const COLOR_KO: Record<string, string> = { Yellow: '노랑 노란색 옐로우 黄色', Red: '빨강 빨간색 레드 赤', 'Mint Green': '민트 초록 그린 緑 ミント', Blue: '파랑 파란색 블루 青', Orange: '주황 오렌지 オレンジ', 'Light Blue': '하늘색 스카이블루 水色', Purple: '보라 보라색 퍼플 紫', Pink: '분홍 핑크 ピンク' }
const SYN_N = SYN.map((g) => g.map(norm))
function expand(t: string): string[] {
  const out = new Set([t])
  if (t.length < 2) return [t]
  for (const g of SYN_N) if (g.some((w) => w === t || (t.length >= 2 && w.startsWith(t) && w.length - t.length <= 3) || (w.length >= 2 && t.includes(w)))) for (const w of g) out.add(w)
  return [...out]
}

// one-edit typo tolerance (insert/delete/substitute), compared on jamo so '사누' ≈ '사노'
function within1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, e = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++e > 1) return false
    if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++ }
  }
  return e + (a.length - i) + (b.length - j) <= 1
}

const BOOST: Record<Kind, number> = { member: 4, page: 3, release: 2, event: 1, video: 0 }
/** Ranked search: every query word must match (via one of its synonyms); better matches score higher. */
export function search(index: Hit[], q: string, kind: 'all' | Kind = 'all'): Hit[] {
  const raw = q.trim().split(/\s+/).filter(Boolean)
  if (!raw.length) return []
  const terms = raw.map((w) => {
    const n = norm(w)
    if (ONLY_CHO.test(w)) return { cho: w, alts: [] as { n: string; j: string }[] }
    return { cho: '', alts: expand(n).map((a) => ({ n: a, j: jamo(a) })) }
  }).filter((t) => t.cho || t.alts[0]?.n)
  // 'kawaii dake' / '사노 아이카': also try the words glued together as one term (titles have no spaces after norm)
  if (raw.length > 1 && !terms.some((t) => t.cho)) {
    const glued = raw.map(norm).join('')
    const solo = search(index, glued, kind)
    if (solo.length) {
      const rest = searchSplit(index, terms, kind)
      const seen = new Set(solo.slice(0, 12))
      return [...solo.slice(0, 12), ...rest.filter((h) => !seen.has(h)), ...solo.slice(12).filter((h) => !rest.includes(h))]
    }
  }
  return searchSplit(index, terms, kind)
}
type Term = { cho: string; alts: { n: string; j: string }[] }
function searchSplit(index: Hit[], terms: Term[], kind: 'all' | Kind): Hit[] {
  const today = Date.now()
  const out: { h: Hit; s: number }[] = []
  for (const h of index) {
    if (kind !== 'all' && h.kind !== kind) continue
    let total = 0
    for (const t of terms) {
      let best = 0
      if (t.cho) { if (h.cho!.startsWith(t.cho)) best = 5; else if (h.cho!.includes(t.cho)) best = 3 }
      else for (const [k, a] of t.alts.entries()) {
        const syn = k === 0 ? 0 : 1 // a synonym hit ranks a bit below the literal word
        let s = 0
        if (h.t!.startsWith(a.n) || h.tj!.startsWith(a.j)) s = 8
        else if (h.t!.includes(a.n) || h.tj!.includes(a.j)) s = 6
        else if (h.hay.includes(a.n) || h.hj!.includes(a.j)) s = 3
        else if (k === 0 && a.j.length >= 4 && h.words!.some((w) => within1(a.j, w) || (w.length > a.j.length && within1(a.j, w.slice(0, a.j.length))))) s = 1
        if (s) best = Math.max(best, s - syn)
      }
      if (!best) { total = 0; break }
      total += best
    }
    if (!total) continue
    // newer videos/events float up a little among equally good matches
    const age = h.date ? Math.min(1, (today - Date.parse(h.date)) / (365 * 864e5)) : 0.5
    out.push({ h, s: total + BOOST[h.kind] + (1 - Math.abs(age)) * 0.9 })
  }
  return out.sort((a, b) => b.s - a.s).map((x) => x.h)
}

function finish(h: Hit): Hit {
  const t = norm(h.title)
  const words = [...new Set((h.title + ' ' + h.sub).split(/[\s・·、。「」『』【】()（）/|—-]+/).map((w) => jamo(norm(w))).filter((w) => w.length >= 3))]
  return { ...h, t, tj: jamo(t), hj: jamo(h.hay), cho: chosung(h.title.replace(/\s+/g, '')) + ' ' + chosung(h.hay), words }
}

// [title, path, icon, extra words people search for]
const PAGES: [string, string, string, string][] = [
  ['홈', '/', 'heart', '메인 오늘 오늘의큐스트 home'], ['정상까지의 여정 (3D)', '/journey/', 'mountain', '후지산 등반 연혁 역사 타임라인 데뷔'], ['큐스트 월드맵 (활동한 나라·도시)', '/world/', 'globe', '지구본 해외 공연 도시'],
  ['멤버 전체', '/members/', 'heart', '멤버소개 프로필 생일 나이 키'], ['유닛 & 케미', '/units/', 'sparkle', '조합 케미 콤비'],
  ['영상 아카이브', '/videos/', 'film', '유튜브 youtube 공식채널'], ['디스코그래피', '/discography/', 'disc', '음반 싱글 발매 곡목록 트랙'], ['스케줄', '/schedule/', 'calendar', '이벤트 다음 일정 카운트다운 ics'],
  ['나의 ♡ 앨범', '/likes/', 'heart', '좋아요 저장 즐겨찾기'], ['라이브 가이드 · 펜라이트', '/live-guide/', 'penlight', '응원법 준비물 체크리스트 멤버컬러'], ['나와 닮은 멤버 테스트', '/which-member/', 'target', '심리테스트 성향 결과'],
  ['공식 소식', '/news/', 'news', '공지 티켓 발표'], ['CUTIE LAND 앨범 특집', '/cutie-land/', 'disc', '1집 정규 트랙리스트'], ['입문 가이드 (처음이에요)', '/start/', 'sparkle', '추천 영상 먼저 볼 것'],
  ['紅白 특집', '/kohaku/', 'fan', '연말 12월31일 첫출장'], ['큐스트 in KOREA (한국 공연·한국어 버전)', '/korea/', 'pin', '내한 서울 한국팬'], ['영상 통계', '/videos/stats/', 'trophy', '조회수 차트 그래프'],
  ['레전드 무대', '/stages/', 'mic', '명무대 무대영상'], ['출연 아카이브 (다른 채널 출연 영상)', '/appearances/', 'tv', '외부 출연 다른채널'], ['MV 장면 퀴즈 (곡 맞히기 게임)', '/mv-quiz/', 'target', '노래 맞히기'],
]


// songs: Korean reading, meaning and romaji id, so '귀엽기만', '카와이이' or 'kawaii' find the MV too
const songAlias = songs.map((x) => ({ key: norm(x.title), words: `${x.read} ${x.meaning} ${x.id.replace(/-/g, '')}` }))
const songWords = (title: string) => { const t = norm(title); return songAlias.filter((a) => t.includes(a.key)).map((a) => a.words).join(' ') }
const memWords = (ids: string[] = []) => ids.map((id) => { const m = memberById[id]; return `${m.ko} ${m.nicknameKo} ${m.ja} ${m.en}` }).join(' ')

export function buildIndex(withBase: (p: string) => string): Hit[] {
  return [
  ...PAGES.map(([t, h, i, extra]) => ({ kind: 'page' as const, title: t, sub: '페이지', href: withBase(h), icon: '', ico: i, hay: norm(t + ' ' + extra) })),
  ...members.map((m) => ({ kind: 'member' as const, title: `${m.ja} ${m.ko}`, sub: `${m.colorName} · ${m.nickname} · ${m.birthplace}`, href: withBase(`/members/${m.id}`), color: m.color, icon: m.ja.slice(-2, -1),
    hay: norm([m.ja, m.ko, m.ko.split(' ')[1], m.en, m.kana, m.nickname, m.nicknameKo, m.colorName, COLOR_KO[m.colorName] ?? '', m.id, m.birthplace, ...m.hobbies].join(' ')) })),
  ...songs.map((x) => ({ kind: 'release' as const, title: `${x.title} — 곡 이야기`, sub: `${x.meaning} · ${x.tagline}`, href: withBase(`/discography/${x.id}`), icon: '', ico: 'music', hay: norm(x.title + x.read + x.meaning + x.tagline + x.id + ' 곡 이야기 곡해설 song story') })),
  ...releases.map((r) => ({ kind: 'release' as const, title: r.title, sub: `${r.type} · ${r.date.replace(/-/g, '.')}`, href: withBase('/discography/'), icon: '', ico: 'disc', date: r.date, hay: norm(r.title + r.song + ' ' + songWords(r.title + r.song)) })),
  ...events.map((e) => ({ kind: 'event' as const, title: e.ja, sub: `${e.date.replace(/-/g, '.')} · ${catMeta[e.cat].ko}${e.venue ? ' · ' + e.venue : ''}`, href: e.url, ext: true, icon: '', ico: 'calendar', date: e.date, hay: norm(e.ja + e.ko + (e.venue ?? '') + ' ' + memWords([...(e.member ? [e.member] : []), ...(e.with ?? [])])) })),
  ...(videosRaw as Video[]).map((v) => ({ kind: 'video' as const, title: v.title.replace(/【CUTIE STREET[^】]*】/g, '').trim(), sub: `${v.duration || 'MV'}${v.date ? ' · ' + v.date.replace(/-/g, '.') : ''}`,
    href: `https://www.youtube.com/watch?v=${v.id}`, ext: true, icon: '', ico: 'play', date: v.date,
    hay: norm(v.title + ' ' + v.category + ' ' + memWords(v.members) + ' ' + songWords(v.title)) })),
  ...(appearancesRaw as { id: string; title: string; ch: string; date: string; members: string[] }[]).map((v) => ({ kind: 'video' as const, title: v.title, sub: `${v.ch} · ${v.date.replace(/-/g, '.')}`,
    href: `https://www.youtube.com/watch?v=${v.id}`, ext: true, icon: '', ico: 'tv', date: v.date,
    hay: norm(v.title + ' ' + v.ch + ' ' + memWords(v.members) + ' ' + songWords(v.title)) })),
  ].map(finish)
}
