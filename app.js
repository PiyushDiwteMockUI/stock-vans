/* Stock Vans page logic.
   Rendering security model:
   1. Every string in DATA (van names, codes, spec rows — sourced from dealer listings) is
      HTML-escaped at build time and every URL whitelisted to https:// before it reaches
      this file.
   2. All generated markup is passed through DOMPurify (vendored) before insertion — no
      inline event handlers anywhere; interaction uses delegated listeners reading data-*
      attributes only.
   3. Nothing a visitor types is ever rendered into the page: form values go only into the
      ActiveCampaign POST body and element .value/.textContent. */
'use strict';
const money = n => n == null ? 'Enquire for price' : '$' + Math.round(n).toLocaleString('en-AU');
const VANS = DATA.vans.map((v, i) => {
  const lenN = v.length ? parseFloat(v.length.replace(/'/, '.').replace(/"/, '')) : 99;
  return Object.assign({}, v, {
    id: i, priceN: v.price, priceTxt: money(v.price), lenN: lenN,
    lenIn: lenN === 99 ? null : Math.floor(lenN) * 12 + Math.round((lenN % 1) * 100),
    axle: lenN < 18 ? 'Single axle' : 'Tandem axle',
    status: v.used ? 'Pre-loved' : 'Stock van',
    img: v.images[0] || ''
  });
});
const fullName = v => v.name.startsWith(v.model) ? v.name : v.model + ' ' + v.name;
const MODELS = ['Solara', 'XTR', 'Hornet', 'Amaroo'];
const STATES = [...new Set(VANS.map(v => v.state))];
const LAYOUTS = ['Couples', 'Family'];
const AXLES = ['Single axle', 'Tandem axle'];
const PRICE_MIN = 105000, PRICE_MAX = 215000;
const LEN_MIN = 204, LEN_MAX = 288; // whole inches: 17'00" to 24'00"
const fmtLen = (v, unit) => {
  if (unit === 'm') return (v / 12 * 0.3048).toFixed(2) + ' m';
  return Math.floor(v / 12) + "'" + String(v % 12).padStart(2, '0') + '"';
};
const kg = n => n.toLocaleString('en-AU') + ' kg';
// Slider definitions. lo/hi are state keys; nulls in van data never exclude a van.
const SLIDERS = {
  price: { lo: 'minPrice', hi: 'maxPrice', min: PRICE_MIN, max: PRICE_MAX, step: 1000, title: 'Budget', fmt: (v) => money(v), field: 'priceN', icon: '' },
  tare:  { lo: 'minTare', hi: 'maxTare', min: 2300, max: 3700, step: 10, title: 'Weight', fmt: (v) => kg(v), field: 'tare', icon: 'M6.2 7.2h7.6l1.6 8.6H4.6L6.2 7.2z M10 6.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
  atm:   { lo: 'minAtm', hi: 'maxAtm', min: 2950, max: 4500, step: 50, title: 'Weight', fmt: (v) => kg(v), field: 'atm', icon: 'M6.2 7.2h7.6l1.6 8.6H4.6L6.2 7.2z M10 6.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
  ball:  { lo: 'minBall', hi: 'maxBall', min: 150, max: 450, step: 5, title: 'Weight', fmt: (v) => kg(v), field: 'ball', icon: 'M6.2 7.2h7.6l1.6 8.6H4.6L6.2 7.2z M10 6.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
  sleeps:{ lo: 'minSleeps', hi: 'maxSleeps', min: 2, max: 6, step: 1, title: 'Sleeps', fmt: (v) => String(v), field: 'sleeps', icon: 'M7 9.4a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z M2.8 15.6c0-2.3 1.9-4.2 4.2-4.2s4.2 1.9 4.2 4.2 M13.6 9.2a1.8 1.8 0 1 0 0-3.6 M13.6 11.4c1.9 0 3.5 1.6 3.5 3.5' },
  len:   { lo: 'minLen', hi: 'maxLen', min: LEN_MIN, max: LEN_MAX, step: 1, title: 'Length', fmt: null, field: 'lenIn', icon: 'M2.5 7.5h15v5h-15v-5z M6 7.5v2.2 M9 7.5v3 M12 7.5v2.2 M15 7.5v3' }
};

const SAN = { ADD_ATTR: ['role', 'aria-checked', 'aria-label', 'aria-live', 'target'] };
function put(el, markup) { el.innerHTML = DOMPurify.sanitize(markup, SAN); }

const SV = {
  s: { models: [], layouts: [], states: [], axles: [], status: 'all', minPrice: PRICE_MIN, maxPrice: PRICE_MAX,
       minLen: LEN_MIN, maxLen: LEN_MAX, lenUnit: 'm', weightMetric: 'atm',
       minTare: 2300, maxTare: 3700, minAtm: 2950, maxAtm: 4500, minBall: 150, maxBall: 450, minSleeps: 2, maxSleeps: 6,
       sort: 'featured', group: false, consent: false, intent: 0, detail: null, gal: 0, tab: 'Chassis' },
  set(k, v) { this.s[k] = v; this.render(); },
  toggleIn(k, val) { const a = this.s[k]; this.s[k] = a.includes(val) ? a.filter(x => x !== val) : a.concat([val]); this.render(); },
  clearAll() { Object.assign(this.s, { models: [], layouts: [], states: [], axles: [], status: 'all', minPrice: PRICE_MIN, maxPrice: PRICE_MAX,
    minLen: LEN_MIN, maxLen: LEN_MAX, minTare: 2300, maxTare: 3700, minAtm: 2950, maxAtm: 4500, minBall: 150, maxBall: 450, minSleeps: 2, maxSleeps: 6 }); this.render(); },

  matches(v, skip) {
    const s = this.s;
    if (skip !== 'models' && s.models.length && !s.models.includes(v.model)) return false;
    if (skip !== 'layouts' && s.layouts.length && !s.layouts.includes(v.layout)) return false;
    if (skip !== 'states' && s.states.length && !s.states.includes(v.state)) return false;
    if (skip !== 'axles' && s.axles.length && !s.axles.includes(v.axle)) return false;
    if (s.status !== 'all' && v.status !== s.status) return false;
    for (const key in SLIDERS) {
      const c = SLIDERS[key];
      const val = key === 'price' ? (v.priceN == null ? PRICE_MIN : v.priceN) : v[c.field];
      if (val == null) continue;
      if (val < s[c.lo] || val > s[c.hi]) return false;
    }
    return true;
  },
  countFor(k, val) {
    return VANS.filter(v => this.matches(v, k) &&
      (k === 'models' ? v.model === val : k === 'layouts' ? v.layout === val : k === 'axles' ? v.axle === val : v.state === val)).length;
  },
  filtered() {
    let a = VANS.filter(v => this.matches(v));
    const s = this.s.sort;
    if (s === 'priceAsc') a = a.slice().sort((x, y) => (x.priceN || 9e9) - (y.priceN || 9e9));
    else if (s === 'priceDesc') a = a.slice().sort((x, y) => (y.priceN || 0) - (x.priceN || 0));
    else if (s === 'lenAsc') a = a.slice().sort((x, y) => x.lenN - y.lenN);
    return a;
  },
  chips() {
    const s = this.s, c = [];
    s.models.forEach(m => c.push([m, 'models', m]));
    s.layouts.forEach(m => c.push([m, 'layouts', m]));
    s.states.forEach(m => c.push([m, 'states', m]));
    s.axles.forEach(m => c.push([m, 'axles', m]));
    if (s.status !== 'all') c.push([s.status, 'status', '']);
    const CHIP_PREFIX = { price: '', len: '', tare: 'Tare ', atm: 'ATM ', ball: 'Ball ', sleeps: 'Sleeps ' };
    for (const key in SLIDERS) {
      const cfg = SLIDERS[key];
      if (s[cfg.lo] > cfg.min || s[cfg.hi] < cfg.max) {
        const f = cfg.fmt || (v => fmtLen(v, s.lenUnit));
        c.push([CHIP_PREFIX[key] + f(s[cfg.lo]) + ' – ' + f(s[cfg.hi]), 'slider', key]);
      }
    }
    return c;
  },

  cardHTML(v) {
    return `<article class="card">
      <div class="cardimg" data-act="view" data-id="${v.id}" style="position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--line);cursor:pointer">
        <img src="${v.img}" alt="${v.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;filter:contrast(1.05) saturate(1.06)">
        <div style="position:absolute;top:12px;left:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-start">
          <span class="badge-dark">Ready now</span>
          ${v.used ? '<span class="badge-orange">Pre-loved</span>' : ''}
        </div>
        <span class="photocount">${v.images.length} photos</span>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;flex:1">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px">
          <span class="modelkick">${v.model} · ${v.year}</span>
          <span style="font:400 10.5px/1 'Gordita';letter-spacing:.06em;color:var(--mut)">${v.chassis}</span>
        </div>
        <h3 class="av cardname" data-act="view" data-id="${v.id}">${v.name}</h3>
        <div class="cardspecs">
          <div><div class="speck">Length</div><div class="specv">${v.length || '—'}</div></div>
          <div><div class="speck">Layout</div><div class="specv">${v.layout}</div></div>
          <div><div class="speck">Location</div><div class="specv">${v.state}</div></div>
          <div><div class="speck">Condition</div><div class="specv">${v.used ? 'Pre-loved' : 'New'}</div></div>
        </div>
        <div style="margin-top:auto">
          <span class="av" style="font-size:23px;line-height:1;letter-spacing:-.02em">${v.priceTxt}</span>
          ${v.priceN ? '<div style="margin-top:8px;font:400 11px/1 \'Gordita\';color:var(--mut)">drive away · ' + v.state + '</div>' : ''}
          <div style="display:flex;gap:8px;margin-top:16px">
            <button class="btn-dark" style="flex:1" data-act="view" data-id="${v.id}">View details</button>
            <button class="btn-line" style="flex:1" data-act="enquire" data-id="${v.id}">Enquire</button>
          </div>
        </div>
      </div>
    </article>`;
  },

  sliderBlock(key, extraHead) {
    const s = this.s, c = SLIDERS[key];
    const fmt = c.fmt || (v => fmtLen(v, s.lenUnit));
    const pc = v => ((v - c.min) / (c.max - c.min) * 100).toFixed(2);
    return `<div data-slider="${key}" style="padding:18px 0;border-bottom:1px solid var(--line)">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:11px">
        ${c.icon ? `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" style="display:block;flex:none"><path d="${c.icon}" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"></path></svg>` : ''}
        <span class="kicker">${c.title}</span>
        ${extraHead || ''}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px">
        <span class="slb-lo" style="font:400 12px/1 'Gordita';color:var(--mut);font-variant-numeric:tabular-nums">${fmt(s[c.lo])}</span>
        <span class="slb-hi" style="font:500 13px/1 'Gordita';color:var(--olink);font-variant-numeric:tabular-nums">${fmt(s[c.hi])}</span>
      </div>
      <div class="dualwrap" data-skey="${key}" style="position:relative;height:28px;touch-action:none">
        <div style="position:absolute;left:0;right:0;top:12px;height:3px;background:#D8D3CC;border-radius:2px"></div>
        <div class="slfill" style="position:absolute;top:12px;height:3px;border-radius:2px;background:var(--olink);left:${pc(s[c.lo])}%;right:${(100 - +pc(s[c.hi])).toFixed(2)}%"></div>
        <input type="range" autocomplete="off" class="dual" aria-label="${c.title} minimum" min="${c.min}" max="${c.max}" step="${c.step}" value="${s[c.lo]}" data-skey="${key}" data-end="lo" style="z-index:3">
        <input type="range" autocomplete="off" class="dual" aria-label="${c.title} maximum" min="${c.min}" max="${c.max}" step="${c.step}" value="${s[c.hi]}" data-skey="${key}" data-end="hi" style="z-index:4">
      </div>
    </div>`;
  },

  railHTML() {
    const s = this.s;
    const chk = (k, val) => `<button type="button" role="checkbox" aria-checked="${s[k].includes(val)}" class="chk" data-act="toggle" data-key="${k}" data-val="${val}">
      <span class="box ${s[k].includes(val) ? 'on' : ''}"></span><span style="flex:1;text-align:left">${val}</span>
      <span style="font:400 11.5px/1 'Gordita';color:var(--mut);font-variant-numeric:tabular-nums">${this.countFor(k, val)}</span></button>`;
    const wUnits = `<div style="margin-left:auto;display:flex;gap:6px">${[['tare','Tare'],['atm','ATM'],['ball','Ball']].map(([k,l]) =>
      `<button type="button" class="useg ${s.weightMetric === k ? 'on' : ''}" data-act="wmetric" data-val="${k}">${l}</button>`).join('')}</div>`;
    const lUnits = `<div style="margin-left:auto;display:flex;gap:6px">${[['m','Metres'],['ft','Feet']].map(([k,l]) =>
      `<button type="button" class="useg ${s.lenUnit === k ? 'on' : ''}" data-act="lenUnit" data-val="${k}">${l}</button>`).join('')}</div>`;
    return `
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding-bottom:14px;border-bottom:2px solid var(--ink);margin-bottom:6px">
        <span class="av" style="font-size:14px;letter-spacing:.06em;text-transform:uppercase">Refine</span>
        <button class="linkbtn" data-act="clear">Clear all</button>
      </div>
      <div style="padding:16px 0 4px">
        <select autocomplete="off" aria-label="Stock status" class="selbox selstatus" data-act="status">
          <option value="all" ${s.status === 'all' ? 'selected' : ''}>Show all stock</option>
          <option value="Stock van" ${s.status === 'Stock van' ? 'selected' : ''}>New stock vans</option>
          <option value="Pre-loved" ${s.status === 'Pre-loved' ? 'selected' : ''}>Pre-loved</option>
        </select>
      </div>
      <div style="padding:18px 0;border-bottom:1px solid var(--line)">
        <div class="kicker" style="margin-bottom:6px">Layout</div>${LAYOUTS.map(m => chk('layouts', m)).join('')}
      </div>
      <div style="padding:7px 0">
        <select autocomplete="off" aria-label="Model" class="selbox" data-act="modelSel">
          <option value="">All models</option>
          ${MODELS.map(m => `<option value="${m}" ${s.models[0] === m ? 'selected' : ''}>${m} (${this.countFor('models', m)})</option>`).join('')}
        </select>
      </div>
      <div style="padding:7px 0">
        <select autocomplete="off" aria-label="State" class="selbox" data-act="stateSel">
          <option value="">All states</option>
          ${STATES.map(st => `<option value="${st}" ${s.states[0] === st ? 'selected' : ''}>${st} (${this.countFor('states', st)})</option>`).join('')}
        </select>
      </div>
      ${this.sliderBlock('price')}
      ${this.sliderBlock(s.weightMetric, wUnits)}
      ${this.sliderBlock('sleeps')}
      ${this.sliderBlock('len', lUnits)}
      <div style="padding:18px 0;border-bottom:1px solid var(--line)">
        <div class="kicker" style="margin-bottom:6px">Axle configuration</div>${AXLES.map(m => chk('axles', m)).join('')}
      </div>
      <button type="button" role="checkbox" aria-checked="${s.group}" class="chk" style="padding-top:20px" data-act="group">
        <span class="box ${s.group ? 'on' : ''}"></span><span style="flex:1;text-align:left">Group by location</span>
      </button>
      <div style="padding:20px 0 2px;border-top:1px solid var(--line);margin-top:18px">
        <button type="button" class="btn-orange" style="width:100%" data-act="clear">Reset filters</button>
      </div>
      <div style="margin-top:28px;background:var(--ink);padding:22px;border-radius:4px">
        <div style="font:500 10px/1 'Gordita';letter-spacing:.28em;text-transform:uppercase;color:var(--peach);margin-bottom:12px">Not sure?</div>
        <p style="margin:0 0 16px;font:300 13px/1.55 'Gordita';color:rgba(255,255,255,.72)">Tell us how you travel and we will point you at the right van. No hard sell.</p>
        <a href="#enquire" class="talkbtn">Talk to us</a>
      </div>`;
  },

  render() {
    put(document.getElementById('railbox'), this.railHTML());
    this.renderList();
    const sel = document.getElementById('vanselect');
    const keep = sel.value;
    put(sel, '<option value="">Which van are you asking about?</option>' +
      VANS.map(v => `<option value="${v.chassis}">${v.chassis} · ${fullName(v)} (${v.state})</option>`).join('') +
      '<option value="unsure">Not sure yet, help me choose</option>');
    sel.value = keep;
    this.renderIntents();
    this.syncMob();
  },

  // Lightweight re-render while a slider is being dragged: results update live but the
  // rail (and the input being dragged) is left alone so the drag is not interrupted.
  renderList() {
    const list = this.filtered();
    document.getElementById('count').textContent = list.length;
    const chips = this.chips();
    const chEl = document.getElementById('chips');
    chEl.style.display = chips.length ? 'flex' : 'none';
    put(chEl, chips.map(([l, kind, val]) =>
      `<button class="chip" data-act="unchip" data-kind="${kind}" data-val="${val}">${l}<span style="color:var(--mut);font-size:13px">×</span></button>`).join(''));
    const badge = document.getElementById('mob-count-badge');
    badge.style.display = chips.length ? 'block' : 'none';
    badge.textContent = chips.length;
    let groups;
    if (this.s.group) groups = STATES.map(st => ({ loc: st, vans: list.filter(v => v.state === st) })).filter(g => g.vans.length);
    else groups = [{ loc: null, vans: list }];
    put(document.getElementById('groups'), groups.map(g => `
      <div style="margin-bottom:34px">
        ${g.loc ? `<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-top:6px">
          <span class="av" style="font-size:19px;letter-spacing:.05em;text-transform:uppercase">${g.loc}</span>
          <span style="font:400 11.5px/1 'Gordita';color:var(--mut)">${g.vans.length} vans</span>
          <span style="flex:1;height:1px;background:var(--line);display:block"></span></div>` : ''}
        <div class="grid">${g.vans.map(v => this.cardHTML(v)).join('')}</div>
      </div>`).join(''));
    document.getElementById('empty').style.display = list.length ? 'none' : 'block';
    const mc = document.getElementById('mobcount');
    if (mc) mc.textContent = list.length;
  },

  // Update one slider's labels, fill and input values in place (every rendered instance).
  updateSliderUI(key) {
    const s = this.s, c = SLIDERS[key];
    const fmt = c.fmt || (v => fmtLen(v, s.lenUnit));
    const pc = v => ((v - c.min) / (c.max - c.min) * 100).toFixed(2);
    document.querySelectorAll(`[data-slider="${key}"]`).forEach(w => {
      w.querySelector('.slb-lo').textContent = fmt(s[c.lo]);
      w.querySelector('.slb-hi').textContent = fmt(s[c.hi]);
      const f = w.querySelector('.slfill');
      f.style.left = pc(s[c.lo]) + '%';
      f.style.right = (100 - +pc(s[c.hi])).toFixed(2) + '%';
      const [ilo, ihi] = w.querySelectorAll('input.dual');
      ilo.value = s[c.lo]; ihi.value = s[c.hi];
    });
  },

  setSlider(key, end, raw, light) {
    const c = SLIDERS[key];
    let v = Math.round(+raw / c.step) * c.step;
    v = Math.max(c.min, Math.min(c.max, v));
    if (end === 'lo') this.s[c.lo] = Math.min(v, this.s[c.hi] - c.step);
    else this.s[c.hi] = Math.max(v, this.s[c.lo] + c.step);
    if (light) { this.updateSliderUI(key); this.renderList(); }
    else this.render();
  },

  INTENTS: ['Call back', 'Book a viewing', 'Get a quote', 'Hold this van'],
  renderIntents() {
    put(document.getElementById('intents'), this.INTENTS.map((l, i) => `
      <button type="button" role="radio" aria-checked="${this.s.intent === i}" data-act="intent" data-id="${i}"
        class="intentcell${i ? ' intentdiv' : ''}">
        <span class="intentpill ${this.s.intent === i ? 'on' : ''}">${l}</span>
      </button>`).join(''));
  },
  toggleConsent() {
    this.s.consent = !this.s.consent;
    const b = document.getElementById('consentbtn');
    b.setAttribute('aria-checked', this.s.consent);
    b.classList.toggle('on', this.s.consent);
  },

  view(id) {
    this.s.detail = id; this.s.gal = 0; this.s.tab = 'Chassis';
    document.getElementById('page-grid').style.display = 'none';
    document.getElementById('page-detail').style.display = 'block';
    this.renderDetail(); window.scrollTo(0, 0);
    history.replaceState(null, '', '#van/' + VANS[id].chassis);
  },
  backToGrid() {
    this.s.detail = null;
    document.getElementById('page-detail').style.display = 'none';
    document.getElementById('page-grid').style.display = 'block';
    history.replaceState(null, '', '#'); window.scrollTo(0, 0);
  },

  renderDetail() {
    const v = VANS[this.s.detail]; if (!v) return;
    const specs = DATA.modelSpecs[v.model] || {};
    const tabs = Object.keys(specs);
    if (!tabs.includes(this.s.tab)) this.s.tab = tabs[0];
    const rows = specs[this.s.tab] || [];
    const similar = VANS.filter(x => x.id !== v.id && x.model === v.model).slice(0, 3);
    put(document.getElementById('page-detail'), `
    <div class="detailwrap">
    <div style="padding:20px 56px 0;display:flex;align-items:center;gap:10px;font:400 11px/1 'Gordita';letter-spacing:.14em;text-transform:uppercase;color:var(--mut)">
      <button class="linkbtn" style="letter-spacing:.14em;text-transform:uppercase" data-act="back">Stock vans</button>
      <span>/</span><span style="color:var(--ink)">${v.chassis}</span>
    </div>
    <div class="wrap" style="padding:22px 0 0">
      <div style="flex:1 1 560px;min-width:0;padding:0 46px 0 56px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          <span class="badge-dark">Ready now</span>
          ${v.used ? '<span class="badge-orange">Pre-loved</span>' : ''}
          <span style="font:400 11.5px/1 'Gordita';color:var(--mut)">Stock no. ${v.chassis}</span>
        </div>
        <h1 class="av" style="margin:0 0 8px;font-size:38px;line-height:1.04;letter-spacing:.03em;text-transform:uppercase">${fullName(v)}</h1>
        <p style="margin:0 0 22px;font:300 16px/1.55 'Gordita';color:var(--body);max-width:600px">Built, finished and located in ${v.state}, ready to leave.</p>
        <div style="position:relative;aspect-ratio:3/2;background:var(--dk);border-radius:4px;overflow:hidden;margin-bottom:10px">
          <div role="img" aria-label="${v.name}" style="width:100%;height:100%;background-image:url(${v.images[this.s.gal]});background-size:cover;background-position:center;filter:contrast(1.05) saturate(1.06)"></div>
          <button class="galbtn" style="left:14px" data-act="galprev">‹</button>
          <button class="galbtn" style="right:14px" data-act="galnext">›</button>
          <span style="position:absolute;bottom:14px;right:14px;background:rgba(6,9,12,.72);color:#fff;font:400 11.5px/1 'Gordita';padding:7px 11px;border-radius:2px">${this.s.gal + 1} / ${v.images.length}</span>
        </div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:34px">
          ${v.images.map((src, i) => `<button class="thumbbtn ${i === this.s.gal ? 'on' : ''}" data-act="gal" data-id="${i}"><span style="display:block;width:100%;height:100%;background-image:url(${src});background-size:cover;background-position:center;pointer-events:none"></span></button>`).join('')}
        </div>
        <div style="display:grid;gap:1px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));background:var(--ink);border-radius:4px;overflow:hidden;margin-bottom:38px">
          ${[['Model', v.model, 'Wonderland RV range'], ['Length', v.length || '—', 'Body length'], ['Layout', v.layout, v.layout === 'Family' ? 'Bunks on board' : 'Two berth touring'], ['Location', v.state, 'Where it is now']].map(([k, val, d]) => `
          <div style="padding:22px 20px;background:var(--ink)">
            <div style="font:400 9.5px/1 'Gordita';letter-spacing:.26em;text-transform:uppercase;color:var(--peach);margin-bottom:11px">${k}</div>
            <div class="av" style="font-size:22px;line-height:1.1;letter-spacing:-.01em;color:#fff">${val}</div>
            <div style="margin-top:9px;font:300 11.5px/1.45 'Gordita';color:rgba(255,255,255,.6)">${d}</div>
          </div>`).join('')}
        </div>
        <div style="margin-bottom:38px">
          <h2 class="av" style="margin:0 0 6px;font-size:20px;letter-spacing:.05em;text-transform:uppercase">Specifications</h2>
          <p style="margin:0 0 16px;font:300 12.5px/1.5 'Gordita';color:var(--mut);max-width:560px">Standard specification for the ${v.model} range. This van may include additional optioned upgrades — confirm the exact build on the dealer listing or with our team.</p>
          <div style="display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px solid var(--line);margin-bottom:4px">
            ${tabs.map(t => `<button class="tabbtn ${this.s.tab === t ? 'on' : ''}" data-act="tab" data-val="${t}">${t}</button>`).join('')}
          </div>
          <div>${rows.map(([k, val]) => `<div style="display:flex;flex-wrap:wrap;gap:6px 20px;padding:15px 2px;border-bottom:1px solid var(--line)">
            <span style="flex:0 0 200px;font:500 12px/1.45 'Gordita';letter-spacing:.04em">${k}</span>
            <span style="flex:1 1 260px;min-width:0;font:300 13px/1.55 'Gordita';color:var(--body)">${val}</span></div>`).join('')}</div>
        </div>
        <div style="background:var(--cream);border:1px solid var(--line);border-radius:4px;padding:26px;margin-bottom:38px">
          <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
            <div style="min-width:0">
              <div style="font:500 10px/1 'Gordita';letter-spacing:.28em;text-transform:uppercase;color:var(--olink);margin-bottom:12px">Where it is</div>
              <div class="av" style="font-size:17px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:10px">${v.state}</div>
              <div style="font:300 13px/1.6 'Gordita';color:var(--body)">This van is with our ${v.state} dealer. Enquire and we will set up a walkthrough in person or on a call.</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:9px;flex:none">
              <button class="btn-dark" data-act="enquire" data-id="${v.id}">Book a viewing</button>
              <a class="btn-line" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="${v.listing}" target="_blank" rel="noopener">View dealer listing</a>
            </div>
          </div>
        </div>
        <div style="padding-bottom:66px">
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:20px">
            <h2 class="av" style="margin:0;font-size:20px;letter-spacing:.05em;text-transform:uppercase">Similar vans in stock</h2>
            <button class="linkbtn" style="letter-spacing:.16em;text-transform:uppercase;font-weight:500" data-act="back">See all ${VANS.length}</button>
          </div>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
            ${similar.map(x => `<article class="simcard" data-act="view" data-id="${x.id}">
              <div style="aspect-ratio:16/10;background:var(--line)"><img src="${x.img}" alt="${x.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"></div>
              <div style="padding:15px;pointer-events:none">
                <div style="font:500 9.5px/1 'Gordita';letter-spacing:.24em;text-transform:uppercase;color:var(--olink);margin-bottom:7px">${x.model} ${x.chassis}</div>
                <div class="av" style="font-size:13px;line-height:1.25;letter-spacing:.03em;text-transform:uppercase;margin-bottom:10px">${x.name}</div>
                <div style="font:500 14px/1 'Gordita'">${x.priceTxt}</div>
                <div style="margin-top:8px;font:400 11px/1 'Gordita';color:var(--body)">${x.state}</div>
              </div></article>`).join('')}
          </div>
        </div>
      </div>
      <aside class="detailside" style="flex:1 1 300px;max-width:380px;padding:0 56px 66px 0;position:sticky;top:20px;align-self:flex-start">
        <div style="border:1px solid var(--line2);border-radius:4px;overflow:hidden;background:#fff">
          <div style="padding:24px 22px;border-bottom:1px solid var(--line)">
            <div style="font:400 10px/1 'Gordita';letter-spacing:.28em;text-transform:uppercase;color:var(--mut);margin-bottom:12px">Drive away</div>
            <div class="av" style="font-size:30px;line-height:1;letter-spacing:-.02em">${v.priceTxt}</div>
          </div>
          <div style="padding:20px 22px;display:flex;flex-direction:column;gap:9px">
            <button class="btn-orange" data-act="enquire" data-id="${v.id}">Enquire about this van</button>
            <a class="btn-dark" style="display:flex;align-items:center;justify-content:center;text-decoration:none;color:#fff" href="tel:+61386920032">Call (03) 8692 0032</a>
          </div>
          <div style="padding:0 22px 22px">
            ${[['Stock no', v.chassis], ['Layout code', v.code], ['Length', v.length || '—'], ['Layout', v.layout], ['Sleeps', v.sleeps || '—'],
               ['Tare', v.tare ? kg(v.tare) : '—'], ['ATM', v.atm ? kg(v.atm) : '—'], ['Ball weight', v.ball ? kg(v.ball) : '—'],
               ['Axle', v.axle], ['Condition', v.used ? 'Pre-loved' : 'New'], ['Location', v.state], ['Photos', v.images.length]].map(([k, val]) => `
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid var(--line)">
              <span style="font:400 11.5px/1.3 'Gordita';letter-spacing:.06em;text-transform:uppercase;color:var(--mut)">${k}</span>
              <span style="font:500 12.5px/1.3 'Gordita';text-align:right">${val}</span></div>`).join('')}
          </div>
        </div>
        <div style="margin-top:14px;background:var(--cream);border:1px solid var(--line);border-radius:4px;padding:18px">
          <div style="font:400 12px/1.6 'Gordita';color:var(--body)">Three year factory-backed warranty and aftersales support wherever you are in the country. Same as a custom build.</div>
        </div>
      </aside>
    </div>
    </div>`);
  },

  enquire(id) {
    const v = VANS[id];
    if (this.s.detail != null) this.backToGrid();
    document.getElementById('vanselect').value = v.chassis;
    document.getElementById('enquire').scrollIntoView({ behavior: 'smooth' });
  },

  openMob() {
    const m = document.getElementById('mobfilter');
    m.style.display = 'block';
    put(m, `<div class="modal-bg" data-act="closemob"></div>
      <div class="mobpanel">
        <div style="flex:none;background:var(--ink);padding:20px;display:flex;align-items:center;gap:12px">
          <span class="av" style="font-size:16px;letter-spacing:.09em;text-transform:uppercase;color:#fff">Filters</span>
          <button class="mobx" data-act="closemob">×</button>
        </div>
        <div id="mobrail" style="flex:1;min-height:0;overflow-y:auto;padding:0 20px 20px"></div>
        <div style="flex:none;border-top:1px solid var(--line);padding:13px 20px;display:flex;gap:9px;background:#fff">
          <button class="btn-line" style="flex:0 0 88px" data-act="clear">Clear</button>
          <button class="btn-dark" style="flex:1" data-act="closemob">Show <span id="mobcount">${this.filtered().length}</span> vans</button>
        </div>
      </div>`);
    this.syncMob();
  },
  syncMob() {
    const el = document.getElementById('mobrail');
    if (el) {
      put(el, this.railHTML());
      const c = document.getElementById('mobcount');
      if (c) c.textContent = this.filtered().length;
    }
  },

  submit(e) {
    e.preventDefault();
    const f = document.getElementById('enqform');
    const g = n => f.querySelector('[name="' + n + '"]');
    for (const n of ['firstname', 'lastname', 'email', 'phone', 'state']) {
      if (!g(n).value) { g(n).focus(); return false; }
    }
    let phone = g('phone').value.replace(/\s+/g, '');
    if (/^0\d{9}$/.test(phone)) phone = '+61' + phone.slice(1);
    const vanSel = g('van').value || 'unspecified';
    const vv = VANS.find(x => x.chassis === vanSel);
    const vanTxt = vanSel === 'unsure' ? 'Not sure yet' : vanSel === 'unspecified' ? 'Not specified' : vanSel + ' ' + (vv ? fullName(vv) : '');
    const intent = this.INTENTS[this.s.intent];
    const msg = (g('msg').value || '').trim();
    const ad = 'Stock Vans page | ' + intent + ' | Van: ' + vanTxt +
      (msg ? ' | Note: ' + msg.slice(0, 300) : '') + (this.s.consent ? ' | Newsletter: yes' : '');
    const post = document.createElement('form');
    post.method = 'POST'; post.action = 'https://wonderlandrv.activehosted.com/proc.php';
    post.target = 'ac_sink'; post.style.display = 'none';
    const H = { u: '47', f: '47', s: '', c: '0', m: '0', act: 'sub', v: '2', or: OR_TOKEN,
      firstname: g('firstname').value, lastname: g('lastname').value, email: g('email').value,
      phone: phone, 'field[27]': g('state').value, 'field[86]': ad };
    for (const k in H) {
      const i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = H[k];
      post.appendChild(i);
    }
    document.body.appendChild(post); post.submit();
    const st = document.getElementById('enqstatus');
    st.textContent = 'Thanks — enquiry sent. We will be in touch within 24 hours on business days.';
    st.style.color = '#2E7D32';
    f.reset(); this.s.intent = 0; if (this.s.consent) this.toggleConsent(); this.renderIntents();
    return false;
  },

  act(el) {
    const a = el.dataset.act, id = el.dataset.id, val = el.dataset.val, key = el.dataset.key;
    if (a === 'view') this.view(+id);
    else if (a === 'enquire') this.enquire(+id);
    else if (a === 'toggle') this.toggleIn(key, val);
    else if (a === 'clear') this.clearAll();
    else if (a === 'group') this.set('group', !this.s.group);
    else if (a === 'unchip') {
      const kind = el.dataset.kind;
      if (kind === 'status') this.set('status', 'all');
      else if (kind === 'slider') { const c = SLIDERS[val]; this.s[c.lo] = c.min; this.s[c.hi] = c.max; this.render(); }
      else this.toggleIn(kind, val);
    }
    else if (a === 'lenUnit') this.set('lenUnit', val);
    else if (a === 'wmetric') this.set('weightMetric', val);
    else if (a === 'intent') { this.s.intent = +id; this.renderIntents(); }
    else if (a === 'back') this.backToGrid();
    else if (a === 'galprev') { const v = VANS[this.s.detail]; this.s.gal = (this.s.gal - 1 + v.images.length) % v.images.length; this.renderDetail(); }
    else if (a === 'galnext') { const v = VANS[this.s.detail]; this.s.gal = (this.s.gal + 1) % v.images.length; this.renderDetail(); }
    else if (a === 'gal') { this.s.gal = +id; this.renderDetail(); }
    else if (a === 'tab') { this.s.tab = val; this.renderDetail(); }
    else if (a === 'closemob') document.getElementById('mobfilter').style.display = 'none';
    else if (a === 'openmob') this.openMob();
    else if (a === 'consent') this.toggleConsent();
  },

  boot() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (el) this.act(el);
    });
    document.addEventListener('change', e => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      if (el.dataset.act === 'status') this.set('status', el.value);
      else if (el.dataset.act === 'stateSel') { this.s.states = el.value ? [el.value] : []; this.render(); }
      else if (el.dataset.act === 'modelSel') { this.s.models = el.value ? [el.value] : []; this.render(); }
      else if (el.dataset.act === 'sort') { this.s.sort = el.value; this.render(); }
    });
    // Keyboard on the range inputs (arrow keys): light update while focused.
    document.addEventListener('input', e => {
      const el = e.target;
      if (el.classList && el.classList.contains('dual') && el.dataset.skey)
        this.setSlider(el.dataset.skey, el.dataset.end, el.value, true);
    });
    // Pointer drag engine for the dual sliders. Native range drag is unreliable with
    // stacked inputs (Safari ignores pointer-events on the thumb pseudo-element) and a
    // full re-render mid-drag destroys the input being dragged, so the wrapper owns the
    // pointer: pick the nearest thumb on pointerdown, track moves, full render on release.
    const dragState = {};
    document.addEventListener('pointerdown', e => {
      const w = e.target.closest('.dualwrap');
      if (!w) return;
      e.preventDefault();
      const key = w.dataset.skey, c = SLIDERS[key];
      const r = w.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const v = c.min + frac * (c.max - c.min);
      const dLo = Math.abs(v - this.s[c.lo]), dHi = Math.abs(v - this.s[c.hi]);
      dragState.key = key; dragState.end = (dLo < dHi || (dLo === dHi && v < this.s[c.lo])) ? 'lo' : 'hi';
      dragState.rect = r; dragState.active = true;
      w.setPointerCapture && w.setPointerCapture(e.pointerId);
      this.setSlider(key, dragState.end, v, true);
    });
    document.addEventListener('pointermove', e => {
      if (!dragState.active) return;
      const c = SLIDERS[dragState.key], r = dragState.rect;
      const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      this.setSlider(dragState.key, dragState.end, c.min + frac * (c.max - c.min), true);
    });
    document.addEventListener('pointerup', () => {
      if (!dragState.active) return;
      dragState.active = false;
      this.render();
    });
    document.getElementById('enqform').addEventListener('submit', e => this.submit(e));
    this.render();
    const h = location.hash.match(/^#van\/(WL\d+)/);
    if (h) { const v = VANS.find(x => x.chassis === h[1]); if (v) this.view(v.id); }
  }
};
SV.boot();
