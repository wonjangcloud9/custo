// Search index for the ⌘K palette — dynamically imported on first open so the
// 539-video dataset isn't part of every page's bundle.
import { members, memberById } from './members'
import { releases } from './discography'
import { events, catMeta } from './events'
import videosRaw from './videos.json'

interface Video { id: string; title: string; duration: string; category: string; date: string; members?: string[] }
export type Kind = 'page' | 'member' | 'release' | 'event' | 'video'
export interface Hit { kind: Kind; title: string; sub: string; href: string; ext?: boolean; color?: string; icon: string; hay: string }

export const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s・·、。！!？?「」『』【】()（）\-_/]/g, '')

const PAGES: [string, string, string][] = [
  ['홈', '/', '🏠'], ['정상까지의 여정 (3D)', '/journey/', '🗻'], ['멤버 전체', '/members/', '💖'], ['유닛 & 케미', '/units/', '💞'],
  ['영상 아카이브', '/videos/', '🎬'], ['디스코그래피', '/discography/', '💿'], ['스케줄', '/schedule/', '🗓️'], ['나의 ♡ 앨범', '/likes/', '♡'], ['라이브 가이드 · 펜라이트', '/live-guide/', '🔦'], ['나와 닮은 멤버 테스트', '/which-member/', '🔮'], ['공식 소식', '/news/', '📰'], ['CUTIE LAND 앨범 특집', '/cutie-land/', '💿'], ['입문 가이드 (처음이에요)', '/start/', '🎓'], ['紅白 특집', '/kohaku/', '🎍'],
  ['레전드 무대', '/stages/', '🎤'], ['히라가나 배우기', '/japanese/beginner/hiragana', '🔤'], ['현장 일본어', '/japanese/idol-japanese/live-terms', '📣'], ['덕질 용어 사전', '/japanese/dictionary', '📖'],
]
export function buildIndex(withBase: (p: string) => string): Hit[] {
  return [
  ...PAGES.map(([t, h, i]) => ({ kind: 'page' as const, title: t, sub: '페이지', href: withBase(h), icon: i, hay: norm(t) })),
  ...members.map((m) => ({ kind: 'member' as const, title: `${m.ja} ${m.ko}`, sub: `${m.colorName} · ${m.nickname} · ${m.birthplace}`, href: withBase(`/members/${m.id}`), color: m.color, icon: m.ja.slice(-2, -1),
    hay: norm([m.ja, m.ko, m.en, m.kana, m.nickname, m.nicknameKo, m.colorName, m.id].join(' ')) })),
  ...releases.map((r) => ({ kind: 'release' as const, title: r.title, sub: `${r.type} · ${r.date.replace(/-/g, '.')}`, href: withBase('/discography/'), icon: '💿', hay: norm(r.title + r.song) })),
  ...events.map((e) => ({ kind: 'event' as const, title: e.ja, sub: `${e.date.replace(/-/g, '.')} · ${catMeta[e.cat].ko}${e.venue ? ' · ' + e.venue : ''}`, href: e.url, ext: true, icon: catMeta[e.cat].emoji, hay: norm(e.ja + e.ko + (e.venue ?? '')) })),
  ...(videosRaw as Video[]).map((v) => ({ kind: 'video' as const, title: v.title.replace(/【CUTIE STREET[^】]*】/g, '').trim(), sub: `${v.duration || 'MV'}${v.date ? ' · ' + v.date.replace(/-/g, '.') : ''}`,
    href: `https://www.youtube.com/watch?v=${v.id}`, ext: true, icon: '▶',
    hay: norm(v.title + ' ' + (v.members ?? []).map((id) => `${memberById[id].ko} ${memberById[id].nicknameKo}`).join(' ')) })),
  ]
}
