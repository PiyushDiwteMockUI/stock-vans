import re, os, json, glob

ROOT='live-build/stock'
OUT='wp-pages'
os.makedirs(OUT, exist_ok=True)
WPU='https://wonderlandrv.com.au/wp-content/uploads/2026/09/'
HOST='https://wonderlandrv.com.au'

manifest=json.load(open('email-prod/page-upload-manifest.json'))
# path (/stock/...) -> wp url
urlmap={m['path']: WPU+m['name'] for m in manifest if m['name']!='stockpg-vans-'}
# longest first for safe replacement
keys=sorted(urlmap, key=len, reverse=True)

def map_paths(text):
    # normalise stray ../assets (srcset bug) to /stock/assets
    text=text.replace('../assets/','/stock/assets/')
    for k in keys:
        text=text.replace(k, urlmap[k])
    return text

def inline_assets(html, page_dir):
    # css links
    def css_repl(m):
        path=m.group(1)
        rel=path[len('/stock/'):]
        return '<style>\n'+open(os.path.join(ROOT,rel)).read()+'\n</style>'
    html=re.sub(r'<link[^>]*href="(/stock/[^"]+\.css)(?:\?[^"]*)?"[^>]*>', css_repl, html)
    # js scripts
    def js_repl(m):
        path=m.group(1).split('?')[0]
        rel=path[len('/stock/'):]
        js=open(os.path.join(ROOT,rel)).read()
        if rel=='data.js':
            js=map_paths(js)
        if rel=='app.js':
            js=js.replace("u.startsWith('/stock/assets/')", f"u.startsWith('{WPU}stockpg-')")
            js=js.replace("location.href = '/stock/vans/' + VANS[id].chassis.toLowerCase() + '.html'", "location.href = '/stock/' + VANS[id].chassis.toLowerCase() + '/'")
            js=js.replace("location.replace('/stock/vans/' + h[1].toLowerCase() + '.html')", "location.replace('/stock/' + h[1].toLowerCase() + '/')")
            js=js.replace("location.replace('/stock/vans/')", "location.replace('/stock/')")
            js=map_paths(js)
        if rel in ('assets/vanpage.js','assets/ref/js/reviews.js','assets/ref/js/footer.js','assets/ref/js/video.js','assets/purify.min.js'):
            js=map_paths(js)
        return '<script>\n'+js+'\n</script>'
    html=re.sub(r'<script[^>]*src="(/stock/[^"]+\.js[^"]*)"[^>]*>\s*</script>', js_repl, html)
    return html

def page_links(html):
    html=re.sub(r'href="/stock/vans/(wl\d+)\.html"', r'href="/stock/\1/"', html)
    html=html.replace('href="/stock/vans/"','href="/stock/"')
    # van page sibling links (same-dir relative)
    html=re.sub(r'href="(wl\d+)\.html"', r'href="/stock/\1/"', html)
    html=html.replace('href="./"','href="/stock/"')
    return html

def nav_fix(html, current):
    cur=' aria-current="page"' if current=='index' else ''
    html=html.replace('<a href="#" aria-current="page">Buy</a>', '<a href="'+HOST+'/stock-vans/"'+cur+'>buy now</a>')
    html=html.replace('>Buy</a>','>buy now</a>')
    return html

def body_and_head(html):
    head=re.search(r'<head[^>]*>(.*?)</head>', html, re.S).group(1)
    body=re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
    # carry style blocks + scripts (GA etc.) + og/canonical from head into content top
    keep=re.findall(r'<style>.*?</style>|<script(?![^>]*type="application/ld)[^>]*>.*?</script>|<script[^>]*src="https://www\.googletagmanager[^"]*"[^>]*></script>|<link rel="canonical"[^>]*>|<meta property="og:[^>]*>', head, re.S)
    return '\n'.join(keep)+'\n'+body

pages={}
# van pages
for f in sorted(glob.glob(f'{ROOT}/vans/wl*.html')):
    name=os.path.basename(f)[:-5]
    h=open(f).read()
    h=map_paths(h); h=inline_assets(h,'vans'); h=page_links(h); h=nav_fix(h,name)
    h=h.replace(f'<link rel="canonical" href="{HOST}/stock/vans/{name}.html">', f'<link rel="canonical" href="{HOST}/stock/{name}/">')
    title=re.search(r'<title>([^<]+)</title>', h).group(1)
    content=body_and_head(h)
    pages[name]={'title':title, 'content':content, 'slug':name}
# vans hub (index of /stock/)
f=f'{ROOT}/vans/index.html'
h=open(f).read(); h=map_paths(h); h=inline_assets(h,'vans'); h=page_links(h); h=nav_fix(h,'hub')
pages['stock-hub']={'title': re.search(r'<title>([^<]+)</title>', h).group(1), 'content': body_and_head(h), 'slug':'stock'}
# main index (for page 10876 / Elementor html widget)
f=f'{ROOT}/index.html'
h=open(f).read(); h=map_paths(h); h=inline_assets(h,'.'); h=page_links(h); h=nav_fix(h,'index')
pages['stock-vans-index']={'title':'Caravans In Stock | Wonderland RV', 'content': body_and_head(h), 'slug':'stock-vans'}

for k,v in pages.items():
    open(f'{OUT}/{k}.html','w').write(v['content'])
json.dump({k:{'title':v['title'],'slug':v['slug'],'len':len(v['content'])} for k,v in pages.items()}, open(f'{OUT}/meta.json','w'), indent=1)
print("pages built:", len(pages))
# residue check
bad=0
for k,v in pages.items():
    r=re.findall(r'/stock/assets/[^"\')\s]+', v['content'])
    if r: bad+=1; print("  residue in",k,":",r[:3])
print("pages with unmapped /stock/assets residue:", bad)
import statistics
sizes=[v['len'] for v in pages.values()]
print("content sizes KB: min",min(sizes)//1024,"median",int(statistics.median(sizes))//1024,"max",max(sizes)//1024)
