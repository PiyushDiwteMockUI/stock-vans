"""Publish the eight upcoming stock van pages (Ana 3 Nov 2026, Piyush 'you check and publish' 5 Nov) from wp-pages builds.
POST wp/v2/pages: status publish, parent 12179, template elementor_header_footer, slug wlxxxx, title + excerpt from META.
Records ids in tools/wp_page_ids.json. Idempotent: skips a slug already in wp_page_ids.json. Waits out 429s."""
import json, os, sys, time, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wp_live
IDS = os.path.join(wp_live.ROOT, 'tools', 'wp_page_ids.json')
ids = json.load(open(IDS))
def req(method, path, body=None):
    for t in range(5):
        try: return wp_live.req(method, path, body)
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(60); continue
            raise
    raise SystemExit('429 persists')
for slug in ['wl1240', 'wl1216', 'wl1329', 'wl1346', 'wl1239', 'wl1250', 'wl1336', 'wl1249']:
    if slug in ids:
        print('skip', slug, 'already', ids[slug]); continue
    html = wp_live.build(slug); m = wp_live.META.get(slug, {})
    body = {'content': html, 'status': 'publish', 'parent': 12179, 'template': 'elementor_header_footer',
            'slug': slug, 'title': m.get('title') or slug.upper()}
    if m.get('excerpt'): body['excerpt'] = m['excerpt']
    r = req('POST', 'wp/v2/pages', body)
    b = req('GET', f"wp/v2/pages/{r['id']}?context=edit&_fields=id,status,template,parent,link,slug,content")
    ok = b['content']['raw'].strip() == html.strip()
    print(slug, '->', b['id'], b['status'], b['template'], 'parent', b['parent'], b['link'], 'stored==build:', ok)
    assert b['status'] == 'publish' and b['slug'] == slug and ok, 'check page ' + str(b['id'])
    ids[slug] = b['id']
    json.dump(ids, open(IDS, 'w'), indent=1); time.sleep(3)
print('ids saved')
