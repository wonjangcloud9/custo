# Custo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 큐티스트리트 팬을 위한 일본어 학습 + 팬위키 VitePress 사이트 구축

**Architecture:** VitePress 정적 사이트에 Vue 3 커스텀 컴포넌트(Quiz, Flashcard, MemberCard)를 마크다운 안에서 사용. 카와이이 파스텔 톤 커스텀 테마. GitHub Actions로 GitHub Pages 자동 배포.

**Tech Stack:** VitePress, Vue 3, TypeScript, CSS Custom Properties, GitHub Actions

---

## File Structure

```
docs/
├── .vitepress/
│   ├── config.ts                    # VitePress 설정 (nav, sidebar, head)
│   ├── theme/
│   │   ├── index.ts                 # 커스텀 테마 등록 + 컴포넌트 글로벌 등록
│   │   └── style.css                # 전체 커스텀 CSS (컬러, 폰트, 카드 등)
│   └── components/
│       ├── Flashcard.vue            # 플래시카드 인터랙티브 컴포넌트
│       ├── Quiz.vue                 # 퀴즈 인터랙티브 컴포넌트
│       └── MemberCard.vue           # 멤버 프로필 카드 컴포넌트
├── index.md                         # 홈페이지
├── members/
│   ├── index.md                     # 멤버 목록
│   ├── risa.md ~ haruka.md          # 개별 멤버 페이지 (8개)
├── discography/
│   ├── index.md                     # 디스코그래피 목록
│   ├── kawaii-dake.md               # 곡별 페이지
│   ├── hello-hello-mirai.md
│   └── happy-sekai.md
├── japanese/
│   ├── beginner/
│   │   ├── hiragana.md              # 히라가나 학습
│   │   ├── katakana.md              # 카타카나 학습
│   │   └── basics.md                # 기초 표현
│   ├── idol-japanese/
│   │   ├── live-terms.md            # 현장 용어
│   │   ├── sns-japanese.md          # SNS 일본어
│   │   └── fan-letter.md            # 팬레터 쓰기
│   └── lyrics/
│       ├── kawaii-dake.md            # 가사 학습
│       ├── hello-hello-mirai.md
│       └── happy-sekai.md
├── schedule/
│   └── index.md                     # 활동 일정
.github/
└── workflows/
    └── deploy.yml                   # GitHub Pages 배포
package.json                         # 프로젝트 의존성
```

---

### Task 1: VitePress 프로젝트 초기화

**Files:**
- Create: `docs/.vitepress/config.ts`
- Create: `docs/index.md`
- Create: `package.json`

- [ ] **Step 1: npm init + VitePress 설치**

```bash
cd /Users/notwonjang/custo
npm init -y
npm install -D vitepress
```

- [ ] **Step 2: package.json 스크립트 추가**

`package.json`의 scripts를 다음으로 교체:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  }
}
```

- [ ] **Step 3: VitePress config 생성**

`docs/.vitepress/config.ts`:

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Custo',
  description: '큐티스트리트와 함께하는 일본어 학습',
  base: '/custo/',
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Zen+Maru+Gothic:wght@400;700&display=swap', rel: 'stylesheet' }],
  ],
  themeConfig: {
    nav: [
      { text: '홈', link: '/' },
      { text: '멤버', link: '/members/' },
      { text: '디스코그래피', link: '/discography/' },
      {
        text: '일본어 배우기',
        items: [
          { text: '초급', link: '/japanese/beginner/hiragana' },
          { text: '덕질 일본어', link: '/japanese/idol-japanese/live-terms' },
          { text: '가사로 배우기', link: '/japanese/lyrics/kawaii-dake' },
        ],
      },
      { text: '스케줄', link: '/schedule/' },
    ],
    sidebar: {
      '/members/': [
        {
          text: '멤버',
          items: [
            { text: '전체 멤버', link: '/members/' },
            { text: '古澤里紗 (Risa)', link: '/members/risa' },
            { text: '佐野愛花 (Aika)', link: '/members/aika' },
            { text: '板倉可奈 (Kana)', link: '/members/kana' },
            { text: '増田彩乃 (Ayano)', link: '/members/ayano' },
            { text: '川本笑瑠 (Emiru)', link: '/members/emiru' },
            { text: '梅田みゆ (Miyu)', link: '/members/miyu' },
            { text: '真鍋凪咲 (Nagisa)', link: '/members/nagisa' },
            { text: '桜庭遥花 (Haruka)', link: '/members/haruka' },
          ],
        },
      ],
      '/japanese/beginner/': [
        {
          text: '초급',
          items: [
            { text: '히라가나', link: '/japanese/beginner/hiragana' },
            { text: '카타카나', link: '/japanese/beginner/katakana' },
            { text: '기초 표현', link: '/japanese/beginner/basics' },
          ],
        },
      ],
      '/japanese/idol-japanese/': [
        {
          text: '덕질 일본어',
          items: [
            { text: '현장 용어', link: '/japanese/idol-japanese/live-terms' },
            { text: 'SNS 일본어', link: '/japanese/idol-japanese/sns-japanese' },
            { text: '팬레터 쓰기', link: '/japanese/idol-japanese/fan-letter' },
          ],
        },
      ],
      '/japanese/lyrics/': [
        {
          text: '가사로 배우기',
          items: [
            { text: 'かわいいだけじゃだめですか？', link: '/japanese/lyrics/kawaii-dake' },
            { text: 'Hello Hello Mirai', link: '/japanese/lyrics/hello-hello-mirai' },
            { text: 'Happy Sekai!', link: '/japanese/lyrics/happy-sekai' },
          ],
        },
      ],
      '/discography/': [
        {
          text: '디스코그래피',
          items: [
            { text: '전체 목록', link: '/discography/' },
            { text: 'かわいいだけじゃだめですか？', link: '/discography/kawaii-dake' },
            { text: 'Hello Hello Mirai', link: '/discography/hello-hello-mirai' },
            { text: 'Happy Sekai!', link: '/discography/happy-sekai' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'x', link: 'https://x.com/CUTIE_STREET_' },
      { icon: 'instagram', link: 'https://www.instagram.com/cutie_street' },
    ],
  },
})
```

- [ ] **Step 4: 홈페이지 생성**

`docs/index.md`:

```md
---
layout: home
hero:
  name: "Custo"
  text: "큐티스트리트와 함께하는 일본어"
  tagline: "덕질하면서 일본어도 배우자!"
  actions:
    - theme: brand
      text: 일본어 시작하기
      link: /japanese/beginner/hiragana
    - theme: alt
      text: 멤버 알아보기
      link: /members/
features:
  - title: 🎤 멤버와 함께 배우기
    details: 큐티스트리트 멤버 이름으로 히라가나·카타카나를 익혀보세요.
  - title: 🎵 가사로 배우는 일본어
    details: 좋아하는 곡의 가사를 읽으며 단어와 문법을 자연스럽게 학습.
  - title: 📱 덕질 일본어
    details: SNS, 현장, 팬레터에 꼭 필요한 실전 일본어 표현 모음.
---
```

