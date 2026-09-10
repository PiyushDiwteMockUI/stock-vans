"""Post-build fixes applied to every wp-pages payload. Run after build_wp_pages.py."""
import glob, re, json
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from css_scope import scope_css

RENAMED = """stockpg-vans-WL1223-25_sm-rotated.jpg stockpg-vans-WL1223-24_sm-rotated.jpg stockpg-vans-WL1223-24-rotated.jpg stockpg-vans-WL1223-23-rotated.jpg stockpg-vans-WL1223-22_sm-rotated.jpg stockpg-vans-WL1223-25-rotated.jpg stockpg-vans-WL1223-21_sm-rotated.jpg stockpg-vans-WL1223-23_sm-rotated.jpg stockpg-vans-WL1223-21-rotated.jpg stockpg-vans-WL1223-20-rotated.jpg stockpg-vans-WL1223-19_sm-rotated.jpg stockpg-vans-WL1223-22-rotated.jpg stockpg-vans-WL1223-18_sm-rotated.jpg stockpg-vans-WL1223-20_sm-rotated.jpg stockpg-vans-WL1223-18-rotated.jpg stockpg-vans-WL1223-17-rotated.jpg stockpg-vans-WL1223-16_sm-rotated.jpg stockpg-vans-WL1223-19-rotated.jpg stockpg-vans-WL1223-15_sm-rotated.jpg stockpg-vans-WL1223-17_sm-rotated.jpg stockpg-vans-WL1223-15-rotated.jpg stockpg-vans-WL1223-14-rotated.jpg stockpg-vans-WL1223-13_sm-rotated.jpg stockpg-vans-WL1223-16-rotated.jpg stockpg-vans-WL1223-12_sm-rotated.jpg stockpg-vans-WL1223-14_sm-rotated.jpg stockpg-vans-WL1223-12-rotated.jpg stockpg-vans-WL1223-11-rotated.jpg stockpg-vans-WL1223-10_sm-rotated.jpg stockpg-vans-WL1223-13-rotated.jpg stockpg-vans-WL1223-09_sm-rotated.jpg stockpg-vans-WL1223-11_sm-rotated.jpg stockpg-vans-WL1223-09-rotated.jpg stockpg-vans-WL1223-08-rotated.jpg stockpg-vans-WL1223-07_sm-rotated.jpg stockpg-vans-WL1223-10-rotated.jpg stockpg-vans-WL1223-06_sm-rotated.jpg stockpg-vans-WL1223-08_sm-rotated.jpg stockpg-vans-WL1223-06-rotated.jpg stockpg-vans-WL1223-04_sm-rotated.jpg stockpg-vans-WL1223-07-rotated.jpg stockpg-vans-WL1223-05_sm-rotated.jpg stockpg-vans-WL1223-05-rotated.jpg stockpg-vans-WL1223-03-rotated.jpg stockpg-vans-WL1223-03_sm-rotated.jpg stockpg-vans-WL1223-02-rotated.jpg stockpg-vans-WL1223-04-rotated.jpg stockpg-vans-WL1223-02_sm-rotated.jpg stockpg-vans-WL1223-01_sm-rotated.jpg stockpg-vans-WL1223-01-rotated.jpg stockpg-vans-WL1014-01_sm-rotated.jpg stockpg-vans-WL1014-01-rotated.jpg stockpg-ref-img-wonderland-rv-logo-scaled.png stockpg-ref-img-home-review-sandro-scaled.jpg stockpg-ref-img-home-review-julian-scaled.jpg stockpg-ref-img-home-review-mandi-scaled.jpg stockpg-ref-img-home-review-jasique-scaled.jpg stockpg-ref-img-experience-band-scaled.jpg""".split()

UP='https://wonderlandrv.com.au/wp-content/uploads/'
FONT_MAP={
 '../fonts/Gordita-Regular.otf': UP+'2022/11/Gordita-Regular.woff2',
 '../fonts/Gordita-Medium.otf': UP+'2022/11/Gordita-Medium.woff2',
 '../fonts/Gordita-Bold.otf': UP+'2026/09/stockpg-font-Gordita-Bold.woff2',
 '../fonts/AvianoSans-Black.otf': UP+'2026/09/stockpg-font-AvianoSans-Black.woff2',
}
DROP_FACES=['AvianoSans-Regular.otf','AvianoSans-Bold.otf']

fbq_re=re.compile(r"<script>\s*!function\(f,b,e,v,n,t,s\).*?fbq\('track','PageView'\);\s*</script>\s*", re.S)
aw_re=re.compile(r"gtag\('config','AW-16557773612'\);\s*")
hdr_re=re.compile(r'<header class="site-header">.*?</header>\s*', re.S)
ftr_re=re.compile(r'<footer class="site-footer">.*?</footer>\s*', re.S)
browse_re=re.compile(r'<a class="linkbtn"[^>]*>Browse as pages</a>\s*')


