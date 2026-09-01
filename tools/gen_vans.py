#!/usr/bin/env python3
"""Generate one static page per stock van + the pages index, from data.js.
Run from the repo root: python3 tools/gen_vans.py
Header/footer are sliced from index.html (WLHEADER/WLFOOTER markers) so the
pages always match the main page. All dynamic strings in data.js are already
HTML-escaped at harvest time."""
import json, re, os

src = open('data.js').read()
DATA = json.loads(re.search(r'const DATA = ([\s\S]*?);\s*const OR_TOKEN', src).group(1))
idx = open('index.html').read()
header = re.search(r'<!--WLHEADER-->([\s\S]*?)<!--/WLHEADER-->', idx).group(1)
footer = re.search(r'<!--WLFOOTER-->([\s\S]*?)<!--/WLFOOTER-->', idx).group(1)
# links inside header/footer are relative to root; from vans/ prefix local assets with ../
def rel(html):
    return html.replace('src="assets/', 'src="../assets/').replace('href="assets/', 'href="../assets/')
headerV, footerV = rel(header), rel(footer)

kg = lambda n: format(n, ',').replace(',', ',') + ' kg'
money = lambda n: 'Enquire for price' if n is None else '$' + format(round(n), ',')

INCL = {
 'XTR': ['Victron off-grid power', 'Cruisemaster ATX airbag suspension', '2 x 90-100L water tanks'],
 'Hornet': ['Redarc Alpha 75 off-grid power', 'Cruisemaster XT airbag suspension', '2 x 90-100L water tanks'],
 'Amaroo': ['Redarc Alpha 50 off-grid power', 'Cruisemaster coil suspension', '2 x 90-100L water tanks'],
 'Solara': ['Redarc Alpha 75 off-grid power', 'Frameless composite construction', '2 x 90-100L water tanks'],
}


def asrc(u):
    """Image src usable from inside /vans/: absolute URLs pass through, local assets get ../"""
    return u if u.startswith('http') else '../' + u

def full_name(v):
    return v['name'] if v['name'].startswith(v['model']) else v['model'] + ' ' + v['name']

HEAD = '''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>{title} | Wonderland RV stock vans</title>
<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://caravancampingsales.pxcrush.net">
<link rel="preconnect" href="https://jealstorage.blob.core.windows.net">
<link rel="preconnect" href="https://use.typekit.net" crossorigin>
<link rel="stylesheet" href="https://use.typekit.net/ywn7byg.css">
<link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/ref/css/styles.css">
<link rel="stylesheet" href="../assets/ref/css/type-compact.css">
<style>
@media (min-width:901px){{html{{font-size:min(100px, max(calc(100vw / 23.76), min(66px, calc(100vw / 17.5))))}}}}
.vp-wrap{{max-width:1040px;margin-bottom:34px}}
@media (max-width:900px){{.vp-mediarow{{grid-template-columns:1fr!important}}}}
.vp-main{{position:relative;aspect-ratio:3/2;background:var(--dk);border-radius:4px;overflow:hidden;margin-bottom:10px}}
.vp-main img{{width:100%;height:100%;object-fit:cover;display:block;filter:contrast(1.05) saturate(1.06)}}
.vp-count{{position:absolute;bottom:14px;right:14px;background:rgba(6,9,12,.72);color:#fff;font:400 11.5px/1 'Gordita',sans-serif;padding:7px 11px;border-radius:2px}}
</style>
</head>
<body>
'''

