// Song spotlight pages (/discography/<id>). Credits/dates from the official discography pages,
// charts from Wikipedia JA / Oricon / Billboard JAPAN; every video id verified via oEmbed (see loop/ROADMAP.md).
// kyuutai credits: pocketmonsters.net song DB + j-lyric (official detail page lists none) — shown with that source.
export interface Song {
  id: string
  title: string
  read: string // how to say it (Korean)
  meaning: string
  tagline: string
  grad: [string, string, string]
  facts: { k: string; v: string }[]
  badges: string[]
  story: string[]
  videos: { id: string; label: string }[]
  quiz: { q: string; options: string[]; answer: number }[]
}

export const songs: Song[] = [
  {
    id: 'kawaii-dake', title: 'かわいいだけじゃだめですか？', read: '카와이이 다케쟈 다메데스카', meaning: '귀엽기만 하면 안 되나요?',
    tagline: '데뷔곡이자 큐스트의 시그니처 송', grad: ['#FF6B9D', '#FFC93C', '#A06CD5'],
    facts: [
      { k: '발매', v: '2024.09.09 디지털 · 2024.11.13 CD' },
      { k: '작사', v: '早川博隆' },
      { k: '작곡', v: '早川博隆 · 渡邉俊彦' },
      { k: '편곡', v: '渡邉俊彦 · 早川博隆' },
      { k: '수록', v: '1st ALBUM 「CUTIE LAND」 4번 트랙' },
    ],
    badges: ['Billboard JAPAN Hot 100 2위', '1st CD 오리콘 주간 3위', 'RIAJ 골드 (스트리밍)', '한국어 버전 2026.04.10'],
    story: [
      '큐티스트리트를 단숨에 알린 곡이에요. Billboard JAPAN Hot 100 2위, 1st CD 싱글 오리콘 주간 3위, RIAJ 스트리밍 골드 인증까지 받았어요.',
      '2026년에는 한국어 버전 「귀엽기만 하면 안 되나요?」가 나왔고, Mnet 엠카운트다운 스페셜 스테이지도 이 곡으로 꾸몄어요.',
    ],
    videos: [
      { id: 'jZqTz1G8G04', label: '공식 MV' },
      { id: 'H4ZRCW5HamI', label: 'THE FIRST TAKE' },
      { id: 'sB1Mr-eXR3c', label: '한국어 버전 MV' },
      { id: 'aanKhmeCl-s', label: '엠카운트다운 무대' },
    ],
    quiz: [
      { q: '이 곡의 Billboard JAPAN Hot 100 최고 순위는?', options: ['1위', '2위', '3위', '5위'], answer: 1 },
      { q: '이 곡의 발매 형식은?', options: ['디지털만', 'CD만', '디지털 + CD', 'LP'], answer: 2 },
      { q: '작사가는?', options: ['Yuki.KT', '早川博隆', '渡邉俊彦', '秋元康'], answer: 1 },
    ],
  },
  {
    id: 'hello-hello-mirai', title: 'ハロハロミライ', read: '하로하로 미라이', meaning: '안녕 안녕, 미래야',
    tagline: '8명의 우정과 미래를 노래한 두 번째 곡', grad: ['#3CCFA8', '#5DC8F5', '#4A90D9'],
    facts: [
      { k: '발매', v: '2024.10.21 디지털' },
      { k: '작사·작곡·편곡', v: 'Yuki.KT (CK Creative Studio)' },
      { k: '수록', v: '1st ALBUM 「CUTIE LAND」 14번 트랙' },
    ],
    badges: ['두 번째 디지털 싱글', '라이브 단골곡'],
    story: [
      '데뷔곡에 이어 한 달여 만에 나온 두 번째 디지털 싱글이에요. 손을 맞잡고 함께 달려 나가는 8명의 모습을 그린, 밝고 힘찬 곡이에요.',
      '전국 투어 파이널 ぴあアリーナMM 등 큰 무대마다 불러 온 곡으로, 1st 앨범에도 실렸어요.',
    ],
    videos: [
      { id: 'NCo7KGszkzg', label: 'ぴあアリーナMM (2025.10.12)' },
      { id: 'YFb3f7f5nQs', label: '恵比寿 The Garden Hall (2025.12.01)' },
    ],
    quiz: [
      { q: '이 곡의 작사·작곡가는?', options: ['早川博隆', 'Yuki.KT', '渡邉俊彦', '秋元康'], answer: 1 },
      { q: '이 곡의 주요 테마는?', options: ['사랑', '이별', '우정과 미래', '여름'], answer: 2 },
    ],
  },
  {
    id: 'happy-sekai', title: 'ハッピー世界！', read: '핫피 세카이', meaning: '행복한 세계!',
    tagline: '저마다의 귀여움을 축하하는 세 번째 곡', grad: ['#FFC93C', '#FF9F43', '#FF6B9D'],
    facts: [
      { k: '발매', v: '2025.01.24 디지털' },
    ],
    badges: ['세 번째 디지털 싱글', 'KAWAII MAKER'],
    story: [
      '"하라주쿠에서 세계로 KAWAII를 발신한다"는 큐스트의 컨셉이 담긴 곡이에요. 긴 머리도 짧은 머리도, 활발해도 조용해도 — 모두 귀엽다는 메시지로 개성을 축하해요.',
      '"나에게서 너에게, 너에게서 세계로" 기쁨을 전하자는 노랫말처럼, 첫 단독 공연부터 도쿄 가든 시어터까지 무대를 밝혀 왔어요.',
    ],
    videos: [
      { id: '4j2aQHAmvJs', label: '첫 단독 공연 (2024.10.07)' },
      { id: 'WsumMB5dGEc', label: '東京ガーデンシアター (2025.09.09)' },
    ],
    quiz: [
      { q: '이 곡의 핵심 메시지는?', options: ['이별의 슬픔', '개성과 다양한 귀여움', '여름 바다', '학교 생활'], answer: 1 },
      { q: '큐티스트리트의 컨셉명은?', options: ['COOL MAKER', 'KAWAII MAKER', 'HAPPY MAKER', 'DREAM MAKER'], answer: 1 },
    ],
  },
  {
    id: 'kyuutai', title: 'キュートなキューたい', read: '큐토나 큐-타이', meaning: '큐트한 구체 (CUTIE SPHERE)',
    tagline: '첫 오리콘 1위 · 포켓몬 엔딩 테마', grad: ['#5DC8F5', '#FFC93C', '#3CCFA8'],
    facts: [
      { k: '발매', v: '2026.05.15 디지털 (TV size) · 2026.05.27 3rd SINGLE' },
      { k: '작사', v: 'ジンツチハシ · 早川博隆 · ポケモン音楽歌い隊' },
      { k: '작곡', v: 'ジンツチハシ · 早川博隆 · 宇田川翔' },
      { k: '편곡', v: '宇田川翔 · 早川博隆' },
      { k: '수록', v: '1st ALBUM 「CUTIE LAND」 7번 트랙' },
    ],
    badges: ['오리콘 주간 합산 싱글 1위', 'Billboard JAPAN Top Singles Sales 1위', 'TV 애니메이션 「포켓몬스터」 엔딩', '한국어 ver. 2026.10.21'],
    story: [
      '「ナイスだね」와 함께 더블 A면으로 나온 3rd 싱글의 타이틀곡이에요. 오리콘 주간 합산 싱글·주간 싱글 랭킹에서 그룹 첫 1위를 했고, Billboard JAPAN Top Singles Sales에서도 1위에 올랐어요.',
      '일본 TV 애니메이션 「포켓몬스터」의 엔딩 테마예요. 한국어 버전 「동글동글 동글이」는 재능TV 「포켓몬스터: 원더보야지」 엔딩으로 11월 3일부터 방송돼, 일본과 한국 양쪽에서 엔딩을 맡게 됐어요.',
      '2026년 10월에는 엠카운트다운·뮤직뱅크·음악중심·인기가요 무대에서 한국어 버전을 선보였어요.',
    ],
    videos: [
      { id: 'VQmdUnlNnds', label: '공식 MV' },
      { id: 'J7osyzGsxZs', label: '한국어 ver. MV' },
      { id: 'K8Ve15WbM_0', label: '엠카운트다운 (10.22)' },
      { id: 'hyZLLImDeds', label: '뮤직뱅크 (10.23)' },
      { id: '4-t2sNCZIX4', label: '음악중심' },
      { id: 'ArJmURaeilo', label: '인기가요 (10.25)' },
    ],
    quiz: [
      { q: '이 곡이 엔딩 테마로 쓰인 TV 애니메이션은?', options: ['포켓몬스터', '원피스', '프리큐어', '짱구는 못말려'], answer: 0 },
      { q: '한국어 버전의 제목은?', options: ['귀엽기만 하면 안 되나요?', '동글동글 동글이', '프리큐큐', '큐스토의 노래'], answer: 1 },
      { q: '3rd 싱글에서 이 곡과 더블 A면인 곡은?', options: ['ナイスだね', 'ラブトレ', 'Error404♡', 'ご褒美しよっ！'], answer: 0 },
    ],
  },
]
export const songById = Object.fromEntries(songs.map((s) => [s.id, s]))
