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