def gallery(v):
    thumbs = ''.join(
        f'<button class="thumbbtn{" on" if i==0 else ""}" data-i="{i}" aria-label="Photo {i+1}"><span style="display:block;width:100%;height:100%;background-image:url({asrc(u)});background-size:cover;background-position:center;pointer-events:none"></span></button>'
        for i, u in enumerate(v['images']))
    side = ''.join(
        f"""<button type="button" class="vp-side" data-goto="{i}" aria-label="Photo {i+1}" style="position:relative;padding:0;border:0;cursor:pointer;background:var(--line);overflow:hidden;border-radius:3px"><img src="{asrc(v['images'][i])}" alt="" loading="lazy" width="700" height="466" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"></button>"""
        for i in range(1, min(5, len(v['images']))))
    return f'''<div class="vp-wrap"><div style="display:grid;grid-template-columns:1.55fr 1fr;gap:10px" class="vp-mediarow"><div class="vp-main" style="margin-bottom:0">
      <img id="vp-img" src="{asrc(v['images'][0])}" alt="{v['name']}" width="1600" height="1067" fetchpriority="high">
      <button class="galbtn" style="left:14px" data-nav="-1" aria-label="Previous photo">‹</button>
      <button class="galbtn" style="right:14px" data-nav="1" aria-label="Next photo">›</button>
      <span class="vp-count"><span id="vp-n">1</span> / {len(v['images'])}</span>
      {'<img src="../assets/coty-jca.png" alt="Caravan of the Year 2026 Judges Choice Award" width="526" height="1288" style="position:absolute;top:0;right:24px;width:64px;height:auto;filter:drop-shadow(0 5px 12px rgba(0,0,0,.42))">' if v['model']=='Solara' else ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px">{side}</div></div>
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-top:10px" id="vp-thumbs">{thumbs}</div></div>'''

def spec_sections(v):
    specs = DATA['modelSpecs'].get(v['model'], {})
    out = []
    for tab, rows in specs.items():
        rws = ''.join(f'''<div style="display:flex;flex-wrap:wrap;gap:6px 20px;padding:17px 2px;border-bottom:1px solid var(--line)">
          <span style="flex:0 0 220px;font:500 13.5px/1.55 'Gordita',sans-serif;letter-spacing:.02em;color:var(--svink)">{k}</span>
          <span style="flex:1 1 260px;min-width:0;font:400 15px/1.65 'Gordita',sans-serif;color:var(--body)">{val}</span></div>''' for k, val in rows)
        out.append(f'''<h3 class="av" style="margin:30px 0 4px;font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--olink)">{tab}</h3>{rws}''')
    return ''.join(out)

