#!/usr/bin/env python3
"""Link-rot check for the built site (run after `bash loop/preview.sh`).

  python3 loop/linkcheck.py            # external pages + every YouTube video id
  python3 loop/linkcheck.py --no-yt    # external pages only

External pages: GET with a browser UA; reports non-200s and 200s that land on a different page
(a removed notice often redirects to the site top). x.com / instagram / tiktok block scripts and
are skipped; natalie.mu answers bots with a 405 "are you human" page — open it in a browser.
YouTube: every 11-char id in dist + data/*.json via oEmbed (404 removed, 401/403 private or
embedding off). Exit code 1 when anything needs a look.
"""
import collections, concurrent.futures, glob, json, re, sys, urllib.error, urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'docs/.vitepress/dist'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15', 'Accept-Language': 'ja,ko'}
SKIP = ('youtube.com', 'youtu.be', 'ytimg.com', 'youtube-nocookie.com', 'googleapis', 'gstatic', 'w3.org', 'schema.org',
        'calendar.google.com', 'vuejs.org', 'iconify.design', 'localhost', 'x.com', 'instagram.com', 'tiktok.com')
PLACEHOLDER = {'http://a.com', 'https://a.com'}  # placeholder in bundled library code
BOT_WALLED = {'natalie.mu': 405}
NOT_VIDEOS = {'VPNavScreen', 'ASOBISYSTEM'}  # add here when a new non-video 11-char token shows up as 400/404
YT = re.compile(r'(?:ytimg\.com/vi/|youtube\.com/watch\?v=|youtu\.be/|youtube(?:-nocookie)?\.com/embed/)([A-Za-z0-9_-]{11})')


def built_text():
    for f in glob.glob(str(DIST / '**/*.html'), recursive=True) + glob.glob(str(DIST / 'assets/**/*.js'), recursive=True):
        yield open(f, encoding='utf-8', errors='ignore').read()


def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25)
        return r.status, r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as e:  # noqa: BLE001 — report, don't crash
        return f'ERR {str(e)[:40]}', ''


def main():
    if not DIST.exists():
        sys.exit('no build — run bash loop/preview.sh first')
    texts = list(built_text())
    urls, ids = set(), set()
    for s in texts:
        for u in re.findall(r'https?://[^\s"\'<>`\\)]+', s):
            u = u.rstrip('.,;')
            if len(u) < 400 and '${' not in u and u not in PLACEHOLDER and not any(k in u for k in SKIP):
                urls.add(u)
        ids |= set(YT.findall(s)) | set(re.findall(r'"id":"([A-Za-z0-9_-]{11})"', s))
        # bare ids in minified data (songs videos, Korea hub mv/v, quiz scenes …)
        ids |= set(re.findall(r'\b(?:id|v|mv|yt|video|vid):"([A-Za-z0-9_-]{11})"', s))
    for f in glob.glob(str(ROOT / 'docs/.vitepress/data/*.json')):
        ids |= set(re.findall(r'"id": "([A-Za-z0-9_-]{11})"', open(f).read()))
    # 11-char strings that are not videos: song page slugs + words seen in bundles. Shape heuristics
    # are unsafe — real ids like IjunRnJiOvw look CamelCase — so only exclude what is known.
    not_videos = {f.stem for f in (ROOT / 'docs/discography').glob('*.md')} | NOT_VIDEOS
    ids -= not_videos

    problems = []
    with concurrent.futures.ThreadPoolExecutor(10) as ex:
        for u, (code, final) in zip(sorted(urls), ex.map(get, sorted(urls))):
            host = urlparse(u).netloc.replace('www.', '')
            if code == BOT_WALLED.get(host):
                continue
            if code != 200:
                problems.append(f'{code} {u}')
            elif final and (urlparse(final).netloc.replace('www.', '') != host or urlparse(final).path.rstrip('/') != urlparse(u).path.rstrip('/')):
                problems.append(f'moved {u} -> {final}')
    print(f'{len(urls)} external pages checked')

    if '--no-yt' not in sys.argv:
        def yt(v):
            return get(f'https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v={v}')[0], v
        with concurrent.futures.ThreadPoolExecutor(12) as ex:
            res = list(ex.map(yt, sorted(ids)))
        print(f'{len(ids)} YouTube ids checked:', dict(collections.Counter(str(c) for c, _ in res)))
        problems += [f'youtube {c} {v}' for c, v in res if c != 200]

    print('\n'.join(problems) if problems else 'no broken links')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
