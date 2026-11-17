#!/usr/bin/env python3
"""Off-channel appearance archive (/appearances/).

Adds YouTube videos uploaded by OTHER official channels (TV, music shows, brands,
media, other artists) to docs/.vitepress/data/appearances.json, after checking on
the watch page that the video exists, is embeddable, and who uploaded it when.

  python3 loop/appearances.py add <kind> <videoId> [<videoId> ...]
  python3 loop/appearances.py list

kinds: stage | fancam | variety | unit | event | news | collab
Rules: official uploaders only — never fan re-uploads, clip channels, covers by
others, or news-summary channels. Members are tagged from names in the title
(plus channel rules below); untagged = whole group.
"""
import json, re, sys, time, urllib.request, pathlib

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
    return {'title': vd['title'], 'ch': vd['author'], 'date': (mf.get('publishDate') or '')[:10], 'secs': int(vd.get('lengthSeconds') or 0)}


def tag(title, ch):
    found = [k for k, ns in NAMES.items() if any(n in title for n in ns)]
    return found or CHANNEL_MEMBERS.get(ch, [])


def main():
    items = json.loads(DATA.read_text()) if DATA.exists() else []
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
