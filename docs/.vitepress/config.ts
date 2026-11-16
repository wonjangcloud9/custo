import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Custo',
  description: 'CUTIE STREET(큐티스트리트) 비공식 팬허브 — 멤버 프로필, 레전드 컷, 공식 영상 아카이브, 스케줄, 정상까지의 여정, 덕질 일본어.',
  base: '/custo/',
  lang: 'ko',
  appearance: false,
  srcExclude: ['superpowers/**'],
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/custo/favicon.svg' }],
    ['link', { rel: 'manifest', href: '/custo/manifest.webmanifest' }],
    ['link', { rel: 'apple-touch-icon', href: '/custo/apple-touch-icon.png' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'Custo' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&family=Zen+Maru+Gothic:wght@500;700&display=swap', rel: 'stylesheet' }],
    ['meta', { name: 'keywords', content: '큐티스트리트, 큐스트, CUTIE STREET, キューティーストリート, きゅーすと, KAWAII LAB, 팬사이트, 멤버, 스케줄, MV, 紅白, 덕질 일본어' }],
    ['meta', { name: 'theme-color', content: '#FF6B9D' }],
    ['meta', { name: 'author', content: 'Custo' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Custo · CUTIE STREET Fan Hub' }],
    ['meta', { property: 'og:image', content: 'https://wonjangcloud9.github.io/custo/og.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'CUTIE STREET 팬허브 — 귀여움으로 세계까지' }],
    ['meta', { property: 'og:locale', content: 'ko_KR' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://wonjangcloud9.github.io/custo/og.png' }],
  ],
  sitemap: { hostname: 'https://wonjangcloud9.github.io/custo/' },
  transformHead({ pageData, siteData }) {
    const title = pageData.frontmatter.titleTemplate
      ? `${pageData.title} | ${pageData.frontmatter.titleTemplate}`
      : pageData.title ? `${pageData.title} | ${siteData.title}` : siteData.title
    const desc = pageData.frontmatter.description || pageData.description || siteData.description
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = `https://wonjangcloud9.github.io/custo/${path}`
    return [
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: desc }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: desc }],
      ['link', { rel: 'canonical', href: url }],
    ]
  },
  themeConfig: {
    nav: [
      { text: '홈', link: '/' },
      { text: '소개', link: '/about' },
      { text: '여정 🗻', link: '/journey/' },
      { text: '紅白 🎍', link: '/kohaku/' },
      { text: '멤버', link: '/members/' },
      { text: '디스코그래피', link: '/discography/' },
      {
        text: '일본어 배우기',
        items: [
          { text: '초급', link: '/japanese/beginner/hiragana' },
          { text: '덕질 일본어', link: '/japanese/idol-japanese/live-terms' },
          { text: '가사로 배우기', link: '/japanese/lyrics/kawaii-dake' },
          { text: '종합 테스트', link: '/japanese/test' },
          { text: '용어 사전', link: '/japanese/dictionary' },
          { text: '나의 학습', link: '/japanese/my-progress' },
        ],
      },
      { text: '영상', link: '/videos/' },
      { text: '레전드 무대', link: '/stages/' },
      {
        text: '스케줄',
        items: [
          { text: '스케줄 · 카운트다운', link: '/schedule/' },
          { text: '공식 소식 (한국어 요약)', link: '/news/' },
          { text: '라이브 가이드 · 펜라이트', link: '/live-guide/' },
        ],
      },
    ],
    sidebar: {
      '/members/': [
        {
          text: '멤버',
          items: [
            { text: '전체 멤버', link: '/members/' },
            { text: '후루사와 (古澤)', link: '/members/risa' },
            { text: '사노 (佐野)', link: '/members/aika' },
            { text: '이타쿠라 (板倉)', link: '/members/kana' },
            { text: '마스다 (増田)', link: '/members/ayano' },
            { text: '카와모토 (川本)', link: '/members/emiru' },
            { text: '우메다 (梅田)', link: '/members/miyu' },
            { text: '마나베 (真鍋)', link: '/members/nagisa' },
            { text: '사쿠라바 (桜庭)', link: '/members/haruka' },
            { text: '💞 유닛 & 케미', link: '/units/' },
            { text: '🔮 나와 닮은 멤버', link: '/which-member/' },
            { text: '♡ 나의 앨범', link: '/likes/' },
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
            { text: '일본어 입력', link: '/japanese/beginner/typing' },
            { text: '자주 틀리는 표현', link: '/japanese/beginner/common-mistakes' },
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
            { text: '정중한 표현', link: '/japanese/idol-japanese/polite-speech' },
            { text: '오노마토페', link: '/japanese/idol-japanese/onomatopoeia' },
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
            { text: '💿 CUTIE LAND 특집', link: '/cutie-land/' },
            { text: 'かわいいだけじゃだめですか？', link: '/discography/kawaii-dake' },
            { text: 'Hello Hello Mirai', link: '/discography/hello-hello-mirai' },
            { text: 'Happy Sekai!', link: '/discography/happy-sekai' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'x', link: 'https://x.com/CUTIE_STREET_' },
      { icon: 'instagram', link: 'https://www.instagram.com/cutie_street_/' },
      { icon: 'youtube', link: 'https://www.youtube.com/@CUTIE_STREET' },
    ],
    footer: {
      message: '귀여움으로 세계까지 — CUTIE STREET 비공식 팬허브 · 영상·이미지 저작권은 각 권리자(ASOBISYSTEM / KAWAII LAB.)에 있습니다',
      copyright: 'Fan-made project. CUTIE STREET is managed by ASOBISYSTEM / KAWAII LAB.',
    },
    docFooter: {
      prev: '이전 학습',
      next: '다음 학습',
    },
  },
})
