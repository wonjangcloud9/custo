#!/usr/bin/env python3
"""Turn loop/yt-videos.tsv (scraped from the official @CUTIE_STREET channel) into
docs/.vitepress/data/videos.json with category + member tags.
Usage: python3 -I loop/build_videos.py  (run from repo root)"""
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'loop' / 'yt-videos.tsv'
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

videos = []
for line in src.read_text(encoding='utf-8').splitlines():
    if '\t' not in line:
        continue
    vid, rest = line.split('\t', 1)
    if not re.fullmatch(r'[\w-]{11}', vid):
        continue
    dm = re.search(r'\s((?:\d+시간\s?)?(?:\d+분\s?)?(?:\d+초)?)$', rest)
    title = rest[: dm.start()].strip() if dm and dm.group(1) else rest.strip()
    dur = duration(dm.group(1)) if dm else ''
    cat = next((c for c, rx in CATS if re.search(rx, title)), 'variety')
    members = [k for k, (name, emo) in MEMBERS.items() if name in title or (emo in title and '【' in title)]
    date = re.search(r'\((20\d\d)/(\d{1,2})/(\d{1,2})\)', title)
    venue = re.search(r'📍([^()（【]+)', title)
    videos.append({
        'id': vid, 'title': title, 'duration': dur, 'category': cat, 'members': members,
        'date': f'{date.group(1)}-{int(date.group(2)):02d}-{int(date.group(3)):02d}' if date else '',
        'venue': venue.group(1).strip() if venue else '',
    })

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(videos, ensure_ascii=False, indent=1), encoding='utf-8')
from collections import Counter
print(len(videos), Counter(v['category'] for v in videos), Counter(m for v in videos for m in v['members']))
