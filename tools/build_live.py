import re, os, shutil, glob, hashlib

SRC='.'
OUT='live-build/stock'
if os.path.exists('live-build'): shutil.rmtree('live-build')
os.makedirs(OUT)

BASE='/stock/'          # static bundle root on the server
PAGE='/stock-vans/'     # WP page URL
HOST='https://wonderlandrv.com.au'

# 1. copy bundle
shutil.copytree('assets', f'{OUT}/assets')
shutil.copytree('vans', f'{OUT}/vans')
for f in ['data.js','app.js']:
    shutil.copy(f, f'{OUT}/{f}')
shutil.copy('index.html', f'{OUT}/index.html')

# strip email/mock/dev files that shouldn't ship
for p in glob.glob(f'{OUT}/assets/btn-*.png')+glob.glob(f'{OUT}/assets/wedge-*.png')+[f'{OUT}/assets/name-wl1223.png', f'{OUT}/assets/mock-van-fade.gif', f'{OUT}/assets/tour-factory.png', f'{OUT}/assets/head-layout.png']+glob.glob(f'{OUT}/assets/head-*.png')+[f'{OUT}/assets/_tour_src.jpg', f'{OUT}/assets/tour-photo.png', f'{OUT}/assets/photo-treatment.md']:
    if os.path.exists(p): os.remove(p)

# 2. data.js: absolutise local asset paths
d=open(f'{OUT}/data.js').read()
d=d.replace('"assets/', f'"{BASE}assets/')
open(f'{OUT}/data.js','w').write(d)

# 3. app.js: path logic
a=open(f'{OUT}/app.js').read()
a=a.replace("u.startsWith('assets/')", f"u.startsWith('{BASE}assets/')")
a=a.replace("location.href = 'vans/' + VANS[id].chassis.toLowerCase() + '.html'", f"location.href = '{BASE}vans/' + VANS[id].chassis.toLowerCase() + '.html'")
a=a.replace("location.replace('vans/' + h[1].toLowerCase() + '.html')", f"location.replace('{BASE}vans/' + h[1].toLowerCase() + '.html')")
a=a.replace("location.replace('vans/')", f"location.replace('{BASE}vans/')")
a=a.replace('<img src="assets/coty-jca.png"', f'<img src="{BASE}assets/coty-jca.png"')
open(f'{OUT}/app.js','w').write(a)

def stamp(path):
    return hashlib.md5(open(path,'rb').read()).hexdigest()[:8]
DV=stamp(f'{OUT}/data.js'); AV=stamp(f'{OUT}/app.js')

# 4. index.html -> live version (this file also becomes the WP page body source)
h=open(f'{OUT}/index.html').read()
h=h.replace('<title>Stock Vans | Wonderland RV staging preview</title>','<title>Caravans In Stock | Wonderland RV</title>')
h=re.sub(r'(src|href)="assets/', rf'\1="{BASE}assets/', h)
h=re.sub(r'src="data\.js\?v=[0-9a-f]+"', f'src="{BASE}data.js?v={DV}"', h)
h=re.sub(r'src="app\.js\?v=[0-9a-f]+"', f'src="{BASE}app.js?v={AV}"', h)
h=h.replace("'assets/", f"'{BASE}assets/").replace('"assets/', f'"{BASE}assets/')
h=h.replace('href="vans/', f'href="{BASE}vans/')
# canonical + og
head_extra=(f'<link rel="canonical" href="{HOST}{PAGE}">\n'
 f'<meta property="og:title" content="Caravans In Stock | Wonderland RV">\n'
 f'<meta property="og:description" content="Australian made caravans built, priced and ready to go now. View the current Wonderland RV stock list.">\n'
 f'<meta property="og:url" content="{HOST}{PAGE}">\n')
h=h.replace('</title>', '</title>\n'+head_extra, 1)
open(f'{OUT}/index.html','w').write(h)

# 5. van pages
for f in glob.glob(f'{OUT}/vans/*.html'):
    v=open(f).read()
    v=v.replace(' | Wonderland RV stock vans</title>',' | Wonderland RV</title>')
    v=re.sub(r'(src|href)="\.\./assets/', rf'\1="{BASE}assets/', v)
    v=v.replace('href="../?van=', f'href="{PAGE}?van=')
    v=v.replace('href="../"', f'href="{PAGE}"')
    v=v.replace("'../assets/", f"'{BASE}assets/").replace('"../assets/', f'"{BASE}assets/')
    v=v.replace('src="../data.js', f'src="{BASE}data.js').replace('src="../app.js', f'src="{BASE}app.js')
    name=os.path.basename(f)
    if name!='index.html':
        v=v.replace('</title>', f'</title>\n<link rel="canonical" href="{HOST}{BASE}vans/{name}">', 1)
    open(f,'w').write(v)

# leftover relative refs check
bad=[]
for f in [f'{OUT}/index.html']+glob.glob(f'{OUT}/vans/*.html'):
    t=open(f).read()
    for m in re.findall(r'(?:src|href)="(?!https?://|/|#|tel:|mailto:|data:)[^"]+"', t):
        bad.append((os.path.basename(f), m))
print("leftover relative refs:", len(bad))
for b in bad[:10]: print("  ", b)
print("bundle size:", end=' '); os.system(f"du -sh {OUT} | cut -f1")
print("data.js v:", DV, "| app.js v:", AV)
