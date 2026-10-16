"""Upload a van's own photos (assets/vans/<CHASSIS>/NN.jpg + NN_sm.jpg) to WordPress media as
stockpg-vans-<CHASSIS>-<file> and record "wp" + "media_id" on the matching entries in
email-prod/page-upload-manifest.json (adds the entry if missing). Idempotent: skips files that
already have a wp URL. Same pattern as upload_layouts.py.

    python3 tools/upload_van_photos.py WL1184
"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wp_live import AUTH, UA, ROOT  # credentials never printed

chassis = sys.argv[1]
MAN = os.path.join(ROOT, 'email-prod', 'page-upload-manifest.json')
man = json.load(open(MAN))
have = {m['path']: m for m in man}
folder = os.path.join(ROOT, 'assets', 'vans', chassis)
for f in sorted(os.listdir(folder)):
    if not f.lower().endswith('.jpg'): continue
    path = f'/stock/assets/vans/{chassis}/{f}'
    if path in have and have[path].get('wp'):
        print('skip (already hosted)', f, have[path]['wp']); continue
    data = open(os.path.join(folder, f), 'rb').read()
    name = f'stockpg-vans-{chassis}-{f}'
    r = urllib.request.Request('https://wonderlandrv.com.au/wp-json/wp/v2/media', data=data, method='POST', headers={
        'Authorization': AUTH, 'User-Agent': UA, 'Content-Type': 'image/jpeg',
        'Content-Disposition': f'attachment; filename="{name}"', 'Accept': 'application/json'})
    with urllib.request.urlopen(r, timeout=180) as resp:
        j = json.load(resp)
    entry = {'url': f'https://raw.githubusercontent.com/PiyushDiwteMockUI/stock-vans/main/assets/vans/{chassis}/{f}',
             'name': name, 'type': 'image/jpeg', 'path': path, 'wp': j['source_url'], 'media_id': j['id']}
    if path in have: have[path].update(entry)
    else: man.append(entry); have[path] = entry
    json.dump(man, open(MAN, 'w'), indent=1)
    print('uploaded', f, '->', j['id'], j['source_url'], len(data) // 1024, 'KB')
print('manifest entries:', len(man))
