"""Upload a layout code's 8 PNGs (base, _tilt, _top, _tag, each + _sm) to WordPress media as
stockpg-layouts-<file> and append manifest entries (with "wp" + "media_id") to
email-prod/page-upload-manifest.json. Idempotent: skips files already in the manifest with a wp URL.

    python3 tools/upload_layouts.py 2110Q3-F2-4
"""
import json, os, sys, mimetypes, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wp_live import AUTH, UA, ROOT  # credentials never printed

code = sys.argv[1]
MAN = os.path.join(ROOT, 'email-prod', 'page-upload-manifest.json')
man = json.load(open(MAN))
have = {m['path']: m for m in man}
files = [f'{code}{s}.png' for s in ('', '_sm', '_tilt', '_tilt_sm', '_top', '_top_sm', '_tag', '_tag_sm')]
for f in files:
    path = f'/stock/assets/layouts/{f}'
    if path in have and have[path].get('wp'):
        print('skip (already hosted)', f, have[path]['wp']); continue
    local = os.path.join(ROOT, 'assets', 'layouts', f)
    data = open(local, 'rb').read()
    name = f'stockpg-layouts-{f}'
    r = urllib.request.Request('https://wonderlandrv.com.au/wp-json/wp/v2/media', data=data, method='POST', headers={
        'Authorization': AUTH, 'User-Agent': UA, 'Content-Type': 'image/png',
        'Content-Disposition': f'attachment; filename="{name}"', 'Accept': 'application/json'})
    with urllib.request.urlopen(r, timeout=180) as resp:
        j = json.load(resp)
    entry = {'url': f'https://piyushdiwtemockui.github.io/stock-vans/assets/layouts/{f}', 'name': name,
             'type': 'image/png', 'path': path, 'wp': j['source_url'], 'media_id': j['id']}
    if path in have:
        have[path].update(entry)
    else:
        man.append(entry); have[path] = entry
    json.dump(man, open(MAN, 'w'), indent=1)
    print('uploaded', f, '->', j['id'], j['source_url'], len(data) // 1024, 'KB')
print('manifest entries:', len(man))
