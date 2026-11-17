#!/usr/bin/env python3
"""Turn loop/yt-videos.tsv (scraped from the official @CUTIE_STREET channel) into
docs/.vitepress/data/videos.json with category + member tags.
Usage: python3 -I loop/build_videos.py  (run from repo root)"""
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'loop' / 'yt-videos-full.tsv'
mv_src = root / 'loop' / 'mvs.tsv'
out = root / 'docs' / '.vitepress' / 'data' / 'videos.json'

MEMBERS = {
    'risa': ['古澤里紗', '💛'], 'aika': ['佐野愛花', '❤️'], 'kana': ['板倉可奈', '💚'],
    'ayano': ['増田彩乃', '💙'], 'emiru': ['川本笑瑠', '🧡'], 'miyu': ['梅田みゆ', '🩵'],
    'nagisa': ['真鍋凪咲', '💜'], 'haruka': ['桜庭遥花', '🩷'],
}
CATS = [
    ('dance', r'Choreography|Dance Practice|KAWAII FOCUS'),
    ('making', r'裏側|メイキング|밀착|密着'),
    ('birthday', r'生誕'),
    ('live', r'LIVE映像|Shooting LIVE|最前席LIVE|LIVE\】|熊LIVE'),
    ('vlog', r'[Vv]log|さんぽ|夏休み'),
    ('digest', r'ダイジェスト'),
    ('mv', r'MV|Music Video|Lyric Video|Memory Video'),
]

def duration(s):
    h = re.search(r'(\d+)시간', s); m = re.search(r'(\d+)분', s); sec = re.search(r'(\d+)초', s)
    h, m, sec = (int(x.group(1)) if x else 0 for x in (h, m, sec))
    if not (h or m or sec):
        return ''
    return f'{h}:{m:02d}:{sec:02d}' if h else f'{m}:{sec:02d}'

def parse_date(title):
    d = re.search(r'(20\d\d)/(\d{1,2})/(\d{1,2})', title)
    return f'{d.group(1)}-{int(d.group(2)):02d}-{int(d.group(3)):02d}' if d else ''

def tags(title):
    return [k for k, (name, emo) in MEMBERS.items() if name in title or (emo in title and '【' in title)]

videos = []
for line in src.read_text(encoding='utf-8').splitlines():
    cols = line.split('\t')
    if len(cols) < 3 or not re.fullmatch(r'[\w-]{11}', cols[0]):
        continue
    vid, rest, dur = cols[0], cols[1], cols[2].strip()
    dm = re.search(r'\s((?:\d+시간\s?)?(?:\d+분\s?)?(?:\d+초)?)$', rest)
    title = rest[: dm.start()].strip() if dm and dm.group(1) else rest.strip()
    if not dur and dm:
        dur = duration(dm.group(1))
    cat = next((c for c, rx in CATS if re.search(rx, title)), 'variety')
    venue = re.search(r'(?:📍|@\s?)([^()（【@]+)', title)
    videos.append({
        'id': vid, 'title': title, 'duration': dur, 'category': cat, 'members': tags(title),
        'date': parse_date(title), 'venue': venue.group(1).strip() if venue else '',
    })

# Official MVs live on the KAWAII LAB. channel (titles verified via oEmbed)
for line in mv_src.read_text(encoding='utf-8').splitlines():
    cols = line.split('\t')
    if len(cols) < 3 or cols[1] != 'KAWAII LAB.':
        continue
    videos.append({'id': cols[0], 'title': cols[2], 'duration': '', 'category': 'mv', 'members': [],
                   'date': '', 'venue': '', 'channel': 'KAWAII LAB.'})

# publish timestamps from the RSS refresh (loop/refresh.mjs) power the NEW badge
pub_path = root / 'loop' / 'published.json'
pub = json.loads(pub_path.read_text(encoding='utf-8')) if pub_path.exists() else {}
for v in videos:
    if pub.get(v['id']):
        v['published'] = pub[v['id']][:10]

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(videos, ensure_ascii=False, indent=1), encoding='utf-8')
# slim subset for the home page (latest rail + 'on this day'), keeps the home bundle small
slim = lambda v: {k: v[k] for k in ('id', 'title', 'duration', 'date') if v.get(k)} | ({'published': v['published']} if v.get('published') else {})
home = {
    'total': len(videos),
    'latest': [slim(v) for v in videos if not v.get('channel')][:8],
    'dated': [slim(v) for v in videos if v.get('date')],
}
(out.parent / 'home-videos.json').write_text(json.dumps(home, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
# Korea-related uploads (non-MV) for the /korea/ hub — keeps that page from loading the whole archive
import re as _re
KR = _re.compile(r'韓国|KOREA|Korea|한국|KINTEX|世宗|WANDERLOCH|M COUNTDOWN|[가-힣]{2,}')
korea = [{'id': v['id'], 'title': v['title']} for v in videos if v.get('category') != 'mv' and KR.search(v['title'])]
(out.parent / 'korea-videos.json').write_text(json.dumps(korea, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
from collections import Counter
print(len(videos), Counter(v['category'] for v in videos), Counter(m for v in videos for m in v['members']))
