#!/usr/bin/env python3
"""Ana's 3 Nov 2026 email (yellow rows of the Autogate listings tab) -> data.js (local only, no live write).
Adds WL1240, WL1216, WL1329, WL1346, WL1239, WL1250, WL1336, WL1249. Piyush 5 Nov: publish with the 3D layout render as the
photo where Autogate has only one photo, and say more photos are coming. Layout codes come from Ana's sheet (the Autogate ad
titles carry wrong codes; the ad descriptions and photos agree with the sheet). Prices, weights and specs come from the ads.
Re-runnable: replaces records by chassis. Run from the repo root."""
import json, os, re, ast
HERE = os.path.dirname(os.path.abspath(__file__))
L2 = json.load(open(os.path.join(HERE, 'autogate-listings-2026-11-02.json')))
L5 = json.load(open(os.path.join(HERE, 'autogate-listings-2026-11-05.json')))
BY = {o['stock']: o for o in L2 if o.get('stock')} | {o['stock']: o for o in L5}
SUF = '?pxc_method=gravityfill&pxc_bgtype=self&pxc_size=1600,1067'
def imgs(stock):
    u = BY[stock]['imgs']; u = ast.literal_eval(u) if isinstance(u, str) else u
    return [i + SUF for i in u]
def kg(s):
    m = re.search(r'([\d,]+)\s*kg', str(s or '')); return int(m.group(1).replace(',', '')) if m else None
def m_(s):
    m = re.search(r'([\d.]+)\s*m', str(s or '')); return float(m.group(1)) if m else None

SECT = ["Construction", "Chassis & Suspension", "Electrical", "Plumbing", "Appliances", "Optional upgrades fitted"]
HEAD_MAP = {'CONSTRUCTION': 0, 'CHASSIS': 1, 'ELECTRICAL': 2, 'PLUMBING': 3, 'EXTERNAL': 4, 'INTERNAL': 4, 'BUNK LAYOUTS': 4, 'WEIGHTS': None}
def spec_from_comments(text):
    """Split the dealer's ad text into the page's six sections. EXTERNAL, INTERNAL and BUNK lines go under Appliances & fit-out."""
    out = [[] for _ in SECT]; cur = None
    for raw in text.split('\n'):
        line = raw.strip().strip('*').strip()
        if not line: continue
        key = line.upper().rstrip(':')
        if key in HEAD_MAP: cur = HEAD_MAP[key]; continue
        if cur is None: continue
        if line.lower().startswith('disclaimer'): break
        line = re.sub(r'\s+', ' ', line).replace(' - ', ', ').replace('–', ',').replace('Pannel', 'Panel').replace('Aluminum', 'Aluminium')
        if line.upper() in ('TARE', 'ATM'): continue
        out[cur].append(line)
    return [[SECT[i], out[i]] for i in range(6)]

def layout_assets(code):
    """No render exists yet for 2004EW-F2.4 and 2107EW-F4.2 (checked 3D LAYOUTS 2025 + 2026, 5 Nov 2026): those vans get no floorplan until Piyush picks one."""
    c = code.replace('.', '-')
    if not os.path.exists(f'assets/layouts/{c}_tilt.png'): return None, []
    tag = f'assets/layouts/{c}_tag.png'
    plans = [f'assets/layouts/{c}_tilt.png', f'assets/layouts/{c}_top.png'] + ([tag] if os.path.exists(tag) else [])
    return f'assets/layouts/{c}.png', plans

s = open('data.js', encoding='utf-8').read()
pre = s[:s.index('const DATA = ') + 13]; j0 = s.index('const DATA = ') + 13; j1 = s.index(';\nconst OR_TOKEN')
D = json.loads(s[j0:j1]); suf = s[j1:]
vans = {v['chassis']: v for v in D['vans']}
sold = json.load(open('sold.json'))
old = {x['chassis']: x for x in sold}

def rec(stock, model, code, name, length, layout, state, price, sleeps, eta, tare=None, atm=None, ball=None, travel=None,
        images=None, photos_note=False, spec=None, year='2026'):
    fp, plans = layout_assets(code)
    imgs_ = images if images is not None else imgs(stock)
    r = dict(chassis=stock, model=model, code=code, name=name, year=year, length=length, layout=layout, state=state, used=False,
             price=price, images=imgs_, listing=BY[stock]['url'], tare=tare, atm=atm, ball=ball, sleeps=sleeps, axle='Tandem axle',
             floorplan=fp, was=None, floorplans=plans, travel=travel, spec_override=spec, spec_source='ana', eta=eta)
    if photos_note: r['photos_note'] = True
    return r

