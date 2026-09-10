"""Prefix every selector in a CSS string with #wlstock so page CSS out-specifies
theme/Elementor kit rules inside WordPress. Keeps :root, html and @font-face global."""
import re

def _prefix_selector(sel):
    s = sel.strip()
    if not s: return s
    low = s.lower()
    if low.startswith(':root') or low == 'html' or low.startswith('html:') or low.startswith('html.'):
        return s
    if low == '*':
        return '#wlstock, #wlstock *'
    if low.startswith('html,') or low.startswith('html ,'):
        rest = s.split(',',1)[1].strip()
        return _prefix_selector(rest)
    if low == 'body' or re.match(r'^body\s*$', low):
        return '#wlstock'
    m = re.match(r'^(body(?:\.[\w-]+|\[[^\]]+\])*)(\s+.*)?$', s)
    if m:
        head, rest = m.group(1), (m.group(2) or '')
        if head.lower() == 'body':
            return '#wlstock' + rest if rest else '#wlstock'
        # body.state — keep on real body, scope the descendant part
        return head + (' #wlstock' + rest if rest else '')
    if '#wlstock' in s:
        return s
    return '#wlstock ' + s

def _split_selectors(text):
    parts, depth, cur = [], 0, ''
    for ch in text:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur); cur = ''
        else:
            cur += ch
    parts.append(cur)
    return parts

def scope_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    def block_end(j):  # j at '{'; return index after matching '}'
        d = 0
        while j < n:
            if css[j] == '{': d += 1
            elif css[j] == '}':
                d -= 1
                if d == 0: return j+1
            j += 1
        return n
    while i < n:
        m = re.compile(r'[^{}]*?(?=\{)|\s*\}', re.S).match(css, i)
        if not m:
            out.append(css[i:]); break
        seg = m.group(0)
        if seg.strip() == '}':
            out.append(seg); i = m.end(); continue
        sel = seg
        j = m.end()  # at '{'
        stripped = sel.strip()
        if stripped.startswith('@'):
            at = stripped.lower()
            if at.startswith('@media') or at.startswith('@supports'):
                end = block_end(j)
                inner = css[j+1:end-1]
                out.append(sel + '{' + scope_css(inner) + '}')
                i = end; continue
            else:  # @font-face, @keyframes, @import etc: copy verbatim
                end = block_end(j)
                out.append(css[i:end]); i = end; continue
        end = block_end(j)
        body_ = css[j:end]
        new_sel = ', '.join(_prefix_selector(p) for p in _split_selectors(stripped))
        out.append(sel.replace(stripped, new_sel, 1) + body_)
        i = end
    return ''.join(out)

if __name__ == '__main__':
    t = "html{font-size:66px}:root{--x:1}body{color:#000}a{color:var(--olink)}@media(min-width:901px){html{font-size:10px}body.lock{overflow:hidden}body.lock .rail{top:0}.a,.b:hover{x:y}}@font-face{font-family:'G';src:url(x)}*{box-sizing:border-box}"
    print(scope_css(t))
