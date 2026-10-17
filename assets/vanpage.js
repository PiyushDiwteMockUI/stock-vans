/* Gallery for a static van page: thumbnails + prev/next swap the main image. */
'use strict';
(function () {
  var img = document.getElementById('vp-img');
  var thumbs = document.getElementById('vp-thumbs');
  if (!img || !thumbs) return;
  var btns = Array.prototype.slice.call(thumbs.querySelectorAll('.thumbbtn'));
  var toFull = function (u) {
    u = u.replace(/pxc_size=\d+,\d+/, 'pxc_size=1024,683');
    return u.replace(/_sm\.(jpg|png)$/, '.$1');
  };
  var smalls = btns.map(function (b) {
    var m = b.querySelector('span').style.backgroundImage.match(/url\("?(.*?)"?\)/);
    return m ? m[1] : '';
  });
  var srcs = smalls.map(toFull);
  var cur = 0, showToken = 0;
  var sides = Array.prototype.slice.call(document.querySelectorAll('.vp-side'));
  var warmed = {};
  function warm(list, i) {
    var k = (i + list.length) % list.length;
    var key = list === srcs ? 'f' + k : 's' + k;
    if (warmed[key]) return;
    warmed[key] = true;
    var im = new Image(); im.src = list[k];
  }
  function warmRing() {
    warm(srcs, cur + 1); warm(srcs, cur - 1); warm(srcs, cur + 2);
    for (var j = 1; j <= 5; j++) warm(smalls, cur + j);
  }
  function paint() {
    btns.forEach(function (b, j) { b.classList.toggle('on', j === cur); });
    var n = document.getElementById('vp-n');
    if (n) n.textContent = cur + 1;
    btns[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    sides.forEach(function (s, j) {
      var k = (cur + 1 + j) % smalls.length;
      var im = s.querySelector('img');
      if (im) im.src = smalls[k];
      s.dataset.goto = k;
      s.setAttribute('aria-label', 'Photo ' + (k + 1));
    });
    warmRing();
  }
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function slideTo(next, dir, token) {
    var main = img.parentElement;
    Array.prototype.slice.call(main.querySelectorAll('img[data-ov]')).forEach(function (o) { o.remove(); });
    img.style.transition = 'none'; img.style.transform = 'none';
    var ov = document.createElement('img');
    ov.setAttribute('data-ov', '1');
    ov.src = next; ov.alt = img.alt;
    ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;filter:contrast(1.05) saturate(1.06);transform:translateX(' + (dir * 100) + '%)';
    main.appendChild(ov);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      var EASE = 'transform .95s cubic-bezier(.45,.05,.15,1)';
      ov.style.transition = EASE; img.style.transition = EASE;
      ov.style.transform = 'translateX(0)';
      img.style.transform = 'translateX(' + (-dir * 100) + '%)';
      var done = false;
      var fin = function () {
        if (done) return; done = true;
        if (token === showToken) img.src = next;
        img.style.transition = 'none'; img.style.transform = 'none';
        ov.remove();
      };
      ov.addEventListener('transitionend', fin);
      setTimeout(fin, 1150);
    }); });
  }
  function show(i) {
    var n = srcs.length;
    var target = (i + n) % n;
    if (target === cur) { paint(); return; }
    var raw = target - cur; if (raw > n / 2) raw -= n; if (raw < -n / 2) raw += n;
    var dir = raw >= 0 ? 1 : -1;
    cur = target;
    var token = ++showToken;
    var next = srcs[cur];
    var pre = new Image();
    pre.src = next;
    var go = function () {
      if (token !== showToken) return;
      if (!REDUCE) slideTo(next, dir, token);
      else img.src = next;
    };
    if (pre.decode) pre.decode().then(go, go); else { pre.onload = go; pre.onerror = go; }
    paint();
  }
  warmRing();
  thumbs.addEventListener('click', function (e) {
    var b = e.target.closest('.thumbbtn');
    if (b) show(btns.indexOf(b));
  });
  document.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    if (nav) { show(cur + parseInt(nav.dataset.nav, 10)); return; }
    var side = e.target.closest('[data-goto]');
    if (side) {
      show(parseInt(side.dataset.goto, 10));
      var main = document.querySelector('.vp-main');
      if (main) main.scrollIntoView({ block: 'nearest' });
    }
  });
  // Floorplan carousel: continuous one-direction loop (first slide cloned at the end,
  // snap back invisibly after the clone), soft ease, pauses on hover/touch/off-screen.
  var car = document.querySelector('.fp-car');
  if (car) {
    var track = car.querySelector('.fp-track');
    var dots = Array.prototype.slice.call(car.querySelectorAll('.fp-dot'));
    var n = dots.length, fi = 0, timer = null, snapping = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (n > 1) track.appendChild(track.children[0].cloneNode(true));
    var EASE = 'transform 1.1s cubic-bezier(.45,.05,.15,1)';
    track.style.transition = EASE;
    function paint() {
      dots.forEach(function (d, j) { d.style.background = j === (fi % n) ? 'var(--svink)' : '#fff'; });
    }
    function go(i) {
      fi = i;
      track.style.transform = 'translateX(-' + (fi * 100) + '%)';
      paint();
    }
    track.addEventListener('transitionend', function () {
      if (fi === n) {
        snapping = true;
        track.style.transition = 'none';
        fi = 0;
        track.style.transform = 'translateX(0%)';
        void track.offsetWidth;
        track.style.transition = EASE;
        snapping = false;
        paint();
      }
    });
    function start() { if (!reduce && n > 1 && !timer) timer = setInterval(function () { if (!snapping) go(fi + 1); }, 4200); }
    function stop() { clearInterval(timer); timer = null; }
    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', start);
    car.addEventListener('touchstart', stop, { passive: true });
    function step(dir) {
      stop();
      if (dir < 0 && fi === 0) {
        track.style.transition = 'none';
        fi = n;
        track.style.transform = 'translateX(-' + (n * 100) + '%)';
        void track.offsetWidth;
        track.style.transition = EASE;
        go(n - 1);
      } else {
        go(fi + dir);
      }
    }
    car.addEventListener('click', function (e) {
      var d = e.target.closest('.fp-dot');
      if (d) { stop(); go(parseInt(d.dataset.fp, 10)); return; }
      var nav = e.target.closest('[data-fpnav]');
      if (nav) step(parseInt(nav.dataset.fpnav, 10));
    });
    // Swipe between floorplan views on touch devices
    var fsx = null;
    car.addEventListener('touchstart', function (e) { fsx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (fsx === null) return;
      var dx = e.changedTouches[0].clientX - fsx;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      fsx = null;
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(car);
    } else { start(); }
  }
  // Exclusive spec accordion: opening one section closes the open one, both animated.
  var accs = Array.prototype.slice.call(document.querySelectorAll('.spec-acc'));
  accs.forEach(function (acc) {
    acc.querySelector('.spec-head').addEventListener('click', function () {
      var isOpen = acc.classList.contains('open');
      if (isOpen && window.matchMedia('(min-width: 901px)').matches) return; // desktop tabs: one always open
      accs.forEach(function (a) {
        a.classList.remove('open');
        a.querySelector('.spec-head').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        acc.classList.add('open');
        acc.querySelector('.spec-head').setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* on phones the buy/warranty sidebar sits above Similar vans in stock */
(function () {
  var aside = document.querySelector('.detailside'), sim = document.querySelector('.vp-simblock');
  if (!aside || !sim) return;
  var home = aside.parentElement, mq = matchMedia('(max-width:900px)');
  function place() {
    if (mq.matches) sim.parentNode.insertBefore(aside, sim);
    else home.appendChild(aside);
  }
  place();
  if (mq.addEventListener) mq.addEventListener('change', place);
})();

/* Specifications-at-a-glance rail: switch the visible category table. */
(function () {
  var rail = document.querySelector('.sg-rail');
  if (!rail) return;
  rail.addEventListener('click', function (e) {
    var b = e.target.closest('.sg-item');
    if (!b) return;
    Array.prototype.forEach.call(rail.querySelectorAll('.sg-item'), function (x) {
      var on = x === b;
      x.classList.toggle('on', on);
      x.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.sg-panel'), function (p) {
      p.classList.toggle('on', p.getAttribute('data-tab') === b.getAttribute('data-tab'));
    });
  });
})();

/* Van page enquiry form (15 Oct 2026). Posts to ActiveCampaign form 47 the same way as the /stock/ form in app.js:
   same fields, same Ad Source pattern ('Stock Vans page | intent | Van: WLxxxx Name ...'), same GA4 / dataLayer / Meta events,
   with the van fixed to this page. On phones the panel moves directly under the price box, and a Call / Hold bar is fixed to the bottom. */
(function () {
  var box = document.querySelector('.side-enq');
  if (!box) return;
  var f = box.querySelector('.se-form'), done = box.querySelector('.se-done');
  var specs = document.querySelector('.vp-specs'), facts = document.querySelector('.detailside .side-facts');
  var mq = matchMedia('(max-width:900px)');
  function place() {
    // phones: the form sits after the Specifications block (Piyush, 18 Oct 2026); the bottom bar jumps to it
    if (mq.matches && specs) { specs.parentNode.insertBefore(box, specs.nextSibling); box.classList.add('is-mobile'); document.body.classList.add('vp-has-bar'); }
    else if (facts) { facts.parentNode.insertBefore(box, facts); box.classList.remove('is-mobile'); document.body.classList.remove('vp-has-bar'); }
  }
  place();
  if (mq.addEventListener) mq.addEventListener('change', place);

  // Phone bar slides out while the form is at least 25% in view, back when it leaves
  var bar = document.getElementById('vp-bar');
  if (bar && window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { bar.classList.toggle('is-off', e.isIntersecting); });
    }, { threshold: 0.25 }).observe(box);
  }

  // Submit button follows the chosen chip (v3, 18 Oct 2026)
  var sub = f.querySelector('.se-submit'), chassis = sub ? sub.getAttribute('data-chassis') : '';
  var BTN = { 'Hold this van': 'Hold this van for me', 'Call back': 'Call me back', 'Book a viewing': 'Book my viewing' };
  function syncBtn() {
    var c = f.querySelector('input[name="enquiry-type"]:checked');
    if (sub && c) sub.textContent = BTN[c.value] || BTN['Hold this van'];
  }
  syncBtn();
  f.addEventListener('change', function (e) { if (e.target.name === 'enquiry-type') syncBtn(); });

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-enq-intent]');
    if (!a) return;
    e.preventDefault();
    var want = a.getAttribute('data-enq-intent');
    var r = want ? f.querySelector('input[name="enquiry-type"][value="' + want + '"]') : null;
    if (r) { r.checked = true; syncBtn(); }
    goTo(box);
    setTimeout(function () { var fn = f.querySelector('[name="first-name"]'); if (fn) fn.focus(); }, reduce ? 0 : 700);
  });

  // Scroll so el sits near the top of the screen. On desktop the sidebar is sticky, so measure where el sits
  // with sticky switched off (its real place in the page) instead of where it happens to be drawn right now.
  function goTo(el) {
    var aside = el.closest('.detailside'), y;
    if (aside && !box.classList.contains('is-mobile')) {
      var pos = aside.style.position, top = aside.style.top;
      aside.style.position = 'relative'; aside.style.top = '0px';
      y = el.getBoundingClientRect().top + window.scrollY;
      aside.style.position = pos; aside.style.top = top;
    } else {
      y = el.getBoundingClientRect().top + window.scrollY;
    }
    window.scrollTo({ top: Math.max(0, y - 110), behavior: reduce ? 'auto' : 'smooth' });
  }

  f.addEventListener('input', function (e) {
    var w = e.target.closest('.se-f');
    if (w) { w.classList.remove('is-err'); e.target.removeAttribute('aria-invalid'); }
  });
  f.addEventListener('change', function (e) {
    var w = e.target.closest('.se-f');
    if (w) { w.classList.remove('is-err'); e.target.removeAttribute('aria-invalid'); }
  });

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var g = function (n) { return f.querySelector('[name="' + n + '"]'); };
    var first = null;
    ['first-name', 'last-name', 'email', 'phone', 'state'].forEach(function (n) {
      var el = g(n), v = (el.value || '').trim();
      var bad = !v || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || (n === 'phone' && v.replace(/\D/g, '').length < 8);
      el.closest('.se-f').classList.toggle('is-err', bad);
      if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      if (bad && !first) first = el;
    });
    if (first) { first.focus(); return false; }
    var phone = g('phone').value.replace(/\s+/g, '');
    if (/^0\d{9}$/.test(phone)) phone = '+61' + phone.slice(1);
    // AC field 27 has a combined NSW/ACT option (same map as app.js)
    var stateMap = { 'New South Wales': 'New South Wales / ACT', 'Australian Capital Territory': 'New South Wales / ACT' };
    var stateVal = stateMap[g('state').value] || g('state').value;
    var vanTxt = f.getAttribute('data-vantxt');
    var intentEl = f.querySelector('[name="enquiry-type"]:checked');
    var intent = intentEl ? intentEl.value : 'Hold this van';
    var msg = (g('message').value || '').trim();
    var subscribed = g('subscribe').checked;
    var ad = 'Stock Vans page | ' + intent + ' | Van: ' + vanTxt +
      (msg ? ' | Note: ' + msg.slice(0, 300) : '') + (subscribed ? ' | Newsletter: yes' : ' | Newsletter: no') + ' | Form: van page';
    var post = document.createElement('form');
    post.method = 'POST'; post.action = 'https://wonderlandrv.activehosted.com/proc.php';
    post.target = 'ac_sink'; post.style.display = 'none';
    var H = { u: '47', f: '47', s: '', c: '0', m: '0', act: 'sub', v: '2', or: f.getAttribute('data-or'),
      firstname: g('first-name').value.trim(), lastname: g('last-name').value.trim(), email: g('email').value.trim(),
      phone: phone, 'field[27]': stateVal, 'field[86]': ad };
    // Subscribe to Marketing (AC field 24, checkbox): sent only when ticked, as the field's single option label
    if (subscribed) H['field[24][]'] = 'I would like to receive marketing communications with discounts, updates, new releases and more. I understand I can unsubscribe at anytime.';
    for (var k in H) {
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = H[k];
      post.appendChild(i);
    }
    document.body.appendChild(post); post.submit();
    try {
      if (typeof gtag === 'function') gtag('event', 'stock_vans_enquiry', { lead_source: 'Stock Vans page', van: vanTxt, enquiry_type: intent, form_location: 'van page' });
      /* GTM-readable event for the Tracklution forwarder (Lead + ContactInfo), same shape as app.js */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'stock_vans_enquiry', form_name: 'Stock van enquiry', lead_source: 'Stock Vans page', van: vanTxt, enquiry_type: intent, page_path: location.pathname,
        user: { email: g('email').value.trim(), phone: phone, firstName: g('first-name').value.trim(), lastName: g('last-name').value.trim() } });
      if (typeof fbq === 'function') fbq('trackCustom', 'Stock Vans Enquiry', { van: vanTxt, enquiry_type: intent });
    } catch (err) {}
    var nm = done.querySelector('.se-done-name');
    if (nm) nm.textContent = ' ' + g('first-name').value.trim();
    var dm = done.querySelector('.se-done-msg'), ch = done.getAttribute('data-chassis');
    if (dm) dm.textContent = intent === 'Hold this van'
      ? ch + ' is on hold for you for two business days. We will call you the same business day to confirm.'
      : 'Got it. We will call you about ' + ch + ' the same business day.';
    f.hidden = true; done.hidden = false;
    var rect = done.getBoundingClientRect();
    if (rect.top < 90 || rect.bottom > window.innerHeight) goTo(done);
    try { done.focus({ preventScroll: true }); } catch (err) { done.focus(); }
    return false;
  });
})();

/* desktop: the sidebar is taller than the screen now that it holds the form, so it sticks by its bottom edge
   (scrolls with the page until Key details and the warranty note are in view, then holds) instead of hiding them */
(function () {
  var a = document.querySelector('.detailside');
  if (!a) return;
  var mq = matchMedia('(min-width:901px)');
  function fit() {
    if (!mq.matches) { a.style.top = ''; return; }
    var h = a.offsetHeight, vh = window.innerHeight;
    a.style.top = (h + 40 > vh ? Math.round(vh - h - 20) : 20) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(a);
})();
