// Canonical CUTIE STREET member data.
// Sources (verified 2026-11-17):
//  - Official profile + SNS: https://cutiestreet.asobisystem.com/news/2
//  - Wikipedia JA: https://ja.wikipedia.org/wiki/CUTIE_STREET (birthplace, height, color, nickname)

export interface Member {
  id: string
  ja: string
  kana: string
  ko: string
  en: string
  nickname: string
  birthday: string // YYYY-MM-DD
  birthplace: string
  height: number
  color: string // hex used on this site
  colorName: string
  emoji: string
  x: string
  instagram: string
  tiktok: string
  nicknameKo: string
  skills: string[] // verified 2026-11-17: ciatr.jp/topics/336201 + ticket.co.jp/entx/?p=5758
  hobbies: string[]
  heightNote?: string
}

export const members: Member[] = [
  { id: 'risa', ja: '古澤里紗', kana: 'ふるさわ りさ', ko: '후루사와 리사', en: 'Risa Furusawa', nickname: 'ふーりー', birthday: '2000-11-08', birthplace: '熊本県', height: 158, color: '#FFC93C', colorName: 'Yellow', emoji: '💛', x: 'risa_cs1108', instagram: 'fuuuuu_ri', tiktok: 'fuuuuu_ri', nicknameKo: '후리, 후리탄', skills: ['댄스 (고교 댄스부 전국대회 우승)'], hobbies: ['귀여운 옷 만들기'] },
  { id: 'aika', ja: '佐野愛花', kana: 'さの あいか', ko: '사노 아이카', en: 'Aika Sano', nickname: 'あいか', birthday: '2000-11-26', birthplace: '東京都', height: 151, color: '#FF4757', colorName: 'Red', emoji: '❤️', x: 'aika_cs1126', instagram: 'aika.sano_official', tiktok: 'aika_sano_', nicknameKo: '아이짱', skills: ['댄스 (경력 9년)'], hobbies: ['드라마·영화 감상', '먹는 것', '야키니쿠 맛집 탐방'] },
  { id: 'kana', ja: '板倉可奈', kana: 'いたくら かな', ko: '이타쿠라 카나', en: 'Kana Itakura', nickname: 'かな', birthday: '2001-11-11', birthplace: '千葉県', height: 157, color: '#3CCFA8', colorName: 'Mint Green', emoji: '💚', x: 'kana_cs1111', instagram: 'kana.sii.i', tiktok: 'kana.sii.i', nicknameKo: '카나짱, 카나린', skills: ['댄스 (경력 10년+)'], hobbies: ['YouTube', '애니메이션 감상'] },
  { id: 'ayano', ja: '増田彩乃', kana: 'ますだ あやの', ko: '마스다 아야노', en: 'Ayano Masuda', nickname: 'あやの', birthday: '2003-05-26', birthplace: '愛知県', height: 157, heightNote: '일부 매체 156cm', color: '#4A90D9', colorName: 'Blue', emoji: '💙', x: 'ayano_cs0526', instagram: 'm_ayano26', tiktok: 'm_ayano26', nicknameKo: '아야노, 아야논', skills: [], hobbies: ['댄스', '운동'] },
  { id: 'emiru', ja: '川本笑瑠', kana: 'かわもと えみる', ko: '카와모토 에미루', en: 'Emiru Kawamoto', nickname: 'えみる', birthday: '2002-04-22', birthplace: '神奈川県', height: 149, color: '#FF9F43', colorName: 'Orange', emoji: '🧡', x: 'emiru_cs0422', instagram: '_emiru._', tiktok: '_emiru._', nicknameKo: '에미루', skills: ['소형선박 면허 보유'], hobbies: ['수상바이크 타기', '댄스 스태킹'] },
  { id: 'miyu', ja: '梅田みゆ', kana: 'うめだ みゆ', ko: '우메다 미유', en: 'Miyu Umeda', nickname: 'みゆ', birthday: '2004-09-13', birthplace: '熊本県', height: 150, color: '#5DC8F5', colorName: 'Light Blue', emoji: '🩵', x: 'miyu_cs0913', instagram: 'miyu_.0913', tiktok: 'miyu_ume', nicknameKo: '미유', skills: [], hobbies: ['카페 탐방', '헤어 어레인지'] },
  { id: 'nagisa', ja: '真鍋凪咲', kana: 'まなべ なぎさ', ko: '마나베 나기사', en: 'Nagisa Manabe', nickname: 'なべちゃん', birthday: '2004-06-28', birthplace: '神奈川県', height: 161, color: '#A06CD5', colorName: 'Purple', emoji: '💜', x: 'nagisa_cs0628', instagram: 'nagisa_manabe', tiktok: 'nagisa_manabe', nicknameKo: '나베짱', skills: [], hobbies: ['댄스', '배드민턴'] },
  { id: 'haruka', ja: '桜庭遥花', kana: 'さくらば はるか', ko: '사쿠라바 하루카', en: 'Haruka Sakuraba', nickname: 'ぱるたん', birthday: '2006-01-29', birthplace: '北海道', height: 154, color: '#FF6B9D', colorName: 'Pink', emoji: '🩷', x: 'haruka_cs0129', instagram: 'pa___.ru', tiktok: 'sakuraba_haruka', nicknameKo: '파루탄', skills: [], hobbies: ['만화 감상'] },
]

export const memberById = Object.fromEntries(members.map((m) => [m.id, m])) as Record<string, Member>

export function ageOn(birthday: string, now = new Date()): number {
  const [y, m, d] = birthday.split('-').map(Number)
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--
  return age
}

export const prefectureKo: Record<string, string> = {
  '熊本県': '구마모토현', '東京都': '도쿄도', '千葉県': '치바현', '愛知県': '아이치현', '神奈川県': '가나가와현', '北海道': '홋카이도',
}

/** Days until the next birthday (0 = today). */
export function daysToBirthday(birthday: string, now = new Date()): number {
  const [, m, d] = birthday.split('-').map(Number)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), m - 1, d)
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}