- [ ] **Step 5: dev 서버 구동 확인**

```bash
npx vitepress dev docs
```

Expected: 브라우저에서 `http://localhost:5173/custo/` 접속 시 홈페이지 표시

- [ ] **Step 6: .gitignore 추가 후 커밋**

`.gitignore`에 `node_modules/`, `docs/.vitepress/dist/`, `docs/.vitepress/cache/` 추가.

```bash
git add package.json package-lock.json docs/.vitepress/config.ts docs/index.md .gitignore
git commit -m "feat: initialize VitePress project with nav and home page"
```

---

### Task 2: 커스텀 테마 (컬러, 폰트, 카와이이 스타일)

**Files:**
- Create: `docs/.vitepress/theme/index.ts`
- Create: `docs/.vitepress/theme/style.css`

- [ ] **Step 1: 커스텀 테마 엔트리 생성**

`docs/.vitepress/theme/index.ts`:

```ts
import DefaultTheme from 'vitepress/theme'
import './style.css'

export default DefaultTheme
```

- [ ] **Step 2: 커스텀 CSS 작성**

`docs/.vitepress/theme/style.css`:

```css
:root {
  /* 큐티스트리트 메인 컬러 */
  --custo-pink: #FF6B9D;
  --custo-lavender: #C49CFF;
  --custo-cream: #FFF8F0;
  --custo-text: #333333;

  /* 멤버 컬러 */
  --member-risa: #FFD700;
  --member-aika: #FF4757;
  --member-kana: #7FDBCA;
  --member-ayano: #4A90D9;
  --member-emiru: #FF9F43;
  --member-miyu: #74B9FF;
  --member-nagisa: #A06CD5;
  --member-haruka: #FF6B9D;

  /* VitePress 테마 오버라이드 */
  --vp-c-brand-1: #FF6B9D;
  --vp-c-brand-2: #E8558A;
  --vp-c-brand-3: #D04077;
  --vp-c-brand-soft: rgba(255, 107, 157, 0.14);
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #FF6B9D, #C49CFF);
  --vp-home-hero-image-background-image: linear-gradient(135deg, #FF6B9D33, #C49CFF33);
  --vp-home-hero-image-filter: blur(44px);

  /* 배경 */
  --vp-c-bg: var(--custo-cream);
  --vp-c-bg-soft: #FFF0E8;
  --vp-c-bg-mute: #FFE8DC;
}

/* 폰트 */
:root {
  --vp-font-family-base: 'Noto Sans KR', 'Noto Sans JP', sans-serif;
}

h1, h2, h3, .VPHero .name {
  font-family: 'Zen Maru Gothic', 'Noto Sans KR', sans-serif;
}

/* 카드 스타일 글로벌 */
.custo-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.custo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 157, 0.18);
}

/* VPFeature 카드 둥글게 */
.VPFeature {
  border-radius: 16px !important;
  border: 1px solid rgba(255, 107, 157, 0.2) !important;
}

/* 네비게이션 바 배경 */
.VPNav {
  background: rgba(255, 248, 240, 0.85) !important;
  backdrop-filter: blur(12px);
}

/* 버튼 그라데이션 */
.VPButton.brand {
  background: linear-gradient(135deg, #FF6B9D, #C49CFF) !important;
  border: none !important;
}

.VPButton.brand:hover {
  background: linear-gradient(135deg, #E8558A, #A06CD5) !important;
}

/* 사이드바 액티브 링크 */
.VPSidebarItem.is-active > .item > .link > .text {
  color: var(--custo-pink) !important;
}
```

- [ ] **Step 3: dev 서버에서 테마 적용 확인**

```bash
npx vitepress dev docs
```

Expected: 핑크-라벤더 그라데이션 타이틀, 크림 배경, 둥근 카드, 커스텀 폰트 표시

- [ ] **Step 4: 커밋**

```bash
git add docs/.vitepress/theme/
git commit -m "feat: add kawaii custom theme with Cutie Street colors"
```

---

### Task 3: MemberCard 컴포넌트

**Files:**
- Create: `docs/.vitepress/components/MemberCard.vue`
- Modify: `docs/.vitepress/theme/index.ts`

- [ ] **Step 1: MemberCard 컴포넌트 작성**

`docs/.vitepress/components/MemberCard.vue`:

```vue
<script setup lang="ts">
defineProps<{
  name: string
  nameJa: string
  color: string
  birthday?: string
  position?: string
  sns?: { x?: string; instagram?: string }
}>()
</script>

<template>
  <div class="member-card" :style="{ '--member-color': color }">
    <div class="member-header">
      <div class="member-color-dot" />
      <div>
        <h3 class="member-name">{{ nameJa }}</h3>
        <p class="member-name-sub">{{ name }}</p>
      </div>
    </div>
    <div class="member-info">
      <p v-if="birthday"><span class="label">생일</span> {{ birthday }}</p>
      <p v-if="position"><span class="label">포지션</span> {{ position }}</p>
    </div>
    <div v-if="sns" class="member-sns">
      <a v-if="sns.x" :href="sns.x" target="_blank" rel="noopener">X</a>
      <a v-if="sns.instagram" :href="sns.instagram" target="_blank" rel="noopener">Instagram</a>
    </div>
  </div>
</template>

<style scoped>
.member-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border-left: 4px solid var(--member-color);
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
  margin: 1rem 0;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.member-color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--member-color);
  flex-shrink: 0;
}

.member-name {
  margin: 0;
  font-size: 1.3rem;
  font-family: 'Zen Maru Gothic', sans-serif;
}

.member-name-sub {
  margin: 0;
  color: #888;
  font-size: 0.9rem;
}

.member-info .label {
  font-weight: 700;
  color: var(--member-color);
  margin-right: 0.5rem;
}

.member-info p {
  margin: 0.3rem 0;
}

.member-sns {
  margin-top: 1rem;
  display: flex;
  gap: 0.8rem;
}

.member-sns a {
  color: var(--member-color);
  font-weight: 700;
  text-decoration: none;
}

.member-sns a:hover {
  text-decoration: underline;
}
</style>
```

- [ ] **Step 2: 글로벌 컴포넌트 등록**

`docs/.vitepress/theme/index.ts` 수정:

```ts
import DefaultTheme from 'vitepress/theme'
import MemberCard from '../components/MemberCard.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MemberCard', MemberCard)
  },
}
```

- [ ] **Step 3: dev 서버에서 테스트용 마크다운 작성 후 확인**

`docs/members/index.md`에 테스트:

```md
# 멤버

<MemberCard
  name="Haruka Sakuraba"
  name-ja="桜庭遥花"
  color="#FF6B9D"
  birthday="미공개"
  position="멤버"
/>
```

Expected: 핑크 보더의 멤버 카드 렌더링

