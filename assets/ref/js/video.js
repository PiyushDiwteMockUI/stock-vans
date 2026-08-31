/* ==========================================================================
   "Things you can't see" — video section
   --------------------------------------------------------------------------
   PASTE THE VIDEO LINK BELOW. That is the only line you need to change.

   Accepts:
     • a YouTube link   https://www.youtube.com/watch?v=XXXX  |  https://youtu.be/XXXX
     • a Vimeo link     https://vimeo.com/123456789
     • a direct file    https://.../clip.mp4  (also .webm, .mov)
     • a local file     assets/video/clip.mp4

   Leave it as "" and the labelled placeholder stays in place.
   ========================================================================== */

const VIDEO_URL = "https://www.youtube.com/watch?v=thFwJAod6Ng";

/* -------------------------------------------------------------------------- */

(function () {
  const frame = document.querySelector(".video-frame");
  if (!frame || !VIDEO_URL) return;

  const url = VIDEO_URL.trim();
  let node;

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);

  if (yt) {
    node = document.createElement("iframe");
    node.id = "ytFrame";
    node.src = "https://www.youtube.com/embed/" + yt[1] +
      "?autoplay=1&mute=1&loop=1&controls=0&playsinline=1&rel=0&modestbranding=1" +
      "&cc_load_policy=0&cc_lang_pref=en&iv_load_policy=3&enablejsapi=1&playlist=" + yt[1];
    node.allow = "autoplay; encrypted-media; picture-in-picture";
    node.allowFullscreen = true;
    node.title = "Wonderland RV — things you can't see";
  } else if (vimeo) {
    node = document.createElement("iframe");
    node.src = "https://player.vimeo.com/video/" + vimeo[1] +
      "?autoplay=1&muted=1&loop=1&background=1";
    node.allow = "autoplay; fullscreen; picture-in-picture";
    node.allowFullscreen = true;
    node.title = "Wonderland RV — things you can't see";
  } else {
    node = document.createElement("video");
    node.src = url;
    node.autoplay = true;
    node.muted = true;
    node.loop = true;
    node.playsInline = true;
    node.setAttribute("playsinline", "");
    node.controls = false;
    const poster = frame.querySelector(".video-poster");
    if (poster && poster.getAttribute("src")) node.poster = poster.getAttribute("src");
  }

  frame.classList.remove("ph");
  frame.removeAttribute("data-ph");
  frame.appendChild(node);

  if (yt) buildControls(frame);
})();

/* ------------------------------------------- mute + captions controls -----
   The plain embed gives no way to toggle sound or subtitles, so the player is
   attached to the YouTube IFrame API. Buttons sit top right and fade in on
   hover. Captions start off; sound starts muted, because browsers refuse to
   autoplay otherwise.                                                     */
function buildControls(frame) {
  const bar = document.createElement("div");
  bar.className = "video-controls";

  const SPEAKER_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>';
  const SPEAKER_ON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';

  const sound = document.createElement("button");
  sound.type = "button";
  sound.className = "video-ctl";
  sound.innerHTML = SPEAKER_OFF;
  sound.setAttribute("aria-label", "Unmute");
  sound.setAttribute("aria-pressed", "false");

  const cc = document.createElement("button");
  cc.type = "button";
  cc.className = "video-ctl";
  cc.textContent = "CC";
  cc.setAttribute("aria-label", "Show captions");
  cc.setAttribute("aria-pressed", "false");

  bar.appendChild(sound);
  bar.appendChild(cc);
  frame.appendChild(bar);

  let player = null, muted = true, captions = false;

  function withApi(done) {
    if (window.YT && window.YT.Player) return done();
    if (!document.getElementById("ytApi")) {
      const tag = document.createElement("script");
      tag.id = "ytApi";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) prev(); done(); };
  }

  function killCaptions() {
    if (!player) return;
    try { player.unloadModule("captions"); player.unloadModule("cc"); } catch (e) {}
  }

  withApi(function () {
    player = new YT.Player("ytFrame", {
      events: {
        onReady: function () { player.mute(); killCaptions(); },
        /* The captions module can load itself once playback starts, so it is
           turned off again on the first PLAYING rather than only on ready. */
        onStateChange: function (e) { if (e.data === 1 && !captions) killCaptions(); }
      }
    });
  });

  sound.addEventListener("click", function () {
    if (!player) return;
    muted = !muted;
    if (muted) player.mute(); else player.unMute();
    sound.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
    sound.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    sound.setAttribute("aria-pressed", String(!muted));
  });

  cc.addEventListener("click", function () {
    if (!player) return;
    captions = !captions;
    try {
      if (captions) {
        player.loadModule("captions");
        player.loadModule("cc");
        player.setOption("captions", "track", { languageCode: "en" });
      } else { killCaptions(); }
    } catch (e) {}
    cc.setAttribute("aria-label", captions ? "Hide captions" : "Show captions");
    cc.setAttribute("aria-pressed", String(captions));
  });
}

/* -------------------------------------------------- mobile nav toggle ---- */
(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    const open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });
})();

/* ------------------------------------- State: chevron follows the value ---
   The artboard sits the arrow immediately after the word "State". A longer
   value like "Australian Capital Territory" would run underneath a fixed
   arrow, so it is measured and re-placed on every change.               */
(function () {
  const field = document.querySelector(".field--select");
  if (!field) return;
  const sel = field.querySelector("select");
  const chev = field.querySelector(".chev");
  if (!sel || !chev) return;

  const ctx = document.createElement("canvas").getContext("2d");

  function place() {
    const cs = getComputedStyle(sel);
    ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const opt = sel.options[sel.selectedIndex];
    const textW = opt ? ctx.measureText(opt.text).width : 0;
    const padL = parseFloat(cs.paddingLeft) || 0;
    const gap = (parseFloat(cs.fontSize) || 24) * 0.58;
    const chevW = chev.getBoundingClientRect().width;   /* SVG has no offsetWidth */
    const limit = sel.offsetWidth - (parseFloat(cs.paddingRight) || 0) - chevW;
    chev.style.left = Math.min(padL + textW + gap, Math.max(padL, limit)) + "px";
  }

  place();
  sel.addEventListener("change", place);
  window.addEventListener("resize", place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();

/* --------------------------------- enquiry-type pill: gliding indicator ---
   One thumb slides between cells on an ease-in-out curve, squashing slightly
   while it travels so the movement reads as fluid rather than as a jump.   */
(function () {
  const chips = document.querySelector(".chips");
  const thumb = chips && chips.querySelector(".chips-thumb");
  if (!chips || !thumb) return;

  let settle;

  function place() {
    const checked = chips.querySelector('input[type="radio"]:checked');
    if (!checked) return;
    const span = checked.parentElement.querySelector("span");
    if (!span) return;
    const cb = chips.getBoundingClientRect();
    const sb = span.getBoundingClientRect();
    thumb.style.left = (sb.left - cb.left - chips.clientLeft) + "px";
    thumb.style.width = sb.width + "px";
  }

  function enable() {
    void thumb.offsetWidth;            // flush styles; rAF never fires in a
    thumb.classList.remove("is-init"); // background tab, so don't rely on it
  }

  place();
  enable();

  chips.addEventListener("change", function (e) {
    if (!e.target.matches('input[type="radio"]')) return;
    thumb.classList.add("is-moving");
    place();
    clearTimeout(settle);
    settle = setTimeout(function () { thumb.classList.remove("is-moving"); }, 300);
  });

  function reflow() {
    thumb.classList.add("is-init");
    place();
    enable();
  }
  window.addEventListener("resize", reflow);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reflow);
})();
