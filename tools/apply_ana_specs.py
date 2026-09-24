"""Apply Ana's per-van spec template (6 sections) to every van in data.js.

- Vans with a sheet in Ana's workbook get her lines verbatim (tidied: no dashes, typos, dupes).
- Every other van gets the same 6-section sequence populated from the range-standard
  modelSpecs, with single/tandem "or" choices resolved from the van's axle.
- Sold vans (sheet name contains SOLD) are removed from the stock list (kept in sold.json).
- Prices come from Ana's sheet (locked rule); travel length + weights stay as they are
  (MD dimensions sheet / weighbridge tickets) and conflicts are only reported.
"""
import json, re, sys, os, openpyxl, html

# Pass the current workbook with ANA_XLSX=... (24 Sep 2026 sheet has no "(1)" in the name).
XLSX = os.environ.get("ANA_XLSX", "/Users/piyushdiwte/Downloads/WL RV WEBSITE STOCK VAN LISTING TEMPATE (1).xlsx")
SECT = ["Construction", "Chassis & Suspension", "Electrical", "Plumbing", "Appliances", "Optional upgrades fitted"]
FACT_RE = r'^(RRP|Drive away|Location|Stock no|Layout code|Layout|Length|Travel|Sleeps|Tare|ATM|Ball|Payload|Axle|Condition|CHASSIS)'
STATE = {'NSW': 'New South Wales', 'QLD': 'Queensland', 'VIC': 'Victoria', 'WA': 'Western Australia', 'PERTH': 'Western Australia', 'BRENDALE': 'Queensland'}

FIX = [
    (r'\s+', ' '), (r'supression', 'suppression'), (r'Lithiun', 'Lithium'), (r'electtical', 'electrical'),
    (r'\bpanty\b', 'pantry'), (r'delivering(\d)', r'delivering \1'), (r'(\d)A/h\b', r'\1Ah'), (r'(\d)a/h\b', r'\1Ah'),
    (r'(\d+L) – (\d+L)', r'\1 to \2'), (r'(\d+kg) – (\d+(?:\.\d+)?kg)', r'\1 to \2'), (r'(\d+L)-(\d+L)', r'\1 to \2'), (r' – ', ', '), (r'–', ','), (r'—', ','),
    (r' -(\d)', r', \1'), (r'\s*,\s*,', ','), (r'Cold tap', 'cold tap'), (r'\bby pass\b', 'bypass'),
    (r'(\d)"', r'\1″'), (r'\s+$', ''), (r'^\s+', ''), (r'\bvan\b', 'van'),
    # 24 Sep 2026 sheet typos
    (r'\bBreaks\b', 'Brakes'), (r'\bruisemaster', 'Cruisemaster'), (r'Crusimaster', 'Cruisemaster'), (r'redution', 'reduction'),
    (r'^(\d{3,4}) inverter', r'\1W inverter'), (r'^3\.5 [Ff]ront [Ll]oad(er)?', '3.5kg front loader'), (r'‐', '-'),
    (r'\bBy Pass\b', 'Bypass'), (r'\bby [Pp]ass\b', 'bypass'), (r'Molded', 'Moulded'), (r'\bD0-?45\b', 'DO45'), (r'\bsirocco\b', 'Sirocco'),
    (r'(\d)v\b', r'\1V'), (r'(\d)kw\b', r'\1kW'), (r'(\d)w\b', r'\1W'), (r'/ ', '/'), (r' - ', ', '),
]
CAPS_WORDS = {'sirocco': 'Sirocco', 'dexter': 'Dexter', 'bbq': 'BBQ', 'cs': 'CS', '12v': '12V', 'x': 'x'}
CAPS_FIX = {'Soft drawers': 'Soft close drawers', '4 x Sirocco': '4 x Sirocco fans'}

def uncaps(s):
    """Ana types some lines in ALL CAPS: turn them into sentence case, keeping brand words."""
    letters = re.sub(r'[^A-Za-z]', '', s)
    words = re.findall(r'[A-Za-z]{2,}', s)
    up = [w for w in words if w.isupper()]
    if not words or len(up) < max(1, len(words) - 1) or not any(len(w) >= 4 for w in up): return s
    out = []
    for i, w in enumerate(s.split(' ')):
        lw = w.lower(); out.append(CAPS_WORDS.get(lw, lw.capitalize() if i == 0 else lw))
    s = ' '.join(out)
    return CAPS_FIX.get(s, s)