- [ ] **Step 4: 커밋**

```bash
git add docs/.vitepress/components/MemberCard.vue docs/.vitepress/theme/index.ts
git commit -m "feat: add MemberCard component with member color theming"
```

---

### Task 4: Flashcard 컴포넌트

**Files:**
- Create: `docs/.vitepress/components/Flashcard.vue`
- Modify: `docs/.vitepress/theme/index.ts`

- [ ] **Step 1: Flashcard 컴포넌트 작성**

`docs/.vitepress/components/Flashcard.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  cards: Array<{ front: string; back: string }>
}>()

const currentIndex = ref(0)
const isFlipped = ref(false)

function flip() {
  isFlipped.value = !isFlipped.value
}

function next() {
  if (currentIndex.value < props.cards.length - 1) {
    currentIndex.value++
    isFlipped.value = false
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    isFlipped.value = false
  }
}
</script>

<template>
  <div class="flashcard-container">
    <div class="flashcard-progress">
      {{ currentIndex + 1 }} / {{ cards.length }}
    </div>
    <div class="flashcard" :class="{ flipped: isFlipped }" @click="flip">
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <p>{{ cards[currentIndex].front }}</p>
          <span class="flip-hint">클릭해서 뒤집기</span>
        </div>
        <div class="flashcard-back">
          <p>{{ cards[currentIndex].back }}</p>
        </div>
      </div>
    </div>
    <div class="flashcard-nav">
      <button :disabled="currentIndex === 0" @click="prev">← 이전</button>
      <button :disabled="currentIndex === cards.length - 1" @click="next">다음 →</button>
    </div>
  </div>
</template>

<style scoped>
.flashcard-container {
  margin: 1.5rem 0;
  text-align: center;
}

.flashcard-progress {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 0.8rem;
}

.flashcard {
  perspective: 1000px;
  cursor: pointer;
  width: 100%;
  max-width: 400px;
  height: 200px;
  margin: 0 auto;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s;
  transform-style: preserve-3d;
}

.flashcard.flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.12);
}

.flashcard-front {
  background: linear-gradient(135deg, #FFF0F5, #F0E6FF);
}

.flashcard-front p {
  font-size: 1.6rem;
  font-family: 'Zen Maru Gothic', sans-serif;
  margin: 0;
}

.flip-hint {
  font-size: 0.75rem;
  color: #bbb;
  margin-top: 1rem;
}

.flashcard-back {
  background: linear-gradient(135deg, #FF6B9D, #C49CFF);
  color: white;
  transform: rotateY(180deg);
}

.flashcard-back p {
  font-size: 1.3rem;
  font-family: 'Noto Sans KR', sans-serif;
  margin: 0;
}

.flashcard-nav {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.flashcard-nav button {
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  border: 2px solid var(--custo-pink);
  background: white;
  color: var(--custo-pink);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.flashcard-nav button:hover:not(:disabled) {
  background: var(--custo-pink);
  color: white;
}

.flashcard-nav button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
```

- [ ] **Step 2: 글로벌 등록 추가**

`docs/.vitepress/theme/index.ts` 수정:

```ts
import DefaultTheme from 'vitepress/theme'
import MemberCard from '../components/MemberCard.vue'
import Flashcard from '../components/Flashcard.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MemberCard', MemberCard)
    app.component('Flashcard', Flashcard)
  },
}
```

- [ ] **Step 3: dev 서버에서 확인**

테스트용 마크다운에 추가 후 플립 동작, 이전/다음 네비게이션, 진행률 표시 확인.

- [ ] **Step 4: 커밋**

```bash
git add docs/.vitepress/components/Flashcard.vue docs/.vitepress/theme/index.ts
git commit -m "feat: add Flashcard component with flip animation"
```

---

### Task 5: Quiz 컴포넌트

**Files:**
- Create: `docs/.vitepress/components/Quiz.vue`
- Modify: `docs/.vitepress/theme/index.ts`

- [ ] **Step 1: Quiz 컴포넌트 작성**

`docs/.vitepress/components/Quiz.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  questions: Array<{ q: string; options: string[]; answer: number }>
}>()

const currentIndex = ref(0)
const selectedOption = ref<number | null>(null)
const answered = ref(false)
const score = ref(0)
const finished = ref(false)

const currentQ = computed(() => props.questions[currentIndex.value])
const isCorrect = computed(() => selectedOption.value === currentQ.value.answer)

function selectOption(index: number) {
  if (answered.value) return
  selectedOption.value = index
  answered.value = true
  if (index === currentQ.value.answer) {
    score.value++
  }
}

function nextQuestion() {
  if (currentIndex.value < props.questions.length - 1) {
    currentIndex.value++
    selectedOption.value = null
    answered.value = false
  } else {
    finished.value = true
  }
}

function restart() {
  currentIndex.value = 0
  selectedOption.value = null
  answered.value = false
  score.value = 0
  finished.value = false
}
</script>

<template>
  <div class="quiz-container">
    <div v-if="!finished">
      <div class="quiz-progress">
        문제 {{ currentIndex + 1 }} / {{ questions.length }}
      </div>
      <div class="quiz-question">{{ currentQ.q }}</div>
      <div class="quiz-options">
        <button
          v-for="(opt, i) in currentQ.options"
          :key="i"
          class="quiz-option"
          :class="{
            correct: answered && i === currentQ.answer,
            wrong: answered && i === selectedOption && i !== currentQ.answer,
          }"
          @click="selectOption(i)"
        >
          {{ opt }}
        </button>
      </div>
      <div v-if="answered" class="quiz-feedback">
        <p v-if="isCorrect" class="correct-text">정답! 🎉</p>
        <p v-else class="wrong-text">
          오답! 정답은 「{{ currentQ.options[currentQ.answer] }}」
        </p>
        <button class="quiz-next" @click="nextQuestion">
          {{ currentIndex < questions.length - 1 ? '다음 문제 →' : '결과 보기' }}
        </button>
      </div>
    </div>
    <div v-else class="quiz-result">
      <h3>결과</h3>
      <p class="quiz-score">{{ score }} / {{ questions.length }}</p>
      <p v-if="score === questions.length">만점! 완벽해요! 🌟</p>
      <p v-else-if="score >= questions.length * 0.7">잘했어요! 💪</p>
      <p v-else>다시 도전해봐요! 💖</p>
      <button class="quiz-restart" @click="restart">다시 풀기</button>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  margin: 1.5rem 0;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.1);
}

.quiz-progress {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
}

.quiz-question {
  font-size: 1.2rem;
  font-weight: 700;
  font-family: 'Zen Maru Gothic', sans-serif;
  margin-bottom: 1rem;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.quiz-option {
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  border: 2px solid #eee;
  background: white;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.quiz-option:hover:not(.correct):not(.wrong) {
  border-color: var(--custo-pink);
  background: #FFF0F5;
}

.quiz-option.correct {
  border-color: #2ECC71;
  background: #E8F8F0;
}

.quiz-option.wrong {
  border-color: #FF4757;
  background: #FFF0F0;
}

.quiz-feedback {
  margin-top: 1rem;
  text-align: center;
}

.correct-text {
  color: #2ECC71;
  font-weight: 700;
}

.wrong-text {
  color: #FF4757;
  font-weight: 700;
}

.quiz-next,
.quiz-restart {
  margin-top: 0.8rem;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #FF6B9D, #C49CFF);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.quiz-next:hover,
.quiz-restart:hover {
  opacity: 0.85;
}

.quiz-result {
  text-align: center;
}

.quiz-score {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #FF6B9D, #C49CFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
```

