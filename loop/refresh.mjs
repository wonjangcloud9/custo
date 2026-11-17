#!/usr/bin/env node
// Data refresh for the fan hub — no browser needed.
// Pulls the official channels' YouTube RSS feeds (latest 15 uploads each), appends new videos to the
// scraped lists, fetches durations from the watch page, then rebuilds videos.json + feeds.json.
// Usage (repo root): node loop/refresh.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const CS = 'UCEz-AFAg3EUKsxraad1puQA' // @CUTIE_STREET
const KL = 'UCQG8tNnV4hKetLhMb4MopHQ' // @KAWAII_LAB_OFFICIAL
const NAMES = { risa: '古澤里紗', aika: '佐野愛花', kana: '板倉可奈', ayano: '増田彩乃', emiru: '川本笑瑠', miyu: '梅田みゆ', nagisa: '真鍋凪咲', haruka: '桜庭遥花' }
const PUB = 'loop/published.json'

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
async function feed(channel) {
  const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel}`)).text()
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1],
    title: decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
    short: /\/shorts\//.test(e.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? ''),
    published: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? '',
  })).filter((v) => v.id)
}
async function duration(id) {
  try {
    const html = await (await fetch(`https://www.youtube.com/watch?v=${id}&hl=ja`, { headers: { 'Accept-Language': 'ja' } })).text()
    const s = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1] ?? 0)
    if (!s) return ''
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
  } catch { return '' }
}

const tsv = readFileSync('loop/yt-videos-full.tsv', 'utf8').split('\n')
const known = new Set(tsv.map((l) => l.split('\t')[0]))
const mvs = readFileSync('loop/mvs.tsv', 'utf8')
const teasers = readFileSync('loop/teasers-raw.tsv', 'utf8')
const published = existsSync(PUB) ? JSON.parse(readFileSync(PUB, 'utf8')) : {}

const added = { cs: [], mv: [], teaser: [] }
for (const v of (await feed(CS)).reverse()) {
  published[v.id] ??= v.published
  if (v.short || known.has(v.id)) continue
  const d = await duration(v.id)
  tsv.splice(tsv[0] && /^\d+$/.test(tsv[0]) ? 1 : 0, 0, `${v.id}\t${v.title}\t${d}`)
  known.add(v.id); added.cs.push(v.title)
}
let mvOut = mvs, tOut = teasers
for (const v of await feed(KL)) {
  if (v.short || !/CUTIE STREET/.test(v.title)) continue
  published[v.id] ??= v.published
  if (/【(韓国版)?MV】/.test(v.title) && !mvOut.includes(v.id)) { mvOut = `${v.id}\tKAWAII LAB.\t${v.title}\n` + mvOut; added.mv.push(v.title) } // newest first
  for (const [mid, name] of Object.entries(NAMES)) {
    if (v.title.includes(name) && !tOut.includes(`${mid}\t${v.id}`)) { tOut += `${tOut.endsWith('\n') ? '' : '\n'}${mid}\t${v.id}\t${v.title}\n`; added.teaser.push(`${mid}: ${v.title}`) }
  }
}
writeFileSync('loop/yt-videos-full.tsv', tsv.join('\n'))
writeFileSync('loop/mvs.tsv', mvOut)
writeFileSync('loop/teasers-raw.tsv', tOut)
writeFileSync(PUB, JSON.stringify(published, null, 1))
execFileSync('python3', ['-I', 'loop/build_videos.py'], { stdio: 'inherit' })
execFileSync('python3', ['-I', 'loop/build_feeds.py'], { stdio: 'inherit' })
console.log(JSON.stringify({ newUploads: added.cs.length, newMVs: added.mv.length, newMemberCuts: added.teaser.length, added }, null, 1))
