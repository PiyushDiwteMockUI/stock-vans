import json, re, html as H

# ---- data ----
raw=open('data.js').read()
i=raw.find('{'); d=0
for k in range(i,len(raw)):
    if raw[k]=='{': d+=1
    elif raw[k]=='}':
        d-=1
        if d==0: break
vans=json.loads(raw[i:k+1])['vans']
URLS=json.load(open('email-prod/wp-urls.json'))
W=lambda n: URLS[n]
tmpl=open('send-test.html').read()

AR="arial, 'helvetica neue', helvetica, sans-serif"
STAGING="https://piyushdiwtemockui.github.io/stock-vans/"

def money(x):
    return "${:,.0f}".format(x) if x==int(x) else "${:,.2f}".format(x)

def dealer(v):
    s=v['state']
    if s=='Queensland': return ("at <strong>Aussie Escape Caravans</strong>, our Queensland dealer","at our Queensland dealer")
    if s=='New South Wales': return ("at <strong>Off Grid Outfitters</strong>, our New South Wales dealer","at our New South Wales dealer")
    if s=='Victoria': return ("at our <strong>Campbellfield showroom</strong> in Melbourne","at our Campbellfield showroom")
    return ("at our Western Australia dealer","at our WA dealer")

def similar(v):
    others=[o for o in vans if o['chassis']!=v['chassis']]
    same=[o for o in others if o['layout']==v['layout'] and o['state']==v['state']]
    pool=same if len(same)>=2 else same+[o for o in others if o['layout']==v['layout'] and o['state']!=v['state']]
    if len(pool)<2: pool=pool+[o for o in others if o not in pool]
    ref=v['price'] or 150000
    pool.sort(key=lambda o: abs((o['price'] or 150000)-ref))
    return pool[:2]

TILT_OVERRIDE={'WL1216':'1907Q1-F2-0','WL1250':'2206EW-F2-2','WL1296':'1907Q1-F3-0'}
def tiltname(v):
    if v['chassis'] in TILT_OVERRIDE:
        code=TILT_OVERRIDE[v['chassis']]
        return f"stockmail-tilt-{code}.png", code
    tilts=[p for p in (v.get('floorplans') or []) if p.endswith('_tilt.png')]
    if not tilts: return None, None
    code=tilts[0].split('/')[-1].replace('_tilt.png','')
    return f"stockmail-tilt-{code}.png", code

def spec(v):
    def f(x,suf=''):
        return (str(x)+suf) if x not in (None,'','None') else '&mdash;'
    return f(v.get('sleeps')), f(v.get('tare'),' kg'), f(v.get('atm'),' kg'), f(v.get('travel'),' m')

def vanpage(v):
    return f"https://wonderlandrv.com.au/stock/vans/{v['chassis'].lower()}.html"

