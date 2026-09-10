/* ==========================================================================
   Footer link groups become an accordion on a phone.
   Its own file: the homepage and the contact page carry the same footer, so
   neither page's script owns it.

   As one column the five groups run 982 tall -- just under half the footer.
   Closed, the same five headings are 266.
   ========================================================================== */
/* -------------------------------------------- Let's Chat: the contact rows ---
   The three lines are one paragraph split by <br>. On a phone each becomes its
   own ruled row with a glyph. Phone and email are links; the address is not,
   so it is built as a plain row rather than dressed up as one. */
(function () {
  if (!window.matchMedia("(max-width: 900px)").matches) return;
  const block = document.querySelector(".footer-contact");
  if (!block || block.dataset.rows) return;

  const tel  = block.querySelector('a[href^="tel:"]');
  const mail = block.querySelector('a[href^="mailto:"]');
  const addr = block.querySelector("span");
  if (!tel || !mail || !addr) return;          // markup changed: leave it alone

  const ICON = {
    tel:  '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    addr: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'
  };

  function row(kind, text, href) {
    const el = document.createElement(href ? "a" : "div");
    el.className = "foot-row";
    if (href) el.href = href;
    el.innerHTML =
      '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[kind] + '</svg>' +
      '<span class="t"></span>';
    el.querySelector(".t").textContent = text;
    return el;
  }

  const wrap = document.createElement("div");
  wrap.className = "foot-contact";
  wrap.appendChild(row("tel",  tel.textContent.trim(),  tel.getAttribute("href")));
  wrap.appendChild(row("mail", mail.textContent.trim(), mail.getAttribute("href")));
  wrap.appendChild(row("addr", addr.textContent.trim(), null));

  block.parentNode.insertBefore(wrap, block);
  block.remove();
  wrap.dataset.rows = "1";
})();

(function () {
  if (!window.matchMedia("(max-width: 900px)").matches) return;
  const cols = document.querySelector(".link-cols");
  if (!cols) return;

  /* Collect the heading/list pairs before touching anything. The transform
     moves nodes out of their column, and walking a live child list while
     mutating it drops every second pair. */
  const pairs = [];
  [].forEach.call(cols.querySelectorAll(".link-col"), function (col) {
    [].forEach.call(col.querySelectorAll("h4"), function (head) {
      const list = head.nextElementSibling;
      if (list && list.tagName === "UL") pairs.push({ col: col, head: head, list: list });
    });
  });
  if (!pairs.length) return;

  pairs.forEach(function (p) {
    const row = document.createElement("div");
    row.className = "foot-acc";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "foot-acc-head";
    btn.setAttribute("aria-expanded", "false");

    /* .footer-head but never .footer-head--gap: the rows carry their own
       rhythm, and the 32 top margin would double the rule spacing. */
    const label = document.createElement("span");
    label.className = "footer-head";
    label.textContent = p.head.textContent.trim();

    const sign = document.createElement("span");
    sign.className = "foot-acc-sign";
    sign.setAttribute("aria-hidden", "true");

    btn.appendChild(label);
    btn.appendChild(sign);

    const body = document.createElement("div");
    body.className = "foot-acc-body";

    p.col.insertBefore(row, p.head);
    row.appendChild(btn);
    row.appendChild(body);
    body.appendChild(p.list);          // the real list, moved rather than copied
    p.head.remove();
  });

  cols.addEventListener("click", function (e) {
    const btn = e.target.closest(".foot-acc-head");
    if (!btn) return;
    const row = btn.parentElement, body = row.querySelector(".foot-acc-body");
    const open = row.classList.contains("is-on");

    /* Animated from a measured number: `auto` does not transition, and a grid
       0fr -> 1fr resolves to zero inside an auto-height parent -- both of which
       cost an afternoon on the homepage accordions already. */
    body.style.height = body.scrollHeight + "px";
    if (open) {
      requestAnimationFrame(function () { body.style.height = "0px"; });
      row.classList.remove("is-on");
      btn.setAttribute("aria-expanded", "false");
    } else {
      row.classList.add("is-on");
      btn.setAttribute("aria-expanded", "true");
      /* released to auto once open, so a window resize cannot clip it */
      setTimeout(function () {
        if (row.classList.contains("is-on")) body.style.height = "auto";
      }, 320);
    }
  });
})();
