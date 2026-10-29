"""Re-host a van's caravancampingsales (pxcrush) listing photos to WordPress media in the three sizes the pages use
(1600x1067, 1024x683, 640x427) as stockpg-cdn-<id>-<size>.jpg, and record url/name/wp/media_id in
email-prod/ext-manifest.json. Idempotent: skips entries that already have a wp URL.

    python3 tools/upload_listing_photos.py WL1293
"""
import json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wp_live import AUTH, UA, ROOT  # credentials never printed

chassis = sys.argv[1].upper()
s = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
D = json.loads(s[s.index('const DATA = ') + 13:s.index(';\nconst OR_TOKEN')])
van = [v for v in D['vans'] if v['chassis'] == chassis][0]
MAN = os.path.join(ROOT, 'email-prod', 'ext-manifest.json'); man = json.load(open(MAN)); have = {m['url']: m for m in man}
SIZES = [('1600', '1600,1067'), ('1024', '1024,683'), ('640', '640,427')]
for u in van['images']:
    m = re.search(r'/dealer/([a-z0-9]+)\.jpg', u)
    if not m: print('not a pxcrush image, skipped', u); continue
    pid = m.group(1)
    for tag, px in SIZES:
        url = f'https://caravancampingsales.pxcrush.net/caravancampingsales/cars/dealer/{pid}.jpg?pxc_method=gravityfill&pxc_bgtype=self&pxc_size={px}'
        if url in have and have[url].get('wp'): print('skip', pid, tag); continue
        data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
        name = f'stockpg-cdn-{pid}-{tag}.jpg'
        r = urllib.request.Request('https://wonderlandrv.com.au/wp-json/wp/v2/media', data=data, method='POST', headers={
            'Authorization': AUTH, 'User-Agent': UA, 'Content-Type': 'image/jpeg',
            'Content-Disposition': f'attachment; filename="{name}"', 'Accept': 'application/json'})
        with urllib.request.urlopen(r, timeout=180) as resp: j = json.load(resp)
        e = {'url': url, 'name': name, 'wp': j['source_url'], 'media_id': j['id']}
        if url in have: have[url].update(e)
        else: man.append(e); have[url] = e
        json.dump(man, open(MAN, 'w'), indent=1)
        print('uploaded', name, '->', j['id'], len(data) // 1024, 'KB')
print('manifest entries:', len(man))