# ---- build one van's email body from the template ----
def build(v):
    h=tmpl
    ch=v['chassis']
    dlr_long, dlr_short = dealer(v)
    tilt_file, tilt_code = tiltname(v)
    s1,s2,s3,s4=spec(v)

    # greeting personalisation back to AC tags
    h=h.replace('Hi Piyush,','Hi %FIRSTNAME%,')
    h=h.replace('Wonderland RV, 46 Lara Way, Campbellfield VIC 3061','%SENDER-INFO-SINGLELINE%')

    # gif
    h=h.replace('https://piyushdiwtemockui.github.io/stock-vans/assets/mock-van-fade.gif', W(f"stockmail-{ch}-fade.gif"))
    h=h.replace('alt="Solara Full Composite 2006 Couple Van"', f'alt="{H.escape(v["name"])}"')
    # intro
    h=h.replace('We&rsquo;re glad to know you&rsquo;re interested in the <strong>Solara Full Composite 2006 Couple Van</strong>. This van is currently located at <strong>Aussie Escape Caravans</strong>, our Queensland dealer.',
                f'We&rsquo;re glad to know you&rsquo;re interested in the <strong>{H.escape(v["name"])}</strong>. This van is currently located {dlr_long}.')
    # name lockup
    h=h.replace('https://piyushdiwtemockui.github.io/stock-vans/assets/name-wl1223.png', W(f"stockmail-{ch}-name.png"))
    h=h.replace('alt="SOLARA FULL COMPOSITE 2006 COUPLE VAN"', f'alt="{H.escape(v["name"].upper())} {v["code"]}"')
    # meta line
    h=re.sub(r'<strong style="color:#1D1D1B">Stock no\. WL1223</strong>[^<]*</p>',
             f'<strong style="color:#1D1D1B">Stock no. {ch}</strong> &nbsp;&middot;&nbsp; {dlr_short} &nbsp;&middot;&nbsp; ready to go now</p>', h)
    # tilt
    if tilt_file:
        h=h.replace('https://piyushdiwtemockui.github.io/stock-vans/assets/layouts/2006Q-R-SC_tilt.png', W(tilt_file))
        h=h.replace('alt="2006Q-R-SC floorplan, 3D view"', f'alt="{tilt_code} floorplan, 3D view"')
    else:
        h=re.sub(r'<tr><td align="center" style="padding:20px 40px 0"><img src="https://piyushdiwtemockui\.github\.io/stock-vans/assets/layouts/2006Q-R-SC_tilt\.png"[^>]*></td></tr>\s*','',h)
    # price cluster
    if v.get('price'):
        h=h.replace('>$172,999<', f'>{money(v["price"])}<')
        if v.get('was') and v['was']>v['price']:
            h=h.replace('<s>$177,231</s>', f'<s>{money(v["was"])}</s>')
            h=h.replace('>SAVE $4,232<', f'>SAVE {money(v["was"]-v["price"])}<')
        else:
            h=re.sub(r'<p style="Margin:0;font-family:[^"]*font-size:13px[^"]*"><s>\$177,231</s></p>\s*<p style="Margin:2px 0 0;[^"]*">SAVE \$4,232</p>', '&nbsp;', h)
    else:
        h=h.replace('>$172,999<', '>Talk to us<')
        h=re.sub(r'<s>\$177,231</s>', '', h)
        h=h.replace('>SAVE $4,232<', '>Call for our best price<')
    # specs
    h=h.replace('font-weight:bold;color:#1D1D1B">2</p>', f'font-weight:bold;color:#1D1D1B">{s1}</p>',1)
    h=h.replace('>2,981 kg<', f'>{s2}<').replace('>4,500 kg<', f'>{s3}<').replace('>8.9 m<', f'>{s4}<')
    # take-another-look link
    h=h.replace('<a href="#"><img src="https://piyushdiwtemockui.github.io/stock-vans/assets/btn-look.png"', f'<a href="{vanpage(v)}"><img src="{W("stockmail-btn-look.png")}"')
    # video by state
    if v['state']=='New South Wales':
        h=h.replace('https://youtu.be/thFwJAod6Ng','https://youtu.be/EEjWG4iZ62E')
        h=h.replace('https://i.ytimg.com/vi/thFwJAod6Ng/maxresdefault.jpg','https://i.ytimg.com/vi/EEjWG4iZ62E/hqdefault.jpg')
    # similar vans
    a,b=similar(v)
    for card,(old_img,old_name,old_price) in zip((a,b), [
        ('https://jealstorage.blob.core.windows.net/easycarsblobcontainer/383/stockphoto/18238114.jpg?sv=2023-11-03&se=2027-01-04T12%3A47%3A49Z&sr=b&sp=r&sig=9WQf%2FfBu6IXxkICBMuKtMPO3Y9sHA8%2ByikZ4MWfor%2BI%3D','HORNET 1907 DOUBLE BUNK FAMILY','<strong style="color:#ffffff">$169,800</strong> drive away'),
        ('https://jealstorage.blob.core.windows.net/easycarsblobcontainer/383/stockphoto/18330682.jpg?sv=2023-11-03&se=2027-01-04T12%3A50%3A32Z&sr=b&sp=r&sig=9o9GUbPlpy4rcVmqvwsnmwzMq8r7HnItHwseeuXD%2BEE%3D','AMAROO 2206 DOUBLE BUNK FAMILY','<strong style="color:#ffffff">$154,999</strong> drive away')]):
        h=h.replace(old_img, W(f"stockmail-{card['chassis']}-thumb.png"))
        h=h.replace(old_name, H.escape(f"{card['model']} {card['name']}".upper()) if not card['name'].upper().startswith(card['model'].upper()) else H.escape(card['name'].upper()))
        pr=f'<strong style="color:#ffffff">{money(card["price"])}</strong> drive away' if card.get('price') else '<strong style="color:#ffffff">Talk to us</strong> for the price'
        h=h.replace(old_price, pr)
    # remaining staged assets -> WP
    swaps={'assets/wedge-top.png':'stockmail-wedge-top.png','assets/wedge-bot.png':'stockmail-wedge-bot.png','assets/btn-tour.png':'stockmail-btn-tour.png','assets/btn-call.png':'stockmail-btn-call.png','assets/btn-check.png':'stockmail-btn-check.png','assets/btn-viewmore.png':'stockmail-btn-viewmore.png','assets/tour-factory.png':'stockmail-tour-factory.png'}
    for old,new in swaps.items():
        h=h.replace(STAGING+old, W(new))
    # view-more link -> staging stock page
    h=h.replace('<a href="#"><img src="'+W("stockmail-btn-viewmore.png"), '<a href="https://wonderlandrv.com.au/stock-vans/"><img src="'+W("stockmail-btn-viewmore.png"))
    # body only (between <body> and </body>)
    m=re.search(r'<body[^>]*>(.*)</body>', h, re.S)
    return m.group(1)

