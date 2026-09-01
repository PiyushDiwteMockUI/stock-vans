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
  function show(i) {
    cur = (i + srcs.length) % srcs.length;
    var token = ++showToken;
    var next = srcs[cur];
    var pre = new Image();
    pre.src = next;
    var swap = function () { if (token === showToken) img.src = next; };
    if (pre.decode) pre.decode().then(swap, swap); else { pre.onload = swap; pre.onerror = swap; }
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
