import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Custo',
  description: '큐티스트리트와 함께하는 일본어 학습',
  base: '/custo/',
  lang: 'ko',
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Zen+Maru+Gothic:wght@400;700&display=swap', rel: 'stylesheet' }],
    ['meta', { name: 'keywords', content: '큐티스트리트, CUTIE STREET, 일본어, 일본어 학습, 아이돌, 덕질 일본어, 히라가나, 카타카나, KAWAII LAB, キューティーストリート' }],
    ['meta', { name: 'author', content: 'Custo' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Custo - 큐티스트리트와 함께하는 일본어' }],
    ['meta', { property: 'og:description', content: '큐티스트리트(CUTIE STREET) 팬을 위한 일본어 학습 사이트. 멤버 이름으로 히라가나를, 가사로 문법을, 덕질하면서 일본어를 배워보세요!' }],
    ['meta', { property: 'og:url', content: 'https://wonjangcloud9.github.io/custo/' }],
    ['meta', { property: 'og:locale', content: 'ko_KR' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Custo - 큐티스트리트와 함께하는 일본어' }],
    ['meta', { name: 'twitter:description', content: '큐티스트리트 팬을 위한 일본어 학습 사이트' }],
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
            { text: '조사', link: '/japanese/beginner/particles' },
            { text: '동사 활용', link: '/japanese/beginner/verbs' },
            { text: '형용사', link: '/japanese/beginner/adjectives' },
            { text: '숫자/날짜/시간', link: '/japanese/beginner/numbers' },
            { text: '문장 만들기', link: '/japanese/beginner/sentences' },
            { text: '조수사', link: '/japanese/beginner/counters' },
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
            { text: '현장 회화', link: '/japanese/idol-japanese/conversations' },
            { text: 'SNS 읽기 연습', link: '/japanese/idol-japanese/reading-practice' },
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
