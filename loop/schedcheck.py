#!/usr/bin/env python3
"""Official news page 1 + schedule lists (this month and the next two, JST) vs the site's data (#276).

Prints every official id the site doesn't mention yet (events.ts / news.ts / AlbumGuide.vue), with its date and title,
so a today check can't miss an item that appears only on the schedule list (12/2 online sign session, 2026-11-25).
Ids covered through another link carry a comment like `// official schedule detail 46743` in events.ts.
  python3 loop/schedcheck.py              # exit 1 when something is new
  python3 loop/schedcheck.py --forget ID  # self-test: pretend the site lacks ID
"""
import datetime, html, pathlib, re, sys, urllib.request

O = 'https://cutiestreet.asobisystem.com'
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = [ROOT / 'docs/.vitepress/data/events.ts', ROOT / 'docs/.vitepress/data/news.ts', ROOT / 'docs/.vitepress/components/AlbumGuide.vue']
SKIP = {'45377'}  # site-wide banner link, not an item


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (custo fan hub check)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def text(page: str) -> str:
    page = re.sub(r'<(script|style)[\s\S]*?</\1>', '', page)
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', page)))


def main() -> int:
    known = '\n'.join(p.read_text() for p in DATA)
    if '--forget' in sys.argv:
        known = known.replace(sys.argv[sys.argv.index('--forget') + 1], '')
    jst = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)
    months = []
    y, m = jst.year, jst.month
    for _ in range(3):
        months.append((y, m))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    pages = [('news p1', f'{O}/news/1/')] + [(f'{y}-{m:02}', f'{O}/live_information/schedule/list/?viewMode=default&year={y}&month={m}') for y, m in months]
    new = []
    for label, url in pages:
        try:
            src = get(url)
        except Exception as e:  # one bad fetch shouldn't hide the rest
            print(f'{label}: fetch failed ({e})'); continue
        ids = list(dict.fromkeys(re.findall(r'/(?:news|live_information)/detail/(\d+)', src)))
        ids = [i for i in ids if i not in SKIP]
        miss = [i for i in ids if i not in known]
        print(f'{label}: {len(ids)} ids, {len(miss)} new')
        for i in miss:
            kind = 'news' if f'/news/detail/{i}' in src else 'live_information'
            t = text(get(f'{O}/{kind}/detail/{i}'))
            d = re.search(r'20\d\d\.\d\d\.\d\d', t)
            title = re.search(r'ログイン 会員登録 ログイン (.{0,90})', t)
            new.append(i)
            print(f'  NEW {kind}/detail/{i}  {d.group(0) if d else "?"}  {title.group(1).strip() if title else ""}')
    return 1 if new else 0


if __name__ == '__main__':
    sys.exit(main())