def tidy(s):
    s = html.unescape(str(s))
    for a, b in FIX:
        s = re.sub(a, b, s)
    return uncaps(s)

def parse_sheets():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    out = {}
    for name in wb.sheetnames:
        if 'TEMPLATE' in name: continue
        ch = re.search(r'WL\d+', name).group(0)
        d = {'sold': 'SOLD' in name.upper(), 'sections': {}, 'facts': {}, 'title': None}
        cur = None
        for row in wb[name].iter_rows():
            cells = {c.column_letter: str(c.value).strip() for c in row if c.value is not None and str(c.value).strip()}
            if not cells: continue
            a, b = cells.get('A'), cells.get('B')
            if a and any(a.startswith(s) for s in SECT):
                cur = next(s for s in SECT if a.startswith(s)); d['sections'][cur] = []
                if b: d['sections'][cur].append(b)
                continue
            if a and re.match(FACT_RE, a, re.I):
                cur = None
                if b: d['facts'][a.rstrip(':').strip()] = b
                continue
            if a and a.startswith('Change to'):
                d['rename'] = (b or a.split('Change to', 1)[1]).strip(' "'); continue
            if cur and b: d['sections'][cur].append(b)
            elif cur and a and not b and cur in SECT and a not in ('Off Grid Outfitters -NSW', 'Aussie Escape Caravans-QLD', 'Outbound RVS-VIC', 'Outbound RVS -WA'):
                pass  # stray col-A text after a section: ignore (dealer list)
            elif b and d['title'] is None and not d['sections']: d['title'] = b
            elif a and d['title'] is None and not d['sections'] and not a.startswith('CHASSIS'): d['title'] = a
        # tidy + dedupe
        for k, items in d['sections'].items():
            seen, clean = set(), []
            for it in items:
                t = tidy(it)
                if t.lower() in seen: continue
                seen.add(t.lower()); clean.append(t)
            d['sections'][k] = clean
        out[ch] = d
    return out

def money(s):
    s = str(s).replace('$', '').replace(',', '').strip()
    if not re.search(r'\d', s): return None
    # Ana writes 156.990.00 -> 156990.00
    parts = s.split('.')
    if len(parts) >= 3:
        if any(len(g) != 3 for g in parts[1:-1]): return None  # e.g. 134.9990.00 = typo in sheet
        s = ''.join(parts[:-1]) + '.' + parts[-1]
    try: return float(s)
    except ValueError: return None

def num(s):
    m = re.search(r'[\d,]+(?:\.\d+)?', str(s))
    return float(m.group(0).replace(',', '')) if m else None

def state_of(loc):
    u = str(loc).upper()
    for k, v in STATE.items():
        if k in u: return v
    return None

# ---------- generic (range-standard) -> Ana's 6 sections ----------
LABEL_ALWAYS = {'Axle', 'Brakes', 'Chassis finish', 'Tow plug', 'Mood lighting and step light', 'Mood lighting & step light',
                'Water tank gauge', 'TV', 'Fans', 'Sink', 'Tapware', 'Shower screen frame', 'Fridge', 'Awning', 'Media', 'Insulation'}
SKIP_KEYS = {'Cladding colour – side'}
MAP = [
    ('Construction', ['Construction', 'Floor', 'Insulation', 'Alloy plate / side protection', 'Alloy plate', 'Outer trim', 'Entry door']),
    ('Chassis & Suspension', ['A-Frame, riser and chassis', 'Axle', 'Suspension', 'Brakes', 'Chassis finish', 'Hitch type', 'Hitch Type',
                              'Jockey wheel', 'Stabilising legs', 'Step', 'Bumper', 'Wheels and tyres', 'Chassis skid plates and recovery points',
                              'Water tank / jerry can holder', 'Water tank/jerry can holder', 'Jack']),
    ('Electrical', ['Electrical system', 'Electrical systems', 'Anderson plug', 'External GPO', 'Lighting – external', 'Lighting – external: 6 external lights',
                    'Lighting – internal', 'Media', 'Mood lighting and step light', 'Mood lighting & step light', 'Starlink provision', 'Starlink Provision',
                    'Tow plug', 'TV', 'TV antenna', 'Charging outlets', 'Charging Outlets', 'External entertainment pack']),
    ('Plumbing', ['Tank – fresh water', 'Tank – Fresh Water', 'Tank – drinking water', 'Tank – Drinking Water', 'Tank – grey water', 'Tank – Grey Water',
                  'Grey water bypass', 'Water filler and mains', 'Water tank gauge', 'External shower', 'External Shower', 'Gas bottles', 'Gas Bottles',
                  'BBQ bayonet and tap', 'BBQ bayonet', 'Hot water service', 'Heating and hot water service']),
    ('Appliances', ['Air Conditioner', 'Cooker', 'Fridge', 'Rangehood', 'Washing machine', 'Fans', 'Awning', 'Outdoor pantry', 'Outdoor Pantry', 'Picnic table',
                    'External Pantry', 'External slide-out kitchen at front tunnel boot', 'Dust reduction vent', 'Spare wheel with holder', 'Accessories pack',
                    'Shower and toilet hatch and exhaust fan', 'Shower screen frame', 'Sink', 'Tapware']),
]

