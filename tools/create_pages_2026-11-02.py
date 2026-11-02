"""Publish the four new stock van pages (WL1337, WL1155, WL1000, WL1027) from wp-pages builds.
POST wp/v2/pages: status publish, parent 12179, template elementor_header_footer, slug wlxxxx, title + excerpt from META.
Records ids in tools/wp_page_ids.json. Idempotent: skips a slug already in wp_page_ids.json."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wp_live
IDS = os.path.join(wp_live.ROOT, 'tools', 'wp_page_ids.json')
ids = json.load(open(IDS))
for slug in ['wl1337', 'wl1155', 'wl1000', 'wl1027']:
    if slug in ids:
        print('skip', slug, 'already', ids[slug]); continue
    html = wp_live.build(slug); m = wp_live.META.get(slug, {})
    body = {'content': html, 'status': 'publish', 'parent': 12179, 'template': 'elementor_header_footer',
            'slug': slug, 'title': m.get('title') or slug.upper()}
    if m.get('excerpt'): body['excerpt'] = m['excerpt']
    r = wp_live.req('POST', 'wp/v2/pages', body)
    b = wp_live.req('GET', f"wp/v2/pages/{r['id']}?context=edit&_fields=id,status,template,parent,link,slug,content")
    ok = b['content']['raw'].strip() == html.strip()
    print(slug, '->', b['id'], b['status'], b['template'], 'parent', b['parent'], b['link'], 'stored==build:', ok)
    assert b['status'] == 'publish' and b['slug'] == slug and ok, 'check page ' + str(b['id'])
    ids[slug] = b['id']
    json.dump(ids, open(IDS, 'w'), indent=1)
print('ids saved')
