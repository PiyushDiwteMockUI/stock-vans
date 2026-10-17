"""Create (or update) a DRAFT WordPress page from a wp-pages build for preview. Never publishes.
Usage: python3 tools/wp_preview_draft.py <slug> [draft page id to update]
Creates a new draft child of /stock/ (parent 12179) with the live van page's template, title prefixed PREVIEW."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wp_live
slug = sys.argv[1]; pid = sys.argv[2] if len(sys.argv) > 2 else None
html = wp_live.build(slug); m = wp_live.META.get(slug, {})
body = {'content': html, 'status': 'draft', 'parent': 12179, 'template': 'elementor_header_footer',
        'title': 'PREVIEW ' + (m.get('title') or slug.upper()) + ' (form v3 + page v4)', 'slug': 'preview-' + slug + '-form-v3'}
if m.get('excerpt'): body['excerpt'] = m['excerpt']
r = wp_live.req('POST', f'wp/v2/pages/{pid}' if pid else 'wp/v2/pages', body)
b = wp_live.req('GET', f"wp/v2/pages/{r['id']}?context=edit&_fields=id,status,template,parent,link,content")
print('draft page', b['id'], b['status'], b['template'], 'parent', b['parent'], 'stored==build:', b['content']['raw'].strip() == html.strip())
print('preview link: https://wonderlandrv.com.au/?page_id=%d&preview=true' % b['id'])
