#!/usr/bin/env python3
"""Upload a van's stock-email assets (email-prod/gifs|lockups|thumbs: stockmail-<WL>-fade.gif, -name.png, -thumb.png) and any
stockmail-tilt-<code>.png given as extra args to WordPress media, then record source_url in email-prod/wp-urls.json.
Idempotent: skips names already in wp-urls.json. Waits out 429s.

    python3 tools/upload_email_assets.py WL1240 WL1329 ...  [tilt:1806Q-M-L tilt:2111EWL-F4-6]
"""
import json, os, sys, time, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wp_live import AUTH, UA, ROOT  # credentials never printed
W = os.path.join(ROOT, 'email-prod', 'wp-urls.json'); urls = json.load(open(W))

def post(name, data, ctype):
    for t in range(5):
        r = urllib.request.Request('https://wonderlandrv.com.au/wp-json/wp/v2/media', data=data, method='POST', headers={
            'Authorization': AUTH, 'User-Agent': UA, 'Content-Type': ctype, 'Content-Disposition': f'attachment; filename="{name}"', 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(r, timeout=180) as resp: return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(60); continue
            raise
    raise SystemExit('429 persists')

jobs = []
for a in sys.argv[1:]:
    if a.startswith('tilt:'):
        code = a[5:]; name = f'stockmail-tilt-{code}.png'
        jobs.append((name, os.path.join(ROOT, 'email-prod', f'tilt-{code}.png'), 'image/png'))
    else:
        jobs += [(f'stockmail-{a}-fade.gif', os.path.join(ROOT, 'email-prod', 'gifs', f'{a}.gif'), 'image/gif'),
                 (f'stockmail-{a}-name.png', os.path.join(ROOT, 'email-prod', 'lockups', f'{a}.png'), 'image/png'),
                 (f'stockmail-{a}-thumb.png', os.path.join(ROOT, 'email-prod', 'thumbs', f'{a}.png'), 'image/png')]
for name, path, ctype in jobs:
    if urls.get(name): print('skip', name); continue
    if not os.path.exists(path): print('MISSING', path); continue
    j = post(name, open(path, 'rb').read(), ctype)
    urls[name] = j['source_url']; print('uploaded', name, '->', j['id'], round(os.path.getsize(path) / 1024), 'KB')
    json.dump(urls, open(W, 'w'), indent=1); time.sleep(2)