blocks=[]
bodies={}
for v in vans:
    body=build(v)
    bodies[v['chassis']]=body
    blocks.append(f"%IF in_string('Van: {v['chassis']}', $AD_SOURCE)%\n{body}\n%/IF%")

# generic fallback (Not sure yet / General enquiry): strip van-specific parts from a body
g=bodies['WL1223']
g=re.sub(r'<img[^>]*-fade\.gif[^>]*>\s*','',g,count=1)                             # gif inside intro run
g=g.replace('We&rsquo;re glad to know you&rsquo;re interested in the <strong>'+ [v for v in vans if v['chassis']=='WL1223'][0]['name'].replace("'","&rsquo;") +'</strong>. This van is currently located at <strong>Aussie Escape Caravans</strong>, our Queensland dealer.',
            'We&rsquo;re glad to know you&rsquo;re interested in our stock vans.')
g=g.replace('One of our team members will be in touch soon to talk you through it and answer any questions.',
            'One of our team members will be in touch soon to talk you through what&rsquo;s available and answer any questions.')
g=re.sub(r"We&rsquo;re glad to know you&rsquo;re interested in the <strong>[^<]*</strong>\. This van is currently located [^.]*\.",
         'We&rsquo;re glad to know you&rsquo;re interested in our stock vans. They&rsquo;re built, priced and ready to go now.', g)
g=re.sub(r'<tr><td align="center"[^>]*style="padding:36px 40px 0">.*?</td></tr>\s*','',g,count=1,flags=re.S)   # name lockup + meta
g=re.sub(r'<tr><td[^>]*><img[^>]*stockmail-tilt[^>]*></td></tr>\s*','',g,count=1)  # tilt
g=re.sub(r'<tr><td[^>]*style="padding:0 40px">\s*<table.*?DRIVE AWAY.*?</table>\s*</td></tr>\s*','',g,count=1,flags=re.S)  # price+specs
g=re.sub(r'<tr><td align="center"[^>]*style="padding:20px 40px 40px">\s*<a[^>]*><img[^>]*btn-look[^>]*></a>\s*</td></tr>\s*','',g,count=1,flags=re.S)
g=g.replace('YOU&rsquo;RE HALFWAY THERE','YOU&rsquo;RE ON YOUR WAY')
g=g.replace('A COUPLE MORE WORTH A LOOK','A COUPLE WORTH A LOOK')
for key in ('Van: Not sure yet','Van: General stock van enquiry'):
    blocks.append(f"%IF in_string('{key}', $AD_SOURCE)%\n{g}\n%/IF%")
full=('<!DOCTYPE html>\n<html lang="en-AU">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your Wonderland RV stock van enquiry</title>'
      + re.search(r'<style>.*?</style>', tmpl, re.S).group(0)
      + '</head>\n<body style="margin:0;background:#f4f4f4">\n'
      + '\n'.join(blocks)
      + '\n</body>\n</html>')
open('email-prod/ac-message.html','w').write(full)
print("message size:", len(full)//1024, "KB;", len(blocks), "van blocks")
# sanity
assert full.count('%/IF%')==30 and full.count("%IF in_string('Van:")==30
leftover=re.findall(r'piyushdiwtemockui\.github\.io/stock-vans/(?!vans/|$)[^"\s]*', full)
from collections import Counter
print("staging refs left (should be van pages + index only):", Counter(x.split('/')[1].split('.')[0] if '/' in x else x for x in leftover).most_common(5))