def fix_div_balance(s):
    """Remove </div> closes that would go below depth 0 (harmless strays in staging body,
    but they close the #wlstock wrapper early in WP)."""
    spans=[(m.start(),m.end()) for m in re.finditer(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->', s, re.S|re.I)]
    def masked(i): return any(a<=i<b for a,b in spans)
    depth=0; remove=[]
    for m in re.finditer(r'<div\b[^>]*>|</div>', s):
        if masked(m.start()): continue
        if m.group(0).startswith('</'):
            if depth==0: remove.append((m.start(),m.end()))
            else: depth-=1
        else: depth+=1
    for a,b in reversed(remove):
        s=s[:a]+s[b:]
    return s

rename_pairs=[(re.sub(r'-(rotated|scaled)(\.[a-z]+)$', r'\2', n), n) for n in RENAMED]

for f in sorted(glob.glob('wp-pages/*.html')):
    s=open(f,encoding='utf-8').read()
    for old,new in rename_pairs: s=s.replace(old,new)
    s=fbq_re.sub('',s); s=aw_re.sub('',s)
    s=hdr_re.sub('',s); s=ftr_re.sub('',s)
    s=browse_re.sub('',s)
    for d in DROP_FACES:
        s=re.sub(r'@font-face\s*\{[^}]*'+re.escape(d)+r'[^}]*\}\s*','',s)
    if 'id="wlstock"' not in s:
        s=fix_div_balance(s)
        s=re.sub(r'(<style>)(.*?)(</style>)', lambda m: m.group(1)+scope_css(m.group(2))+m.group(3), s, flags=re.S)
        reset='<style>#wlstock h1,#wlstock h2,#wlstock h3,#wlstock h4,#wlstock h5,#wlstock h6{color:inherit}#wlstock input,#wlstock select,#wlstock textarea,#wlstock button{transition:all 0s;border-radius:0}#wlstock select{line-height:normal}#wlstock label{line-height:inherit}#wlstock optgroup,#wlstock option{font-size:inherit;line-height:normal}</style>'
        s='<div id="wlstock">\n'+reset+'\n'+s+'\n</div>'
    for old,new in FONT_MAP.items():
        s=s.replace(f'url("{old}") format("opentype")', f'url("{new}") format("woff2")')
    for w in ('Light','Regular','Medium'):
        s=s.replace(f"url('fonts/Gordita-{w}.woff2')", f"url('{UP}2022/11/Gordita-{w}.woff2')")
    s=s.replace("return u.replace(/\\.(jpg|png)$/, '_sm.$1');",
                "return u.endsWith('-rotated.jpg') ? u.replace(/-rotated\\.jpg$/, '_sm-rotated.jpg') : u.replace(/\\.(jpg|png)$/, '_sm.$1');")
    open(f,'w',encoding='utf-8').write(s)

# verification
problems=[]
for f in sorted(glob.glob('wp-pages/*.html')):
    s=open(f,encoding='utf-8').read()
    checks={
      'residue-assets': re.findall(r'/stock/assets/[^"\')\s]+', s),
      'old-media-name': [o for o,_ in rename_pairs if o in s],
      'fbq': re.findall(r"fbq\('init'", s),
      'aw': re.findall(r'AW-16557773612', s),
      'replica-hdr': re.findall(r'<header class="site-header"', s),
      'replica-ftr': re.findall(r'<footer class="site-footer"', s),
      'otf-fonts': re.findall(r'\.\./fonts/', s),
      'rel-fonts': re.findall(r"url\('fonts/", s),
      'bad-sm-derive': ([] if "endsWith('-rotated.jpg')" in s or 'stockpg-' not in s else ['unpatched']) if "_sm.$1" in s else [],
      'browse-link': re.findall(r'Browse as pages', s),
      'wlstock-missing': [] if 'id="wlstock"' in s else ['no wrapper'],
    }
    for k,v in checks.items():
        if v: problems.append((f,k,v[:2]))
if problems:
    for p in problems: print('PROBLEM', p)
else:
    print('postfix OK, all checks clean')
# titles
m=json.load(open('wp-pages/meta.json'))
out={k:{'title':v['title'].replace(' | Wonderland RV',''),'slug':v['slug']} for k,v in m.items() if k.startswith('wl')}
json.dump(out,open('wp-pages/titles.json','w'),indent=1)
print('titles.json:',len(out))
