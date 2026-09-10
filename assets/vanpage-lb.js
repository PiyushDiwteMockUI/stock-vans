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

/* ============================================================
   Fullscreen lightbox (PREVIEW build) — click a gallery photo to
   open it full screen; arrows / keyboard / swipe to move; ESC or
   tap-outside to close. Soft eased slide between photos.
   Self-contained: no markup changes, reads the existing thumbnails.
   ============================================================ */
(function () {
  var main = document.querySelector('.vp-main');
  var thumbs = document.getElementById('vp-thumbs');
  if (!main || !thumbs) return;
  var btns = Array.prototype.slice.call(thumbs.querySelectorAll('.thumbbtn'));
  if (!btns.length) return;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var big = function (u) {
    return u.replace(/pxc_size=\d+,\d+/, 'pxc_size=1600,1067')
            .replace(/-640\.(jpg|png)$/, '-1600.$1')
            .replace(/_sm\.(jpg|png)$/, '.$1');
  };
  var srcs = btns.map(function (b) {
    var sp = b.querySelector('span');
    var m = sp && sp.style.backgroundImage.match(/url\("?(.*?)"?\)/);
    return m ? big(m[1]) : '';
  });
  var n = srcs.length;

  var css = document.createElement('style');
  css.textContent = [
    '.vp-main,.vp-main img{cursor:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2732%27%20height%3D%2732%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cg%20stroke%3D%27%23ffffff%27%20stroke-width%3D%274.5%27%3E%3Cpath%20d%3D%27M4%209V4h5%27%2F%3E%3Cpath%20d%3D%27M20%209V4h-5%27%2F%3E%3Cpath%20d%3D%27M4%2015v5h5%27%2F%3E%3Cpath%20d%3D%27M20%2015v5h-5%27%2F%3E%3C%2Fg%3E%3Cg%20stroke%3D%27%23DB7627%27%20stroke-width%3D%272.6%27%3E%3Cpath%20d%3D%27M4%209V4h5%27%2F%3E%3Cpath%20d%3D%27M20%209V4h-5%27%2F%3E%3Cpath%20d%3D%27M4%2015v5h5%27%2F%3E%3Cpath%20d%3D%27M20%2015v5h-5%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E\") 16 16, zoom-in}',
    '.wl-lb{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;',
      'background:rgba(8,10,12,.94);opacity:0;transition:opacity .28s cubic-bezier(.23,1,.32,1);touch-action:none}',
    '.wl-lb.on{opacity:1}',
    '.wl-lb-stage{position:absolute;inset:0;overflow:hidden}',
    '.wl-lb-img{position:absolute;inset:0;margin:auto;max-width:92vw;max-height:88vh;width:auto;height:auto;',
      'object-fit:contain;user-select:none;-webkit-user-drag:none;will-change:transform,opacity}',
    '.wl-lb-btn{position:absolute;top:50%;transform:translateY(-50%);width:56px;height:56px;border-radius:50%;',
      "background:#fff;border:1px solid #E4E1DC;cursor:pointer;display:flex;align-items:center;justify-content:center;",
      "font:400 30px/1 'Gordita',sans-serif;color:#12171C!important;z-index:2;",
      'transition:transform .16s cubic-bezier(.23,1,.32,1)}',
    '.wl-lb-btn:hover,.wl-lb-btn:focus{background:#fff;color:#12171C!important;outline:none}',
    '.wl-lb-btn:active{transform:translateY(-50%) scale(.94)}',
    '.wl-lb-prev{left:22px}.wl-lb-next{right:22px}',
    '.wl-lb-close{position:absolute;top:20px;right:22px;width:48px;height:48px;border-radius:50%;',
      "background:#fff;border:1px solid #E4E1DC;cursor:pointer;display:flex;align-items:center;justify-content:center;",
      "font:400 20px/1 'Gordita',sans-serif;color:#12171C!important;z-index:2;transition:transform .16s cubic-bezier(.23,1,.32,1)}",
    '.wl-lb-close:hover,.wl-lb-close:focus{background:#fff;color:#12171C!important;outline:none}',
    '.wl-lb-close:active{transform:scale(.94)}',
    '.wl-lb-count{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);color:#fff;',
      "font:400 13px/1 'Gordita',sans-serif;letter-spacing:.08em;background:rgba(6,9,12,.55);padding:9px 15px;border-radius:3px;z-index:2}",
    '@media(max-width:700px){.wl-lb-btn{width:44px;height:44px;font-size:24px}.wl-lb-prev{left:8px}.wl-lb-next{right:8px}',
      '.wl-lb-img{max-width:96vw;max-height:82vh}.wl-lb-close{top:12px;right:12px}}',
    '@media(prefers-reduced-motion:reduce){.wl-lb,.wl-lb *{transition:none!important}}'
  ].join('');
  document.head.appendChild(css);

  var lb, stage, countEl, lbi = 0, anim = false, built = false, warmed = {};
  function warm(i){var k=(i+n)%n;if(warmed[k])return;warmed[k]=true;var im=new Image();im.src=srcs[k];}
  function mkBtn(cls,label,txt){var b=document.createElement('button');b.type='button';b.className=cls;
    b.setAttribute('aria-label',label);b.textContent=txt;return b;}
  function mkImg(src){var im=document.createElement('img');im.className='wl-lb-img';im.src=src;im.alt='';im.draggable=false;return im;}
  function build(){
    lb=document.createElement('div');lb.className='wl-lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    stage=document.createElement('div');stage.className='wl-lb-stage';lb.appendChild(stage);
    var prev=mkBtn('wl-lb-btn wl-lb-prev','Previous photo','‹');
    var next=mkBtn('wl-lb-btn wl-lb-next','Next photo','›');
    var close=mkBtn('wl-lb-close','Close','✕');
    countEl=document.createElement('span');countEl.className='wl-lb-count';
    lb.appendChild(prev);lb.appendChild(next);lb.appendChild(close);lb.appendChild(countEl);
    document.body.appendChild(lb);
    prev.addEventListener('click',function(e){e.stopPropagation();nav(-1)});
    next.addEventListener('click',function(e){e.stopPropagation();nav(1)});
    close.addEventListener('click',function(e){e.stopPropagation();closeLB()});
    lb.addEventListener('click',function(e){if(e.target===lb||e.target===stage)closeLB()});
    var sx=null;
    stage.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    stage.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;
      if(Math.abs(dx)>45)nav(dx<0?1:-1);sx=null},{passive:true});
    built=true;
  }
  function setCount(){countEl.textContent=(lbi+1)+' / '+n;}
  function openLB(i){
    if(!built)build();
    lbi=(i+n)%n;
    stage.innerHTML='';stage.appendChild(mkImg(srcs[lbi]));setCount();warm(lbi+1);warm(lbi-1);
    document.body.style.overflow='hidden';lb.style.display='flex';
    requestAnimationFrame(function(){requestAnimationFrame(function(){lb.classList.add('on')})});
    document.addEventListener('keydown',onKey);
  }
  function closeLB(){
    lb.classList.remove('on');
    document.removeEventListener('keydown',onKey);
    var done=false,fin=function(){if(done)return;done=true;lb.style.display='none';document.body.style.overflow='';
      stage.innerHTML='';lb.removeEventListener('transitionend',fin)};
    if(REDUCE)fin();else{lb.addEventListener('transitionend',fin);setTimeout(fin,420)}
    var b=btns[lbi];if(b)b.click();  // leave the inline gallery on the last-viewed photo
  }
  function nav(dir){
    if(anim||n<2)return;
    var ni=(lbi+dir+n)%n;if(ni===lbi)return;
    var cur=stage.querySelector('.wl-lb-img');
    var nx=mkImg(srcs[ni]);
    lbi=ni;setCount();warm(ni+dir);
    if(REDUCE){stage.innerHTML='';stage.appendChild(nx);return;}
    var enter=function(){
      anim=true;
      nx.style.transform='translateX('+(dir*42)+'%)';nx.style.opacity='0';stage.appendChild(nx);
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        var E='transform .42s cubic-bezier(.23,1,.32,1),opacity .42s cubic-bezier(.23,1,.32,1)';
        nx.style.transition=E;if(cur)cur.style.transition=E;
        nx.style.transform='translateX(0)';nx.style.opacity='1';
        if(cur){cur.style.transform='translateX('+(-dir*42)+'%)';cur.style.opacity='0';}
        var d2=false,end=function(){if(d2)return;d2=true;if(cur&&cur.parentNode)cur.remove();anim=false};
        nx.addEventListener('transitionend',end);setTimeout(end,560);
      })});
    };
    if(nx.decode)nx.decode().then(enter,enter);else{nx.onload=enter;nx.onerror=enter;}
  }
  function onKey(e){if(e.key==='Escape')closeLB();else if(e.key==='ArrowRight')nav(1);else if(e.key==='ArrowLeft')nav(-1);}
  main.addEventListener('click',function(e){
    if(e.target.closest('[data-nav]')||e.target.closest('button'))return;
    var idx=btns.findIndex(function(b){return b.classList.contains('on')});
    openLB(idx<0?0:idx);
  });
})();
