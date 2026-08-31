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
  if (unit === 'm') return (v / 12 * 0.3048).toFixed(1) + ' m';
  return Math.floor(v / 12) + "'" + String(v % 12).padStart(2, '0') + '"';
};

const SAN = { ADD_ATTR: ['role', 'aria-checked', 'aria-label', 'aria-live', 'target'] };
function put(el, markup) { el.innerHTML = DOMPurify.sanitize(markup, SAN); }

const SV = {
  s: { models: [], layouts: [], states: [], axles: [], status: 'all', minPrice: PRICE_MIN, maxPrice: PRICE_MAX,
       minLen: LEN_MIN, maxLen: LEN_MAX, lenUnit: 'ft',
       sort: 'featured', group: false, consent: false, intent: 0, detail: null, gal: 0, tab: 'Chassis' },
  set(k, v) { this.s[k] = v; this.render(); },
  toggleIn(k, val) { const a = this.s[k]; this.s[k] = a.includes(val) ? a.filter(x => x !== val) : a.concat([val]); this.render(); },
  clearAll() { Object.assign(this.s, { models: [], layouts: [], states: [], axles: [], status: 'all', minPrice: PRICE_MIN, maxPrice: PRICE_MAX, minLen: LEN_MIN, maxLen: LEN_MAX }); this.render(); },

  matches(v, skip) {
    const s = this.s;
    if (skip !== 'models' && s.models.length && !s.models.includes(v.model)) return false;
    if (skip !== 'layouts' && s.layouts.length && !s.layouts.includes(v.layout)) return false;
    if (skip !== 'states' && s.states.length && !s.states.includes(v.state)) return false;
    if (skip !== 'axles' && s.axles.length && !s.axles.includes(v.axle)) return false;
    if (s.status !== 'all' && v.status !== s.status) return false;
    const p = v.priceN == null ? PRICE_MIN : v.priceN;
    if (p > s.maxPrice || p < s.minPrice) return false;
    if (v.lenIn != null && (v.lenIn < s.minLen || v.lenIn > s.maxLen)) return false;
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
    if (s.minPrice > PRICE_MIN || s.maxPrice < PRICE_MAX) c.push([money(s.minPrice) + ' – ' + money(s.maxPrice), 'price', '']);
    if (s.minLen > LEN_MIN || s.maxLen < LEN_MAX) c.push([fmtLen(s.minLen, s.lenUnit) + ' – ' + fmtLen(s.maxLen, s.lenUnit), 'len', '']);
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

  railHTML() {
    const s = this.s;
    const chk = (k, val) => `<button type="button" role="checkbox" aria-checked="${s[k].includes(val)}" class="chk" data-act="toggle" data-key="${k}" data-val="${val}">
      <span class="box ${s[k].includes(val) ? 'on' : ''}"></span><span style="flex:1;text-align:left">${val}</span>
      <span style="font:400 11.5px/1 'Gordita';color:var(--mut)">${this.countFor(k, val)}</span></button>`;
    const pct = v => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN) * 100).toFixed(2);
    const lpct = v => ((v - LEN_MIN) / (LEN_MAX - LEN_MIN) * 100).toFixed(2);
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
        <div class="kicker" style="margin-bottom:6px">Model</div>${MODELS.map(m => chk('models', m)).join('')}
      </div>
      <div style="padding:18px 0;border-bottom:1px solid var(--line)">
        <div class="kicker" style="margin-bottom:6px">Layout</div>${LAYOUTS.map(m => chk('layouts', m)).join('')}
      </div>
      <div style="padding:7px 0">
        <select autocomplete="off" aria-label="State" class="selbox" data-act="stateSel">
          <option value="">All states</option>
          ${STATES.map(st => `<option value="${st}" ${s.states[0] === st ? 'selected' : ''}>${st} (${this.countFor('states', st)})</option>`).join('')}
        </select>
      </div>
      <div style="padding:18px 0;border-bottom:1px solid var(--line)">
        <div style="margin-bottom:11px"><span class="kicker">Budget</span></div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px">
          <span style="font:400 12px/1 'Gordita';color:var(--mut)">${money(s.minPrice)}</span>
          <span style="font:500 13px/1 'Gordita';color:var(--olink)">${money(s.maxPrice)}</span>
        </div>
        <div style="position:relative;height:28px">
          <div style="position:absolute;left:0;right:0;top:12px;height:3px;background:#D8D3CC;border-radius:2px"></div>
          <div style="position:absolute;top:12px;height:3px;border-radius:2px;background:var(--olink);left:${pct(s.minPrice)}%;right:${(100 - pct(s.maxPrice)).toFixed(2)}%"></div>
          <input type="range" autocomplete="off" class="dual" aria-label="Budget minimum" min="${PRICE_MIN}" max="${PRICE_MAX}" step="1000" value="${s.minPrice}" data-act="priceMin" style="z-index:3">
          <input type="range" autocomplete="off" class="dual" aria-label="Budget maximum" min="${PRICE_MIN}" max="${PRICE_MAX}" step="1000" value="${s.maxPrice}" data-act="priceMax" style="z-index:4">
        </div>
      </div>
      <div style="padding:18px 0;border-bottom:1px solid var(--line)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:11px">
          <span class="kicker">Length</span>
          <span style="display:inline-flex;border:1px solid var(--line2);border-radius:2px;overflow:hidden">
            ${['ft', 'm'].map(u => `<button type="button" class="unitbtn ${s.lenUnit === u ? 'on' : ''}" data-act="lenUnit" data-val="${u}">${u}</button>`).join('')}
          </span>
        </div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px">
          <span style="font:400 12px/1 'Gordita';color:var(--mut)">${fmtLen(s.minLen, s.lenUnit)}</span>
          <span style="font:500 13px/1 'Gordita';color:var(--olink)">${fmtLen(s.maxLen, s.lenUnit)}</span>
        </div>
        <div style="position:relative;height:28px">
          <div style="position:absolute;left:0;right:0;top:12px;height:3px;background:#D8D3CC;border-radius:2px"></div>
          <div style="position:absolute;top:12px;height:3px;border-radius:2px;background:var(--olink);left:${lpct(s.minLen)}%;right:${(100 - lpct(s.maxLen)).toFixed(2)}%"></div>
          <input type="range" autocomplete="off" class="dual" aria-label="Length minimum" min="${LEN_MIN}" max="${LEN_MAX}" step="1" value="${s.minLen}" data-act="lenMin" style="z-index:3">
          <input type="range" autocomplete="off" class="dual" aria-label="Length maximum" min="${LEN_MIN}" max="${LEN_MAX}" step="1" value="${s.maxLen}" data-act="lenMax" style="z-index:4">
        </div>
      </div>
      <div style="padding:18px 0;border-bottom:1px solid var(--line)">
        <div class="kicker" style="margin-bottom:6px">Axle</div>${AXLES.map(m => chk('axles', m)).join('')}
      </div>
      <button type="button" role="checkbox" aria-checked="${s.group}" class="chk" style="padding-top:20px" data-act="group">
        <span class="box ${s.group ? 'on' : ''}"></span><span style="flex:1;text-align:left">Group by location</span>
      </button>
      <button type="button" class="btn-orange" style="width:100%;margin-top:20px" data-act="clear">Reset filters</button>
      <div style="margin-top:28px;background:var(--ink);padding:22px;border-radius:4px">
        <div style="font:500 10px/1 'Gordita';letter-spacing:.28em;text-transform:uppercase;color:var(--peach);margin-bottom:12px">Not sure?</div>
        <p style="margin:0 0 16px;font:300 13px/1.55 'Gordita';color:rgba(255,255,255,.72)">Tell us how you travel and we will point you at the right van. No hard sell.</p>
        <a href="#enquire" class="talkbtn">Talk to us</a>
      </div>`;
  },

  render() {
    const list = this.filtered();
    document.getElementById('count').textContent = list.length;
    put(document.getElementById('railbox'), this.railHTML());
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
    const sel = document.getElementById('vanselect');
    const keep = sel.value;
    put(sel, '<option value="">Which van are you asking about?</option>' +
      VANS.map(v => `<option value="${v.chassis}">${v.chassis} · ${fullName(v)} (${v.state})</option>`).join('') +
      '<option value="unsure">Not sure yet, help me choose</option>');
    sel.value = keep;
    this.renderIntents();
    this.syncMob();
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
            ${[['Stock no', v.chassis], ['Layout code', v.code], ['Length', v.length || '—'], ['Layout', v.layout], ['Condition', v.used ? 'Pre-loved' : 'New'], ['Location', v.state], ['Photos', v.images.length]].map(([k, val]) => `
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
      else if (kind === 'price') { this.s.minPrice = PRICE_MIN; this.s.maxPrice = PRICE_MAX; this.render(); }
      else if (kind === 'len') { this.s.minLen = LEN_MIN; this.s.maxLen = LEN_MAX; this.render(); }
      else this.toggleIn(kind, val);
    }
    else if (a === 'lenUnit') this.set('lenUnit', val);
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
      else if (el.dataset.act === 'sort') { this.s.sort = el.value; this.render(); }
    });
    document.addEventListener('input', e => {
      const el = e.target.closest('[data-act]');
      if (!el) return;
      if (el.dataset.act === 'priceMin') { this.s.minPrice = Math.min(+el.value, this.s.maxPrice - 1000); this.render(); }
      else if (el.dataset.act === 'priceMax') { this.s.maxPrice = Math.max(+el.value, this.s.minPrice + 1000); this.render(); }
      else if (el.dataset.act === 'lenMin') { this.s.minLen = Math.min(+el.value, this.s.maxLen - 1); this.render(); }
      else if (el.dataset.act === 'lenMax') { this.s.maxLen = Math.max(+el.value, this.s.minLen + 1); this.render(); }
    });
    document.getElementById('enqform').addEventListener('submit', e => this.submit(e));
    this.render();
    const h = location.hash.match(/^#van\/(WL\d+)/);
    if (h) { const v = VANS.find(x => x.chassis === h[1]); if (v) this.view(v.id); }
  }
};
SV.boot();
