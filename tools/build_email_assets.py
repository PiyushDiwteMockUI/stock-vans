import re, json, os, io, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageOps

h=open('data.js').read()
i=h.find('{'); d=0
for k in range(i,len(h)):
    if h[k]=='{': d+=1
    elif h[k]=='}':
        d-=1
        if d==0: break
vans=json.loads(h[i:k+1])['vans']

F="/Users/piyushdiwte/Library/CloudStorage/OneDrive-WonderlandRVPtyLtd/Marketing - Documents/BRAND GUIDELINES/Branding Fonts/Aviano Sans Black.otf"
CH=(29,29,27,255); OR=(219,118,39,255)

def fetch(url):
    if not url.startswith('http'):
        return Image.open(url)
    req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read()))

def cover(im, w, hgt):
    im=ImageOps.exif_transpose(im).convert('RGB')
    r=max(w/im.width, hgt/im.height)
    im=im.resize((round(im.width*r), round(im.height*r)))
    x=(im.width-w)//2; y=(im.height-hgt)//2
    return im.crop((x,y,x+w,y+hgt))

def build_gif(v):
    out=f"email-prod/gifs/{v['chassis']}.gif"
    if os.path.exists(out): return 'cached'
    frames=[]
    for u in v['images'][:6]:
        try:
            frames.append(cover(fetch(u), 650, 366))
        except Exception as e:
            print(v['chassis'], 'img fail', str(e)[:60], flush=True)
        if len(frames)==3: break
    if len(frames)<2:
        return 'FAILED (photos)'
    seq=[]; dur=[]
    for a in range(len(frames)):
        b=(a+1)%len(frames)
        seq.append(frames[a]); dur.append(1700)
        for t in (0.33,0.66):
            seq.append(Image.blend(frames[a], frames[b], t)); dur.append(120)
    pal=[f.quantize(80, method=Image.MEDIANCUT) for f in seq]
    pal[0].save(out, save_all=True, append_images=pal[1:], duration=dur, loop=0, optimize=True)
    return f"{os.path.getsize(out)//1024}KB"

def measure(font,text,tracking):
    ws=[font.getbbox(c)[2]-font.getbbox(c)[0] if c!=' ' else font.getbbox('n')[2]//2+6 for c in text]
    return sum(ws)+tracking*(len(text)-1), ws

def draw_line(dr,font,text,tracking,x,y,fill):
    _,ws=measure(font,text,tracking)
    for c,cw in zip(text,ws):
        if c!=' ':
            bb=font.getbbox(c); dr.text((x-bb[0],y),c,font=font,fill=fill,stroke_width=1,stroke_fill=fill)
        x+=cw+tracking

def build_lockup(v):
    out=f"email-prod/lockups/{v['chassis']}.png"
    l1=v['name'].upper(); l2=v['code'].upper()
    fs=54
    while fs>30:
        f1=ImageFont.truetype(F,fs)
        w1,_=measure(f1,l1,6)
        if w1<=960: break
        fs-=2
    f1=ImageFont.truetype(F,fs); f2=ImageFont.truetype(F,max(30,int(fs*0.72)))
    w1,_=measure(f1,l1,6); w2,_=measure(f2,l2,10)
    a1,d1=f1.getmetrics(); a2,d2=f2.getmetrics()
    W=max(w1,w2)+40; H=(a1+d1)+16+(a2+d2)+30+10
    im=Image.new('RGBA',(W,H),(0,0,0,0)); dr=ImageDraw.Draw(im)
    draw_line(dr,f1,l1,6,(W-w1)//2,0,CH)
    draw_line(dr,f2,l2,10,(W-w2)//2,a1+d1+16,OR)
    dr.rectangle([((W-150)//2,H-10),((W+150)//2,H-2)],fill=OR)
    im.save(out)
    return f"{W//2}x{H//2}"

def build_thumb(v):
    out=f"email-prod/thumbs/{v['chassis']}.png"
    if os.path.exists(out): return 'cached'
    try:
        cover(fetch(v['images'][0]), 546, 364).save(out)  # 273 display 2x
        return 'ok'
    except Exception as e:
        return 'FAILED '+str(e)[:50]

manifest={}
for v in vans:
    ch=v['chassis']
    g=build_gif(v); lk=build_lockup(v); th=build_thumb(v)
    manifest[ch]={'gif':g,'lockup':lk,'thumb':th}
    print(f"{ch}: gif={g} lockup={lk} thumb={th}", flush=True)
json.dump(manifest, open('email-prod/build-log.json','w'), indent=1)
print("DONE")