# Hero = 3D tilt render when the ad has one photo (Piyush 5 Nov), then the ad photo(s).
def render_first(stock, code):
    c = code.replace('.', '-'); t = f'assets/layouts/{c}_tilt.png'
    return ([t] if os.path.exists(t) else []) + imgs(stock)

A2 = {o['stock']: o for o in L2 if o.get('stock')}
new = [
 rec('WL1240', 'Solara', '1806Q-M-L', 'Solara 1806 Couples', '18\'06"', 'Couples', 'Western Australia', 212042.0, 2, 'November 2026',
     tare=kg(A2['WL1240'].get('tare')), atm=3500, ball=kg(A2['WL1240'].get('ball')), travel=m_(A2['WL1240'].get('travelL')),
     images=render_first('WL1240', '1806Q-M-L'), photos_note=True, spec=spec_from_comments(A2['WL1240']['comments'])),
 rec('WL1216', 'Hornet', '1907Q1-F2.0', 'Hornet 1907 Double Bunk Family', '19\'07"', 'Family', 'Victoria', 179999.0, 4, 'November 2026',
     tare=kg(A2['WL1216'].get('tare')) or old['WL1216']['tare'], atm=3500, ball=kg(A2['WL1216'].get('ball')), travel=old['WL1216'].get('travel'),
     images=old['WL1216']['images'], spec=spec_from_comments(A2['WL1216']['comments'])),
 rec('WL1329', 'Amaroo', '2110Q3-F2.4', 'Amaroo 2110 Double Bunk Family', '21\'10"', 'Family', 'Victoria', 164160.0, 4, 'December 2026',
     tare=kg(A2['WL1329'].get('tare')), atm=3500, ball=kg(A2['WL1329'].get('ball')), travel=m_(A2['WL1329'].get('travelL')),
     spec=spec_from_comments(A2['WL1329']['comments'])),
 rec('WL1346', 'Amaroo', '2004EW-F2.4', 'Amaroo 2004 Rear Bunk Family', '20\'04"', 'Family', 'Victoria', 154999.0, 4, 'November 2026',
     atm=3500, travel=8.3, images=render_first('WL1346', '2004EW-F2.4'), photos_note=True, spec=spec_from_comments(BY['WL1346']['comments'])),
 rec('WL1239', 'Amaroo', '2107EW-F4.2', 'Amaroo 2107 Triple Bunk Family', '21\'07"', 'Family', 'Victoria', 164999.0, 5, 'December 2026',
     tare=2900, atm=3500, ball=180, travel=8.9, images=render_first('WL1239', '2107EW-F4.2'), photos_note=True, spec=spec_from_comments(BY['WL1239']['comments'])),
 rec('WL1250', 'Amaroo', '2206EW-F2.2', 'Amaroo 2206 East-West Double Bunk Family', '22\'06"', 'Family', 'Victoria', 164999.0, 4, 'December 2026',
     tare=old['WL1250'].get('tare'), atm=3500, travel=old['WL1250'].get('travel'), images=render_first('WL1250', '2206EW-F2.2'), photos_note=True,
     spec=spec_from_comments(BY['WL1250']['comments'])),
 rec('WL1336', 'Amaroo', '2106EW-F2.4', 'Amaroo 2106 Rear Bunk Family', '21\'06"', 'Family', 'Victoria', None, 4, 'November 2026',
     tare=2850, atm=3500, ball=160, travel=8.9, images=render_first('WL1336', '2106EW-F2.4'), photos_note=True, spec=spec_from_comments(BY['WL1336']['comments'])),
 rec('WL1249', 'Hornet', '2111EWL-F4.6', 'Hornet 2111 Quad Bunk Electric Lift Bed', '21\'11"', 'Family', 'Victoria', None, 6, 'December 2026',
     atm=4500, travel=9.3, images=render_first('WL1249', '2111EWL-F4.6'), photos_note=True, spec=spec_from_comments(BY['WL1249']['comments'])),
]
for r in new:
    if not r['floorplans']: print('NOTE no render for', r['chassis'], r['code'], '(ad photo only)')
    vans[r['chassis']] = r
D['vans'] = list(vans.values())
open('data.js', 'w', encoding='utf-8').write(pre + json.dumps(D, indent=1, ensure_ascii=False) + suf)
for r in new:
    print(r['chassis'], r['name'], r['code'], r['price'], r['eta'], 'imgs', len(r['images']), 'spec lines', [len(x[1]) for x in r['spec_override']])
print('vans now', len(D['vans']))
