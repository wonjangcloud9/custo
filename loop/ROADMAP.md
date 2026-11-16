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
| _(iteration 1: research + fill this table)_ | | | | | | | |

## Research notes (verified facts + sources)
_(append here)_

## Iteration log
_(append: `#N  YYYY-MM-DD HH:MM — what shipped — commit sha — next`)_
