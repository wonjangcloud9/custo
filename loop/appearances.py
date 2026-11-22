#!/usr/bin/env python3
"""Off-channel appearance archive (/appearances/).

Adds YouTube videos uploaded by OTHER official channels (TV, music shows, brands,
media, other artists) to docs/.vitepress/data/appearances.json, after checking on
the watch page that the video exists, is embeddable, and who uploaded it when.

  python3 loop/appearances.py add <kind> <videoId> [<videoId> ...]
  python3 loop/appearances.py list
  python3 loop/appearances.py scan [days=3]   # candidates uploaded in the last N days (not added)

kinds: stage | fancam | variety | unit | event | news | collab
Rules: official uploaders only — never fan re-uploads, clip channels, covers by
others, or news-summary channels. Members are tagged from names in the title
(plus channel rules below); untagged = whole group.
"""
import json, re, sys, time, urllib.request, pathlib
from datetime import datetime, timedelta, timezone

DATA = pathlib.Path(__file__).resolve().parent.parent / 'docs/.vitepress/data/appearances.json'
OWN = {'UCEz-AFAg3EUKsxraad1puQA', 'UCW8Q9LBGGBgK6a-u0C0h95A'}  # CUTIE STREET, KAWAII LAB.
KINDS = {'stage', 'fancam', 'variety', 'unit', 'event', 'news', 'collab'}
NAMES = {
    'risa': ['古澤里紗', '후루사와 리사', 'Risa Furusawa', 'RISA FURUSAWA'],
    'aika': ['佐野愛花', '사노 아이카', 'Aika Sano', 'AIKA SANO'],
    'kana': ['板倉可奈', '이타쿠라 카나', 'Kana Itakura', 'KANA ITAKURA'],
    'ayano': ['増田彩乃', '마스다 아야노', 'Ayano Masuda', 'AYANO MASUDA'],
    'emiru': ['川本笑瑠', '카와모토 에미루', 'Emiru Kawamoto', 'EMIRU KAWAMOTO'],
    'miyu': ['梅田みゆ', '우메다 미유', 'Miyu Umeda', 'MIYU UMEDA'],
    'nagisa': ['真鍋凪咲', '마나베 나기사', 'Nagisa Manabe', 'NAGISA MANABE'],
    'haruka': ['桜庭遥花', '사쿠라바 하루카', 'Haruka Sakuraba', 'SAKURABA HARUKA', 'HARUKA SAKURABA'],
}
CHANNEL_MEMBERS = {'PiKi': ['haruka']}  # PiKi = 松本かれん (FRUITS ZIPPER) × 桜庭遥花


def jst_date(iso):
    """publishDate carries the uploader's UTC offset (often -08:00) — the site's dates are JST."""
    try:
        return datetime.fromisoformat(iso).astimezone(timezone(timedelta(hours=9))).strftime('%Y-%m-%d')
    except ValueError:
        return iso[:10]


def fetch(vid):
    req = urllib.request.Request(f'https://www.youtube.com/watch?v={vid}&hl=ja', headers={'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja'})
    h = urllib.request.urlopen(req, timeout=20).read().decode('utf-8')
    m = re.search(r'var ytInitialPlayerResponse = (\{.*?\});(?:var|</script>)', h)
    pr = json.loads(m.group(1)) if m else {}
    ps, vd = pr.get('playabilityStatus', {}), pr.get('videoDetails', {})
    mf = pr.get('microformat', {}).get('playerMicroformatRenderer', {})
    if ps.get('status') != 'OK':
        raise ValueError(f'{vid}: not playable ({ps.get("status")})')
    if ps.get('playableInEmbed') is False:
        raise ValueError(f'{vid}: embedding disabled')
    if vd.get('channelId') in OWN:
        raise ValueError(f'{vid}: own channel — belongs in the video archive, not here')
    return {'title': vd['title'], 'ch': vd['author'], 'date': jst_date(mf.get('publishDate') or ''), 'secs': int(vd.get('lengthSeconds') or 0)}


def tag(title, ch):
    found = [k for k, ns in NAMES.items() if any(n in title for n in ns)]
    return found or CHANNEL_MEMBERS.get(ch, [])


SCAN_Q = ['CUTIE STREET', 'きゅーすと', 'キューティーストリート', '큐티스트릿', '큐티스트리트', '큐스토'] + [ns[0] for ns in NAMES.values()]
# clip/re-upload/news-summary channels seen before — never official
# Channels already reviewed and found NOT official (fan reaction / summary / subtitle / clip) — names, exact
NOT_OFFICIAL = {'時彩堂ジャパン', 'J-Pop Junction', 'Japan Sports 24', 'きゅーてすとの集い', '音楽の今', 'Zen Pop Media', '𝐓𝐎𝐊𝐘𝐎 𝐓𝐑𝐄𝐍𝐃 𝐋𝐈𝐕𝐄', '𝙏𝙤𝙠𝙮𝙤 𝘽𝙪𝙡𝙡𝙚𝙩𝙞𝙣', '𝐚𝐢', '이루카', 'ジュールのモジュール', '쇼쇼쇼'}
# compare channel names loosely: YouTube search shows some with leading flags/spaces (' J-Pop Junction', '🇯🇵 Japan Sports 24 ') — #210
def chan_key(name):
    import unicodedata
    n = unicodedata.normalize('NFKC', name)
    return ''.join(c for c in n if c.isalnum()).lower()