def van_page(v):
    name = full_name(v)
    clr = int(v.get('year') or 2026) < 2026
    badge = ('<span class="badge-red">Clearance</span>' if clr else '<span class="badge-dark">Ready now</span>') + ('<span class="badge-grey">Pre-loved</span>' if v['used'] else '')
    tow = ''
    if v.get('atm'):
        note = 'Tows behind most 3.5T-rated dual cab utes.' if v['atm'] <= 3500 else 'Needs a 4.5T-rated tow vehicle.'
        payload = f" Payload of {v['atm']-v['tare']:,} kg once you are loaded." if v.get('tare') else ''
        tow = f'''<div style="display:flex;align-items:center;gap:12px;padding:15px 18px;border:1px solid var(--line2);border-radius:4px;margin-bottom:38px">
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" style="flex:none;display:block"><path d="M2.5 12.5h11v-5h-11v5z M13.5 9.5h2.6l1.4 3h-4z M5.5 14.8a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z M15 14.8a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z" fill="none" stroke="#12171C" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"></path></svg>
          <span style="font:400 13.5px/1.5 'Gordita',sans-serif;color:var(--body2)">{note}{payload}</span></div>'''
    floor = ''
    if v.get('floorplan'):
        floor = f'''<div style="margin-bottom:38px">
          <h2 class="av" style="margin:0 0 6px;font-size:24px;letter-spacing:.04em;text-transform:uppercase">Floorplan</h2>
          <p style="margin:0 0 16px;font:400 14px/1.65 'Gordita',sans-serif;color:var(--body);max-width:60ch">The {v['code']} layout, top down.</p>
          <div style="border:1px solid var(--line);border-radius:4px;background:#fff;padding:18px">
            <img src="../{v['floorplan']}" alt="{v['code']} floorplan" loading="lazy" style="width:100%;height:auto;display:block"></div></div>'''
    strip = ''.join(f'''<div style="padding:22px 20px;background:var(--svink)">
        <div style="font:400 10.5px/1 'Gordita',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:var(--peach);margin-bottom:11px">{k}</div>
        <div class="av" style="font-size:22px;line-height:1.1;letter-spacing:-.01em;color:#fff">{val}</div>
        <div style="margin-top:9px;font:400 12.5px/1.55 'Gordita',sans-serif;color:rgba(255,255,255,.76)">{d}</div></div>'''
        for k, val, d in [('Model', v['model'], 'Wonderland RV range'), ('Length', v.get('length') or '—', 'Body length'),
                          ('Layout', v['layout'], 'Bunks on board' if v['layout'] == 'Family' else 'Two berth touring'),
                          ('Location', v['state'], 'Where it is now')])
    incl = ''.join(f'<span style="background:var(--cream);border:1px solid var(--line);color:var(--body2);font:400 12.5px/1 \'Gordita\',sans-serif;padding:8px 10px;border-radius:2px">{t}</span>' for t in INCL.get(v['model'], []))
    facts = ''.join(f'''<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:13px 0;border-top:1px solid var(--line)">
        <span style="font:400 12px/1.4 'Gordita',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)">{k}</span>
        <span style="font:500 13.5px/1.4 'Gordita',sans-serif;color:var(--svink);text-align:right;font-variant-numeric:tabular-nums">{val}</span></div>'''
        for k, val in [('Stock no', v['chassis']), ('Layout code', v['code']), ('Length', v.get('length') or '—'), ('Layout', v['layout']),
                       ('Sleeps', v.get('sleeps') or '—'),
                       ('Tare', f"{v['tare']:,} kg" if v.get('tare') else '—'), ('ATM', f"{v['atm']:,} kg" if v.get('atm') else '—'),
                       ('Ball weight', f"{v['ball']:,} kg" if v.get('ball') else '—'),
                       ('Payload', f"{v['atm']-v['tare']:,} kg" if v.get('atm') and v.get('tare') else '—'),
                       ('Axle', v['axle']), ('Condition', 'Pre-loved' if v['used'] else 'New'), ('Location', v['state'])])
    similar = [x for x in DATA['vans'] if x['chassis'] != v['chassis'] and x['model'] == v['model']][:3]
    sim = ''.join(f'''<a class="simcard" style="text-decoration:none" href="{x['chassis'].lower()}.html">
        <div style="aspect-ratio:16/10;background:var(--line)"><img src="{asrc(x['images'][0])}" alt="{x['name']}" loading="lazy" width="420" height="262" style="width:100%;height:100%;object-fit:cover;display:block"></div>
        <div style="padding:15px">
          <div style="font:500 10.5px/1 'Gordita',sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--olink);margin-bottom:7px">{x['model']} {x['code'].replace(' ()','').strip()}</div>
          <div class="av" style="font-size:14px;line-height:1.3;letter-spacing:.02em;text-transform:uppercase;color:var(--svink);margin-bottom:10px">{x['name']}</div>
          <div style="font:500 15.5px/1 'Gordita',sans-serif;color:var(--svink)">{money(x['price'])}</div>
          <div style="margin-top:8px;font:400 12.5px/1 'Gordita',sans-serif;color:var(--body)">{x['state']}</div>
        </div></a>''' for x in similar)
    enq = f"../?van={v['chassis']}#enquire"
    return HEAD.format(title=f"{name} {v['chassis']}") + headerV + f'''
<div style="padding-top:20px;display:flex;align-items:center;gap:10px;font:400 12px/1 'Gordita',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)" class="gutter shellpad">
  <a class="linkbtn" style="letter-spacing:.14em;text-transform:uppercase" href="../">Stock vans</a>
  <span>/</span><a class="linkbtn" style="letter-spacing:.14em;text-transform:uppercase" href="./">Pages</a>
  <span>/</span><span style="color:var(--svink)">{v['chassis']}</span>
</div>
<div class="wrap shell" style="padding:22px 0 0">
  <div style="flex:1 1 560px;min-width:0;padding:0 46px 0 0" class="vp-left">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
      {badge}
      <span style="font:400 12.5px/1 'Gordita',sans-serif;color:var(--mut)">Stock no. {v['chassis']}</span>
    </div>
    <h1 class="av" style="margin:0 0 8px;font-size:42px;line-height:1.04;letter-spacing:.03em;text-transform:uppercase">{name}</h1>
    <p style="margin:0 0 22px;font:400 17px/1.65 'Gordita',sans-serif;color:var(--body);max-width:62ch">Built, finished and located in {v['state']}, ready to leave.</p>
    {gallery(v)}
    <div style="display:grid;gap:1px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));background:var(--svink);border-radius:4px;overflow:hidden;margin-bottom:38px">{strip}</div>
    {tow}
    {floor}
    <div style="margin-bottom:10px">
      <h2 class="av" style="margin:0 0 6px;font-size:24px;letter-spacing:.04em;text-transform:uppercase">Specifications</h2>
      <p style="margin:0 0 6px;font:400 14px/1.65 'Gordita',sans-serif;color:var(--body);max-width:60ch">Standard specification for the {v['model']} range. This van may include additional optioned upgrades, confirm the exact build with our team.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 6px">{incl}</div>
      {spec_sections(v)}
    </div>
    <div style="background:var(--cream);border:1px solid var(--line);border-radius:4px;padding:26px;margin:38px 0">
      <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
        <div style="min-width:0">
          <div style="font:500 11px/1 'Gordita',sans-serif;letter-spacing:.26em;text-transform:uppercase;color:var(--olink);margin-bottom:12px">Where it is</div>
          <div class="av" style="font-size:17px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:10px">{v['state']}</div>
          <div style="font:400 14.5px/1.7 'Gordita',sans-serif;color:var(--body)">This van is with our {v['state']} dealer. Enquire and we will set up a walkthrough in person or on a call.</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:9px;flex:none">
          <a class="btn-dark" style="display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff" href="{enq}">Book a viewing</a>
          <a class="btn-line" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="https://wonderlandrv.com.au/build-your-caravan/">Build your caravan</a>
        </div>
      </div>
    </div>
    <div style="padding-bottom:66px">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:20px">
        <h2 class="av" style="margin:0;font-size:24px;letter-spacing:.04em;text-transform:uppercase">Similar vans in stock</h2>
        <a class="linkbtn" style="letter-spacing:.16em;text-transform:uppercase;font-weight:500" href="../">See all stock</a>
      </div>
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">{sim}</div>
    </div>
  </div>
  <aside class="detailside" style="flex:1 1 300px;max-width:380px;padding:0 0 66px 0;position:sticky;top:20px;align-self:flex-start">
    <div style="border:1px solid var(--line2);border-radius:4px;overflow:hidden;background:#fff">
      <div style="padding:24px 22px;border-bottom:1px solid var(--line)">
        <div style="font:400 11px/1 'Gordita',sans-serif;letter-spacing:.26em;text-transform:uppercase;color:var(--mut);margin-bottom:12px">Drive away</div>
        <div class="av" style="font-size:30px;line-height:1;letter-spacing:-.02em">{money(v['price'])}</div>
        {f'<div style="margin-top:10px;display:flex;align-items:baseline;gap:10px"><span style="font:400 14px/1 |G|,sans-serif;color:var(--mut);text-decoration:line-through">{money(v["was"])}</span><span style="font:500 13px/1 |G|,sans-serif;color:var(--olink)">Save {money(v["was"]-v["price"])}</span></div>'.replace('|G|', chr(39)+'Gordita'+chr(39)) if v.get('was') and v.get('price') else ''}
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:9px">
        <a class="btn-orange" style="display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff;text-align:center" href="{enq}">Enquire about this van</a>
        <a class="btn-dark" style="display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff" href="tel:+61386920032">Call (03) 8692 0032</a>
      </div>
      <div style="padding:0 22px 22px">{facts}</div>
    </div>
    <div style="margin-top:14px;background:var(--cream);border:1px solid var(--line);border-radius:4px;padding:18px">
      <div style="font:400 13.5px/1.65 'Gordita',sans-serif;color:var(--body)">Three year factory-backed warranty and aftersales support wherever you are in the country. Same as a custom build.</div>
    </div>
  </aside>
</div>
''' + footerV + '''
<script src="../assets/vanpage.js"></script>
</body>
</html>'''

