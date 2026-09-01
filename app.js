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
    code: (v.code || '').replace(' ()', '').trim(),
    lenIn: lenN === 99 ? null : Math.floor(lenN) * 12 + Math.round((lenN % 1) * 100),
    axle: lenN < 18 ? 'Single axle' : 'Tandem axle',
    status: v.used ? 'Pre-loved' : (v.year < 2026 ? 'Clearance' : 'Stock van'),
    clearance: v.year < 2026,
    img: v.images[0] || ''
  });
});
const fullName = v => v.name.startsWith(v.model) ? v.name : v.model + ' ' + v.name;
const MODELS = ['Solara', 'XTR', 'Hornet', 'Amaroo'];
const STATES = [...new Set(VANS.map(v => v.state))];
const LAYOUTS = ['Couples', 'Family'];
const AXLES = ['Single axle', 'Tandem axle'];
// Standard-spec inclusion chips per model, from the live range page spec tables.
const INCL = {
  XTR: ['Victron off-grid power', 'Cruisemaster ATX airbag suspension', '2 x 90-100L water tanks'],
  Hornet: ['Redarc Alpha 75 off-grid power', 'Cruisemaster XT airbag suspension', '2 x 90-100L water tanks'],
  Amaroo: ['Redarc Alpha 50 off-grid power', 'Cruisemaster coil suspension', '2 x 90-100L water tanks'],
  Solara: ['Redarc Alpha 75 off-grid power', 'Frameless composite construction', '2 x 90-100L water tanks']
};
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
        <img src="${v.img}" alt="${v.name}" loading="lazy" width="430" height="269" style="width:100%;height:100%;object-fit:cover;display:block;filter:contrast(1.05) saturate(1.06)">
        <div style="position:absolute;top:12px;left:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-start">
          ${v.clearance ? '<span class="badge-red">Clearance</span>' : '<span class="badge-dark">Ready now</span>'}
          ${v.used ? '<span class="badge-grey">Pre-loved</span>' : ''}
        </div>
        ${v.model === 'Solara' ? '<img src="https://wonderlandrv.com.au/wp-content/uploads/2026/06/Coty-JCA-2-212x300.png" alt="Caravan of the Year 2026 Judges Choice Award" width="212" height="300" loading="lazy" style="position:absolute;top:0;right:16px;width:96px;height:auto;filter:drop-shadow(0 4px 10px rgba(0,0,0,.38))">' : ''}
        <span class="photocount">${v.images.length} photos</span>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;flex:1">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px">
          <span class="modelkick">${v.model} · ${v.year}</span>
          <span style="font:400 10.5px/1 'Gordita';letter-spacing:.06em;color:var(--mut)">${v.code}</span>
        </div>
        <h3 class="av cardname" data-act="view" data-id="${v.id}">${v.name}</h3>
        <div class="cardspecs">
          <div><div class="speck">Length</div><div class="specv">${v.length || '—'}</div></div>
          <div><div class="speck">Sleeps</div><div class="specv">${v.sleeps || '—'}</div></div>
          <div><div class="speck">Tare</div><div class="specv">${v.tare ? kg(v.tare) : '—'}</div></div>
          <div><div class="speck">ATM</div><div class="specv">${v.atm ? kg(v.atm) : '—'}</div></div>
        </div>
        <div style="margin-top:auto">
          <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">
            <span class="av" style="font-size:27px;line-height:1;letter-spacing:-.02em">${v.priceTxt}</span>
            ${v.was && v.priceN ? '<span style="font:400 14px/1 \'Gordita\';color:var(--mut);text-decoration:line-through;font-variant-numeric:tabular-nums">' + money(v.was) + '</span><span style="font:500 12.5px/1 \'Gordita\';color:var(--olink);font-variant-numeric:tabular-nums">Save ' + money(v.was - v.priceN) + '</span>' : ''}
            ${v.priceN ? '<span style="font:400 12px/1 \'Gordita\';color:var(--mut)">drive away · ' + v.state + '</span>' : ''}
          </div>
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
        ${c.icon ? `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" style="display:block;flex:none"><path d="${c.icon}" fill="none" stroke="var(--svink)" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"></path></svg>` : ''}
        <span class="kicker">${c.title}</span>
        ${extraHead || ''}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px">
        <span class="slb-lo" style="font:400 13px/1 'Gordita';color:var(--mut);font-variant-numeric:tabular-nums">${fmt(s[c.lo])}</span>
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
      <span style="font:400 12.5px/1 'Gordita';color:var(--mut);font-variant-numeric:tabular-nums">${this.countFor(k, val)}</span></button>`;
    const wUnits = `<div style="margin-left:auto;display:flex;gap:6px">${[['tare','Tare'],['atm','ATM'],['ball','Ball']].map(([k,l]) =>
      `<button type="button" class="useg ${s.weightMetric === k ? 'on' : ''}" data-act="wmetric" data-val="${k}">${l}</button>`).join('')}</div>`;
    const lUnits = `<div style="margin-left:auto;display:flex;gap:6px">${[['m','Metres'],['ft','Feet']].map(([k,l]) =>
      `<button type="button" class="useg ${s.lenUnit === k ? 'on' : ''}" data-act="lenUnit" data-val="${k}">${l}</button>`).join('')}</div>`;
    return `
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding-bottom:14px;border-bottom:2px solid var(--svink);margin-bottom:6px">
        <span class="av" style="font-size:14px;letter-spacing:.06em;text-transform:uppercase">Refine</span>
        <button class="linkbtn" data-act="clear">Clear all</button>
      </div>
      <div style="padding:16px 0 4px">
        <select autocomplete="off" aria-label="Stock status" class="selbox selstatus" data-act="status">
          <option value="all" ${s.status === 'all' ? 'selected' : ''}>Show all stock</option>
          <option value="Stock van" ${s.status === 'Stock van' ? 'selected' : ''}>New stock vans</option>
          <option value="Clearance" ${s.status === 'Clearance' ? 'selected' : ''}>Clearance</option>
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
      <div style="margin-top:28px;background:var(--svink);padding:22px;border-radius:4px">
        <div style="font:500 10px/1 'Gordita';letter-spacing:.28em;text-transform:uppercase;color:var(--peach);margin-bottom:12px">Not sure?</div>
        <p style="margin:0 0 16px;font:400 13px/1.55 'Gordita';color:rgba(255,255,255,.72)">Tell us how you travel and we will point you at the right van. No hard sell.</p>
        <a href="#enquire" class="talkbtn">Talk to us</a>
      </div>`;
  },

  render() {
    put(document.getElementById('railbox'), this.railHTML());
    this.renderList();
    const sel = document.getElementById('vanselect');
    const keep = sel.value;
    put(sel, '<option value="">Which van are you asking about?</option>' +
      VANS.map(v => `<option value="${v.chassis}">${v.model} ${v.code} · ${(v.name.startsWith(v.model) ? v.name.slice(v.model.length).trim() : v.name)} (${v.state})</option>`).join('') +
      '<option value="unsure">Not sure yet, help me choose</option>');
    sel.value = keep;
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
          <span style="font:400 12.5px/1 'Gordita';color:var(--mut)">${g.vans.length} vans</span>
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

  view(id) { location.href = 'vans/' + VANS[id].chassis.toLowerCase() + '.html'; },

  enquire(id) {
    const v = VANS[id];
    document.getElementById('vanselect').value = v.chassis;
    document.getElementById('enquire').scrollIntoView({ behavior: 'smooth' });
  },

  openMob() {
    const m = document.getElementById('mobfilter');
    m.style.display = 'block';
    put(m, `<div class="modal-bg" data-act="closemob"></div>
      <div class="mobpanel">
        <div style="flex:none;background:var(--svink);padding:20px;display:flex;align-items:center;gap:12px">
          <span class="av" style="font-size:16px;letter-spacing:.09em;text-transform:uppercase;color:#fff">Filters</span>
          <button class="mobx" data-act="closemob" aria-label="Close filters">×</button>
        </div>
        <div id="mobrail" style="flex:1;min-height:0;overflow-y:auto;padding:0 20px 20px"></div>
        <div style="flex:none;border-top:1px solid var(--line);padding:13px 20px;display:flex;gap:9px;background:#fff">
          <button class="btn-line" style="flex:0 0 88px" data-act="clear">Clear</button>
          <button class="btn-dark" style="flex:1" data-act="closemob">Show <span id="mobcount">${this.filtered().length}</span> vans</button>
        </div>
      </div>`);
    this.syncMob();
    requestAnimationFrame(() => { const p = document.querySelector('.mobpanel'); if (p) p.classList.add('in'); });
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
    const LBL = { 'first-name': 'first name', 'last-name': 'last name', email: 'email', phone: 'phone', state: 'state', postcode: 'post code' };
    for (const n of ['first-name', 'last-name', 'email', 'phone', 'state', 'postcode']) {
      if (!g(n).value) {
        g(n).focus();
        const st0 = document.getElementById('enqstatus');
        st0.textContent = 'Please add your ' + LBL[n] + ' and press Submit again.';
        st0.style.color = '#C0392B';
        return false;
      }
    }
    let phone = g('phone').value.replace(/\s+/g, '');
    if (/^0\d{9}$/.test(phone)) phone = '+61' + phone.slice(1);
    // AC field 27 has a combined NSW/ACT option; the visible form keeps the plain state names.
    const stateMap = { 'New South Wales': 'New South Wales / ACT', 'Australian Capital Territory': 'New South Wales / ACT' };
    const stateVal = stateMap[g('state').value] || g('state').value;
    const vanSel = g('van').value || 'unspecified';
    const vv = VANS.find(x => x.chassis === vanSel);
    const vanTxt = vanSel === 'unsure' ? 'Not sure yet' : vanSel === 'unspecified' ? 'Not specified' : vanSel + ' ' + (vv ? fullName(vv) : '');
    const intentEl = f.querySelector('[name="enquiry-type"]:checked');
    const intent = intentEl ? intentEl.value : 'Call back';
    const msg = (g('message').value || '').trim();
    const consent = g('marketing').checked;
    const ad = 'Stock Vans page | ' + intent + ' | Van: ' + vanTxt + ' | Postcode: ' + g('postcode').value.slice(0, 8) +
      (msg ? ' | Note: ' + msg.slice(0, 300) : '') + (consent ? ' | Newsletter: yes' : '');
    const post = document.createElement('form');
    post.method = 'POST'; post.action = 'https://wonderlandrv.activehosted.com/proc.php';
    post.target = 'ac_sink'; post.style.display = 'none';
    const H = { u: '47', f: '47', s: '', c: '0', m: '0', act: 'sub', v: '2', or: OR_TOKEN,
      firstname: g('first-name').value, lastname: g('last-name').value, email: g('email').value,
      phone: phone, 'field[27]': stateVal, 'field[86]': ad };
    for (const k in H) {
      const i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = H[k];
      post.appendChild(i);
    }
    document.body.appendChild(post); post.submit();
    const st = document.getElementById('enqstatus');
    st.textContent = 'Thanks — enquiry sent. We will be in touch within 24 hours on business days.';
    st.style.color = '#2E7D32';
    f.reset();
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
    else if (a === 'closemob') document.getElementById('mobfilter').style.display = 'none';
    else if (a === 'openmob') this.openMob();
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
      try { w.setPointerCapture && w.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events have no active pointer */ }
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
    if (h) { location.replace('vans/' + h[1].toLowerCase() + '.html'); return; }
    if (location.hash === '#index') { location.replace('vans/'); return; }
    const q = new URLSearchParams(location.search).get('van');
    if (q) {
      const v = VANS.find(x => x.chassis.toUpperCase() === q.toUpperCase());
      if (v) { document.getElementById('vanselect').value = v.chassis;
        document.getElementById('enquire').scrollIntoView(); }
    }
  }
};
SV.boot();
