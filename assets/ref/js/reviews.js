/* ==========================================================================
   Legendary Service — the review slider.
   Its own file: the homepage and the contact page both carry the section, so
   neither page's script owns it.
   ========================================================================== */
/* ------------------------------------- Legendary service: review slider ---
   Endless in both directions: a clone of the first review is parked after the
   last, so advancing past the end keeps moving forward and the jump back to
   the real first slide happens with the transition off, out of sight.    */
(function () {
  const track = document.getElementById("serviceTrack");
  if (!track) return;
  const real = [].slice.call(track.children);
  const n = real.length;
  if (!n) return;

  const EASE = "transform .9s cubic-bezier(.45, .05, .15, 1)";
  const RIDE = 900;      // matches EASE
  const HOLD = 10000;    // 10s between reviews

  const PHONE = window.matchMedia("(max-width: 900px)");

  if (n > 1) {
    const clone = real[0].cloneNode(true);
    clone.classList.add("is-clone");   // hidden on the phone: it is a duplicate there
    track.appendChild(clone);
  }

  let i = 0, busy = false, timer;

  function show(animate) {
    track.style.transition = animate ? EASE : "none";
    track.style.transform = "translateX(" + (-i * 100) + "%)";
  }

  function go(dir) {
    if (busy || n < 2) return;
    busy = true;
    if (dir < 0 && i === 0) {          // stand on the clone, then walk back
      i = n; show(false); void track.offsetWidth;
    }
    i += dir;
    show(true);
    setTimeout(function () {
      if (i === n) { i = 0; show(false); }   // landed on the clone: reset unseen
      busy = false;
    }, RIDE);
  }

  function auto() { clearInterval(timer); timer = setInterval(function () { go(1); }, HOLD); }

  const prev = document.querySelector(".service-arrow--prev");
  const next = document.querySelector(".service-arrow--next");
  if (prev) prev.addEventListener("click", function () { go(-1); auto(); });
  if (next) next.addEventListener("click", function () { go(1);  auto(); });

  /* ----------------------------------------------------- the phone rail ---
     On the phone the viewport scrolls and snaps, so the translate slider is off
     entirely -- auto() would fight the finger.

     It loops the way the desktop one does, by a different route. The set is
     laid down three times and the scroller sits in the middle one; crossing a
     set boundary moves a whole set width, which lands on an identical pixel
     because the sets are identical. So the fourth review is followed by the
     first, in both directions, and there is no end to reach.

     Index is polled rather than listened for: scroll events are not dependable.
  */
  function phoneRail() {
    const port = track.parentElement;
    if (!port || port.querySelector(".service-rail")) return;

    /* Two further sets. Built only on the phone, so the desktop track still
       holds its four slides and the one wrap-around clone it expects. */
    for (let s = 0; s < 2; s++) {
      real.forEach(function (sl) {
        const copy = sl.cloneNode(true);
        copy.classList.remove("is-clone");   // that one is hidden; these are not
        copy.classList.add("is-copy");
        track.appendChild(copy);
      });
    }
    const slides = [].slice.call(track.children).filter(function (s) {
      return !s.classList.contains("is-clone");   // it is display:none here
    });
    if (slides.length < n * 2) return;

    const rail = document.createElement("div");
    rail.className = "service-rail";
    const dots = real.map(function (_, k) {
      const d = document.createElement("span");
      d.className = "service-dot" + (k ? "" : " is-on");
      rail.appendChild(d);
      return d;
    });
    const count = document.createElement("span");
    count.className = "service-count";
    count.textContent = "01 / " + String(n).padStart(2, "0");
    rail.appendChild(count);
    port.parentElement.insertBefore(rail, port.nextSibling);

    /* measured between two slides, so any gap between them is included */
    function pitch() { return slides[1].offsetLeft - slides[0].offsetLeft; }

    function start() {
      const p = pitch();
      if (p > 0) port.scrollLeft = p * n;      // open in the middle set
    }
    start();
    window.addEventListener("resize", start);

    let last = -1;
    setInterval(function () {
      const p = pitch();
      if (!p) return;
      const W = p * n;
      /* while(), not if(): a flung finger can carry past a whole set */
      while (port.scrollLeft >= W * 2 - 1) port.scrollLeft -= W;
      while (port.scrollLeft < W - 1) port.scrollLeft += W;

      const live = ((Math.round(port.scrollLeft / p) % n) + n) % n;
      if (live === last) return;
      dots.forEach(function (d, k) { d.classList.toggle("is-on", k === live); });
      count.textContent = String(live + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
      last = live;
    }, 150);
  }

  if (PHONE.matches) {
    track.style.transform = "none";
    phoneRail();
  } else {
    show(false);
    auto();
    window.addEventListener("resize", function () { show(false); });
  }
})();
