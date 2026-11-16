#!/usr/bin/env python3
"""Build docs/.vitepress/data/feeds.json — per-member 'legend photo' feed.
Sources (official channels only):
  - loop/teasers-raw.tsv : KAWAII LAB. channel search results (member MV teasers etc.)
  - docs/.vitepress/data/videos.json : @CUTIE_STREET uploads tagged with the member
Thumbnails are referenced from i.ytimg.com (official embed), never downloaded/rehosted.
Usage: python3 -I loop/build_feeds.py  (repo root). Checks maxresdefault availability."""
import json, pathlib, re, urllib.request, concurrent.futures as cf

root = pathlib.Path(__file__).resolve().parent.parent
NAMES = {'risa': '古澤里紗', 'aika': '佐野愛花', 'kana': '板倉可奈', 'ayano': '増田彩乃',
         'emiru': '川本笑瑠', 'miyu': '梅田みゆ', 'nagisa': '真鍋凪咲', 'haruka': '桜庭遥花'}

def kind(t):
    if 'Teaser' in t: return 'teaser'
    if '推しカメラ' in t or 'FOCUS' in t: return 'fancam'
    if '生誕' in t: return 'birthday'
    if '密着' in t or 'vlog' in t.lower() or 'さんぽ' in t: return 'vlog'
    if 'LIVE' in t: return 'live'
    return 'moment'

feeds = {k: [] for k in NAMES}
seen = {k: set() for k in NAMES}
for line in (root / 'loop' / 'teasers-raw.tsv').read_text(encoding='utf-8').splitlines():
    p = line.split('\t')
    if len(p) < 3: continue
    mid, vid, t = p
    if NAMES[mid] in t and 'CUTIE STREET' in t and vid not in seen[mid] and re.fullmatch(r'[\w-]{11}', vid):
        seen[mid].add(vid); feeds[mid].append({'id': vid, 'title': t, 'kind': kind(t)})
for v in json.loads((root / 'docs/.vitepress/data/videos.json').read_text(encoding='utf-8')):
    for mid in v['members']:
        if v['id'] not in seen[mid]:
            seen[mid].add(v['id']); feeds[mid].append({'id': v['id'], 'title': v['title'], 'kind': kind(v['title'])})

def has_maxres(vid):
    try:
        req = urllib.request.Request(f'https://i.ytimg.com/vi/{vid}/maxresdefault.jpg', method='HEAD')
        return urllib.request.urlopen(req, timeout=10).status == 200
    except Exception:
        return False

ids = sorted({x['id'] for f in feeds.values() for x in f})
with cf.ThreadPoolExecutor(16) as ex:
    ok = dict(zip(ids, ex.map(has_maxres, ids)))
order = {'teaser': 0, 'fancam': 1, 'birthday': 2, 'live': 3, 'vlog': 4, 'moment': 5}
for mid in feeds:
    for x in feeds[mid]: x['hq'] = ok[x['id']]
    feeds[mid].sort(key=lambda x: (order[x['kind']], not x['hq']))
out = root / 'docs/.vitepress/data/feeds.json'
out.write_text(json.dumps(feeds, ensure_ascii=False, indent=1), encoding='utf-8')
print({k: len(v) for k, v in feeds.items()}, 'maxres', sum(ok.values()), '/', len(ok))
