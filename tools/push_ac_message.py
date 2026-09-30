"""Push email-prod/ac-message.html to the ActiveCampaign stock enquiry messages (262 and 597).

Run AFTER tools/gen_ac_message.py, every time data.js changes (prices, vans added or removed).
    python3 tools/push_ac_message.py            # dry run: shows what would change, writes nothing
    python3 tools/push_ac_message.py --push     # backs up both messages, pushes, reads back, verifies

Facts (proven Sep 2026): v1 message_edit on these editor-v3 messages needs a list on the message (p[11]=11,
the internal "Test email (Piyush)" list) or it answers "You did not select any lists"; it decodes &amp; to &
in alt text (renders the same) and can blank the internal message name, which is restored with v3 PUT.
Never open 262 or 597 in the ActiveCampaign visual editor: a "repair" there once reverted 262 to old content.
AC key: ~/.claude/secrets/activecampaign.env (never printed). Backups: ac-update/backup-<date>-<id>.json
"""
import json, os, sys, re, datetime, urllib.request, urllib.parse
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
ENV={}
for line in open(os.path.expanduser('~/.claude/secrets/activecampaign.env')):
    line=line.strip()
    if '=' in line and not line.startswith('#'):
        k,v=line.split('=',1); ENV[k.strip()]=v.strip().strip('"').strip("'")
BASE=ENV['AC_BASE_URL'].rstrip('/'); TOKEN=[v for k,v in ENV.items() if 'KEY' in k or 'TOKEN' in k][0]
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
MESSAGES=(262,597); LIST=11

def v1(action, data=None, **params):
    q={'api_action':action,'api_output':'json','api_key':TOKEN, **params}
    body=urllib.parse.urlencode(data).encode() if data else None
    r=urllib.request.Request(BASE+'/admin/api.php?'+urllib.parse.urlencode(q), data=body, method='POST' if body else 'GET', headers={'User-Agent':UA,'Content-Type':'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(r, timeout=180) as resp: return json.load(resp)
def v3(method, path, body=None):
    r=urllib.request.Request(BASE+'/api/3/'+path, data=json.dumps(body).encode() if body is not None else None, method=method, headers={'Api-Token':TOKEN,'Content-Type':'application/json','Accept':'application/json','User-Agent':UA})
    with urllib.request.urlopen(r, timeout=120) as resp: return json.load(resp)

new=open(os.path.join(ROOT,'email-prod','ac-message.html'),encoding='utf-8').read()
push='--push' in sys.argv
os.makedirs(os.path.join(ROOT,'ac-update'),exist_ok=True)
stamp=datetime.date.today().isoformat()
for mid in MESSAGES:
    cur=v1('message_view', id=mid)
    old=cur.get('html') or ''
    bk=os.path.join(ROOT,'ac-update',f'backup-{stamp}-{mid}.json')
    open(bk,'w').write(json.dumps({k:v for k,v in cur.items() if k not in ('result_code','result_message','result_output')}))
    vans_old=sorted(set(re.findall(r"Van: (WL\d+)'", old))); vans_new=sorted(set(re.findall(r"Van: (WL\d+)'", new)))
    print(f"message {mid}: live {len(old)} chars, {len(vans_old)} van blocks | build {len(new)} chars, {len(vans_new)} van blocks | same={old.strip()==new.strip()} | backup {os.path.basename(bk)}")
    if vans_old!=vans_new: print('   vans removed:', sorted(set(vans_old)-set(vans_new)), '| added:', sorted(set(vans_new)-set(vans_old)))
    if not push or old.strip()==new.strip(): continue
    data={'id':mid,'format':cur.get('format') or 'mime','subject':cur['subject'],'fromname':cur['fromname'],'fromemail':cur['fromemail'],'reply2':cur.get('reply2') or cur['fromemail'],
          'priority':cur.get('priority') or 3,'charset':cur.get('charset') or 'utf-8','encoding':cur.get('encoding') or 'quoted-printable',
          'htmlconstructor':'editor','html':new,'textconstructor':'editor','text':cur.get('text') or '', f'p[{LIST}]':LIST}
    r=v1('message_edit', data=data)
    print('   message_edit:', r.get('result_code'), r.get('result_message'))
    back=v1('message_view', id=mid)
    got=back.get('html') or ''
    same=got.strip()==new.strip()
    if not same:
        # AC decodes &amp; in alt/text; compare with that normalised
        same=re.sub(r'&amp;','&',got).strip()==re.sub(r'&amp;','&',new).strip()
    print('   read-back stored==build:', same, '| name now:', repr(back.get('name')), '| subject:', back.get('subject'))
    if (back.get('name') or '')!=(cur.get('name') or '') and cur.get('name'):
        v3('PUT', f'messages/{mid}', {'message':{'name':cur['name']}}); print('   name restored via v3')
print('done' if push else 'dry run only, nothing written')
