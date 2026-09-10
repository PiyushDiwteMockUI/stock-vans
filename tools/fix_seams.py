import re, sys

def main_rows(table_html):
    """split the inner html of the main table into top-level <tr> chunks"""
    rows=[]; depth=0; i=0; start=None
    for m in re.finditer(r'<table\b|</table>|<tr\b|</tr>', table_html):
        t=m.group(0)
        if t=='<table': depth+=1
        elif t=='</table>': depth-=1
        elif t=='<tr' and depth==0 and start is None: start=m.start()
        elif t=='</tr>' and depth==0 and start is not None:
            end=table_html.find('>', m.start())+1
            rows.append(table_html[start:end]); start=None
    return rows

def classify(row):
    if 'wedge-top' in row: return 'wtop'
    if 'wedge-bot' in row: return 'wbot'
    m=re.search(r'<td[^>]*>', row)
    td=m.group(0) if m else ''
    if 'bgcolor="#1D1D1B"' in td or 'background-color:#1D1D1B' in td: return 'dark'
    if 'class="em-img"' in row and ('fade.gif' in row or 'mock-van-fade' in row): return 'bleed'
    return 'white'

def get_img(row):
    m=re.search(r'<img[^>]*>', row)
    return m.group(0)

def inner_of(row):
    """content of the row's td"""
    m=re.match(r'\s*<tr[^>]*>\s*<td([^>]*)>(.*)</td>\s*</tr>\s*$', row, re.S)
    return m.group(1), m.group(2)

def transform(html):
    m=re.search(r'(<table role="presentation" width="650"[^>]*>)(.*?)(</table>\s*</td></tr></table>)', html, re.S)
    head, body, tail = m.group(1), m.group(2), m.group(3)
    rows=main_rows(body)
    out=[]; i=0
    AR="border-collapse:collapse"
    while i<len(rows):
        c=classify(rows[i])
        # detect run: optional bleed, optional wtop, 1+ dark, optional wbot
        j=i; parts={'bleed':[], 'wtop':None, 'dark':[], 'wbot':None}
        k=i
        if classify(rows[k])=='bleed' and k+1<len(rows) and classify(rows[k+1]) in ('dark','wtop'):
            parts['bleed'].append(rows[k]); k+=1
        if k<len(rows) and classify(rows[k])=='wtop' and k+1<len(rows) and classify(rows[k+1])=='dark':
            parts['wtop']=rows[k]; k+=1
        while k<len(rows) and classify(rows[k])=='dark':
            parts['dark'].append(rows[k]); k+=1
        if parts['dark'] and k<len(rows) and classify(rows[k])=='wbot':
            parts['wbot']=rows[k]; k+=1
        if parts['dark']:
            seg='<tr><td bgcolor="#ffffff" style="background-color:#ffffff;font-size:0;line-height:0;padding:0">\n'
            for b in parts['bleed']:
                img=get_img(b)
                img=img.replace('style="','style="margin-bottom:-1px;',1)
                seg+=img+'\n'
            if parts['wtop']:
                img=get_img(parts['wtop'])
                # keep any padding-top the wedge row had
                attrs,_=inner_of(parts['wtop'])
                pt=re.search(r'padding-top:(\d+px)', attrs or '')
                if pt: seg+=f'<div style="height:{pt.group(1)};line-height:{pt.group(1)};font-size:0">&nbsp;</div>\n'
                img=img.replace('style="','style="margin-bottom:-1px;',1)
                seg+=img+'\n'
            seg+=f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#1D1D1B" style="background-color:#1D1D1B;{AR}">\n'
            seg+='\n'.join(parts['dark'])
            seg+='\n</table>\n'
            if parts['wbot']:
                img=get_img(parts['wbot'])
                img=img.replace('style="','style="margin-top:-1px;',1)
                seg+=img+'\n'
            seg+='</td></tr>'
            out.append(seg)
            i=k
        else:
            out.append(rows[i]); i+=1
    newbody='\n'.join(out)
    return html[:m.start()]+head+newbody+tail+html[m.end():]

if __name__=='__main__':
    for f in sys.argv[1:]:
        h=open(f).read()
        h2=transform(h)
        open(f,'w').write(h2)
        print(f, 'runs merged; dark td rows now inside charcoal tables. size', len(h2)//1024, 'KB')
