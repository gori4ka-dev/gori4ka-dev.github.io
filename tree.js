/* A mighty oak behind the content that grows with the scroll of the whole page: a stump on its roots at the
   top, a massive trunk and gnarled limbs through the middle, and instead of leaves the logos of
   technologies in their brand colours towards the end; at the very bottom logos fall like leaves.
   Scrolling back up folds it back. Logos come from tech-icons.js (Simple Icons); without that file the
   leaves are plain coloured dots.

   Two fixed canvases under the content (z-index -1), faded over the text column so the text stays readable:
   - the wood, redrawn only while the oak grows or shrinks (the oak itself does not sway);
   - the leaves: each logo is drawn once into a small picture (sprite) per theme, and every frame only
     places those pictures, so the fluttering costs next to nothing. */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const small = window.matchMedia("(max-width: 760px)").matches;
  const DOT = "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z";
  const SOURCE = window.TECH_ICONS && window.TECH_ICONS.length ? window.TECH_ICONS
    : ["#FF7A59", "#FFB23F", "#F06A98", "#8C78EC", "#4CC38A", "#4B91F7"].map(c => ({ t: "", c, p: DOT }));
  const ICONS = SOURCE.map(i => ({ title: i.t, color: i.c, path: new Path2D(i.p), text: i.x || "" }));

  /* ---------- The oak, built once from a fixed seed (same tree on every visit) ---------- */
  function rng(seed) {
    return () => {
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const R = rng(20261110);
  const MAX = small ? 5 : 6;
  const UP = -Math.PI / 2;
  const branches = [], leaves = [];

  // Units: the trunk base is (0, 0), "up" is -y, the crown is roughly one unit tall.
  // w0/w1 are the wood's width at the base and the tip; k1/k2 push the middle of the branch sideways
  // (oak wood is crooked); t0/t1 are the scroll progress (0..1) where it starts and finishes growing.
  function add(parent, angle, len, w0, w1, depth, t0, dur, crook, ox, oy) {
    const b = { parent, angle, len, w0, w1, depth, t0, t1: Math.min(0.86, t0 + dur), ox: ox || 0, oy: oy || 0,
      c: Math.cos(angle), s: Math.sin(angle), k1: (R() - 0.5) * crook, k2: (R() - 0.5) * crook, phase: R() * 6.283,
      k: 0, x0: 0, y0: 0, xt: 0, yt: 0 };
    branches.push(b);
    return b;
  }
  function grow(parent, angle, len, w, depth, t0) {
    const n = depth >= MAX ? 0 : R() < (depth < 3 ? 0.4 : 0.25) ? 3 : 2;
    const tip = n ? w * 0.8 : w * 0.5;
    const b = add(parent, angle, len, w, tip, depth, t0, 0.16 * Math.pow(0.88, depth) + 0.045, depth < 3 ? 0.26 : 0.16);
    if (!n) { addLeaves(b, 2 + (R() < 0.4 ? 1 : 0)); return; }
    if (depth >= MAX - 2 && R() < 0.5) addLeaves(b, 1);
    const spread = (depth < 2 ? 0.75 : 0.62) + R() * 0.3;
    for (let i = 0; i < n; i++) {
      let a = angle + (i / (n - 1) - 0.5) * spread + (R() - 0.5) * 0.28;
      // The limbs reach out sideways and their twigs turn up to the light: a broad dome.
      a += (UP - a) * (0.12 + depth * 0.04);
      grow(b, a, len * (0.7 + R() * 0.12), tip * (n === 3 ? 0.66 : 0.78), depth + 1,
        b.t0 + (b.t1 - b.t0) * (0.6 + R() * 0.3));
    }
  }
  // Each leaf is one logo: its size (in tree units), a slight tilt and the progress at which it pops out.
  function addLeaves(b, n) {
    for (let i = 0; i < n; i++) {
      leaves.push({
        b, icon: 0, along: 0.4 + R() * 0.6, side: (R() - 0.5) * 2, dist: 0.015 + R() * 0.035,
        size: (small ? 0.05 : 0.04) + R() * 0.018, rot: (R() - 0.5) * 0.7,
        tb: Math.min(0.93, b.t1 + R() * 0.12), phase: R() * 6.283, s: 0, x: 0, y: 0, sx: 0, sy: 0, fa: 1
      });
    }
  }

  // Roots spreading over the ground, then a short, massive trunk that splits low into a few heavy limbs.
  // On wide screens the crown leans over the page (to the left of the trunk, mirrored for Hebrew);
  // on phones it is symmetric.
  for (const [a, len, w, ox] of [[0.14, 0.24, 0.075, 0.035], [Math.PI - 0.17, 0.22, 0.07, -0.035], [0.45, 0.13, 0.05, 0.025], [Math.PI - 0.5, 0.12, 0.05, -0.025]])
    add(null, a, len, w, 0.008, 0, 0, 0.16, 0.14, ox, -0.014);
  const trunk = add(null, UP, 0.26, 0.15, 0.115, 0, 0, 0.22, 0.05);
  const LIMBS = small
    ? [[-1.1, 0.3, 0.07], [-0.4, 0.33, 0.08], [0.4, 0.33, 0.08], [1.1, 0.3, 0.07]]
    : [[-0.98, 0.4, 0.075], [-0.55, 0.37, 0.082], [-0.12, 0.33, 0.085], [0.3, 0.18, 0.066], [0.72, 0.12, 0.05]];
  for (const [off, len, w] of LIMBS) grow(trunk, UP + off + (R() - 0.5) * 0.1, len, w, 1, 0.13 + R() * 0.05);

  // The fully grown shape is known in advance: logos that would sit on top of each other are dropped,
  // and the bounds let the crown be fitted to the screen.
  for (const b of branches) {
    b.fx0 = b.parent ? b.parent.fxt : b.ox; b.fy0 = b.parent ? b.parent.fyt : b.oy;
    b.fxt = b.fx0 + b.c * b.len; b.fyt = b.fy0 + b.s * b.len;
  }
  const kept = [];
  for (const l of leaves) {
    const b = l.b, px = b.fx0 + (b.fxt - b.fx0) * l.along, py = b.fy0 + (b.fyt - b.fy0) * l.along;
    l.fx = px - b.s * l.side * l.dist; l.fy = py + b.c * l.side * l.dist;
    if (kept.every(k => Math.abs(k.fx - l.fx) > (k.size + l.size) * 0.5 || Math.hypot(k.fx - l.fx, k.fy - l.fy) > (k.size + l.size) * 0.5)) kept.push(l);
  }
  leaves.length = 0;
  leaves.push(...kept);
  // Logos are dealt out in a shuffled cycle: every technology shows up, and neighbours differ.
  const order = ICONS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  leaves.forEach((l, i) => { l.icon = order[i % order.length]; });
  const FIRST_LEAF = Math.min(...leaves.map(l => l.tb));
  const BOUNDS = { minX: 0, maxX: 0, minY: 0 };
  for (const b of branches) {
    BOUNDS.minX = Math.min(BOUNDS.minX, b.fxt); BOUNDS.maxX = Math.max(BOUNDS.maxX, b.fxt); BOUNDS.minY = Math.min(BOUNDS.minY, b.fyt);
  }
  for (const l of leaves) {
    BOUNDS.minX = Math.min(BOUNDS.minX, l.fx - l.size / 2); BOUNDS.maxX = Math.max(BOUNDS.maxX, l.fx + l.size / 2);
    BOUNDS.minY = Math.min(BOUNDS.minY, l.fy - l.size / 2);
  }
  const MAX_LEAF = Math.max(...leaves.map(l => l.size));

  /* ---------- Canvases ---------- */
  function layer(cls) {
    const c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", zIndex: "-1", pointerEvents: "none" });
    return c;
  }
  const woodCv = layer("m-tree"), leafCv = layer("m-tree m-tree-leaves");
  document.body.prepend(woodCv, leafCv);
  const wx = woodCv.getContext("2d"), lx = leafCv.getContext("2d");

  /* ---------- Colours and logo sprites ---------- */
  // Wood colours by depth: bark at the trunk, warm plum at the twigs, plus darker furrows in the bark.
  // Lighter in the dark theme. Logo colours are the brand ones, nudged only where they would vanish:
  // black on the dark theme, white and pale yellow on white.
  let dark = false, barkColors = [], furrow = "", canopy = "", iconRGB = [];
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function luminance(c) {
    const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function theme() {
    const t = document.documentElement.dataset.theme;
    dark = t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const [from, to] = dark ? [hex("#BBA698"), hex("#F0C2E0")] : [hex("#4F372C"), hex("#A2668A")];
    barkColors = Array.from({ length: MAX + 1 }, (_, d) => css(mix(from, to, Math.pow(d / MAX, 0.8))));
    furrow = dark ? "#5E4C43" : "#22160F";
    canopy = dark ? "#6E9A5E" : "#5E8A4C";
    woodCv.style.opacity = dark ? "0.8" : "0.85";
    iconRGB = ICONS.map(i => {
      const c = hex(i.color), L = luminance(c);
      if (dark && L < 0.06) return mix(c, [255, 255, 255], 0.7);
      if (!dark && L > 0.6) return mix(c, [0, 0, 0], L > 0.85 ? 0.6 : 0.25);
      return c;
    });
    spriteRes = 0;
  }
  // One picture per logo, sharp at the size it is shown: the logo (24 units) in the middle of a 40-unit square
  // with a soft glow in its brand colour behind it, so every leaf is a single drawImage per frame.
  const BOX = 40;
  let sprites = [], spriteRes = 0;
  function buildSprites(res) {
    spriteRes = res;
    const glow = (dark ? 0.32 : 0.22) / (dark ? 0.95 : 0.92);
    sprites = ICONS.map((icon, i) => {
      const c = document.createElement("canvas");
      c.width = c.height = res;
      const x = c.getContext("2d"), k = res / BOX, h = BOX / 2;
      x.setTransform(k, 0, 0, k, 0, 0);
      const gr = x.createRadialGradient(h, h, 0, h, h, h - 1);
      gr.addColorStop(0, css(iconRGB[i], glow)); gr.addColorStop(0.5, css(iconRGB[i], glow * 0.45)); gr.addColorStop(1, css(iconRGB[i], 0));
      x.fillStyle = gr;
      x.fillRect(0, 0, BOX, BOX);
      x.translate(h - 12, h - 12);
      x.fillStyle = css(iconRGB[i]);
      x.fill(icon.path);
      if (icon.text) {
        x.fillStyle = "#fff"; x.font = "700 9.5px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText(icon.text, 12, 12.6);
      }
      return c;
    });
  }

  /* ---------- Placement on the screen ---------- */
  let W = 0, H = 0, dpr = 1, S = 1, baseX = 0, baseY = 0, fl = 1, colL = 0, colR = 0;
  const FEATHER = 90;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    W = window.innerWidth; H = window.innerHeight;
    for (const c of [woodCv, leafCv]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  }
  function place() {
    fl = !small && document.documentElement.dir === "rtl" ? -1 : 1;
    const col = document.querySelector(".page") || document.querySelector("main .wrap") || document.body;
    const r = col.getBoundingClientRect();
    colL = r.left; colR = r.right;
    const spanX = BOUNDS.maxX - BOUNDS.minX, spanY = -BOUNDS.minY;
    if (small) {
      S = Math.min(H * 0.8 / spanY, W * 0.96 / spanX);
      baseX = W / 2 - (BOUNDS.minX + BOUNDS.maxX) / 2 * S;
    } else {
      // The trunk stands in the margin beside the text column, the crown reaches over the page and the
      // whole oak stays on screen. Worked out for the left-to-right layout and mirrored for Hebrew.
      const right = fl > 0 ? colR : W - colL, margin = W - right;
      const want = right + Math.min(Math.max(margin * 0.32, 50), 170); // where the trunk would like to stand
      S = Math.min(H * 0.9 / spanY, W * 0.72 / spanX);
      // Shrink a little (not below 88%) if the trunk would otherwise stand over the text.
      if (want + BOUNDS.maxX * S > W - 24) S = Math.max(S * 0.88, (W - 24 - want) / BOUNDS.maxX);
      if ((W - 24) - spanX * S < 24) S = (W - 48) / spanX;
      const tx = W - 24 - BOUNDS.maxX * S; // the short side of the crown ends at the screen edge
      baseX = fl > 0 ? tx : W - tx;
    }
    baseY = H - S * 0.03;
    const res = Math.max(24, Math.min(144, Math.ceil(MAX_LEAF * 1.15 * S * dpr * BOX / 24 / 8) * 8));
    if (res !== spriteRes) buildSprites(res);
  }
  // How much of the oak shows at screen x: all of it beside the text, 22% over the text column.
  function fadeAt(x) {
    const a = colL - FEATHER, b = colL + FEATHER * 0.5, c = colR - FEATHER * 0.5, d = colR + FEATHER;
    const f = x <= a || x >= d ? 0 : x < b ? (x - a) / (b - a) : x > c ? (d - x) / (d - c) : 1;
    return 1 - 0.78 * f;
  }

  /* ---------- Growth and drawing ---------- */
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const backOut = k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  // Where everything is at growth g: each branch starts at its parent's current tip, so new branches ride
  // on the growing ones, and the logos hang on their branch.
  function layout(g) {
    for (const b of branches) {
      b.k = clamp((g - b.t0) / (b.t1 - b.t0));
      b.x0 = b.parent ? b.parent.xt : b.ox; b.y0 = b.parent ? b.parent.yt : b.oy;
      b.xt = b.x0 + b.c * b.len * b.k; b.yt = b.y0 + b.s * b.len * b.k;
    }
    for (const l of leaves) {
      const b = l.b;
      l.s = backOut(clamp((g - l.tb) / 0.07));
      l.x = b.x0 + (b.xt - b.x0) * l.along - b.s * l.side * l.dist;
      l.y = b.y0 + (b.yt - b.y0) * l.along + b.c * l.side * l.dist;
    }
  }
  // The points of a branch as it is right now: base, two crooked middle points and the tip.
  function points(b) {
    const L = b.len * b.k, P = [];
    for (let i = 0; i <= 3; i++) {
      const u = i / 3, off = i === 1 ? b.k1 : i === 2 ? b.k2 : 0;
      P.push(b.x0 + b.c * L * u - b.s * off * L, b.y0 + b.s * L * u + b.c * off * L);
    }
    return P;
  }
  // Adds a branch as a tapered outline with a round tip to the current path. Every outline is wound the same
  // way as the circles, so a whole depth is filled in one go without holes where pieces overlap.
  function wood(b, wf, minW, round) {
    const P = points(b), nx = -b.s, ny = b.c;
    const w = u => Math.max(minW, (b.w0 + (b.w1 - b.w0) * u) * wf) / 2;
    wx.moveTo(P[0] - nx * w(0), P[1] - ny * w(0));
    for (let i = 1; i <= 3; i++) wx.lineTo(P[i * 2] - nx * w(i / 3), P[i * 2 + 1] - ny * w(i / 3));
    for (let i = 3; i >= 0; i--) wx.lineTo(P[i * 2] + nx * w(i / 3), P[i * 2 + 1] + ny * w(i / 3));
    wx.closePath();
    if (!round) return;
    const r = w(1);
    wx.moveTo(P[6] + r, P[7]); wx.arc(P[6], P[7], r, 0, 6.2832);
  }
  // The shaded side of the big wood (light comes from the upper left), as a half outline.
  function shade(b, wf) {
    const P = points(b), nx = -b.s, ny = b.c;
    const w = u => (b.w0 + (b.w1 - b.w0) * u) * wf / 2;
    wx.moveTo(P[0] + nx * w(0) * 0.05, P[1] + ny * w(0) * 0.05);
    for (let i = 1; i <= 3; i++) wx.lineTo(P[i * 2] + nx * w(i / 3) * 0.05, P[i * 2 + 1] + ny * w(i / 3) * 0.05);
    for (let i = 3; i >= 0; i--) wx.lineTo(P[i * 2] + nx * w(i / 3), P[i * 2 + 1] + ny * w(i / 3));
    wx.closePath();
  }
  // Furrows in the bark of the trunk: a few wavy, broken lines running up it.
  function furrows(b, wf) {
    const P = points(b), nx = -b.s, ny = b.c;
    for (const f of [-0.55, -0.1, 0.35, 0.7]) {
      for (let i = 0; i <= 3; i++) {
        const u = i / 3, d = f * (b.w0 + (b.w1 - b.w0) * u) * wf / 2 + Math.sin(i * 2.1 + f * 9) * b.w0 * wf * 0.05;
        const x = P[i * 2] + nx * d, y = P[i * 2 + 1] + ny * d;
        if (i) wx.lineTo(x, y); else wx.moveTo(x, y);
      }
    }
  }
  function drawWood(g) {
    const wf = 0.35 + 0.65 * g; // the wood thickens as the oak grows
    wx.setTransform(1, 0, 0, 1, 0, 0);
    wx.clearRect(0, 0, woodCv.width, woodCv.height);
    wx.setTransform(dpr * S * fl, 0, 0, dpr * S, dpr * baseX, dpr * baseY);
    wx.globalAlpha = 1;
    // The flare where the trunk meets its roots.
    wx.beginPath();
    const fw = 0.1 * wf, fh = 0.12 * clamp(g / 0.1);
    wx.moveTo(-fw * 1.9, 0.004);
    wx.quadraticCurveTo(-fw * 0.62, -fh * 0.1, -fw * 0.55, -fh);
    wx.lineTo(fw * 0.55, -fh);
    wx.quadraticCurveTo(fw * 0.62, -fh * 0.1, fw * 1.9, 0.004);
    wx.lineTo(fw * 1.9, 0.08); wx.lineTo(-fw * 1.9, 0.08); // down past the bottom edge of the screen
    wx.closePath();
    wx.fillStyle = barkColors[0];
    wx.fill();
    // Wood, one fill per depth (the canvas itself is semi-transparent, so overlaps leave no seams).
    const minW = 1.3 / S;
    for (let d = 0; d <= MAX; d++) {
      // Thick wood as tapered outlines (round joints only where the wood is heavy); the thin twigs, which are
      // most of the branches, as plain lines of one width per depth, which is much cheaper to draw.
      const thin = d >= MAX - 1;
      let n = 0, sum = 0;
      wx.beginPath();
      for (const b of branches) {
        if (b.depth !== d || b.k <= 0) continue;
        n++;
        if (thin) {
          const P = points(b);
          wx.moveTo(P[0], P[1]); wx.lineTo(P[2], P[3]); wx.lineTo(P[4], P[5]); wx.lineTo(P[6], P[7]);
          sum += (b.w0 + b.w1) / 2;
        } else wood(b, wf, minW, d <= 2);
      }
      if (!n) continue;
      if (thin) {
        wx.strokeStyle = barkColors[d];
        wx.lineWidth = Math.max(minW, sum / n * wf);
        wx.lineCap = "round"; wx.lineJoin = "round";
        wx.stroke();
      } else {
        wx.fillStyle = barkColors[d];
        wx.fill();
      }
    }
    wx.beginPath();
    for (const b of branches) if (b.depth <= 2 && b.k > 0 && (b.parent || b === trunk)) shade(b, wf);
    wx.fillStyle = furrow;
    wx.globalAlpha = dark ? 0.35 : 0.25;
    wx.fill();
    if (trunk.k > 0.3) {
      wx.beginPath();
      furrows(trunk, wf);
      wx.strokeStyle = furrow;
      wx.lineWidth = Math.max(1 / S, 0.005 * wf);
      wx.lineCap = "round"; wx.lineJoin = "round";
      wx.setLineDash([0.05, 0.025]);
      wx.globalAlpha = dark ? 0.5 : 0.35;
      wx.stroke();
      wx.setLineDash([]);
    }
    // Foliage: a soft, lumpy mass around the logos gives the crown the outline of an oak.
    for (const [k, a] of [[2.2, 0.08], [1.4, 0.09]]) {
      wx.beginPath();
      for (const l of leaves) if (l.s > 0) { const r = l.size * k * Math.min(1, l.s); wx.moveTo(l.x + r, l.y); wx.arc(l.x, l.y, r, 0, 6.2832); }
      wx.fillStyle = canopy;
      wx.globalAlpha = dark ? a * 1.5 : a;
      wx.fill();
    }
    // Fade the wood over the text column.
    wx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wx.globalAlpha = 1;
    wx.globalCompositeOperation = "destination-out";
    const pos = x => clamp(x / W), fade = wx.createLinearGradient(0, 0, W, 0);
    fade.addColorStop(pos(colL - FEATHER), "rgba(0,0,0,0)");
    fade.addColorStop(pos(colL + FEATHER * 0.5), "rgba(0,0,0,.78)");
    fade.addColorStop(pos(colR - FEATHER * 0.5), "rgba(0,0,0,.78)");
    fade.addColorStop(pos(colR + FEATHER), "rgba(0,0,0,0)");
    wx.fillStyle = fade;
    wx.fillRect(0, 0, W, H);
    wx.globalCompositeOperation = "source-over";
  }

  const petals = [];
  function drawLeaves(p, now) {
    const flutter = !reduce && fine;
    lx.setTransform(1, 0, 0, 1, 0, 0);
    lx.clearRect(0, 0, leafCv.width, leafCv.height);
    // Each logo with its glow, fading over the text column like the wood.
    for (const l of leaves) {
      if (l.s <= 0) continue;
      l.sx = baseX + fl * l.x * S;
      l.sy = baseY + l.y * S + (flutter ? Math.sin(now * 0.0016 + l.phase) * l.size * S * 0.07 : 0);
      l.fa = fadeAt(l.sx);
      const rot = fl * l.rot + (flutter ? Math.sin(now * 0.002 + l.phase) * 0.09 : 0);
      const z = l.size * l.s * S * dpr * BOX / 24, c = Math.cos(rot), s = Math.sin(rot);
      lx.setTransform(c, s, -s, c, l.sx * dpr, l.sy * dpr);
      lx.globalAlpha = (dark ? 0.95 : 0.92) * l.fa;
      lx.drawImage(sprites[l.icon], -z / 2, -z / 2, z, z);
    }
    // Falling logos once the oak is in full leaf (the last part of the page).
    if (!reduce) {
      if (p > 0.9 && petals.length < (small ? 12 : 24) && Math.random() < 0.15) {
        const l = leaves[Math.floor(Math.random() * leaves.length)];
        if (l.s > 0.9) petals.push({ x: l.sx, y: l.sy, vx: (Math.random() - 0.5) * 0.4, vy: 0.35 + Math.random() * 0.5,
          rot: fl * l.rot, vr: (Math.random() - 0.5) * 0.03, size: l.size * S * 0.85, icon: l.icon, born: now, life: 4500 + Math.random() * 3000, phase: Math.random() * 6.283 });
      }
      for (let i = petals.length - 1; i >= 0; i--) {
        const q = petals[i], age = (now - q.born) / q.life;
        if (age >= 1 || q.y > H + 40) { petals.splice(i, 1); continue; }
        q.x += q.vx + Math.sin(now * 0.002 + q.phase) * 0.6; q.y += q.vy; q.rot += q.vr;
        const z = q.size * dpr * BOX / 24, c = Math.cos(q.rot), s = Math.sin(q.rot);
        lx.setTransform(c, s, -s, c, q.x * dpr, q.y * dpr);
        lx.globalAlpha = (dark ? 0.9 : 0.8) * (1 - age) * fadeAt(q.x);
        lx.drawImage(sprites[q.icon], -z / 2, -z / 2, z, z);
      }
    }
    lx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ---------- Scroll-driven loop ---------- */
  let p = 0, target = 0, raf = 0, last = 0, frameNo = 0, drawnG = -1;
  function progress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp(window.scrollY / max) : 0;
  }
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(50, now - last) : 16;
    last = now;
    if (reduce) p = target;
    else { p += (target - p) * Math.min(1, dt / 260); if (Math.abs(target - p) < 0.0004) p = target; }
    const settling = p !== target, g = 0.06 + p * 0.94; // a stump on its roots is visible even at the very top
    const grew = g !== drawnG;
    if (grew) { layout(g); drawWood(g); drawnG = g; }
    const fluttering = !reduce && fine && g > FIRST_LEAF;
    // Leaves: whenever the oak changed, and for the flutter every other frame (to spare the battery).
    if (grew || petals.length || (fluttering && frameNo++ % 2 === 0)) drawLeaves(p, now);
    const alive = settling || petals.length || (!reduce && p > 0.9) || fluttering;
    if (alive && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function redraw() { drawnG = -1; kick(); }

  resize(); theme(); place();
  target = p = progress();
  window.addEventListener("scroll", () => { target = progress(); kick(); }, { passive: true });
  window.addEventListener("resize", () => { resize(); place(); target = progress(); redraw(); }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { theme(); place(); redraw(); });
  // The theme button sets data-theme on <html>; language switches flip dir (the oak moves to the other side).
  new MutationObserver(() => { theme(); place(); target = progress(); redraw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "dir"] });
  // Re-renders (language switch, blog post open) change the page height and maybe the text column;
  // the oak is redrawn only if it has to move.
  let pending = 0;
  new MutationObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      const was = colL + "," + colR;
      place();
      target = progress();
      if (was !== colL + "," + colR) redraw(); else kick();
    });
  }).observe(document.getElementById("main") || document.body, { childList: true, subtree: true });
  kick();
})();