- [ ] **Step 2: 글로벌 등록 추가**

`docs/.vitepress/theme/index.ts` 수정:

```ts
import DefaultTheme from 'vitepress/theme'
import MemberCard from '../components/MemberCard.vue'
import Flashcard from '../components/Flashcard.vue'
import Quiz from '../components/Quiz.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MemberCard', MemberCard)
    app.component('Flashcard', Flashcard)
    app.component('Quiz', Quiz)
  },
}
```

- [ ] **Step 3: dev 서버에서 확인**

4지선다 클릭 → 정답/오답 피드백 → 다음 문제 → 결과 표시 → 다시 풀기 동작 확인.

- [ ] **Step 4: 커밋**

```bash
git add docs/.vitepress/components/Quiz.vue docs/.vitepress/theme/index.ts
git commit -m "feat: add Quiz component with scoring and feedback"
```

---

### Task 6: 멤버 페이지 (8명)

**Files:**
- Create: `docs/members/index.md`
- Create: `docs/members/risa.md`
- Create: `docs/members/aika.md`
- Create: `docs/members/kana.md`
- Create: `docs/members/ayano.md`
- Create: `docs/members/emiru.md`
- Create: `docs/members/miyu.md`
- Create: `docs/members/nagisa.md`
- Create: `docs/members/haruka.md`

- [ ] **Step 1: 멤버 목록 페이지 작성**

`docs/members/index.md`:

```md
# CUTIE STREET 멤버

KAWAII LAB. 소속 8인조 아이돌 그룹 큐티스트리트의 멤버를 소개합니다.

<MemberCard name="Risa Furusawa" name-ja="古澤里紗" color="#FFD700" birthday="미공개" position="멤버" />
<MemberCard name="Aika Sano" name-ja="佐野愛花" color="#FF4757" birthday="미공개" position="멤버" />
<MemberCard name="Kana Itakura" name-ja="板倉可奈" color="#7FDBCA" birthday="미공개" position="멤버" />
<MemberCard name="Ayano Masuda" name-ja="増田彩乃" color="#4A90D9" birthday="미공개" position="멤버" />
<MemberCard name="Emiru Kawamoto" name-ja="川本笑瑠" color="#FF9F43" birthday="미공개" position="멤버" />
<MemberCard name="Miyu Umeda" name-ja="梅田みゆ" color="#74B9FF" birthday="미공개" position="멤버" />
<MemberCard name="Nagisa Manabe" name-ja="真鍋凪咲" color="#A06CD5" birthday="미공개" position="멤버" />
<MemberCard name="Haruka Sakuraba" name-ja="桜庭遥花" color="#FF6B9D" birthday="미공개" position="멤버" />
```

- [ ] **Step 2: 개별 멤버 페이지 작성 (8개)**

각 멤버 페이지는 동일 구조. `docs/members/risa.md` 예시:

```md
# 古澤里紗 (Risa Furusawa)

<MemberCard
  name="Risa Furusawa"
  name-ja="古澤里紗"
  color="#FFD700"
  birthday="미공개"
  position="멤버"
  :sns="{ x: 'https://x.com/CUTIE_STREET_' }"
/>

## 이름 읽기 연습

**古澤里紗** → ふるさわ りさ (후루사와 리사)

| 한자 | 읽기 | 뜻 |
|------|------|-----|
| 古 | ふる | 옛 |
| 澤 | さわ | 늪 |
| 里 | り | 마을 |
| 紗 | さ | 비단 |

> 💡 멤버 이름의 한자를 읽을 수 있으면 다른 일본어 이름도 쉬워져요!
```

나머지 7명도 동일 패턴으로 작성:
- `aika.md`: 佐野愛花 → さの あいか, color="#FF4757"
- `kana.md`: 板倉可奈 → いたくら かな, color="#7FDBCA"
- `ayano.md`: 増田彩乃 → ますだ あやの, color="#4A90D9"
- `emiru.md`: 川本笑瑠 → かわもと えみる, color="#FF9F43"
- `miyu.md`: 梅田みゆ → うめだ みゆ, color="#74B9FF"
- `nagisa.md`: 真鍋凪咲 → まなべ なぎさ, color="#A06CD5"
- `haruka.md`: 桜庭遥花 → さくらば はるか, color="#FF6B9D"

- [ ] **Step 3: dev 서버에서 확인**

멤버 목록 및 개별 페이지 렌더링, MemberCard 표시, 한자 읽기 표 확인.

- [ ] **Step 4: 커밋**

```bash
git add docs/members/
git commit -m "feat: add member profiles with kanji reading practice"
```

---

### Task 7: 디스코그래피 페이지

**Files:**
- Create: `docs/discography/index.md`
- Create: `docs/discography/kawaii-dake.md`
- Create: `docs/discography/hello-hello-mirai.md`
- Create: `docs/discography/happy-sekai.md`

- [ ] **Step 1: 디스코그래피 목록 페이지**

`docs/discography/index.md`:

```md
# 디스코그래피

CUTIE STREET의 싱글 목록입니다.

| 발매일 | 타이틀 | 링크 |
|--------|--------|------|
| 2024.09 | かわいいだけじゃだめですか？ | [상세](/custo/discography/kawaii-dake) |
| 2024.10 | Hello Hello Mirai | [상세](/custo/discography/hello-hello-mirai) |
| 2025.01 | Happy Sekai! | [상세](/custo/discography/happy-sekai) |
```

- [ ] **Step 2: 각 곡 상세 페이지 작성**

`docs/discography/kawaii-dake.md` 예시:

```md
# かわいいだけじゃだめですか？

- **발매일**: 2024년 9월
- **타입**: 싱글

## 타이틀 읽기

**かわいいだけじゃだめですか？**
카와이이 다케쟈 다메데스카?
"귀엽기만 하면 안 되나요?"

## 가사로 배우기

이 곡의 가사로 일본어를 배워보세요 → [가사 학습 페이지](/custo/japanese/lyrics/kawaii-dake)
```

`hello-hello-mirai.md`, `happy-sekai.md`도 동일 패턴.

- [ ] **Step 3: 커밋**

```bash
git add docs/discography/
git commit -m "feat: add discography pages with song details"
```

---

### Task 8: 히라가나 학습 페이지