def index_page():
    groups = [('Stock van', 'Stock vans'), ('Clearance', 'Clearance'), ('Pre-loved', 'Pre-loved')]
    out = []
    for key, title in groups:
        vans = [v for v in DATA['vans'] if ('Pre-loved' if v['used'] else ('Clearance' if int(v.get('year') or 2026) < 2026 else 'Stock van')) == key]
        if not vans: continue
        cards = ''.join(f'''<a href="{v['chassis'].lower()}.html" class="pagecard" style="text-decoration:none;background:#fff;border:1px solid var(--line2);border-radius:4px;overflow:hidden;display:flex;flex-direction:column;font-family:'Gordita',sans-serif">
          <div style="position:relative;aspect-ratio:16/10;background:var(--line)">
            <img src="{asrc(v['images'][0])}" alt="{v['name']}" loading="lazy" width="420" height="262" style="width:100%;height:100%;object-fit:cover;display:block">
            <span style="position:absolute;left:10px;top:10px;background:{'#4A5560' if v['used'] else ('#C0392B' if int(v.get('year') or 2026)<2026 else '#12171C')};color:#fff;font:500 9px/1 'Gordita',sans-serif;letter-spacing:.18em;text-transform:uppercase;padding:6px 9px;border-radius:2px">{'Pre-loved' if v['used'] else ('Clearance' if int(v.get('year') or 2026)<2026 else 'Ready now')}</span>
            <span style="position:absolute;right:10px;bottom:10px;background:rgba(6,9,12,.74);color:#fff;font:400 10px/1 'Gordita',sans-serif;letter-spacing:.08em;padding:6px 8px;border-radius:2px">{len(v['images'])} photos</span>
            {'<img src="../assets/coty-jca.png" alt="Caravan of the Year 2026 Judges Choice Award" width="526" height="1288" loading="lazy" style="position:absolute;top:0;right:14px;width:88px;height:auto;filter:drop-shadow(0 4px 10px rgba(0,0,0,.38))">' if v['model']=='Solara' else ''}
          </div>
          <div style="padding:16px;display:flex;flex-direction:column;flex:1">
            <div style="font:500 10.5px/1 'Gordita',sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--olink);margin-bottom:8px">{v['chassis']} · {v['model']}</div>
            <div class="av" style="font-size:14.5px;line-height:1.3;letter-spacing:.02em;text-transform:uppercase;color:var(--svink);margin-bottom:12px">{v['name']}</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px">{''.join(f'<span style="background:#F2EEE8;color:var(--body2);font:400 12px/1 |Gordita|,sans-serif;padding:7px 9px;border-radius:2px">{t}</span>' for t in [str(v.get('sleeps') or '') and f"{v['sleeps']} sleeps", v.get('length'), v['axle'], v['layout']] if t)}</div>
            <div style="margin-top:auto;display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-top:13px;border-top:1px solid var(--line)">
              <span style="font:500 16.5px/1 'Gordita',sans-serif;color:var(--svink);font-variant-numeric:tabular-nums">{money(v['price'])}</span>
              <span style="font:500 11px/1 'Gordita',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--olink)">Open page →</span>
            </div>
          </div>
        </a>'''.replace('|Gordita|', "'Gordita'") for v in vans)
        out.append(f'''<div style="margin-bottom:44px">
          <div style="display:flex;align-items:baseline;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--svink);margin-bottom:22px">
            <h2 class="av" style="margin:0;font-size:19px;letter-spacing:.05em;text-transform:uppercase">{title}</h2>
            <span style="font:400 13px/1 'Gordita',sans-serif;color:var(--mut);font-variant-numeric:tabular-nums">{len(vans)} pages</span>
          </div>
          <div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">{cards}</div>
        </div>''')
    n = len(DATA['vans'])
    return HEAD.format(title='Stock van pages') + headerV + f'''
<div style="background:var(--svink);padding-top:56px;padding-bottom:56px" class="gutter shellpad">
  <div style="font:500 10px/1 'Gordita',sans-serif;letter-spacing:.42em;text-transform:uppercase;color:var(--peach);margin-bottom:16px">Detail pages</div>
  <h1 class="av" style="margin:0;font-size:42px;line-height:1;letter-spacing:-.01em;color:#fff">One page per van</h1>
  <p style="margin:14px 0 0;max-width:58ch;font:400 15.5px/1.65 'Gordita',sans-serif;color:rgba(255,255,255,.78)">{n} stock vans, each with its own photos, weights, floorplan and drive-away price.</p>
  <a class="linkbtn" style="display:inline-block;margin-top:22px;color:var(--peach);font:500 11px/1 'Gordita',sans-serif;letter-spacing:.16em;text-transform:uppercase" href="../">← Back to all stock</a>
</div>
<div style="padding-top:44px;padding-bottom:44px" class="gutter shellpad">{out and ''.join(out)}</div>
''' + footerV + '''
</body>
</html>'''

os.makedirs('vans', exist_ok=True)
for v in DATA['vans']:
    open(f"vans/{v['chassis'].lower()}.html", 'w').write(van_page(v))
open('vans/index.html', 'w').write(index_page())
print(f"generated {len(DATA['vans'])} van pages + index")
