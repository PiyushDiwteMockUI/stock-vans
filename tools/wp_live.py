"""Push stock van builds to the live WordPress site (wonderlandrv.com.au) and take vans down.

Run from the repo root AFTER the build:
    python3 tools/gen_vans.py && python3 tools/build_live.py && python3 tools/build_wp_pages.py ; python3 tools/postfix_wp_pages.py
(build_wp_pages.py ends with a harmless KeyError 'len' on its stats line; files are already written.)

Commands:
    python3 tools/wp_live.py drift                 # compare live content.raw with wp-pages/*.html, back up live to ../live-backup-<date>/
    python3 tools/wp_live.py push wl1223 wl1173 …  # POST content, read back, check stored == build
    python3 tools/wp_live.py takedown wl684 …      # status -> draft (never delete) + 301 /stock/<slug>/ -> /stock/
    python3 tools/wp_live.py clearcache            # WP Engine clear_all_caches

Auth: WP application password for piyush@wonderlandrv.com.au read from ~/.claude/secrets/harvested-wp_app_pw.env
(never print it). A full Chrome User-Agent is required or WP Engine answers 403.
Rule: push ONE page, render-check it in a browser, then push the rest.
"""
import json, base64, os, sys, datetime, urllib.request, urllib.error
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
IDS={k:v for k,v in json.load(open(os.path.join(HERE,'wp_page_ids.json'))).items() if not k.startswith('_')}
pw=open(os.path.expanduser('~/.claude/secrets/harvested-wp_app_pw.env')).read().strip().split('=',1)[1].strip().strip('"').strip("'")
AUTH='Basic '+base64.b64encode(('piyush@wonderlandrv.com.au:'+pw).encode()).decode()
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
def req(method, path, body=None):
    r=urllib.request.Request('https://wonderlandrv.com.au/wp-json/'+path, data=json.dumps(body).encode() if body is not None else None,
        method=method, headers={'Authorization':AUTH,'User-Agent':UA,'Content-Type':'application/json','Accept':'application/json'})
    with urllib.request.urlopen(r, timeout=120) as resp: return json.load(resp)
def build(slug): return open(os.path.join(ROOT,'wp-pages',slug+'.html')).read()
META=json.load(open(os.path.join(ROOT,'wp-pages','meta.json'))) if os.path.exists(os.path.join(ROOT,'wp-pages','meta.json')) else {}
def drift():
    bk=os.path.join(ROOT,'..','live-backup-'+datetime.date.today().isoformat()); os.makedirs(bk,exist_ok=True)
    for slug,pid in IDS.items():
        p=req('GET',f'wp/v2/pages/{pid}?context=edit&_fields=content,status')
        if p['status']!='publish': continue
        raw=p['content']['raw']; open(os.path.join(bk,slug+'.html'),'w').write(raw)
        f=os.path.join(ROOT,'wp-pages',slug+'.html')
        same=os.path.exists(f) and raw.strip()==open(f).read().strip()
        print(('same ' if same else 'DIFF ')+slug, pid)
    print('live backup:',os.path.abspath(bk))
def push(slugs):
    for slug in slugs:
        pid=IDS[slug]; html=build(slug); m=META.get(slug,{})
        body={'content':html}
        if m.get('title'): body['title']=m['title']
        if m.get('excerpt'): body['excerpt']=m['excerpt']
        try: req('POST',f'wp/v2/pages/{pid}',body)
        except urllib.error.HTTPError as e: print(slug,'FAILED',e.code,e.read()[:200]); continue
        b=req('GET',f'wp/v2/pages/{pid}?context=edit&_fields=content,status,template,title,excerpt')
        print(slug,pid,'stored==build:',b['content']['raw'].strip()==html.strip(),b['status'],b['template'],'| title:',b['title']['raw'][:50],'| excerpt set:',bool(b['excerpt']['raw']))
def takedown(slugs):
    ex=req('GET','redirection/v1/redirect?per_page=200&filterBy%5Burl%5D=stock')['items']
    for slug in slugs:
        pid=IDS[slug]; req('POST',f'wp/v2/pages/{pid}',{'status':'draft'})
        url=f'/stock/{slug}/'; msg='redirect exists'
        # SEO (1 Oct 2026): send a sold van's URL to the closest live van of the same model (by price) so its ranking is not thrown away;
        # the sold record must already be in sold.json and removed from data.js before running takedown.
        target='/stock/'
        try:
            import re as _re
            src=open(os.path.join(ROOT,'data.js')).read(); live=json.loads(_re.search(r'^const DATA = (\{.*?\});\s*\nconst OR_TOKEN', src, _re.S).group(1))['vans']
            sold=[s for s in json.load(open(os.path.join(ROOT,'sold.json'))) if s['chassis'].lower()==slug]
            if sold:
                same=[v for v in live if v['model']==sold[0]['model']]
                if same: target='/stock/'+min(same,key=lambda v:abs(v['price']-sold[0]['price']))['chassis'].lower()+'/'
        except Exception as e: print('  target fallback /stock/ (',str(e)[:60],')')
        if not any(x['url']==url for x in ex):
            req('POST','redirection/v1/redirect',{'url':url,'match_type':'url','action_type':'url','action_code':301,'action_data':{'url':target},'group_id':1,'regex':False}); msg='redirect created -> '+target
        print(slug,pid,req('GET',f'wp/v2/pages/{pid}?context=edit&_fields=status')['status'],msg)
def clearcache(): print(req('POST','wpe/cache-plugin/v1/clear_all_caches',{}))
if __name__=='__main__':
    cmd,args=sys.argv[1],sys.argv[2:]
    {'drift':lambda:drift(),'push':lambda:push(args),'takedown':lambda:takedown(args),'clearcache':lambda:clearcache()}[cmd]()