**Files:**
- Create: `docs/japanese/beginner/hiragana.md`

- [ ] **Step 1: 히라가나 학습 페이지 작성**

`docs/japanese/beginner/hiragana.md`:

```md
# 히라가나 (ひらがな)

일본어의 기본 문자인 히라가나를 배워봅시다. 큐티스트리트 멤버 이름으로 연습해요!

## 히라가나 50음표

| | あ단 | い단 | う단 | え단 | お단 |
|---|---|---|---|---|---|
| **あ행** | あ(a) | い(i) | う(u) | え(e) | お(o) |
| **か행** | か(ka) | き(ki) | く(ku) | け(ke) | こ(ko) |
| **さ행** | さ(sa) | し(shi) | す(su) | せ(se) | そ(so) |
| **た행** | た(ta) | ち(chi) | つ(tsu) | て(te) | と(to) |
| **な행** | な(na) | に(ni) | ぬ(nu) | ね(ne) | の(no) |
| **は행** | は(ha) | ひ(hi) | ふ(fu) | へ(he) | ほ(ho) |
| **ま행** | ま(ma) | み(mi) | む(mu) | め(me) | も(mo) |
| **や행** | や(ya) | | ゆ(yu) | | よ(yo) |
| **ら행** | ら(ra) | り(ri) | る(ru) | れ(re) | ろ(ro) |
| **わ행** | わ(wa) | | | | を(wo) |
| | ん(n) | | | | |

## 큐티스트리트 멤버 이름으로 연습

<Flashcard :cards="[
  { front: 'さくらば はるか', back: '사쿠라바 하루카 (桜庭遥花 / Haruka)' },
  { front: 'うめだ みゆ', back: '우메다 미유 (梅田みゆ / Miyu)' },
  { front: 'まなべ なぎさ', back: '마나베 나기사 (真鍋凪咲 / Nagisa)' },
  { front: 'ふるさわ りさ', back: '후루사와 리사 (古澤里紗 / Risa)' },
  { front: 'さの あいか', back: '사노 아이카 (佐野愛花 / Aika)' },
  { front: 'いたくら かな', back: '이타쿠라 카나 (板倉可奈 / Kana)' },
  { front: 'ますだ あやの', back: '마스다 아야노 (増田彩乃 / Ayano)' },
  { front: 'かわもと えみる', back: '카와모토 에미루 (川本笑瑠 / Emiru)' }
]" />

## 히라가나 퀴즈

<Quiz :questions="[
  { q: '「さ」의 발음은?', options: ['sa', 'shi', 'su', 'ka'], answer: 0 },
  { q: '「は」의 발음은?', options: ['na', 'ha', 'ma', 'ra'], answer: 1 },
  { q: '멤버 이름 「みゆ」를 로마자로 쓰면?', options: ['miyo', 'miyu', 'miya', 'miyu'], answer: 1 },
  { q: '「な」가 들어가는 멤버 이름은?', options: ['さくらば', 'まなべ なぎさ', 'うめだ', 'ふるさわ'], answer: 1 },
  { q: '「つ」의 발음은?', options: ['tu', 'chu', 'tsu', 'su'], answer: 2 }
]" />
```

- [ ] **Step 2: 커밋**

```bash
git add docs/japanese/beginner/hiragana.md
git commit -m "feat: add hiragana learning page with member name practice"
```

---

### Task 9: 카타카나 학습 페이지

**Files:**
- Create: `docs/japanese/beginner/katakana.md`

- [ ] **Step 1: 카타카나 학습 페이지 작성**

`docs/japanese/beginner/katakana.md`:

```md
# 카타카나 (カタカナ)

카타카나는 외래어를 적을 때 사용해요. 아이돌 덕질에서 자주 보는 단어로 배워봅시다!

## 카타카나 50음표

| | ア단 | イ단 | ウ단 | エ단 | オ단 |
|---|---|---|---|---|---|
| **ア행** | ア(a) | イ(i) | ウ(u) | エ(e) | オ(o) |
| **カ행** | カ(ka) | キ(ki) | ク(ku) | ケ(ke) | コ(ko) |
| **サ행** | サ(sa) | シ(shi) | ス(su) | セ(se) | ソ(so) |
| **タ행** | タ(ta) | チ(chi) | ツ(tsu) | テ(te) | ト(to) |
| **ナ행** | ナ(na) | ニ(ni) | ヌ(nu) | ネ(ne) | ノ(no) |
| **ハ행** | ハ(ha) | ヒ(hi) | フ(fu) | ヘ(he) | ホ(ho) |
| **マ행** | マ(ma) | ミ(mi) | ム(mu) | メ(me) | モ(mo) |
| **ヤ행** | ヤ(ya) | | ユ(yu) | | ヨ(yo) |
| **ラ행** | ラ(ra) | リ(ri) | ル(ru) | レ(re) | ロ(ro) |
| **ワ행** | ワ(wa) | | | | ヲ(wo) |
| | ン(n) | | | | |

## 아이돌 용어로 카타카나 연습

<Flashcard :cards="[
  { front: 'ライブ', back: '라이브 (live) - 공연' },
  { front: 'チェキ', back: '체키 (cheki) - 폴라로이드 사진' },
  { front: 'グッズ', back: '굿즈 (goods) - 상품/굿즈' },
  { front: 'ペンライト', back: '펜라이트 (penlight) - 응원봉' },
  { front: 'アイドル', back: '아이도루 (idol) - 아이돌' },
  { front: 'ファン', back: '팬 (fan) - 팬' },
  { front: 'コンサート', back: '콘사토 (concert) - 콘서트' },
  { front: 'メンバー', back: '멤바 (member) - 멤버' },
  { front: 'キューティーストリート', back: '큐티 스트리트 (Cutie Street)!' },
  { front: 'カワイイ', back: '카와이이 (kawaii) - 귀여운' }
]" />

## 카타카나 퀴즈

<Quiz :questions="[
  { q: '「ライブ」의 뜻은?', options: ['앨범', '공연', '팬미팅', '굿즈'], answer: 1 },
  { q: '「チェキ」는 무엇인가요?', options: ['콘서트', '응원봉', '폴라로이드 사진', '사인'], answer: 2 },
  { q: '큐티스트리트를 카타카나로 쓰면?', options: ['クティストリト', 'キューティーストリート', 'クーティストリート', 'キュティストリト'], answer: 1 },
  { q: '「グッズ」의 뜻은?', options: ['그룹', '굿즈/상품', '공연장', '노래'], answer: 1 },
  { q: '「ペンライト」는 뭘까요?', options: ['펜', '라이터', '응원봉', '볼펜'], answer: 2 }
]" />
```

- [ ] **Step 2: 커밋**

```bash
git add docs/japanese/beginner/katakana.md
git commit -m "feat: add katakana learning page with idol vocabulary"
```

---

### Task 10: 기초 표현 학습 페이지

**Files:**
- Create: `docs/japanese/beginner/basics.md`

