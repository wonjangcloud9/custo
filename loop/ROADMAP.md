# CUTIE STREET Fan Hub — Overnight Loop Roadmap

> Read this file FIRST every iteration. Update it LAST every iteration.

## Mission (user's words, translated)
Make `custo` the biggest, most complete fan-made CUTIE STREET fan page (KR + JP audience).
Motto = CUTIE STREET's motto: **"귀여움으로 세계까지" (Kawaii to the world)**.
- Designer-grade, extremely detailed UI. Use the **mobbin MCP** (`mcp__mobbin__search_screens / search_sections / search_flows`) for reference patterns.
- Lovely, *non-cliché* animation — things people are newly trying on the modern web
  (View Transitions API, CSS scroll-driven animations `animation-timeline: view()/scroll()`,
  `@property` animated gradients, spring/physics micro-interactions, `:has()` driven states,
  container queries, sticker/peel effects, magnetic cursor, marquee kinetic type, bento grids,
  glass/holo foil cards with pointer-tilt, confetti on interaction, etc.).
- Every member gets a **dedicated, color-themed page**: photos/official media, videos, hobbies, age, height,
  hometown, nickname, member color, SNS, fun facts, etc. Each page styled in that member's color.
- Link ALL relevant YouTube videos (MVs, dance practice, live, variety). Schedule. Everything a fan page needs.
- Work by **RICE** (Reach × Impact × Confidence ÷ Effort). When the backlog runs dry, research again and refill.

## Hard rules
1. **Facts must be verified** with WebSearch/WebFetch (official site cutiestreet.asobisystem.com, official X/IG/YouTube, Wikipedia JA, reputable news). Never invent birthdays/heights/video IDs/dates. If unverified → omit or mark "확인 중".
   YouTube video IDs must be verified (e.g. WebFetch `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=ID&format=json` returns 200).
2. **Images**: do NOT download/commit copyrighted member photos into the repo, and do NOT AI-generate likenesses of the real members. Use official embeds (YouTube iframes / `i.ytimg.com` thumbnails), links to official profile pages, and original illustrated/graphic UI (SVG, gradients, member-color art).
3. Keep the existing Japanese-learning features working (they're the site's origin); evolve the site into a fan hub *around* them.
4. Each iteration must end with `npm run docs:build` passing AND a Playwright visual check (desktop 1440 + mobile 390) of changed pages via `npm run docs:preview` (port 4173, base `/custo/`). No console errors. Respect `prefers-reduced-motion`.
5. Commit on branch **`fanpage-overhaul`** only (never push, never touch `main`). One focused commit per iteration, conventional message, with the Co-Authored-By trailer.
6. Iteration scope: pick the top 1–3 RICE items that fit ~20 min. Small and shipped > big and broken.
7. Keep the site Korean-first UI, with Japanese names/terms alongside.

