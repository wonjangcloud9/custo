# Custo - 큐티스트리트 덕질 일본어 학습 사이트

## 개요

큐티스트리트(CUTIE STREET) 팬을 위한 일본어 학습 + 팬위키 사이트.
학습 콘텐츠 자체에 큐티스트리트 소재를 활용하여 덕질과 공부를 동시에.

- **타겟**: 일본어 초보 ~ 중급 큐티스트리트 팬
- **배포**: GitHub Pages (VitePress 정적 빌드)
- **관리**: 마크다운 직접 편집
- **저장소**: `notwonjang/custo`

---

## 기술 스택

- **프레임워크**: VitePress (Vue 3 기반 정적 사이트 생성기)
- **인터랙티브**: Vue 3 커스텀 컴포넌트 (Quiz, Flashcard, MemberCard)
- **스타일**: 커스텀 CSS (VitePress 테마 오버라이드)
- **폰트**: Noto Sans JP + Noto Sans KR (본문), Zen Maru Gothic (타이틀)
- **배포**: GitHub Actions → GitHub Pages

---

## 사이트 구조

```
docs/
├── .vitepress/
│   ├── config.ts
│   ├── theme/
│   │   ├── index.ts
│   │   └── style.css
│   └── components/
│       ├── Quiz.vue
│       ├── Flashcard.vue
│       └── MemberCard.vue
├── index.md
├── members/
│   ├── index.md
│   ├── risa.md
│   ├── aika.md
│   ├── kana.md
│   ├── ayano.md
│   ├── emiru.md
│   ├── miyu.md
│   ├── nagisa.md
│   └── haruka.md
├── discography/
│   ├── index.md
│   ├── kawaii-dake.md
│   ├── hello-hello-mirai.md
│   └── happy-sekai.md
├── japanese/
│   ├── beginner/
│   │   ├── hiragana.md
│   │   ├── katakana.md
│   │   └── basics.md
│   ├── idol-japanese/
│   │   ├── live-terms.md
│   │   ├── sns-japanese.md
│   │   └── fan-letter.md
│   └── lyrics/
│       ├── kawaii-dake.md
│       ├── hello-hello-mirai.md
│       └── happy-sekai.md
└── schedule/
    └── index.md
```

---

## 네비게이션

```
홈 | 멤버 | 디스코그래피 | 일본어 배우기 | 스케줄
                              ├── 초급
                              ├── 덕질 일본어
                              └── 가사로 배우기
```

사이드바 하단: 공식 웹사이트, X, Instagram 링크 고정

---

## 비주얼 테마

### 컬러 시스템

| 용도 | 컬러 | HEX |
|------|-------|-----|
| 메인 1 | 핑크 | #FF6B9D |
| 메인 2 | 라벤더 | #C49CFF |
| 배경 | 크림 화이트 | #FFF8F0 |
| 텍스트 | 다크 그레이 | #333333 |

멤버 컬러 (포인트 활용):

| 멤버 | 컬러 | 용도 |
|------|-------|------|
| 古澤里紗 (Risa) | Yellow | 카드 보더/강조 |
| 佐野愛花 (Aika) | Red | 카드 보더/강조 |
| 板倉可奈 (Kana) | Mint Green | 카드 보더/강조 |
| 増田彩乃 (Ayano) | Blue | 카드 보더/강조 |
| 川本笑瑠 (Emiru) | Orange | 카드 보더/강조 |
| 梅田みゆ (Miyu) | Sky Blue | 카드 보더/강조 |
| 真鍋凪咲 (Nagisa) | Purple | 카드 보더/강조 |
| 桜庭遥花 (Haruka) | Pink | 카드 보더/강조 |

### 폰트

- 본문: Noto Sans JP + Noto Sans KR
- 타이틀/포인트: Zen Maru Gothic

### 디자인 톤

- 둥근 카드 UI, 부드러운 그림자
- 파스텔 톤 그라데이션
- 다크모드 미지원 (카와이이 컨셉 유지)

---

## 인터랙티브 컴포넌트

### Flashcard.vue

- props: `cards` (배열: `{ front, back }`)
- 동작: 클릭 시 앞/뒤 플립 애니메이션
- 좌우 화살표로 카드 이동
- 진행률 표시 (3/10)

### Quiz.vue

- props: `questions` (배열: `{ q, options[], answer }`)
- 동작: 4지선다, 클릭 시 정답/오답 즉시 피드백
- 전체 완료 시 점수 표시
- 오답 해설 표시

### MemberCard.vue

- props: `name`, `nameJa`, `color`, `birthday`, `position`, `sns`
- 멤버 컬러 보더/그라데이션
- 프로필 정보 카드 레이아웃

### 마크다운 사용 예시

```md
<Flashcard :cards="[
  { front: 'さくらば はるか', back: '사쿠라바 하루카 (桜庭遥花)' },
  { front: 'うめだ みゆ', back: '우메다 미유 (梅田みゆ)' }
]" />

<Quiz :questions="[
  { q: '「推し」의 뜻은?', options: ['최애', '노래', '춤', '인사'], answer: 0 }
]" />
```

---

## 학습 콘텐츠

### 초급 (beginner/)

- **히라가나**: 히라가나표 + 큐티스트리트 멤버 이름으로 읽기 연습 + 플래시카드
- **카타카나**: 카타카나표 + 아이돌 용어로 연습 (ライブ, チェキ 등) + 플래시카드
- **기초**: 인사, 숫자, 자기소개 표현

### 덕질 일본어 (idol-japanese/)

- **현장 용어**: 콜, 챈트, 물판, 특전회, MIX 등 라이브 필수 용어
- **SNS 일본어**: 트위터/인스타에서 자주 보는 표현, 해시태그 읽기
- **팬레터 쓰기**: 예문 템플릿 + 문법 해설 + 주의사항

### 가사로 배우기 (lyrics/)

- 곡별 페이지 구성: 가사 원문 → 한국어 번역 → 단어 해설 → 문법 포인트
- 각 곡 페이지 하단에 관련 퀴즈

---

## 팬위키 섹션

### 멤버 (members/)

- 각 멤버별 개별 페이지
- MemberCard 컴포넌트로 프로필 표시
- 소개 텍스트 + 일본어 학습 연결 링크

### 디스코그래피 (discography/)

- 싱글/앨범 목록 (발매일순)
  - かわいいだけじゃだめですか？ (2024.09)
  - Hello Hello Mirai (2024.10)
  - Happy Sekai! (2025.01)
- 각 곡 → 가사 학습 페이지 연결

### 스케줄 (schedule/)

- 마크다운 테이블로 관리
- 날짜 | 이벤트명 | 장소 | 비고

---

## 배포

- GitHub Actions 워크플로우로 자동 빌드/배포
- `main` 브랜치 push 시 자동 트리거
- `gh-pages` 브랜치에 빌드 결과물 배포
- URL: `https://notwonjang.github.io/custo/`