- [ ] **Step 1: 기초 표현 페이지 작성**

`docs/japanese/beginner/basics.md`:

```md
# 기초 표현

덕질에 바로 쓸 수 있는 기초 일본어 표현을 배워봅시다!

## 인사

| 일본어 | 발음 | 뜻 |
|--------|------|-----|
| こんにちは | 콘니치와 | 안녕하세요 |
| おはようございます | 오하요 고자이마스 | 좋은 아침이에요 |
| おやすみなさい | 오야스미나사이 | 잘 자요 |
| はじめまして | 하지메마시테 | 처음 뵙겠습니다 |
| よろしくお願いします | 요로시쿠 오네가이시마스 | 잘 부탁드립니다 |
| ありがとうございます | 아리가토 고자이마스 | 감사합니다 |
| お疲れ様です | 오츠카레사마데스 | 수고하셨습니다 |

## 숫자

| 숫자 | 일본어 | 발음 |
|------|--------|------|
| 1 | いち | 이치 |
| 2 | に | 니 |
| 3 | さん | 산 |
| 4 | よん/し | 욘/시 |
| 5 | ご | 고 |
| 6 | ろく | 로쿠 |
| 7 | なな/しち | 나나/시치 |
| 8 | はち | 하치 |
| 9 | きゅう/く | 큐/쿠 |
| 10 | じゅう | 쥬 |

> 💡 큐티스트리트는 **8**(はち)인조! 멤버 수를 일본어로 말해보세요.

## 자기소개

```
わたしは [이름] です。
(와타시와 [이름] 데스.)
저는 [이름]입니다.

キューティーストリートが好きです。
(큐티스트리트가 스키데스.)
큐티스트리트를 좋아합니다.

[멤버이름] 推しです。
([멤버이름] 오시데스.)
[멤버이름]이 최애입니다.
```

## 기초 표현 퀴즈

<Quiz :questions="[
  { q: '「ありがとうございます」의 뜻은?', options: ['안녕하세요', '감사합니다', '잘 부탁해요', '수고하셨어요'], answer: 1 },
  { q: '큐티스트리트 멤버는 몇 명? 일본어로?', options: ['ろく (6)', 'なな (7)', 'はち (8)', 'きゅう (9)'], answer: 2 },
  { q: '「推し」(오시)의 뜻은?', options: ['노래', '춤', '최애', '팬'], answer: 2 },
  { q: '「好きです」의 뜻은?', options: ['싫어요', '좋아해요', '모르겠어요', '알겠어요'], answer: 1 }
]" />
```

- [ ] **Step 2: 커밋**

```bash
git add docs/japanese/beginner/basics.md
git commit -m "feat: add basic Japanese expressions page"
```

---

### Task 11: 덕질 일본어 - 현장 용어

**Files:**
- Create: `docs/japanese/idol-japanese/live-terms.md`

- [ ] **Step 1: 현장 용어 페이지 작성**

`docs/japanese/idol-japanese/live-terms.md`:

```md
# 현장 용어 (ライブ用語)

라이브, 특전회, 물판 등 현장에서 꼭 알아야 할 일본어!

## 라이브 관련

| 일본어 | 읽기 | 뜻 | 설명 |
|--------|------|-----|------|
| ライブ | 라이브 | 라이브/공연 | 콘서트 |
| 対バン | 타이반 | 대반 | 여러 그룹이 함께하는 공연 |
| ワンマン | 완만 | 원맨 | 단독 공연 |
| セトリ | 세토리 | 셋리스트 | 공연 곡 순서 |
| アンコール | 앙코루 | 앙코르 | 앙코르 |
| MC | 엠시 | MC | 공연 중 토크 |

## 응원 관련

| 일본어 | 읽기 | 뜻 | 설명 |
|--------|------|-----|------|
| コール | 코루 | 콜 | 정해진 구호 |
| MIX | 믹스 | 믹스 | 곡 전주에 외치는 구호 |
| ケチャ | 케챠 | 케차 | 두 손을 뻗는 응원 동작 |
| サイリウム | 사이리우무 | 사이리움 | 야광봉 |
| 推しジャン | 오시쟌 | 오시점프 | 최애 파트에서 점프 |

## 특전회/물판

| 일본어 | 읽기 | 뜻 | 설명 |
|--------|------|-----|------|
| 特典会 | 토쿠텐카이 | 특전회 | 공연 후 팬 교류 이벤트 |
| チェキ | 체키 | 체키 | 폴라로이드 촬영 |
| 物販 | 붓판 | 물판 | 굿즈 판매 |
| サイン | 사인 | 사인 | 사인 |
| お見送り | 오미오쿠리 | 배웅 | 공연 끝나고 멤버가 팬 배웅 |

## 퀴즈

<Quiz :questions="[
  { q: '단독 공연을 일본어로?', options: ['対バン', 'ワンマン', 'アンコール', 'MC'], answer: 1 },
  { q: '「物販」(붓판)의 뜻은?', options: ['물건 버리기', '굿즈 판매', '물 배급', '팬미팅'], answer: 1 },
  { q: '폴라로이드 촬영을 뜻하는 단어는?', options: ['サイン', 'チェキ', 'グッズ', 'ケチャ'], answer: 1 },
  { q: '공연 곡 순서를 뜻하는 「セトリ」는 무엇의 줄임말?', options: ['세트리스트', '셋리스트', '세토리스트', '셋트리스트'], answer: 0 },
  { q: '최애 파트에서 점프하는 것을 뜻하는 단어는?', options: ['ケチャ', 'コール', '推しジャン', 'MIX'], answer: 2 }
]" />
```

- [ ] **Step 2: 커밋**

```bash
git add docs/japanese/idol-japanese/live-terms.md
git commit -m "feat: add live venue terminology page"
```

---

### Task 12: 덕질 일본어 - SNS 일본어

**Files:**
- Create: `docs/japanese/idol-japanese/sns-japanese.md`

- [ ] **Step 1: SNS 일본어 페이지 작성**

`docs/japanese/idol-japanese/sns-japanese.md`:

