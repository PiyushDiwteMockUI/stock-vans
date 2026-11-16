/* Google reviews badge + reviews panel for the stock van pages (16 Nov 2026).
   Reads window.WLREVIEWS (assets/reviews-data.js). Missing or malformed data: renders nothing.
   Nothing opens by itself. Nothing is stored (no cookies, no storage). Panel DOM and reviewer
   photos are only built and loaded on the first open. Every class is .wlrv-* (CSS in site.css). */
(function () {
  'use strict';
  try { init(); } catch (e) { /* a reviews error must never stop the page or the enquiry form */ }

  function init() {
    var D = window.WLREVIEWS;
    if (!valid(D)) return;
    if (document.getElementById('wlrv-root')) return;

    var NS = 'http://www.w3.org/2000/svg';
    var STAR = 'M12 2.2l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17l-5.9 3.4 1.2-6.6L2.4 9.2l6.7-.9z';
    var G_PATHS = [
      ['#EA4335', 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'],
      ['#4285F4', 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'],
      ['#FBBC05', 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'],
      ['#34A853', 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z']
    ];
    /* the badge's own G and star, drawn as in the Elfsight reference (16 Nov 2026) */
    var BADGE_G = "<svg fill=\"none\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\" class=\"wlrv-bg\"><g clip-path=\"url(#wlrvg-a1)\"><path fill=\"#fff\" stroke=\"#fff\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11.854 1.023c5.965 0 10.8 4.836 10.8 10.8v.4c0 5.965-4.835 10.8-10.8 10.8-5.964 0-10.8-4.835-10.8-10.8v-.4c0-5.964 4.836-10.8 10.8-10.8Z\"></path><path fill=\"url(#wlrvg-b3)\" d=\"M6.382 13.906a6.04 6.04 0 0 1-.307-1.909H1.998c0 1.517.343 2.946.947 4.227l.124.254v.009a10.063 10.063 0 0 0 1.889 2.604l4.47-1.674a6.119 6.119 0 0 1-3.046-3.511Z\"></path><path fill=\"url(#wlrvg-c4)\" d=\"M18.672 4.607c-1.734-1.618-3.987-2.609-6.684-2.609-.531 1.11-.62 2.771 0 3.981 1.471 0 2.78.51 3.824 1.491l2.86-2.863Z\"></path><path fill=\"url(#wlrvg-d5)\" d=\"M11.988 5.979h.095L11.988 2a9.936 9.936 0 0 0-7.645 3.576c.257 1.483.97 2.435 3.12 2.586 1.084-1.324 2.709-2.182 4.525-2.182Z\"></path><path fill=\"url(#wlrvg-e6)\" d=\"M15.357 17.06c-.89.6-2.025.963-3.369.963-.784 1.263-1.31 2.562 0 3.972 2.529 0 4.674-.783 6.295-2.139l.317-.278c1.483-1.37 2.473-3.244 2.83-5.46.099-.607.149-1.24.149-1.894l-2.265.3-1.913 1.35-.036.177a4.596 4.596 0 0 1-1.813 2.871l-.194.138Z\"></path><path fill=\"#3086FF\" d=\"M11.997 10.183v3.863l5.368.005a4.958 4.958 0 0 1-.014.067h4.08a11.894 11.894 0 0 0-.034-3.94h-6.9v.005h-2.5Z\"></path><path fill=\"url(#wlrvg-f7)\" d=\"m6.322 10.324.072-.227A6.136 6.136 0 0 1 8.112 7.48c-.93-.157-3.262-1.525-3.566-2.14a10.066 10.066 0 0 0-1.477 2.174A9.885 9.885 0 0 0 2 12.21c.723.312 3.082.37 4.08 0a5.927 5.927 0 0 1 .243-1.885Z\"></path><path fill=\"url(#wlrvg-g8)\" d=\"m8.03 2.816 1.713 3.623c-.754.322-1.43.8-1.99 1.392l-3.77-1.798A10.016 10.016 0 0 1 8.03 2.816Z\"></path><path fill=\"url(#wlrvg-h9)\" d=\"M11.988 18.023a5.733 5.733 0 0 1-3.047-.878l-1.56-.043c-1.84.488-2.373.882-2.54 1.872a9.934 9.934 0 0 0 7.147 3.021v-3.972Z\"></path><path fill=\"url(#wlrvg-i2)\" d=\"M11.988 21.995c.421 0 .832-.021 1.231-.064v-4.016c-.388.07-.799.108-1.231.108-.412 0-.814-.044-1.202-.128v4.029c.394.047.795.071 1.202.071Z\" opacity=\".5\"></path></g><defs><radialGradient id=\"wlrvg-b3\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-.39757 -10.0208 14.2942 -.60134 9.338 18.94)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".142\" stop-color=\"#1ABD4D\"></stop><stop offset=\".248\" stop-color=\"#6EC30D\"></stop><stop offset=\".312\" stop-color=\"#8AC502\"></stop><stop offset=\".366\" stop-color=\"#A2C600\"></stop><stop offset=\".446\" stop-color=\"#C8C903\"></stop><stop offset=\".54\" stop-color=\"#EBCB03\"></stop><stop offset=\".616\" stop-color=\"#F7CD07\"></stop><stop offset=\".699\" stop-color=\"#FDCD04\"></stop><stop offset=\".771\" stop-color=\"#FDCE05\"></stop><stop offset=\".861\" stop-color=\"#FFCE0A\"></stop></radialGradient><radialGradient id=\"wlrvg-c4\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(6.98036 -.00002 -.00001 8.69591 18.395 7.264)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".408\" stop-color=\"#FB4E5A\"></stop><stop offset=\"1\" stop-color=\"#FF4540\"></stop></radialGradient><radialGradient id=\"wlrvg-d5\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-9.6911 5.28673 7.28367 12.9529 14.733 .725)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".231\" stop-color=\"#FF4541\"></stop><stop offset=\".312\" stop-color=\"#FF4540\"></stop><stop offset=\".458\" stop-color=\"#FF4640\"></stop><stop offset=\".54\" stop-color=\"#FF473F\"></stop><stop offset=\".699\" stop-color=\"#FF5138\"></stop><stop offset=\".771\" stop-color=\"#FF5B33\"></stop><stop offset=\".861\" stop-color=\"#FF6C29\"></stop><stop offset=\"1\" stop-color=\"#FF8C18\"></stop></radialGradient><radialGradient id=\"wlrvg-e6\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-17.1717 -22.6188 -8.27422 6.39593 12.223 20.718)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".132\" stop-color=\"#0CBA65\"></stop><stop offset=\".21\" stop-color=\"#0BB86D\"></stop><stop offset=\".297\" stop-color=\"#09B479\"></stop><stop offset=\".396\" stop-color=\"#08AD93\"></stop><stop offset=\".477\" stop-color=\"#0AA6A9\"></stop><stop offset=\".568\" stop-color=\"#0D9CC6\"></stop><stop offset=\".667\" stop-color=\"#1893DD\"></stop><stop offset=\".769\" stop-color=\"#258BF1\"></stop><stop offset=\".801\" stop-color=\"#3086FF\"></stop></radialGradient><radialGradient id=\"wlrvg-f7\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-1.20389 10.4771 14.3476 1.68068 10.996 3.988)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".366\" stop-color=\"#FF4E3A\"></stop><stop offset=\".458\" stop-color=\"#FF8A1B\"></stop><stop offset=\".54\" stop-color=\"#FFA312\"></stop><stop offset=\".616\" stop-color=\"#FFB60C\"></stop><stop offset=\".771\" stop-color=\"#FFCD0A\"></stop><stop offset=\".861\" stop-color=\"#FECF0A\"></stop><stop offset=\".915\" stop-color=\"#FECF08\"></stop><stop offset=\"1\" stop-color=\"#FDCD01\"></stop></radialGradient><radialGradient id=\"wlrvg-g8\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-3.50897 3.94947 -10.9461 -10.0722 9.372 3.77)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".316\" stop-color=\"#FF4C3C\"></stop><stop offset=\".604\" stop-color=\"#FF692C\"></stop><stop offset=\".727\" stop-color=\"#FF7825\"></stop><stop offset=\".885\" stop-color=\"#FF8D1B\"></stop><stop offset=\"1\" stop-color=\"#FF9F13\"></stop></radialGradient><radialGradient id=\"wlrvg-h9\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-9.59911 -5.20571 7.21454 -12.7543 14.685 23.19)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".231\" stop-color=\"#0FBC5F\"></stop><stop offset=\".312\" stop-color=\"#0FBC5F\"></stop><stop offset=\".366\" stop-color=\"#0FBC5E\"></stop><stop offset=\".458\" stop-color=\"#0FBC5D\"></stop><stop offset=\".54\" stop-color=\"#12BC58\"></stop><stop offset=\".699\" stop-color=\"#28BF3C\"></stop><stop offset=\".771\" stop-color=\"#38C02B\"></stop><stop offset=\".861\" stop-color=\"#52C218\"></stop><stop offset=\".915\" stop-color=\"#67C30F\"></stop><stop offset=\"1\" stop-color=\"#86C504\"></stop></radialGradient><linearGradient id=\"wlrvg-i2\" x1=\"10.786\" x2=\"13.219\" y1=\"19.945\" y2=\"19.945\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#0FBC5C\"></stop><stop offset=\"1\" stop-color=\"#0CBA65\"></stop></linearGradient><clipPath id=\"wlrvg-a1\"><path fill=\"#fff\" d=\"M0 0h24v24H0z\"></path></clipPath></defs></svg>";
    var BADGE_STAR = "M6.82617 11.442L3.54617 13.166C3.46353 13.2093 3.3704 13.2287 3.27732 13.2219C3.18425 13.2151 3.09494 13.1824 3.0195 13.1274C2.94406 13.0725 2.8855 12.9975 2.85045 12.911C2.8154 12.8245 2.80526 12.7299 2.82117 12.638L3.44817 8.98798C3.46192 8.908 3.456 8.82587 3.43091 8.74869C3.40582 8.67151 3.36232 8.6016 3.30417 8.54499L0.650168 5.95899C0.583317 5.89388 0.53602 5.81136 0.51363 5.72076C0.491239 5.63017 0.494647 5.53512 0.52347 5.44637C0.552292 5.35761 0.605378 5.27869 0.676721 5.21854C0.748065 5.15838 0.834818 5.1194 0.927168 5.10599L4.59317 4.57299C4.67344 4.56146 4.7497 4.53059 4.81537 4.48303C4.88105 4.43547 4.93418 4.37265 4.97017 4.29999L6.61017 0.977985C6.65153 0.894518 6.7154 0.824266 6.79455 0.775151C6.87371 0.726037 6.96501 0.700012 7.05817 0.700012C7.15132 0.700012 7.24263 0.726037 7.32178 0.775151C7.40094 0.824266 7.4648 0.894518 7.50617 0.977985L9.14717 4.29899C9.18307 4.37152 9.23604 4.43426 9.30153 4.48182C9.36702 4.52937 9.44308 4.56031 9.52317 4.57199L13.1892 5.10499C13.2815 5.1184 13.3683 5.15738 13.4396 5.21754C13.511 5.27769 13.564 5.35661 13.5929 5.44537C13.6217 5.53412 13.6251 5.62917 13.6027 5.71976C13.5803 5.81036 13.533 5.89288 13.4662 5.95798L10.8132 8.54398C10.7552 8.60049 10.7118 8.67024 10.6867 8.74723C10.6616 8.82422 10.6556 8.90616 10.6692 8.98598L11.2962 12.637C11.3122 12.7291 11.3021 12.8238 11.267 12.9105C11.232 12.9971 11.1733 13.0722 11.0977 13.1272C11.0221 13.1822 10.9326 13.2149 10.8393 13.2215C10.7461 13.2282 10.6528 13.2086 10.5702 13.165L7.29117 11.441C7.21946 11.4033 7.13967 11.3836 7.05867 11.3836C6.97767 11.3836 6.89788 11.4033 6.82617 11.441V11.442Z";
    var COLOURS = ['#5A646B', '#A85F18', '#2E7D32', '#5E35B1', '#B3261E', '#00838F'];
    var PHONE = window.matchMedia ? window.matchMedia('(max-width: 900px)') : { matches: false };

    var root, badge, openBtn, ov, panel, tabsEl, summaryEl, bodyEl, closeBtn;
    var lists = {}, current = 'all', opener = null, locked = null;

    /* ---------- tabs: All first, then one per listing ---------- */
    var tabs = [{
      key: 'all', label: 'All Reviews', google: false,
      rating: D.all.rating, count: D.all.count,
      aria: 'All reviews, rated ' + fmt(D.all.rating) + ' from ' + D.all.count + ' reviews',
      write: D.listings[0], avatar: null, reviews: null
    }];
    D.listings.forEach(function (l) {
      tabs.push({
        key: l.key, label: 'Google', google: true, rating: l.rating, count: l.count,
        aria: l.name + ' on Google, rated ' + fmt(l.rating) + ' from ' + l.count + ' reviews',
        write: l, avatar: l, reviews: l.reviews
      });
    });
    var all = [];
    D.listings.forEach(function (l) {
      l.reviews.forEach(function (r) { all.push({ r: r, l: l }); });
    });
    all.sort(function (a, b) { return b.r.date < a.r.date ? -1 : (b.r.date > a.r.date ? 1 : 0); });
    tabs[0].items = all;
    tabs.forEach(function (t, i) {
      if (i) t.items = t.reviews.map(function (r) { return { r: r, l: t.write }; });
    });

    /* ---------- small helpers ---------- */
    function valid(d) {
      if (!d || typeof d !== 'object' || !d.all || !isFinite(d.all.rating) || !isFinite(d.all.count)) return false;
      if (!Array.isArray(d.listings) || !d.listings.length) return false;
      return d.listings.every(function (l) {
        return l && typeof l === 'object' && typeof l.key === 'string' && typeof l.name === 'string' &&
          isFinite(l.rating) && isFinite(l.count) && Array.isArray(l.reviews) &&
          typeof l.writeReviewUrl === 'string' && /^https:\/\//.test(l.writeReviewUrl);
      });
    }
    function fmt(n) { return (Math.round(n * 10) / 10).toFixed(1); }
    function safe(u) { return (typeof u === 'string' && /^https:\/\//.test(u)) ? u : ''; }
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function svg(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    function gLogo(cls) {
      var s = svg('svg', { viewBox: '0 0 48 48', 'aria-hidden': 'true', focusable: 'false' });
      s.setAttribute('class', cls || 'wlrv-g');
      G_PATHS.forEach(function (p) { s.appendChild(svg('path', { fill: p[0], d: p[1] })); });
      return s;
    }
    function stars(n, cls) {
      var wrap = el('span', 'wlrv-stars' + (cls ? ' ' + cls : ''));
      wrap.setAttribute('role', 'img');
      wrap.setAttribute('aria-label', n + ' out of 5 stars');
      for (var i = 1; i <= 5; i++) {
        var s = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
        s.setAttribute('class', i <= n ? 'wlrv-star is-on' : 'wlrv-star');
        s.appendChild(svg('path', { d: STAR }));
        wrap.appendChild(s);
      }
      return wrap;
    }
    function tick() {
      var s = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
      s.setAttribute('class', 'wlrv-tick');
      s.appendChild(svg('circle', { cx: '12', cy: '12', r: '11', fill: '#1A73E8' }));
      s.appendChild(svg('path', { d: 'M7 12.4l3.2 3.2L17 8.8', fill: 'none', stroke: '#fff', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      return s;
    }
    function closeIcon() {
      var s = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
      s.appendChild(svg('path', { d: 'M6 6l12 12M18 6L6 18', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }));
      return s;
    }
    function ago(iso) {
      var t = Date.parse(iso);
      if (!isFinite(t)) return '';
      var days = Math.floor((Date.now() - t) / 86400000);
      if (days < 1) return 'today';
      if (days === 1) return 'yesterday';
      if (days < 31) return days + ' days ago';
      var months = Math.floor(days / 30.44);
      if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
      var years = Math.floor(days / 365.25);
      return years + (years === 1 ? ' year ago' : ' years ago');
    }
    function thumb(u) { return u.replace(/=k-no$/, '=w240-h240-c-k-no'); }
    function bigPhoto(u) { return u.replace(/=s\d+-/, '=s96-'); }
    function colourFor(name) {
      var h = 0;
      for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
      return COLOURS[h % COLOURS.length];
    }

    /* ---------- badge (desktop card, phone pill) ---------- */
    function buildBadge() {
      root = el('div', 'wlrv');
      root.id = 'wlrv-root';
      badge = el('div', 'wlrv-badge');
      openBtn = el('button', 'wlrv-open');
      openBtn.type = 'button';
      openBtn.setAttribute('aria-haspopup', 'dialog');
      openBtn.setAttribute('aria-label', 'Google reviews, rated ' + fmt(D.all.rating) + ' from ' + D.all.count + ' reviews. Open the reviews.');
      var gw = el('span', 'wlrv-bgw');
      gw.innerHTML = BADGE_G; /* trusted constant above, never data */
      openBtn.appendChild(gw);
      var blk = el('span', 'wlrv-blk');
      var row = el('span', 'wlrv-row');
      row.appendChild(el('span', 'wlrv-score', fmt(D.all.rating)));
      var bs = el('span', 'wlrv-bstars');
      bs.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 5; i++) {
        var sv = svg('svg', { viewBox: '0 0 14 14', 'aria-hidden': 'true', focusable: 'false' });
        sv.appendChild(svg('path', { d: BADGE_STAR }));
        bs.appendChild(sv);
      }
      row.appendChild(bs);
      blk.appendChild(row);
      blk.appendChild(el('span', 'wlrv-cnt-d', D.all.count + ' reviews'));
      blk.appendChild(el('span', 'wlrv-cnt-p', '(' + D.all.count + ')'));
      openBtn.appendChild(blk);
      openBtn.addEventListener('click', function () { openPanel(openBtn); });
      badge.appendChild(openBtn);

      var hide = el('button', 'wlrv-hide');
      hide.type = 'button';
      hide.setAttribute('aria-label', 'Close Badge');
      hide.appendChild(closeIcon());
      hide.addEventListener('click', function () { badge.classList.add('is-dismissed'); });
      badge.appendChild(hide);
      root.appendChild(badge);

      /* sit right after the fixed Call + Enquire bar so CSS can move the pill with it */
      var bar = document.getElementById('vp-bar');
      if (bar && bar.parentNode) bar.parentNode.insertBefore(root, bar.nextSibling);
      else document.body.appendChild(root);
    }

    /* ---------- panel (built on first open) ---------- */
    function buildPanel() {
      ov = el('div', 'wlrv-ov');
      ov.hidden = true;
      panel = el('div', 'wlrv-panel');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', 'Google reviews');

      var head = el('div', 'wlrv-head');
      tabsEl = el('div', 'wlrv-tabs');
      tabsEl.setAttribute('role', 'tablist');
      tabsEl.setAttribute('aria-label', 'Review sources');
      tabs.forEach(function (t) {
        var b = el('button', 'wlrv-tab');
        b.type = 'button';
        b.id = 'wlrv-tab-' + t.key;
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-controls', 'wlrv-body');
        b.setAttribute('aria-label', t.aria);
        b.title = t.aria;
        b.setAttribute('data-key', t.key);
        if (t.google) b.appendChild(gLogo('wlrv-g wlrv-tab-g'));
        b.appendChild(el('span', 'wlrv-tab-t', t.label));
        b.appendChild(el('span', 'wlrv-tab-r', fmt(t.rating)));
        b.addEventListener('click', function () { select(t.key, false); });
        tabsEl.appendChild(b);
      });
      tabsEl.addEventListener('keydown', onTabKey);
      closeBtn = el('button', 'wlrv-x');
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close reviews');
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', closePanel);
      head.appendChild(tabsEl);
      head.appendChild(closeBtn);

      summaryEl = el('div', 'wlrv-sum');
      bodyEl = el('div', 'wlrv-body');
      bodyEl.id = 'wlrv-body';
      bodyEl.setAttribute('role', 'tabpanel');
      bodyEl.tabIndex = 0;

      panel.appendChild(head);
      panel.appendChild(summaryEl);
      panel.appendChild(bodyEl);
      ov.appendChild(panel);
      root.appendChild(ov);

      ov.addEventListener('mousedown', function (e) { if (e.target === ov) ov.setAttribute('data-down', '1'); else ov.removeAttribute('data-down'); });
      ov.addEventListener('click', function (e) { if (e.target === ov && ov.getAttribute('data-down')) closePanel(); });
      ov.addEventListener('keydown', onKey);
      window.addEventListener('resize', debounce(function () { if (!ov.hidden) clampCheck(); }, 120));
    }

    function summary(t) {
      summaryEl.textContent = '';
      var left = el('div', 'wlrv-sum-l');
      left.appendChild(el('div', 'wlrv-kick', 'Overall Rating'));
      var row = el('div', 'wlrv-sum-row');
      row.appendChild(el('span', 'wlrv-big', fmt(t.rating)));
      row.appendChild(stars(5, 'wlrv-stars-l'));
      row.appendChild(el('span', 'wlrv-sum-n', '(' + t.count + ')'));
      left.appendChild(row);
      var w = el('a', 'wlrv-write', 'write a review');
      w.href = safe(t.write.writeReviewUrl);
      w.target = '_blank';
      w.rel = 'noopener noreferrer';
      w.setAttribute('aria-label', 'Write a review for ' + t.write.name + ' on Google (opens in a new tab)');
      summaryEl.appendChild(left);
      summaryEl.appendChild(w);
    }

    function avatar(name, photo) {
      var wrap = el('span', 'wlrv-av');
      var initial = el('span', 'wlrv-ini', (name || '?').trim().charAt(0).toUpperCase() || '?');
      initial.style.background = colourFor(name || '');
      wrap.appendChild(initial);
      var src = safe(photo);
      if (src) {
        var im = document.createElement('img');
        im.className = 'wlrv-ph';
        im.alt = '';
        im.width = 44; im.height = 44;
        im.loading = 'lazy';
        im.decoding = 'async';
        im.referrerPolicy = 'no-referrer';
        im.addEventListener('error', function () { im.remove(); });
        im.src = bigPhoto(src);
        wrap.appendChild(im);
      }
      var g = el('span', 'wlrv-av-g');
      g.appendChild(gLogo('wlrv-g'));
      wrap.appendChild(g);
      return wrap;
    }

    function clampText(text, cls, lines) {
      var wrap = el('div', 'wlrv-clampwrap');
      var p = el('div', cls + ' is-clamp', text);
      p.setAttribute('data-lines', lines);
      var more = el('button', 'wlrv-more', 'Read more');
      more.type = 'button';
      more.hidden = true;
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', function () {
        var open = p.classList.toggle('is-open');
        p.classList.toggle('is-clamp', !open);
        more.textContent = open ? 'Show less' : 'Read more';
        more.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      wrap.appendChild(p);
      wrap.appendChild(more);
      return wrap;
    }

    function card(item) {
      var r = item.r, l = item.l;
      var c = el('div', 'wlrv-card');
      c.setAttribute('role', 'article');
      c.appendChild(avatar(r.name, r.photo));
      var main = el('div', 'wlrv-main');

      var who = el('div', 'wlrv-who');
      who.appendChild(el('span', 'wlrv-name', r.name));
      var tk = tick();
      who.appendChild(tk);
      main.appendChild(who);
      main.appendChild(el('div', 'wlrv-date', ago(r.date)));
      main.appendChild(stars(r.stars, 'wlrv-stars-c'));
      main.appendChild(clampText(r.text, 'wlrv-text', 3));

      var imgs = (r.images || []).map(safe).filter(Boolean).slice(0, 4);
      if (imgs.length) {
        var row = el('div', 'wlrv-imgs');
        imgs.forEach(function (u, i) {
          var a = el('a', 'wlrv-img');
          a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
          a.setAttribute('aria-label', 'Open review photo ' + (i + 1) + ' of ' + imgs.length + ' in a new tab');
          var im = document.createElement('img');
          im.alt = '';
          im.width = 72; im.height = 72;
          im.loading = 'lazy'; im.decoding = 'async'; im.referrerPolicy = 'no-referrer';
          im.src = thumb(u);
          a.appendChild(im);
          row.appendChild(a);
        });
        main.appendChild(row);
      }

      if (r.reply) {
        var box = el('div', 'wlrv-reply');
        var rh = el('div', 'wlrv-reply-h');
        var ra = el('span', 'wlrv-reply-av');
        var av = (typeof l.avatar === 'string' && /^data:image\/png;base64,/.test(l.avatar)) ? l.avatar : '';
        if (av) {
          var rimg = document.createElement('img');
          rimg.alt = ''; rimg.width = 28; rimg.height = 28;
          rimg.src = av;
          ra.appendChild(rimg);
        } else ra.textContent = l.name.charAt(0);
        rh.appendChild(ra);
        rh.appendChild(el('span', 'wlrv-reply-n', l.name));
        rh.appendChild(el('span', 'wlrv-reply-tag', 'OWNER REPLY'));
        box.appendChild(rh);
        box.appendChild(clampText(r.reply, 'wlrv-reply-t', 2));
        main.appendChild(box);
      }

      var u = safe(r.url);
      if (u) {
        var vg = el('a', 'wlrv-view', 'View on Google');
        vg.href = u; vg.target = '_blank'; vg.rel = 'noopener noreferrer';
        vg.setAttribute('aria-label', 'View the review from ' + r.name + ' on Google (opens in a new tab)');
        main.appendChild(vg);
      }
      c.appendChild(main);
      return c;
    }

    function listFor(t) {
      if (lists[t.key]) return lists[t.key];
      var list = el('div', 'wlrv-list');
      var frag = document.createDocumentFragment();
      t.items.forEach(function (it) { frag.appendChild(card(it)); });
      list.appendChild(frag);
      lists[t.key] = list;
      return list;
    }

    function select(key, focusTab) {
      var t = tabs.filter(function (x) { return x.key === key; })[0] || tabs[0];
      current = t.key;
      Array.prototype.forEach.call(tabsEl.children, function (b) {
        var on = b.getAttribute('data-key') === t.key;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        b.classList.toggle('is-on', on);
        if (on && focusTab) b.focus();
        if (on && b.scrollIntoView && PHONE.matches) {
          try { b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* older browser */ }
        }
      });
      bodyEl.setAttribute('aria-labelledby', 'wlrv-tab-' + t.key);
      summary(t);
      bodyEl.textContent = '';
      bodyEl.appendChild(listFor(t));
      bodyEl.scrollTop = 0;
      clampCheck();
    }

    /* "Read more" only where the text really is cut off */
    function clampCheck() {
      if (!bodyEl) return;
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(bodyEl.querySelectorAll('.wlrv-clampwrap'), function (w) {
          var p = w.firstChild, more = w.lastChild;
          if (p.classList.contains('is-open')) { more.hidden = false; return; }
          more.hidden = !(p.scrollHeight - p.clientHeight > 1);
        });
      });
    }

    function onTabKey(e) {
      var k = e.key;
      if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End') return;
      var i = tabs.map(function (t) { return t.key; }).indexOf(current);
      if (k === 'ArrowRight') i = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft') i = (i + tabs.length - 1) % tabs.length;
      else if (k === 'Home') i = 0;
      else i = tabs.length - 1;
      e.preventDefault();
      select(tabs[i].key, true);
    }

    function focusables() {
      var all = panel.querySelectorAll('button, a[href], [tabindex]');
      return Array.prototype.filter.call(all, function (n) {
        return n.tabIndex >= 0 && !n.disabled && !n.hidden && n.offsetParent !== null;
      });
    }
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault(); e.stopPropagation();
        closePanel();
        return;
      }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || !panel.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !panel.contains(a))) { e.preventDefault(); first.focus(); }
    }

    function lock() {
      var de = document.documentElement, b = document.body;
      var sb = window.innerWidth - de.clientWidth;
      locked = { pr: b.style.paddingRight };
      if (sb > 0) b.style.paddingRight = sb + 'px';
      de.classList.add('wlrv-lock');
      b.classList.add('wlrv-lock');
    }
    function unlock() {
      if (!locked) return;
      document.documentElement.classList.remove('wlrv-lock');
      document.body.classList.remove('wlrv-lock');
      document.body.style.paddingRight = locked.pr;
      locked = null;
    }

    function openPanel(from) {
      if (!ov) { buildPanel(); select('all', false); }
      opener = from || openBtn;
      ov.hidden = false;
      lock();
      document.addEventListener('keydown', docKey, true);
      clampCheck();
      closeBtn.focus();
    }
    function docKey(e) {
      /* Esc and Tab are handled on the overlay; this catches them if focus has slipped to the page */
      if (!ov || ov.hidden) return;
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); closePanel(); }
      else if (e.key === 'Tab' && !ov.contains(document.activeElement)) { e.preventDefault(); closeBtn.focus(); }
    }
    function closePanel() {
      if (!ov || ov.hidden) return;
      ov.hidden = true;
      unlock();
      document.removeEventListener('keydown', docKey, true);
      var o = opener;
      opener = null;
      if (o && o.offsetParent !== null) o.focus();
      else if (openBtn) openBtn.focus();
    }
    function debounce(fn, ms) {
      var t;
      return function () { clearTimeout(t); t = setTimeout(fn, ms); };
    }

    buildBadge();
  }
})();