def resolve_choice(key, val, axle):
    """Resolve single/tandem 'or;' alternatives using the van's axle; strip 'Choose from:'."""
    v = html.unescape(val)
    single = 'single' in (axle or '').lower()
    if 'single axle' in v.lower() and 'tandem axle' in v.lower():
        parts = re.split(r'\s+or;?\s+|\s{2,}|(?<=\))\s+(?=\d)', v.replace('Choose from:', '').strip())
        parts = [p.strip(' ;,') for p in parts if p.strip(' ;,')]
        want = 'single' if single else 'tandem'
        keep = [p for p in parts if want in p.lower()]
        if keep:
            v = ' or '.join(re.sub(r'\s*\((single|tandem) axle\)', '', k, flags=re.I) for k in keep)
    if key == 'Axle':
        v = axle or v
    if v.startswith('Choose from:') and key.lower().startswith('electrical'):
        body = v.replace('Choose from:', '').strip()
        opts = [o.strip(' .') for o in re.split(r'(?<=[a-z\d\.])\s+(?=(?:Redarc|Victron|Nexus & Victron|Enerdrive)\b)', body) if o.strip()]
        if len(opts) > 1:
            v = 'One of: ' + '; or '.join(opts)
    v = v.replace('Choose from:', '').strip()
    v = re.sub(r'\s+or;\s+', ' or ', v)
    return v

def generic_sections(model, specs, axle):
    flat = {html.unescape(k): v for sec in specs.values() for k, v in sec}
    out, used = [], set()
    for tab, keys in MAP:
        items = []
        for k in keys:
            if k in flat and k not in used and k not in SKIP_KEYS:
                used.add(k)
                v = tidy(resolve_choice(k, flat[k], axle))
                if v.lower() in ('various', ''): continue
                label = tidy(k).split(':')[0]
                if (k in LABEL_ALWAYS or len(v.split()) <= 3) and label.split()[0].lower() not in v.lower():
                    v = f"{label}: {v}"
                items.append(v)
        out.append([tab, items])
    leftover = [k for k in flat if k not in used and k not in SKIP_KEYS]
    out.append(['Optional upgrades fitted', ['Fitted upgrades for this van to be confirmed with our team.']])
    return out, leftover

def chips(sections, model, INCL):
    txt = {t: ' | '.join(i) for t, i in sections}
    el = txt.get('Electrical', ''); ch = txt.get('Chassis & Suspension', '')
    c = []
    m = re.search(r'(Redarc Alpha \d+|Enerdrive|Victron)', el)
    if m: c.append(f"{m.group(1)} off-grid power")
    if 'Cruisemaster' in ch:
        kind = 'ATX' if 'ATX' in ch else 'XT'
        c.append(f"Cruisemaster {kind} {'airbag' if re.search(r'air', ch, re.I) else 'coil'} suspension")
    elif 'Tuff' in ch: c.append('Tuff-Ride coil suspension')
    c.append('2 x 90-100L water tanks')
    return c if len(c) == 3 else INCL.get(model, c)