```md
# SNS 일본어

트위터, 인스타에서 큐티스트리트를 팔로우할 때 알아두면 좋은 표현!

## 자주 보는 SNS 표현

| 일본어 | 읽기 | 뜻 |
|--------|------|-----|
| お知らせ | 오시라세 | 공지/알림 |
| 本日 | 혼지츠 | 오늘 |
| 明日 | 아시타 | 내일 |
| 出演 | 슈츠엔 | 출연 |
| 開催 | 카이사이 | 개최 |
| 詳細 | 쇼사이 | 상세/자세히 |
| よろしくお願いします | 요로시쿠 오네가이시마스 | 잘 부탁드립니다 |
| 楽しかった | 타노시캇타 | 즐거웠다 |
| ありがとう | 아리가토 | 고마워 |
| 会いに来てね | 아이니 키테네 | 만나러 와줘 |

## 해시태그 읽기

| 해시태그 | 읽기 | 뜻 |
|----------|------|-----|
| #キューティーストリート | 큐티스트리트 | 그룹명 |
| #かわいい | 카와이이 | 귀여운 |
| #今日のセトリ | 쿄노 세토리 | 오늘의 셋리스트 |
| #ライブ | 라이브 | 라이브 |
| #新曲 | 싱쿄쿠 | 신곡 |
| #推し | 오시 | 최애 |

## SNS 일본어 퀴즈

<Quiz :questions="[
  { q: '「お知らせ」의 뜻은?', options: ['인사', '공지/알림', '감사', '사과'], answer: 1 },
  { q: '「会いに来てね」는 무슨 뜻?', options: ['다음에 봐', '만나러 와줘', '잘 가', '조심해'], answer: 1 },
  { q: '「新曲」의 뜻은?', options: ['옛날 노래', '인기곡', '신곡', '타이틀곡'], answer: 2 },
  { q: '「楽しかった」는?', options: ['힘들었다', '슬펐다', '즐거웠다', '무서웠다'], answer: 2 }
]" />
```

- [ ] **Step 2: 커밋**

```bash
git add docs/japanese/idol-japanese/sns-japanese.md
git commit -m "feat: add SNS Japanese expressions page"
```

---

### Task 13: 덕질 일본어 - 팬레터 쓰기

**Files:**
- Create: `docs/japanese/idol-japanese/fan-letter.md`

- [ ] **Step 1: 팬레터 쓰기 페이지 작성**

`docs/japanese/idol-japanese/fan-letter.md`:

```md
# 팬레터 쓰기 (ファンレター)

큐티스트리트 멤버에게 일본어로 팬레터를 써봅시다!

## 기본 구조

일본어 팬레터는 보통 이런 순서로 씁니다:

1. **인사** (あいさつ)
2. **자기소개** (自己紹介)
3. **하고 싶은 말** (伝えたいこと)
4. **마무리** (終わり)

## 인사 표현

| 일본어 | 뜻 | 사용 상황 |
|--------|-----|----------|
| はじめまして | 처음 뵙겠습니다 | 첫 편지 |
| いつも応援しています | 항상 응원하고 있어요 | 일반적 |
| ○○ちゃんへ | ○○에게 | 편지 시작 |

## 자기소개 예문

```
韓国からいつも応援しています。
(한코쿠카라 이츠모 오엔시테이마스.)
한국에서 항상 응원하고 있어요.

○○ちゃんのことが大好きです。
(○○짱노 코토가 다이스키데스.)
○○를 정말 좋아해요.
```

## 칭찬 표현

| 일본어 | 뜻 |
|--------|-----|
| ダンスがかっこいいです | 춤이 멋져요 |
| 歌が上手ですね | 노래를 잘하시네요 |
| 笑顔が素敵です | 미소가 멋져요 |
| いつも元気をもらっています | 항상 힘을 받고 있어요 |
| かわいいです | 귀여워요 |

## 마무리 표현

| 일본어 | 뜻 |
|--------|-----|
| これからも応援しています | 앞으로도 응원할게요 |
| 体に気をつけてください | 몸 건강 조심하세요 |
| 大好きです | 정말 좋아해요 |
| ライブ楽しみにしています | 라이브 기대하고 있어요 |

## 팬레터 전체 예문

```
桜庭遥花ちゃんへ

はじめまして。韓国から応援しているファンです。
キューティーストリートのことが大好きです。

遥花ちゃんの笑顔がとても素敵で、
いつも元気をもらっています。

「かわいいだけじゃだめですか？」を
毎日聞いています。本当にかわいい曲ですね！

これからもずっと応援しています。
体に気をつけてくださいね。

大好きです！
```

> 💡 **주의**: 일본 아이돌 팬레터에는 주소나 개인정보를 적지 않아요!

## 퀴즈

<Quiz :questions="[
  { q: '「応援しています」의 뜻은?', options: ['사랑해요', '응원하고 있어요', '기다리고 있어요', '보고 있어요'], answer: 1 },
  { q: '편지 시작에 쓰는 「はじめまして」는?', options: ['오랜만이에요', '처음 뵙겠습니다', '안녕하세요', '또 만났네요'], answer: 1 },
  { q: '「体に気をつけてください」의 뜻은?', options: ['열심히 하세요', '몸 건강 조심하세요', '파이팅하세요', '조심히 가세요'], answer: 1 },
  { q: '「大好きです」는?', options: ['정말 좋아해요', '처음 뵙겠습니다', '감사합니다', '잘 부탁해요'], answer: 0 }
]" />
```

- [ ] **Step 2: 커밋**

```bash
git add docs/japanese/idol-japanese/fan-letter.md
git commit -m "feat: add fan letter writing guide"
```

---

### Task 14: 가사 학습 페이지 (3곡)

**Files:**
- Create: `docs/japanese/lyrics/kawaii-dake.md`
- Create: `docs/japanese/lyrics/hello-hello-mirai.md`
- Create: `docs/japanese/lyrics/happy-sekai.md`

- [ ] **Step 1: かわいいだけじゃだめですか？ 가사 학습**

`docs/japanese/lyrics/kawaii-dake.md`:

```md
# かわいいだけじゃだめですか？ - 가사로 배우기

큐티스트리트의 데뷔곡으로 일본어를 배워봅시다!

## 타이틀 분석

| 단어 | 읽기 | 뜻 |
|------|------|-----|
| かわいい | 카와이이 | 귀여운 |
| だけ | 다케 | ~만, ~뿐 |
| じゃ | 쟈 | ~에서는 (구어체) |
| だめ | 다메 | 안 돼 |
| ですか | 데스카 | ~인가요? (정중) |

**전체 해석**: "귀엽기만 하면 안 되나요?"

## 핵심 문법

### ～だけじゃだめですか (～만으로는 안 되나요?)

- **だけ**: ~만, ~뿐
- **じゃ**: では의 구어체 (~ 에서는)
- **だめ**: 안 돼

> 예문: 好きなだけじゃだめですか？(좋아하기만 하면 안 되나요?)

### ～ですか (정중한 의문문)

평서문 뒤에 **ですか**를 붙이면 정중한 질문이 됩니다.

| 평서문 | 의문문 |
|--------|--------|
| かわいいです (귀여워요) | かわいいですか？(귀여운가요?) |
| 好きです (좋아해요) | 好きですか？(좋아하나요?) |

## 가사 퀴즈

<Quiz :questions="[
  { q: '「かわいい」의 뜻은?', options: ['멋진', '귀여운', '슬픈', '즐거운'], answer: 1 },
  { q: '「だけ」의 뜻은?', options: ['많이', '조금', '~만/~뿐', '전부'], answer: 2 },
  { q: '「だめ」의 뜻은?', options: ['좋아', '안 돼', '맞아', '몰라'], answer: 1 },
  { q: '「ですか」를 붙이면?', options: ['명령문', '감탄문', '의문문', '부정문'], answer: 2 }
]" />
```

