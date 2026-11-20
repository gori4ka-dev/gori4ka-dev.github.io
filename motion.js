/* Scroll motion for index.html (body[data-motion="cv"]) and portfolio.html (body[data-motion="portfolio"]).
   Reveals blocks as they scroll in, draws a reading progress bar and a back-to-top ring, highlights the current
   menu section, fills the experience timeline, counts up the numbers and runs the tech marquee on the portfolio.
   The pages re-render their content on language change, so new elements are picked up by a MutationObserver.
   With prefers-reduced-motion only the static helpers stay: progress bar, back-to-top and the menu highlight. */
(function () {
  "use strict";
  const page = document.body.dataset.motion;
  if (!page) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = s => document.querySelectorAll(s);

  // [selector, reveal variant]. Variants are styled in motion.css.
  const RULES = {
    cv: [
      [".intro .photo", "fade"], ["#name", "blur"], [".intro .role", "up"], [".intro-text p", "up"], [".quick li", "up"],
      [".sec > h2", "up"], [".group-title", "up"], [".work > a", "wipe"], [".work > .tree", "wipe"], [".work figcaption", "up"],
      [".thumb > a", "wipe"], [".thumb figcaption", "up"], [".also p", "up"], ["#jobs .job", "up"],
      ["#skillRows .row", "side"], [".prose-sm p", "up"], ["#posts .post", "up"], ["#contacts li", "side"]
    ],
    portfolio: [
      [".hello", "up"], [".hero h1 .l1", "up"], [".hero h1 .l2", "up"], [".hero-sub", "up"], [".hero-cta", "up"], [".photo-wrap", "fade"],
      [".stat", "up"], [".head", "up"], [".card", "scale"], [".site-row", "side"], [".hint", "fade"],
      [".about-grid > *", "blur"], [".ins", "scale"], [".yt-grid > div:first-child", "up"], [".eps li", "side"],
      [".job", "up"], [".skill-row h3", "up"], [".chip", "pop"], [".post", "scale"], [".quote", "scale"],
      [".pcard", "scale"], [".contact h2", "blur"], [".contact .lead", "up"], [".mail", "up"], [".socials > *", "pop"]
    ]
  }[page] || [];
  const HEADS = { cv: ".sec > h2", portfolio: ".head h2, .yt h2" }[page];
  const COUNTERS = { cv: "", portfolio: ".stat b, .pcard b:not(.word)" }[page];
  const SPOTS = { cv: "", portfolio: ".card, .ins, .post a, .pcard, .quote" }[page];
  const LINE = "#jobs";
  const STEP = { pop: 40, side: 60 };
  // true: blocks animate every time they come back into view; false: only the first time.
  const REPLAY = true;
  const TOP_LABEL = { ru: "Наверх", uk: "Вгору", en: "Back to top", he: "לראש העמוד" };

  /* ---------- Reveal on scroll ---------- */
  const seen = new WeakSet();
  // Blocks replay every time: they come in from the side they enter from (below when scrolling down,
  // above when scrolling up) and hide again once they are fully off screen.
  const timers = new WeakMap();
  let scrollDir = 1;
  function show(el, delay) {
    if (el.classList.contains("m-in")) return;
    clearTimeout(timers.get(el));
    el.style.setProperty("--m-delay", delay + "ms");
    el.classList.add("m-anim", "m-in");
    if (!REPLAY) { enterIO.unobserve(el); exitIO.unobserve(el); }
    // While .m-anim is on, motion.css owns the transition; afterwards the page's own hover transitions are back.
    timers.set(el, setTimeout(() => { el.classList.remove("m-anim"); el.style.removeProperty("--m-delay"); }, delay + 1150));
  }
  function hide(el, fromTop) {
    el.dataset.mFrom = fromTop ? "top" : "bottom";
    if (!el.classList.contains("m-in")) return;
    clearTimeout(timers.get(el));
    el.classList.remove("m-anim", "m-in");
    el.style.removeProperty("--m-delay");
  }
  // Shows a block once it is 6–8% inside the screen; threshold 0 so blocks taller than the screen count too.
  const enterIO = reduce ? null : new IntersectionObserver(entries => {
    const incoming = entries.filter(e => e.isIntersecting).map(e => e.target);
    if (scrollDir < 0) incoming.reverse(); // scrolling up: the stagger runs bottom to top
    incoming.forEach((el, i) => show(el, Math.min(i, 9) * (STEP[el.dataset.mR] || 80)));
  }, { rootMargin: "-6% 0px -8% 0px", threshold: 0 });
  // Hides a block only when it is completely off screen, so nothing blinks at the edges.
  const exitIO = reduce ? null : new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) hide(e.target, e.boundingClientRect.bottom <= (e.rootBounds ? e.rootBounds.top : 0));
    }
  }, { threshold: 0 });
  function watch(el) { enterIO.observe(el); exitIO.observe(el); }

  /* ---------- Count-up numbers (count again every time they come back into view) ---------- */
  const countState = new WeakMap();
  const countIO = reduce ? null : new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.intersectionRatio >= 0.6) runCount(e.target);
      else if (!e.isIntersecting && REPLAY) resetCount(e.target);
    }
  }, { threshold: [0, 0.6] });
  function resetCount(el) {
    countState.set(el, "ready");
    el.textContent = "0" + (el.dataset.mSuffix || "");
  }
  function runCount(el) {
    if (countState.get(el) !== "ready") return;
    const token = {}, to = +el.dataset.mTo, suffix = el.dataset.mSuffix || "", start = performance.now(), dur = 1400;
    countState.set(el, token);
    (function tick(now) {
      if (countState.get(el) !== token) return; // scrolled away mid-count
      const k = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * eased) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- Scan the page for elements to animate (runs again after every re-render) ---------- */
  function scan() {
    if (!reduce) {
      for (const [sel, variant] of RULES) {
        $$(sel).forEach(el => {
          if (seen.has(el)) return;
          seen.add(el);
          el.dataset.mR = variant;
          // Blocks already above the screen will come in from the top when the visitor scrolls back up.
          el.dataset.mFrom = el.getBoundingClientRect().bottom < 0 ? "top" : "bottom";
          watch(el);
        });
      }
      // Heading bars draw in and out together with their heading.
      if (HEADS) $$(HEADS).forEach(h => {
        if (h.classList.contains("m-head")) return;
        h.classList.add("m-head");
        if (!seen.has(h)) { seen.add(h); watch(h); }
      });
      if (COUNTERS) $$(COUNTERS).forEach(el => {
        if (seen.has(el)) return;
        seen.add(el);
        const m = el.textContent.trim().match(/^(\d+)(\D*)$/);
        if (!m || +m[1] < 2) return;
        el.dataset.mTo = m[1];
        el.dataset.mSuffix = m[2];
        el.setAttribute("aria-label", el.textContent.trim());
        resetCount(el);
        countIO.observe(el);
      });
      if (SPOTS && fine) $$(SPOTS).forEach(el => el.classList.add("m-spot"));
    }
    const line = document.querySelector(LINE);
    if (line) line.classList.add("m-line");
    navLinks();
    if (topBtn) topBtn.setAttribute("aria-label", TOP_LABEL[document.documentElement.lang] || TOP_LABEL.en);
  }

  /* ---------- Current section in the menu ---------- */
  let navIO = null;
  function navLinks() {
    const links = [...$$('#nav a[href^="#"]')].filter(a => !a.classList.contains("mark") && !a.classList.contains("btn") && document.getElementById(a.hash.slice(1)));
    if (!links.length || links[0].classList.contains("m-navlink")) return;
    links.forEach(a => a.classList.add("m-navlink"));
    const byId = new Map(links.map(a => [a.hash.slice(1), a]));
    // Every section is watched, so a section without a menu item (like the list of sites) clears the highlight.
    navIO = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach(a => { a.classList.remove("m-current"); a.removeAttribute("aria-current"); });
        const a = byId.get(e.target.id);
        if (a) { a.classList.add("m-current"); a.setAttribute("aria-current", "location"); }
      }
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("#home section[id], #home header[id]").forEach(s => navIO.observe(s));
  }

  /* ---------- Progress bar, back-to-top ring, timeline fill, header state ---------- */
  const bar = document.createElement("div");
  bar.className = "m-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  const topBtn = document.createElement("button");
  topBtn.type = "button";
  topBtn.className = "m-top";
  topBtn.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="m-ring-bg" cx="24" cy="24" r="21"/><circle class="m-ring" cx="24" cy="24" r="21"/><path d="M24 31V17m-7 7 7-7 7 7"/></svg>';
  topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  document.body.appendChild(topBtn);

  let ticking = false, lastY = window.scrollY;
  function onScroll() {
    ticking = false;
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    bar.style.setProperty("--m-p", p.toFixed(4));
    topBtn.style.setProperty("--m-ring", (132 * (1 - p)).toFixed(1));
    topBtn.classList.toggle("m-show", y > 600);
    document.body.classList.toggle("m-scrolled", y > 40);
    const line = document.querySelector(".m-line");
    if (line) {
      const r = line.getBoundingClientRect();
      const lp = reduce ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.7 - r.top) / r.height));
      line.style.setProperty("--m-p", lp.toFixed(3));
    }
    marqueeKick(y - lastY);
    lastY = y;
  }
  // The direction is read right in the scroll event, before the reveal observers report for this frame.
  let dirY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y !== dirY) { scrollDir = y > dirY ? 1 : -1; dirY = y; }
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(onScroll), { passive: true });

  /* ---------- Spotlight under the cursor ---------- */
  if (SPOTS && fine && !reduce) {
    let spotRaf = 0, spotEv = null;
    document.addEventListener("pointermove", e => {
      spotEv = e;
      if (spotRaf) return;
      spotRaf = requestAnimationFrame(() => {
        spotRaf = 0;
        const el = spotEv.target.closest && spotEv.target.closest(".m-spot");
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (spotEv.clientX - r.left) + "px");
        el.style.setProperty("--my", (spotEv.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  /* ---------- Portfolio: tech marquee that speeds up and turns with the scroll ---------- */
  let marqueeKick = () => {};
  if (page === "portfolio") {
    const TECH = ["PHP", "JavaScript", "React", "TypeScript", "Laravel", "WordPress", "Node.js", "WooCommerce", "REST API", "MySQL", "Linux VPS", "Tauri", "Rust", "Flutter", "Godot"];
    const box = document.createElement("div");
    box.className = "m-marquee";
    box.setAttribute("aria-hidden", "true");
    const row = TECH.map(t => `<span>${t}</span><span class="m-dot">✦</span>`).join("");
    box.innerHTML = `<div class="m-track" dir="ltr">${row}${row}</div>`;
    const anchor = document.getElementById("sites");
    if (anchor) anchor.parentNode.insertBefore(box, anchor);
    const track = box.firstElementChild;
    if (!reduce) {
      let x = 0, speed = 1, boost = 1, dir = -1, last = performance.now(), visible = false, raf = 0;
      marqueeKick = dy => {
        if (!dy) return;
        dir = dy > 0 ? -1 : 1;
        boost = Math.min(9, 1 + Math.abs(dy) * 0.18);
      };
      const loop = now => {
        raf = 0;
        if (!visible) return;
        const dt = Math.min(64, now - last);
        last = now;
        boost += (1 - boost) * 0.04;
        speed += (boost - speed) * 0.12;
        const half = track.scrollWidth / 2;
        x += dir * speed * dt * 0.05;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        const skew = Math.max(-12, Math.min(12, (speed - 1) * 1.6 * -dir));
        track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
        raf = requestAnimationFrame(loop);
      };
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      }).observe(box);
    }
  }

  /* ---------- Watch for re-renders (language switch, blog post open/close) ---------- */
  let pending = false;
  new MutationObserver(records => {
    if (pending) return;
    // Counters rewrite their own text every frame; those changes need no rescan.
    if (records.every(r => r.target.dataset && r.target.dataset.mTo)) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); onScroll(); });
  }).observe(document.getElementById("main") || document.body, { childList: true, subtree: true });

  scan();
  onScroll();
})();