NOT_OFFICIAL_KEYS = {chan_key(n) for n in NOT_OFFICIAL}
SKIP_CH = re.compile(r'切り抜き|切抜|まとめ|推し|ファン|fan|clip|Voice|News|Nipponixia|JPS|Shaheen|ARI Green|Info|Trend|直캠|직캠러|cam$', re.I)


EVENTS_TS = DATA.parent / 'events.ts'


def tv_queries(days):
    """'CUTIE STREET <program>' for official TV slots within ±days of today (program name = text inside 『』)."""
    import datetime
    today = datetime.date.today()
    out = []
    for line in EVENTS_TS.read_text().splitlines():
        m = re.search(r"date: '(\d{4}-\d\d-\d\d)'.*cat: 'tv'.*ja: '([^']*)'", line)
        if not m:
            continue
        d = datetime.date.fromisoformat(m.group(1))
        if abs((d - today).days) > days:
            continue
        prog = re.search(r'『([^』]+)』', m.group(2))
        name = prog.group(1) if prog else m.group(2)
        q = f'CUTIE STREET {name}'
        if q not in out:
            out.append(q)
    return out


def scan(days):
    import urllib.parse
    items = json.loads(DATA.read_text()) if DATA.exists() else []
    have = {it['id'] for it in items}
    known = {it['ch'] for it in items}  # channels already accepted as official uploaders
    seen = {}
    queries = SCAN_Q + tv_queries(max(days, 2))
    print('queries +TV:', ', '.join(q for q in queries if q not in SCAN_Q) or '(none)')
    for q in queries:
        url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(q) + '&sp=CAISAhAB&hl=ja&gl=JP'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja'})
        try:
            h = urllib.request.urlopen(req, timeout=20).read().decode('utf-8')
        except Exception as e:
            print('ERR', q, e); continue
        m = re.search(r'var ytInitialData = (\{.*?\});</script>', h)
        if not m: continue
        out = []
        def walk(o):
            if isinstance(o, dict):
                if 'videoRenderer' in o: out.append(o['videoRenderer'])
                for x in o.values(): walk(x)
            elif isinstance(o, list):
                for x in o: walk(x)
        walk(json.loads(m.group(1)))
        for v in out:
            try:
                vid, ch = v['videoId'], v['ownerText']['runs'][0]['text']
                cid = v['ownerText']['runs'][0]['navigationEndpoint']['browseEndpoint']['browseId']
                pub = v.get('publishedTimeText', {}).get('simpleText', '')
                title = ''.join(r['text'] for r in v['title']['runs'])
            except Exception:
                continue
            if vid in have or cid in OWN or vid in seen: continue
            n = re.match(r'(\d+)\s*(秒|分|時間|日)', pub)
            if not n or (n.group(2) == '日' and int(n.group(1)) > days): continue
            seen[vid] = (pub, ch, title, bool(SKIP_CH.search(ch)) or chan_key(ch) in NOT_OFFICIAL_KEYS)
        time.sleep(0.4)
    keep = [(k, v) for k, v in seen.items() if not v[3]]
    keep.sort(key=lambda kv: kv[1][1] not in known)  # channels we already archive from first
    for vid, (pub, ch, title, _) in keep:
        star = '★' if ch in known else ' '
        print(f'{star} {vid} | {pub} | {ch} | {title[:80]}')
    print(f'{len(keep)} candidates ({len(seen) - len(keep)} clip/fan/known-unofficial hidden; ★ = channel already in the archive) — review, then: add <kind> <id…>')


def main():
    items = json.loads(DATA.read_text()) if DATA.exists() else []
    if len(sys.argv) >= 2 and sys.argv[1] == 'scan':
        scan(int(sys.argv[2]) if len(sys.argv) > 2 else 3); return
    if len(sys.argv) < 2 or sys.argv[1] not in ('add', 'list'):
        print(__doc__); return
    if sys.argv[1] == 'list':
        for it in sorted(items, key=lambda x: x['date']):
            print(it['date'], it['kind'], it['id'], it['ch'], '|', it['title'][:70])
        print(len(items), 'items'); return
    kind, ids = sys.argv[2], sys.argv[3:]
    assert kind in KINDS, f'kind must be one of {sorted(KINDS)}'
    have = {it['id'] for it in items}
    for vid in ids:
        if vid in have:
            print('skip (have)', vid); continue
        try:
            meta = fetch(vid)
        except Exception as e:
            print('REJECT', e); continue
        items.append({'id': vid, 'kind': kind, **meta, 'members': tag(meta['title'], meta['ch'])})
        print('added', meta['date'], vid, meta['ch'], '|', meta['title'][:60])
        time.sleep(0.3)
    items.sort(key=lambda x: (x['date'], x['id']), reverse=True)
    DATA.write_text(json.dumps(items, ensure_ascii=False, indent=1) + '\n')
    print(len(items), 'items')


if __name__ == '__main__':
    main()