- [ ] **Step 2: Hello Hello Mirai 가사 학습**

`docs/japanese/lyrics/hello-hello-mirai.md`:

```md
# Hello Hello Mirai - 가사로 배우기

큐티스트리트의 두 번째 싱글로 일본어를 배워봅시다!

## 타이틀 분석

| 단어 | 읽기 | 뜻 |
|------|------|-----|
| Hello | 헬로 | 안녕 (영어) |
| 未来 (Mirai) | 미라이 | 미래 |

**전체 해석**: "안녕 안녕 미래야"

## 핵심 단어

| 일본어 | 읽기 | 뜻 |
|--------|------|-----|
| 未来 | 미라이 | 미래 |
| 夢 | 유메 | 꿈 |
| 希望 | 키보 | 희망 |
| 明日 | 아시타 | 내일 |
| 一緒に | 잇쇼니 | 함께 |

## 핵심 문법

### ～に向かって (～을 향해서)

- **未来に向かって** = 미래를 향해서
- **夢に向かって** = 꿈을 향해서

> 💡 「に向かって」는 방향을 나타내는 표현이에요!

## 가사 퀴즈

<Quiz :questions="[
  { q: '「未来」(미라이)의 뜻은?', options: ['과거', '현재', '미래', '영원'], answer: 2 },
  { q: '「夢」(유메)의 뜻은?', options: ['꿈', '별', '하늘', '바다'], answer: 0 },
  { q: '「一緒に」의 뜻은?', options: ['혼자서', '함께', '가끔', '항상'], answer: 1 },
  { q: '「明日」의 읽기는?', options: ['きょう', 'あした', 'きのう', 'いま'], answer: 1 }
]" />
```

- [ ] **Step 3: Happy Sekai! 가사 학습**

`docs/japanese/lyrics/happy-sekai.md`:

```md
# Happy Sekai! - 가사로 배우기

큐티스트리트의 세 번째 싱글로 일본어를 배워봅시다!

## 타이틀 분석

| 단어 | 읽기 | 뜻 |
|------|------|-----|
| Happy | 해피 | 행복한 (영어) |
| 世界 (Sekai) | 세카이 | 세계 |

**전체 해석**: "행복한 세계!"

## 핵심 단어

| 일본어 | 읽기 | 뜻 |
|--------|------|-----|
| 世界 | 세카이 | 세계 |
| 幸せ | 시아와세 | 행복 |
| 笑顔 | 에가오 | 미소 |
| みんな | 민나 | 모두/다 같이 |
| 届ける | 토도케루 | 전하다/닿게 하다 |

## 핵심 문법

### ～を届けたい (～를 전하고 싶다)

- **幸せを届けたい** = 행복을 전하고 싶다
- **笑顔を届けたい** = 미소를 전하고 싶다

> 💡 「～たい」는 "~하고 싶다"는 희망 표현이에요!

| 동사 | ～たい형 | 뜻 |
|------|---------|-----|
| 届ける | 届けたい | 전하고 싶다 |
| 歌う | 歌いたい | 노래하고 싶다 |
| 会う | 会いたい | 만나고 싶다 |
| 行く | 行きたい | 가고 싶다 |

## 가사 퀴즈

<Quiz :questions="[
  { q: '「世界」(세카이)의 뜻은?', options: ['나라', '도시', '세계', '우주'], answer: 2 },
  { q: '「笑顔」(에가오)의 뜻은?', options: ['눈물', '미소', '목소리', '마음'], answer: 1 },
  { q: '「～たい」는 어떤 의미?', options: ['~해야 한다', '~하고 싶다', '~할 수 있다', '~하면 안 된다'], answer: 1 },
  { q: '「会いたい」의 뜻은?', options: ['가고 싶다', '먹고 싶다', '만나고 싶다', '보고 싶다'], answer: 2 }
]" />
```

- [ ] **Step 4: 커밋**

```bash
git add docs/japanese/lyrics/
git commit -m "feat: add lyrics-based Japanese learning pages for 3 songs"
```

---

### Task 15: 스케줄 페이지

**Files:**
- Create: `docs/schedule/index.md`

- [ ] **Step 1: 스케줄 페이지 작성**

`docs/schedule/index.md`:

```md
# 스케줄

CUTIE STREET의 활동 일정입니다.

> 💡 공식 X([@CUTIE_STREET_](https://x.com/CUTIE_STREET_))에서 최신 일정을 확인하세요!

## 2025

| 날짜 | 이벤트 | 장소 | 비고 |
|------|--------|------|------|
| - | 업데이트 예정 | - | - |

## 과거 일정

| 날짜 | 이벤트 | 장소 | 비고 |
|------|--------|------|------|
| 2025.01 | Happy Sekai! 발매 | - | 3rd 싱글 |
| 2024.10 | Hello Hello Mirai 발매 | - | 2nd 싱글 |
| 2024.09 | かわいいだけじゃだめですか？ 발매 | - | 데뷔 싱글 |

## 일정 관련 일본어

| 일본어 | 읽기 | 뜻 |
|--------|------|-----|
| 公演 | 코엔 | 공연 |
| 開場 | 카이조 | 개장 |
| 開演 | 카이엔 | 개연 |
| 整理番号 | 세이리방고 | 정리번호 |
| 全席指定 | 젠세키시테이 | 전석 지정 |
| 当日券 | 토지츠켄 | 당일권 |
```

- [ ] **Step 2: 커밋**

```bash
git add docs/schedule/
git commit -m "feat: add schedule page with venue Japanese terms"
```

---

### Task 16: GitHub Actions 배포 설정

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 배포 워크플로우 작성**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 커밋**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deployment workflow"
```

---

### Task 17: 최종 빌드 확인 및 push

- [ ] **Step 1: 로컬 빌드 테스트**

```bash
npm run docs:build
```

Expected: `docs/.vitepress/dist/` 에 정적 파일 생성, 에러 없음

- [ ] **Step 2: 로컬 프리뷰**

```bash
npm run docs:preview
```

Expected: `http://localhost:4173/custo/` 에서 전체 사이트 동작 확인

- [ ] **Step 3: 전체 확인 체크리스트**

- 홈페이지 히어로, 기능 카드 표시
- 네비게이션 (상단 nav, 사이드바) 동작
- 멤버 카드 렌더링 + 멤버 컬러 표시
- 플래시카드 플립 + 이전/다음 네비게이션
- 퀴즈 선택 → 정답/오답 → 점수 표시
- 모든 링크 연결 (디스코 → 가사 학습 등)
- 커스텀 테마 (핑크-라벤더 그라데이션, 크림 배경, 폰트)

- [ ] **Step 4: push**

```bash
git push origin main
```

Expected: GitHub Actions 트리거, GitHub Pages 배포 완료 후 `https://notwonjang.github.io/custo/` 접속 가능