## Project facts
- VitePress 1.6.4, Vue 3 SFCs in `docs/.vitepress/components/`, theme `docs/.vitepress/theme/{index.ts,style.css}`, config `docs/.vitepress/config.ts`, `base: '/custo/'`, `appearance: false` (light only).
- Members (8): risa 古澤里紗, aika 佐野愛花, kana 板倉可奈, ayano 増田彩乃, emiru 川本笑瑠, miyu 梅田みゆ, nagisa 真鍋凪咲, haruka 桜庭遥花 → `docs/members/*.md` (verify all data again).
- Deploy: GitHub Actions on push to main → GitHub Pages (we don't push).

## RICE Backlog
Score = R(1–10) × I(0.25/0.5/1/2/3) × C(0.5/0.8/1) ÷ E(person-iterations). Keep sorted, highest first.

| # | Item | R | I | C | E | Score | Status |
|---|------|---|---|---|---|-------|--------|
| 1 | 영상 아카이브 `/videos/` (공식 채널 261개, 카테고리·멤버 필터, 검색, 모달 플레이어, 시청기록, 랜덤재생, URL 공유) | 10 | 3 | 1 | 1 | 30 | ✅ Done #1 |
| 2 | 버그: IG 그룹 링크 `cutie_street`→`cutie_street_`, favicon 404 | 8 | 0.5 | 1 | 0.1 | 40 | ✅ Done #1 |
| 3 | 멤버 데이터 단일화: 8개 멤버 페이지·MemberCard를 `data/members.ts`로 통일 (아야노 156→157cm 불일치, 공식 SNS X/IG/TikTok 링크 추가, 나이 자동계산) | 9 | 2 | 1 | 1 | 18 | ✅ Done #2 |
| 4 | 멤버 전용 페이지 리디자인: 멤버 컬러 히어로(키네틱 이름, 홀로 포일 프로필 카드 pointer-tilt), 프로필 bento(나이·키·출신 지도 핀·생일 D-day·유닛), 해당 멤버 영상 레일(videos.json 필터), SNS 버튼 | 10 | 3 | 0.8 | 2 | 12 | ✅ Done #2 (hero·holo card·bento·height ruler·video rail·prev/next; members index grid) |
| 5 | 홈 리뉴얼: "귀여움으로 세계까지" 키네틱 히어로, 다음 일정 카운트다운(紅白 12/31, CUTIE LAND 12/2), 최신 영상 레일, 8색 멤버 스트립, 학습 섹션은 하단으로 | 10 | 3 | 0.8 | 2 | 12 | ✅ Done #3 |
| 6 | 스케줄 페이지 갱신: ARENA TOUR 2026 AUTUMN 13공연(IG아레나 11/28-29 피날레), 11/19 모니터링, 11/20 사인회·さんまのまんま, 11/23 삿포로 팬이벤트, 12/2 앨범, 12/31 紅白 — 타임라인 UI + .ics 내보내기 | 9 | 2 | 1 | 1.5 | 12 | Todo |
| 7 | 디스코그래피 확장: 3 CD싱글 + 디지털 싱글 전곡 + 1st album CUTIE LAND, 곡별 관련 영상(안무/FOCUS/라이브) 자동 연결 | 8 | 2 | 0.8 | 1.5 | 8.5 | Todo |
| 8 | 타임라인/연혁 페이지 `/history/` (2024 결성→TIF 데뷔→레코드대상 신인상→武道館→아레나→紅白), 수상 목록, scroll-driven 진행 라인 | 7 | 2 | 1 | 1.5 | 9.3 | Todo |
| 9 | 영상 길이 정확도: 스크랩한 "22분" 반올림 → 썸네일 오버레이(22:21)로 재수집, 오래된 영상(데뷔 MV 등) 추가 수집 | 7 | 1 | 1 | 0.5 | 14 | Todo |
| 10 | 유닛 페이지: 2026 신유닛(どんどんどん！ 리사·아이카·미유 / 君なんだ 에미루·아야노·카나 / おやすみサイレンナイト 하루카·나기사), Cotton Candy 등 | 7 | 1 | 0.8 | 1 | 5.6 | Todo |
| 11 | 생일 캘린더 + 오늘의 멤버(생일 D-day, 생탄제 영상 링크) | 7 | 1 | 1 | 1 | 7 | Todo |
| 12 | 전역 커서/마이크로 인터랙션: 멤버 컬러 스파클 트레일(포인터), 페이지 전환 View Transition, 스티커 peel 배지 | 8 | 1 | 0.8 | 1 | 6.4 | Todo |
| 13 | i18n: 일본어 UI 토글(일본 팬 대상) — 주요 페이지 제목/라벨 | 6 | 2 | 0.5 | 3 | 2 | Todo |
| 14 | OG 이미지/SEO 업데이트(팬허브 포지셔닝), sitemap | 6 | 1 | 1 | 0.5 | 12 | Todo |
| 15 | 멤버 특기/취미/닉네임 재검증 (기존 사이트 데이터 → 공식 Q&A/위키 대조), 멤버별 대표 무대 영상 큐레이션 | 7 | 1 | 0.8 | 1 | 5.6 | Todo |
| 17 | 버그: 전역 표 테두리가 내용보다 넓게 늘어남 → `width: fit-content` | 8 | 0.5 | 1 | 0.1 | 40 | ✅ Done #3 |
| 18 | 홈 카운트다운 이벤트를 `data/events.ts`로 분리 → 스케줄 페이지와 공유 (#6과 함께) | 7 | 0.5 | 1 | 0.3 | 11.7 | Todo |
| 16 | 멤버 페이지 본문(매력/이력/이름읽기/퀴즈)도 멤버 컬러 테마 적용 (h2 언더라인, 표 헤더, 퀴즈 버튼) | 8 | 1 | 1 | 0.5 | 16 | ✅ Done #3 |

## Research notes (verified facts + sources)
- Official profile + SNS handles: https://cutiestreet.asobisystem.com/news/2 → stored in `docs/.vitepress/data/members.ts`.
- Wikipedia JA https://ja.wikipedia.org/wiki/CUTIE_STREET : concept "KAWAII MAKER" (原宿から世界へKAWAIIを), fan name きゅーてぃーず?(wiki: "きゅーてすと" – re-verify), nickname きゅーすと, producer 木村ミサ, KAWAII LAB./ASOBISYSTEM.
  Heights: risa158 aika151 kana157 ayano157 emiru149 miyu150 nagisa161 haruka154. Colors: risa Yellow, aika Red, kana Mint, ayano Blue, emiru Orange, miyu Light blue, nagisa Purple, haruka Pink.
  Singles: かわいいだけじゃだめですか？ (digital 2024-09-09, CD 2024-11-13) / キューにストップできません！・ちきゅーめいくあっぷ計画 (CD 2025-07-23) / キュートなキューたい・ナイスだね (CD 2026-05-27, Oricon #1) ; digital: ハッピー世界！2025-01-24, ラブトレ 2025-02-26, チョットヒトサジ 2025-06-25, ホメマクリズム, Error404♡ ; 1st album CUTIE LAND 2026-12-02.
  Timeline: 2024-08-04 TIF debut; 2024-12-27 MステSUPER LIVE; 2025-11-21 レコード大賞 新人賞; 2026-03-26 M Countdown; 2026-08-25/26 日本武道館; 2026-09-23~11-29 ARENA TOUR (7都市13公演); 2026-11-13 紅白 初出場 決定.
- Official top page (2026-11-17): 11/19 TBS モニタリング, 11/20 1st album online sign event (YouTube) + さんまのまんま, 11/23 Sapporo fan event, tour page https://cutiestreet.asobisystem.com/feature/autumntour , schedule https://cutiestreet.asobisystem.com/live_information/schedule/list
- Arena tour dates (realsound/livedoor): 9/23 横浜アリーナ, 9/29-30 有明アリーナ, 10/3-4 セキスイハイムスーパーアリーナ, 10/28-29 マリンメッセ福岡A館, 10/31-11/1 神戸ワールド記念ホール, 11/14-15 広島グリーンアリーナ, 11/28-29 IGアリーナ(愛知). Korea: 2026-07-25/26 Live in Korea 2026 SUMMER (世宗大 大洋ホール).
- YouTube: scraped 261 videos (2025-10 → 2026-11) from https://www.youtube.com/@CUTIE_STREET/videos via Playwright → `loop/yt-videos.tsv` → `python3 -I loop/build_videos.py` → `docs/.vitepress/data/videos.json`. IDs are real (taken from official channel links). Older videos (2024–2025-09, original MVs) not yet scraped — needs more scrolling.
- Mobbin refs: Quartz video page (chip filters + pill tags), folk team grid (gradient ring avatars + emoji meta), Craft Agency (member-color backdrop portrait cards).
- Modern web techniques in use: View Transitions API (filter reflow), CSS scroll-driven `animation-timeline: view()`, `linear()` spring easing, `@starting-style` dialog entry, `color-mix()`.

## Iteration log
_(append: `#N  YYYY-MM-DD HH:MM — what shipped — commit sha — next`)_
- #1 2026-11-17 00:45 — research + RICE backlog; /videos/ archive (261 videos); members.ts; IG link + favicon fix — next: #3 member data unification, #4 member page redesign
- #2 2026-11-17 00:52 — MemberProfile (member-color hero, kinetic kanji, pointer-tilt holo ID card, bento: age/D-day/hometown/color copy/nick/likes, height ruler, member video rail, prev/next) on all 8 pages; MemberGrid on /members/; members.ts = single source (ayano 157cm); removed MemberCard — next: #16 page body theming, #5 home renewal, #6 schedule
- #3 2026-11-17 01:00 — member pages: whole page follows member color (per-member pageClass → brand vars, h2 scroll-highlight, tables, quiz/SRS accent vars); home HomeHub (kinetic '귀여움으로 세계까지', 8-member orbit, sparkle trail, live countdown to 札幌/아레나 FINAL/CUTIE LAND/紅白, count-up stats, member accordion, latest video rail, explore bento); table fit-content fix — next: #9 video durations + older videos, #6 schedule (+#18 events.ts), #14 SEO
