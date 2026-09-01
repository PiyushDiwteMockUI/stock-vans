/* Gallery for a static van page: thumbnails + prev/next swap the main image. */
'use strict';
(function () {
  var img = document.getElementById('vp-img');
  var thumbs = document.getElementById('vp-thumbs');
  if (!img || !thumbs) return;
  var btns = Array.prototype.slice.call(thumbs.querySelectorAll('.thumbbtn'));
  var srcs = btns.map(function (b) {
    var m = b.querySelector('span').style.backgroundImage.match(/url\("?(.*?)"?\)/);
    return m ? m[1] : '';
  });
  var cur = 0;
  var sides = Array.prototype.slice.call(document.querySelectorAll('.vp-side'));
  function show(i) {
    cur = (i + srcs.length) % srcs.length;
    img.src = srcs[cur];
    btns.forEach(function (b, j) { b.classList.toggle('on', j === cur); });
    var n = document.getElementById('vp-n');
    if (n) n.textContent = cur + 1;
    btns[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    // side grid rolls with the gallery: always the next four photos
    sides.forEach(function (s, j) {
      var k = (cur + 1 + j) % srcs.length;
      var im = s.querySelector('img');
      if (im) im.src = srcs[k];
      s.dataset.goto = k;
      s.setAttribute('aria-label', 'Photo ' + (k + 1));
    });
  }
  // Swipe on the main photo (mobile slideshow)
  var main = document.querySelector('.vp-main');
  if (main) {
    var sx = null;
    main.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
  }
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
    car.addEventListener('click', function (e) {
      var d = e.target.closest('.fp-dot');
      if (d) { stop(); go(parseInt(d.dataset.fp, 10)); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(car);
    } else { start(); }
  }
})();
