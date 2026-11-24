// CUTIE STREET's climb, mapped onto Mt. Fuji (3,776m). The summit is a solo Tokyo Dome show — the goal Emiru named at
// Budokan (2026-08-26: "今一番かなえたい目標は今年の紅白 … その先にいつか東京ドームに立ちたい", sakigake.jp/news/article/20260826OR0217/).
// So 紅白 is the last camp below the top, and the summit has no date yet: altitudes are by stage (i / N of the climb).
// Facts: Wikipedia JA (https://ja.wikipedia.org/wiki/CUTIE_STREET) + official site.
// Video IDs: taken from the official @CUTIE_STREET / @KAWAII_LAB_OFFICIAL channels (see loop/ROADMAP.md).

export interface Milestone {
  date: string
  ja: string
  ko: string
  desc: string
  /** short flag label shown next to the 3D milestone flag */
  flag: string
  video?: string
  videoLabel?: string
}

export const milestones: Milestone[] = [
  { flag: '8명 공개', date: '2024.07.30', ja: '8人、出会う。', ko: '멤버·그룹명 공개', desc: 'KAWAII LAB.의 새 그룹으로 8명의 이름이 처음 세상에 나온 날. 등산로 입구에 선 순간.', video: '9Ovm1N0Mr2s', videoLabel: '데뷔 전 첫 영상' },
  { flag: 'TIF 데뷔', date: '2024.08.04', ja: 'TIF 2024 デビュー', ko: 'TOKYO IDOL FESTIVAL 데뷔', desc: '세계 최대급 아이돌 페스티벌 TIF에서 첫 무대. 원정의 첫 발.' },
  { flag: '데뷔곡 발매', date: '2024.09.09', ja: '「かわいいだけじゃだめですか？」', ko: '데뷔곡 디지털 발매', desc: '“귀엽기만 하면 안 되나요?” — 한 줄의 질문이 SNS를 타고 퍼지며 신드롬이 시작됐다.', video: 'jZqTz1G8G04', videoLabel: '데뷔곡 MV' },
  { flag: 'M스테 첫 출연', date: '2024.12.27', ja: 'Mステ SUPER LIVE', ko: '뮤직스테이션 첫 출연', desc: '데뷔 5개월 만에 일본 대표 음악 방송 무대에.', video: '65h-pneKvM0', videoLabel: '출연 결정의 순간' },
  { flag: '첫 원맨', date: '2025.02.02', ja: '1st ONE-MAN「CROSS STREET」', ko: '첫 단독 라이브 @豊洲PIT', desc: '우리만의 무대, 우리만의 큐티즈. 첫 원맨 라이브.', video: 'E_WBxfXU1BA', videoLabel: '전곡 LIVE 영상' },
  { flag: 'TikTok 트렌드 대상', date: '2025.06.24', ja: 'TikTok上半期トレンド大賞', ko: 'TikTok 상반기 트렌드 대상 (음악 부문)', desc: '“かわいいだけじゃだめですか？” 챌린지가 일본 전체의 트렌드가 됐다.' },
  { flag: '전국 투어 파이널', date: '2025.10.13', ja: '全国ツアー FINAL', ko: '첫 전국 투어 파이널 @ぴあアリーナMM', desc: '「CAN’T STOP CUTIE」 전국 투어를 아레나에서 마무리.', video: 'KnOdSw3E3t0', videoLabel: '파이널 LIVE' },
  { flag: '레코드대상 신인상', date: '2025.11.21', ja: '日本レコード大賞 新人賞', ko: '제67회 일본 레코드대상 신인상', desc: '데뷔 1년 3개월, 일본 음악계가 인정한 신인.', video: 'BPXkXus_Bb8', videoLabel: '신인상 무대' },
  { flag: '엠카운트다운', date: '2026.03.26', ja: 'M COUNTDOWN', ko: '한국 엠카운트다운 출연', desc: '바다를 건너 서울로. 한국어 버전까지 차트 1위에 오르며 “귀여움으로 세계까지”가 현실이 되기 시작.', video: 'aanKhmeCl-s', videoLabel: '엠카 스페셜 스테이지' },
  { flag: '오리콘 1위', date: '2026.05.27', ja: 'オリコン週間1位', ko: '3rd 싱글 오리콘·빌보드 재팬 1위', desc: '「キュートなキューたい / ナイスだね」로 첫 주간 1위 더블 달성.', video: 'VQmdUnlNnds', videoLabel: 'キュートなキューたい MV' },
  { flag: '부도칸', date: '2026.08.25', ja: '日本武道館', ko: '첫 부도칸 공연 (2주년)', desc: '아이돌의 성지, 부도칸. 2주년을 8색 펜라이트로 물들였다.', video: 'Yygy6mM-MCs', videoLabel: '부도칸 LIVE' },
  { flag: '아레나 투어', date: '2026.09.23', ja: 'ARENA TOUR 2026', ko: '첫 아레나 투어 7도시 13공연', desc: '요코하마 아레나에서 시작해 아이치 IG아레나까지. 다음 캠프는 紅白.', video: 'W9FWnBUw-9U', videoLabel: '요코하마 아레나 LIVE' },
  { flag: '紅白', date: '2026.12.31', ja: '第77回 NHK紅白歌合戦', ko: '홍백가합전 첫 출장', desc: '에미루가 부도칸에서 “지금 가장 이루고 싶은 목표”라고 말한 무대. 정상 바로 아래, 마지막 캠프.', video: 'j5ywAzuerLQ', videoLabel: '출장 결정의 순간' },
]

/** Fuji's height. The summit is `goal`, one stage above the last dated milestone. */
export const SUMMIT = 3776
const N = milestones.length

/** The summit: a solo Tokyo Dome show. Not announced — no date until it is. */
export const goal = {
  flag: '도쿄돔', ja: '東京ドーム 単独公演', ko: '단독 도쿄돔 — 언젠가',
  desc: '일본 아이돌 무대의 꼭대기. 2025.11.3 『MUSIC EXPO LIVE 2025』에서 KAWAII LAB. 4그룹과 함께 서 본 그 돔에, 이번엔 8명만의 이름으로.',
  quote: '“그 너머에 언젠가 도쿄돔에 서고 싶어요” — 카와모토 에미루, 첫 부도칸(2026.8.26)',
  source: 'https://www.sakigake.jp/news/article/20260826OR0217/',
}

/** altitude (m) of milestone i; i = N is the summit */
export const altOf = (i: number) => Math.round((i / N) * SUMMIT)

const ymd = (d: string) => Date.parse(d.replace(/\./g, '-') + 'T00:00:00+09:00')
export const milestoneMs = milestones.map((m) => ymd(m.date))
/** the last dated stage (紅白) */
export const lastCampMs = milestoneMs[N - 1]

/** where the group stands at time t, as a fraction of the climb: date-interpolated between milestones, then it waits at
 *  the last camp ((N-1)/N) until the summit gets a date. */
export function climbAt(t: number): number {
  for (let i = 0; i < N - 1; i++) if (t < milestoneMs[i + 1]) return (i + Math.max(0, (t - milestoneMs[i]) / (milestoneMs[i + 1] - milestoneMs[i]))) / N
  return (N - 1) / N
}