def main(write=False):
    src = open('data.js').read()
    m = re.search(r'const DATA = ([\s\S]*?);\s*(const OR_TOKEN[\s\S]*)$', src)
    DATA = json.loads(m.group(1)); tail = m.group(2)
    ana = parse_sheets()
    sold = [ch for ch, d in ana.items() if d['sold']]
    report = []
    kept = []
    for v in DATA['vans']:
        ch = v['chassis']
        if ch in sold:
            report.append(f"REMOVE {ch} ({v['model']} {v['code']}, {v['state']}) - marked sold in Ana's sheet")
            continue
        kept.append(v)
        a = ana.get(ch)
        if a and not a['sold'] and a['sections']:
            secs = [[s, a['sections'].get(s, [])] for s in SECT if a['sections'].get(s)]
            v['spec_override'] = secs; v['spec_source'] = 'ana'
            f = a['facts']
            price = money(f.get('Drive away price $', '')); was = money(f.get('RRP$', ''))
            diffs = []
            if price is None and re.search(r'\d', str(f.get('Drive away price $', ''))): diffs.append(f"FLAG Ana price cell unreadable: {f.get('Drive away price $')} - kept page {v.get('price')}")
            if price and abs((v.get('price') or 0) - price) > 1: diffs.append(f"price {v.get('price')} -> {price:.0f} (Ana)"); v['price'] = price
            if was and abs((v.get('was') or 0) - was) > 1: diffs.append(f"was {v.get('was')} -> {was:.2f} (Ana)"); v['was'] = was
            cond = str(f.get('Condition', '')).upper()
            if cond.startswith('USED') and not v.get('used'): diffs.append("used False -> True (Ana: demo)"); v['used'] = True
            st = state_of(f.get('Location', ''))
            if st and st != v.get('state'): diffs.append(f"state {v.get('state')} -> {st} (Ana)"); v['state'] = st
            sl = num(f.get('Sleeps'));
            if sl and int(sl) != v.get('sleeps'): diffs.append(f"sleeps {v.get('sleeps')} -> {int(sl)} (Ana)"); v['sleeps'] = int(sl)
            # report-only conflicts (locked sources win)
            # Piyush 14 Sep 2026: "ana sheet is correct use that" -> her length, weights and layout code win
            for key in ('Length', 'Travel Length'):
                if key in f and num(f[key]) and abs(num(f[key]) - (v.get('travel') or 0)) > 0.05:
                    diffs.append(f"travel {v.get('travel')} -> {num(f[key])} (Ana)"); v['travel'] = num(f[key])
            for key, fld in [('Tare', 'tare'), ('ATM', 'atm'), ('Ball weight', 'ball')]:
                if key in f and num(f[key]) and abs(num(f[key]) - (v.get(fld) or 0)) > 0.5:
                    diffs.append(f"{fld} {v.get(fld)} -> {int(num(f[key]))} (Ana)"); v[fld] = int(num(f[key]))
            if f.get('Layout code'):
                code = f['Layout code'].replace('_', '-').replace('‐', '-').replace('–', '-').strip(' ()')
                if code.upper() != v['code'].upper():
                    diffs.append(f"code {v['code']} -> {code} (Ana)"); v['code'] = code
            if f.get('Stock no') and f['Stock no'] != ch: diffs.append(f"FLAG Ana stock-no cell says {f['Stock no']} (sheet is {ch}) - typo in sheet")
            if a.get('rename'): diffs.append(f"rename -> {a['rename']}")
            report.append(f"ANA    {ch} {v['model']} {v['code']}: sections {[ (s, len(i)) for s, i in secs ]}; " + ('; '.join(diffs) or 'facts match'))
        else:
            secs, left = generic_sections(v['model'], DATA['modelSpecs'].get(v['model'], {}), v.get('axle'))
            v['spec_override'] = secs; v['spec_source'] = 'range'
            report.append(f"RANGE  {ch} {v['model']} {v['code']} axle={v.get('axle')}: {[ (s, len(i)) for s, i in secs ]}" + (f" unmapped={left}" if left else ''))
    DATA['vans'] = kept
    if write:
        json.dump([v for v in json.loads(m.group(1))['vans'] if v['chassis'] in sold], open('sold.json', 'w'), indent=1)
        open('data.js', 'w').write('const DATA = ' + json.dumps(DATA, indent=1, ensure_ascii=False) + ';\n' + tail)
    return report, DATA, ana

if __name__ == '__main__':
    rep, DATA, ana = main(write='--write' in sys.argv)
    print('\n'.join(rep))
    print('\nvans now:', len(DATA['vans']))
    if '--show' in sys.argv:
        for ch in sys.argv[sys.argv.index('--show') + 1].split(','):
            v = next(x for x in DATA['vans'] if x['chassis'] == ch)
            print(f"\n===== {ch} ({v['spec_source']})")
            for s, items in v['spec_override']:
                print(f"-- {s}")
                for i in items: print("   ", i)
