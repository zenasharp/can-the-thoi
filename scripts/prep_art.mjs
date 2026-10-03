// raw_art/<group>/<id>.png  ->  public/art/<group>/<id>.webp  (+ src/content/art-manifest.json)
//
// For every drawing (hand-made in Krita or AI-generated):
//   1. cut out the background (keeps real alpha; otherwise flood-fills the white
//      that touches the image border, so white areas inside outlines survive)
//   2. flatten colours: k-means down to a few flat colours, which also removes
//      stray gradients / blotches from generated images
//   3. notebook paper: faint ruled lines + grain multiplied into the fills (not
//      into the black outline), like drawing on notebook paper and cutting it out
//   4. trim, pad, resize, write webp
//
//   node scripts/prep_art.mjs [--only group/id,...] [--no-paper] [--no-flatten]
import fs from "fs";
import path from "path";
import sharp from "sharp";

const RAW = "raw_art";
const OUT = "public/art";
const MANIFEST = "src/content/art-manifest.json";
const MAX_SIDE = 1024;
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const only = (args[args.indexOf("--only") + 1] || "").split(",").filter((s) => args.includes("--only") && s);

// Per-file overrides: { "hero/hero_games": { paper: false } }
const overrides = fs.existsSync("scripts/prep-overrides.json") ? JSON.parse(fs.readFileSync("scripts/prep-overrides.json", "utf8")) : {};

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const dist2 = (r1, g1, b1, r2, g2, b2) => (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;

function cutBackground(px, w, h) {
  const at = (x, y) => (y * w + x) * 4;
  const hasAlpha = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)].some((i) => px[i + 3] < 250);
  if (hasAlpha) return;
  // Flood fill from the border through near-white pixels.
  const seen = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = y * w + x;
    if (seen[k]) return;
    const i = k * 4;
    if (dist2(px[i], px[i + 1], px[i + 2], 255, 255, 255) > 40 * 40) return;
    seen[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const k = stack.pop();
    const x = k % w, y = (k / w) | 0;
    px[k * 4 + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}

function hardenAlpha(px) {
  for (let i = 3; i < px.length; i += 4) px[i] = px[i] < 128 ? 0 : 255;
}

// k-means over opaque pixels, seeded with the most common coarse colours.
// keep: colours ("#rrggbb") that must survive even if they cover only a few pixels
function flatten(px, k = 8, keep = []) {
  const hist = new Map();
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
    hist.set(key, (hist.get(key) || 0) + 1);
  }
  const total = [...hist.values()].reduce((a, b) => a + b, 0);
  const seeds = keep.map((hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
  for (const [key, n] of [...hist].sort((a, b) => b[1] - a[1])) {
    if (n < total * 0.004) break; // ignore specks: they get absorbed
    const c = [((key >> 8) & 15) * 16 + 8, ((key >> 4) & 15) * 16 + 8, (key & 15) * 16 + 8];
    if (seeds.every((s) => dist2(...s, ...c) > 48 * 48)) seeds.push(c);
    if (seeds.length >= k) break;
  }
  let centers = seeds;
  const assign = new Uint8Array(px.length / 4);
  for (let iter = 0; iter < 6; iter++) {
    const sum = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      if (!px[i + 3]) continue;
      let best = 0, bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = dist2(px[i], px[i + 1], px[i + 2], ...centers[c]);
        if (d < bd) { bd = d; best = c; }
      }
      assign[p] = best;
      const s = sum[best];
      s[0] += px[i]; s[1] += px[i + 1]; s[2] += px[i + 2]; s[3]++;
    }
    centers = sum.map((s, c) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centers[c]));
  }
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    if (!px[i + 3]) continue;
    const c = centers[assign[p]];
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
  }
}

// Faint notebook rules + grain multiplied into everything that isn't outline.
function paper(px, w, h, seed, strength = 1) {
  const vertical = seed % 2 === 0;
  const rule = Math.max(14, Math.round(Math.max(w, h) / 34));
  let s = seed || 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const offset = Math.floor(rnd() * rule);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!px[i + 3]) continue;
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      if (lum < 60) continue; // outline stays pure ink
      const t = ((vertical ? x : y) + offset) % rule;
      const onLine = t < Math.max(2, rule / 12);
      // multiply by line colour (#B8C5D0) at ~35% and by grain at ~4%
      let mr = 1, mg = 1, mb = 1;
      if (onLine) { mr = 1 - 0.35 * strength * (1 - 184 / 255); mg = 1 - 0.35 * strength * (1 - 197 / 255); mb = 1 - 0.35 * strength * (1 - 208 / 255); }
      const g = 1 - rnd() * 0.05 * strength;
      px[i] *= mr * g; px[i + 1] *= mg * g; px[i + 2] *= mb * g;
    }
  }
}

// Opt-in (override "cleanup": true): recolour small same-colour islands that touch
// no outline ink and sit inside one other colour — removes generator blotches.
const HOLE = [1, 254, 1]; // sentinel for enclosed transparent holes

// Opt-in (override "fillHoles": true): the image model sometimes returns the
// inside of a big shape (a tree canopy) as transparent. Fill every transparent
// region that doesn't reach the image border with the commonest non-ink colour
// around it, or with a given colour ("fillHoles": "#rrggbb", e.g. white eyes).
function fillHoles(px, w, h, color) {
  const forced = typeof color === "string" ? parseInt(color.slice(1), 16) : null;
  const n = w * h;
  const outside = new Uint8Array(n);
  const stack = [];
  const push = (k) => { if (!outside[k] && px[k * 4 + 3] === 0) { outside[k] = 1; stack.push(k); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const k = stack.pop(), x = k % w, y = (k / w) | 0;
    if (x > 0) push(k - 1); if (x < w - 1) push(k + 1); if (y > 0) push(k - w); if (y < h - 1) push(k + w);
  }
  const seen = new Uint8Array(n);
  for (let s0 = 0; s0 < n; s0++) {
    if (seen[s0] || outside[s0] || px[s0 * 4 + 3] !== 0) continue;
    const comp = [s0];
    seen[s0] = 1;
    const votes = new Map();
    for (let c = 0; c < comp.length; c++) {
      const k = comp[c], x = k % w, y = (k / w) | 0;
      for (const q of [x > 0 && k - 1, x < w - 1 && k + 1, y > 0 && k - w, y < h - 1 && k + w]) {
        if (q === false) continue;
        if (px[q * 4 + 3] === 0) { if (!seen[q] && !outside[q]) { seen[q] = 1; comp.push(q); } continue; }
        const lum = 0.299 * px[q * 4] + 0.587 * px[q * 4 + 1] + 0.114 * px[q * 4 + 2];
        if (lum < 70) continue;
        const key = (px[q * 4] << 16) | (px[q * 4 + 1] << 8) | px[q * 4 + 2];
        votes.set(key, (votes.get(key) || 0) + 1);
      }
    }
    if (!votes.size && forced === null) continue;
    const fill = forced !== null ? forced : [...votes].sort((a, b) => b[1] - a[1])[0][0];
    for (const k of comp) { px[k * 4] = (fill >> 16) & 255; px[k * 4 + 1] = (fill >> 8) & 255; px[k * 4 + 2] = fill & 255; px[k * 4 + 3] = 255; }
  }
}

function cleanupIslands(px, w, h, maxFraction = 0.12) {
  // Enclosed transparent holes (semi-transparent blotches) become islands too.
  const outside = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = y * w + x;
    if (outside[k] || px[k * 4 + 3] > 0) return;
    outside[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const k = stack.pop(), x = k % w, y = (k / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let k = 0; k < w * h; k++) {
    if (px[k * 4 + 3] === 0 && !outside[k]) {
      px[k * 4] = HOLE[0]; px[k * 4 + 1] = HOLE[1]; px[k * 4 + 2] = HOLE[2]; px[k * 4 + 3] = 255;
    }
  }
  // Repeat: nested blotches (an island inside an island) clear from the inside out.
  for (let pass = 0; pass < 5; pass++) if (!cleanupPass(px, w, h, maxFraction)) break;
  // Holes that weren't merged (real gaps framed by outline) go back to transparent.
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] === HOLE[0] && px[i + 1] === HOLE[1] && px[i + 2] === HOLE[2]) px[i + 3] = 0;
  }
}

function cleanupPass(px, w, h, maxFraction) {
  let changed = false;
  const n = w * h;
  const key = (i) => (px[i * 4] << 16) | (px[i * 4 + 1] << 8) | px[i * 4 + 2];
  const dark = (i) => 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2] < 60;
  const opaque = (i) => px[i * 4 + 3] > 0;
  const seen = new Uint8Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) if (opaque(i)) total++;
  for (let start = 0; start < n; start++) {
    if (seen[start] || !opaque(start) || dark(start)) continue;
    const k = key(start);
    const comp = [start];
    const neighbours = new Map();
    let touchesInk = false, touchesEdge = false;
    seen[start] = 1;
    for (let c = 0; c < comp.length; c++) {
      const p = comp[c], x = p % w, y = (p / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) { touchesEdge = true; continue; }
        const q = ny * w + nx;
        if (!opaque(q)) { touchesEdge = true; continue; }
        if (key(q) === k) { if (!seen[q]) { seen[q] = 1; comp.push(q); } continue; }
        if (dark(q)) touchesInk = true;
        else neighbours.set(key(q), (neighbours.get(key(q)) || 0) + 1);
      }
    }
    if (touchesInk || touchesEdge || !neighbours.size || comp.length > total * maxFraction) continue;
    const contacts = [...neighbours].sort((a, b) => b[1] - a[1]);
    const sum = contacts.reduce((a, [, c]) => a + c, 0);
    if (contacts[0][1] < sum * 0.75) continue; // must sit inside one dominant colour
    const fill = contacts[0][0];
    for (const p of comp) { px[p * 4] = (fill >> 16) & 255; px[p * 4 + 1] = (fill >> 8) & 255; px[p * 4 + 2] = fill & 255; }
    changed = true;
  }
  return changed;
}

// Silhouette polygons (normalised 0..1, v up) traced from the alpha channel, so
// the site can extrude each drawing into a piece of card with a paper edge.
// Pixel-edge tracing on a coarse grid, outer loops only, Douglas-Peucker simplified.
function traceShapes(alpha, w, h, gridLong = 120) {
  const s = gridLong / Math.max(w, h);
  const W = Math.max(2, Math.round(w * s)), H = Math.max(2, Math.round(h * s));
  const grid = new Uint8Array(W * H);
  for (let gy = 0; gy < H; gy++) {
    for (let gx = 0; gx < W; gx++) {
      const x0 = Math.floor((gx / W) * w), x1 = Math.max(x0 + 1, Math.floor(((gx + 1) / W) * w));
      const y0 = Math.floor((gy / H) * h), y1 = Math.max(y0 + 1, Math.floor(((gy + 1) / H) * h));
      let on = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { n++; if (alpha[y * w + x] > 127) on++; }
      grid[gy * W + gx] = on / n > 0.5 ? 1 : 0;
    }
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : grid[y * W + x]);
  const out = new Map(); // "x,y" -> [[x2,y2], ...] directed edges, interior on the right
  const add = (ax, ay, bx, by) => {
    const k = `${ax},${ay}`;
    if (!out.has(k)) out.set(k, []);
    out.get(k).push([bx, by]);
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!grid[y * W + x]) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const loops = [];
  for (const [start, edges] of out) {
    while (edges.length) {
      const [sx, sy] = start.split(",").map(Number);
      const loop = [[sx, sy]];
      let [cx, cy] = edges.pop();
      while (!(cx === sx && cy === sy)) {
        loop.push([cx, cy]);
        const next = out.get(`${cx},${cy}`);
        if (!next || !next.length) break;
        [cx, cy] = next.pop();
      }
      if (loop.length > 3) loops.push(loop);
    }
  }
  const area = (l) => l.reduce((a, p, i) => { const q = l[(i + 1) % l.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const dp = (pts, eps) => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]];
    let idx = 0, best = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
      if (d > best) { best = d; idx = i; }
    }
    if (best <= eps) return [a, b];
    return [...dp(pts.slice(0, idx + 1), eps).slice(0, -1), ...dp(pts.slice(idx), eps)];
  };
  const total = W * H;
  return loops
    .filter((l) => area(l) > total * 0.002) // outer loops (clockwise in y-down), skip specks and holes
    .map((l) => {
      const half = Math.floor(l.length / 2);
      const simple = [...dp(l.slice(0, half + 1), 0.8).slice(0, -1), ...dp([...l.slice(half), l[0]], 0.8).slice(0, -1)];
      return simple.flatMap(([x, y]) => [+(x / W).toFixed(4), +(1 - y / H).toFixed(4)]);
    });
}

// Opt-in (override "perryShorts": true): my signature mint shorts get a pattern of
// little Perry-the-Platypus heads (teal head, orange bill, brown fedora), drawn in
// the same ink-outline style and clipped to the shorts, so the drawing underneath
// stays untouched.
const perrySvg = (size, angle) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <g transform="rotate(${angle} 50 50)" stroke="#151515" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="42" cy="62" rx="25" ry="21" fill="#2FA8A0"/>
    <rect x="56" y="59" width="34" height="15" rx="7" fill="#F39A3A"/>
    <circle cx="49" cy="56" r="3.2" fill="#151515" stroke="none"/>
    <path d="M27 42 Q29 18 42 18 Q55 18 57 42 Z" fill="#8A5A35"/>
    <ellipse cx="42" cy="42" rx="29" ry="6.5" fill="#8A5A35"/>
    <path d="M28 35 L56 35" stroke="#5A3820" stroke-width="5"/>
  </g>
</svg>`;

async function perryShorts(px, w, h) {
  // Mint pixels (green-blue, light) in the lower half of the drawing...
  const isMint = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return px[i + 3] > 0 && g > r + 15 && b > r && lum > 140 && lum < 240;
  };
  const mask = new Uint8Array(w * h);
  for (let y = Math.floor(h * 0.5); y < h; y++) for (let x = 0; x < w; x++) if (isMint((y * w + x) * 4)) mask[y * w + x] = 1;
  // ...keep the big connected regions: the shorts (both legs, split by the
  // centre line), not stray mint specks.
  const label = new Int32Array(w * h);
  const sizes = [0];
  let bestSize = 0, next = 1;
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || label[s]) continue;
    const stack = [s];
    label[s] = next;
    let size = 0;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
        if (q !== false && mask[q] && !label[q]) { label[q] = next; stack.push(q); }
      }
    }
    sizes.push(size);
    bestSize = Math.max(bestSize, size);
    next++;
  }
  if (!bestSize) throw new Error("perryShorts: no mint shorts found");
  const keep = new Uint8Array(next);
  sizes.forEach((n, l) => { if (l && n >= bestSize * 0.2) keep[l] = 1; });
  const inShorts = (p) => keep[label[p]] === 1;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let p = 0; p < w * h; p++) if (inShorts(p)) {
    const x = p % w, y = (p / w) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const size = Math.max(12, Math.round((y1 - y0) * 0.62));
  const tiles = await Promise.all([-12, 10].map(async (a) => {
    const { data } = await sharp(Buffer.from(perrySvg(size, a))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return data;
  }));
  // Offset grid of heads, alternating tilt, anchored to the shorts' corner.
  const stepX = Math.round(size * 1.05), stepY = Math.round(size * 0.78);
  for (let row = -1; y0 + row * stepY < y1 + size; row++) {
    for (let col = -1; x0 + col * stepX < x1 + size; col++) {
      const tile = tiles[(row + col) & 1];
      const ox = x0 + col * stepX + (row & 1 ? stepX >> 1 : 0) - (size >> 3);
      const oy = y0 + row * stepY - (size >> 4);
      for (let ty = 0; ty < size; ty++) {
        const y = oy + ty;
        if (y < 0 || y >= h) continue;
        for (let tx = 0; tx < size; tx++) {
          const x = ox + tx;
          if (x < 0 || x >= w || !inShorts(y * w + x)) continue;
          const t = (ty * size + tx) * 4, a = tile[t + 3] / 255;
          if (!a) continue;
          const i = (y * w + x) * 4;
          px[i] = px[i] * (1 - a) + tile[t] * a;
          px[i + 1] = px[i + 1] * (1 - a) + tile[t + 1] * a;
          px[i + 2] = px[i + 2] * (1 - a) + tile[t + 2] * a;
        }
      }
    }
  }
}

// Opt-in (override "wobble": amplitude in px): bend a too-clean raster drawing so
// its outlines wobble like a mouse-drawn line. Smooth value-noise displacement
// (a slow bend + a gentler medium one, never fine enough to break a thin line),
// sampled bilinearly so lines stay continuous.
function wobbleRaster(px, w, h, amp = 4, seed = 3) {
  const hash = (x, y, k) => {
    let n = (x * 374761393 + y * 668265263 + k * 2147483647 + seed * 974711) | 0;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const noise = (x, y, k) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const a = hash(xi, yi, k), b = hash(xi + 1, yi, k), c = hash(xi, yi + 1, k), d = hash(xi + 1, yi + 1, k);
    return (a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf) * 2 - 1;
  };
  const src = px.slice();
  const s1 = Math.max(w, h) / 8, s2 = Math.max(w, h) / 28;
  const at = (x, y, c) => src[(y * w + x) * 4 + c];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = amp * noise(x / s1, y / s1, 1) + amp * 0.35 * noise(x / s2, y / s2, 3);
      const dy = amp * noise(x / s1, y / s1, 2) + amp * 0.35 * noise(x / s2, y / s2, 4);
      const fx = Math.min(w - 1.001, Math.max(0, x + dx)), fy = Math.min(h - 1.001, Math.max(0, y + dy));
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const i = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = at(x0, y0, c) * (1 - tx) + at(x0 + 1, y0, c) * tx;
        const bot = at(x0, y0 + 1, c) * (1 - tx) + at(x0 + 1, y0 + 1, c) * tx;
        px[i + c] = top * (1 - ty) + bot * ty;
      }
    }
  }
}

// Opt-in (override "inkGrow": px): thicken the ink outlines inside the drawing,
// so thin generated lines survive being shown small.
// out: also grow into transparent pixels (thickens lines drawn on empty paper,
// like balloon strings, so they survive mipmapping + alpha test on the site)
function inkGrow(px, w, h, r = 1, out = false) {
  const dark = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) {
    const i = k * 4;
    if (px[i + 3] > 0 && 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2] < 75) dark[k] = 1;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      if (dark[k] || (!out && !px[k * 4 + 3])) continue;
      let hit = false;
      for (let dy = -r; dy <= r && !hit; dy++) for (let dx = -r; dx <= r && !hit; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && dark[yy * w + xx] && dx * dx + dy * dy <= r * r) hit = true;
      }
      if (hit) { px[k * 4] = 21; px[k * 4 + 1] = 21; px[k * 4 + 2] = 21; px[k * 4 + 3] = 255; }
    }
  }
}

// Opt-in (override "unify": [hexColour, "green"]): repaint every pixel of one hue
// family (not the ink) with a single flat colour, e.g. a canopy that came back
// with two greens.
function unifyHue(px, hex) {
  const n = parseInt(hex.slice(1), 16), R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (0.299 * r + 0.587 * g + 0.114 * b < 50) continue; // ink
    if (g > r + 12 && g > b + 8) { px[i] = R; px[i + 1] = G; px[i + 2] = B; }
  }
}

// Opt-in (override "restring": { y0, y1, to: [x0, x1, y], up, width } in source
// px): redraw thin generated strings (the Up house balloon strings) as clean
// lines of a set width. The strings are found where they cross row y0, the old
// ones between y0 and y1 are erased, and each new line runs from `up` px above
// y0 (painting only on empty paper there, i.e. between the balloons) down to its
// own spot on the segment x0..x1 at height y (the chimney top), so the strings
// fan in side by side instead of merging into a blob. Gaps stay transparent.
// With `geometry: true` the strings are not painted at all: the old ones are
// erased and the new ones are returned as segments, which the site draws as thin
// 3D ribbons just behind the card (balloons and chimney hide their ends), so they
// stay continuous at any size.
function restring(px, w, h, { y0, y1, to, up = 16, width = 6, geometry = false }, scale) {
  const segments = [];
  const Y0 = Math.round(y0 * scale), Y1 = Math.round(y1 * scale), r = (width * scale) / 2;
  const dark = (i) => px[i + 3] > 0 && 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2] < 90;
  const starts = [];
  for (let x = 0, run = -1; x <= w; x++) {
    const d = x < w && dark((Y0 * w + x) * 4);
    if (d && run < 0) run = x;
    if (!d && run >= 0) { starts.push((run + x - 1) / 2); run = -1; }
  }
  for (let y = Y0; y <= Y1; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (dark(i)) px[i + 3] = 0; }
  const top = Y0 - Math.round(up * scale);
  starts.forEach((sx, k) => {
    const T = [(to[0] + ((to[1] - to[0]) * k) / Math.max(1, starts.length - 1)) * scale, to[2] * scale];
    // extend the string upwards along its own direction, into the balloons
    const dx = sx - T[0], dy = Y0 - T[1], len = Math.hypot(dx, dy);
    const A = [sx + (dx / len) * (Y0 - top), top], B = T;
    if (geometry) { segments.push([A[0], A[1], B[0], B[1]]); return; }
    const minX = Math.floor(Math.min(A[0], B[0]) - r - 1), maxX = Math.ceil(Math.max(A[0], B[0]) + r + 1);
    for (let y = top; y <= Math.ceil(B[1]); y++) {
      for (let x = Math.max(0, minX); x <= Math.min(w - 1, maxX); x++) {
        const vx = B[0] - A[0], vy = B[1] - A[1];
        const t = Math.max(0, Math.min(1, ((x - A[0]) * vx + (y - A[1]) * vy) / (vx * vx + vy * vy)));
        if (Math.hypot(x - (A[0] + vx * t), y - (A[1] + vy * t)) > r) continue;
        const i = (y * w + x) * 4;
        // only paint on empty paper outside the erased band, so balloons/chimney keep their colours
        if ((y < Y0 || y > Y1) && px[i + 3] > 0 && !dark(i)) continue;
        px[i] = 21; px[i + 1] = 21; px[i + 2] = 21; px[i + 3] = 255;
      }
    }
  });
  return { count: starts.length, segments };
}

async function processOne(group, id) {
  const src = path.join(RAW, group, `${id}.png`);
  const opts = { paper: !flag("no-paper"), flatten: !flag("no-flatten"), colors: 8, ...(overrides[`${group}/${id}`] || {}) };
  // Work at <= 1400px so the pixel loops stay fast.
  const { data, info } = await sharp(src).ensureAlpha().resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).raw().toBuffer({ resolveWithObject: true });
  const px = new Float32Array(data);
  cutBackground(px, info.width, info.height);
  hardenAlpha(px);
  if (opts.flatten) flatten(px, opts.colors, opts.keepColors);
  let strings = null;
  if (opts.restring) {
    const r = restring(px, info.width, info.height, opts.restring, info.width / (await sharp(src).metadata()).width);
    console.log("     restrung", r.count, "strings");
    if (r.segments.length) strings = r.segments;
  }
  if (opts.inkGrowOut) inkGrow(px, info.width, info.height, opts.inkGrowOut, true);
  if (opts.wobble) { wobbleRaster(px, info.width, info.height, opts.wobble, hash(`${group}/${id}`) % 97); hardenAlpha(px); }
  if (opts.inkGrow) inkGrow(px, info.width, info.height, opts.inkGrow);
  if (opts.fillHoles) fillHoles(px, info.width, info.height, opts.fillHoles);
  if (opts.unify) unifyHue(px, opts.unify);
  if (opts.cleanup) cleanupIslands(px, info.width, info.height);
  if (opts.perryShorts) await perryShorts(px, info.width, info.height);
  if (opts.paper) paper(px, info.width, info.height, hash(`${group}/${id}`), opts.paperStrength ?? 1);
  const buf = Buffer.from(Uint8ClampedArray.from(px));
  const out = path.join(OUT, group, `${id}.webp`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  // override "tile": true keeps the whole canvas (no trim, no pad), so the tiles
  // of a repeating strip (the sea's waves) abut exactly
  let pipe = sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (!opts.tile) pipe = pipe.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: { r: 0, g: 0, b: 0, alpha: 0 } });
  const trimmed = await pipe
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true });
  fs.writeFileSync(out, trimmed.data);
  const { data: alphaData, info: ai } = await sharp(trimmed.data).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const result = { w: trimmed.info.width, h: trimmed.info.height, shapes: traceShapes(alphaData, ai.width, ai.height) };
  if (strings) {
    // segments -> uv of the final (trimmed + 6px padded) drawing, v up
    const { info: ti } = await sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).toBuffer({ resolveWithObject: true });
    const cl = -ti.trimOffsetLeft, ct = -ti.trimOffsetTop, W = ti.width + 12, H = ti.height + 12;
    const u = (x) => +((x - cl + 6) / W).toFixed(4), v = (y) => +(1 - (y - ct + 6) / H).toFixed(4);
    result.strings = strings.map(([ax, ay, bx, by]) => [u(ax), v(ay), u(bx), v(by)]);
  }
  return result;
}

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const groups = fs.readdirSync(RAW).filter((d) => !d.startsWith("_") && fs.statSync(path.join(RAW, d)).isDirectory());
for (const group of groups) {
  for (const file of fs.readdirSync(path.join(RAW, group)).filter((f) => f.endsWith(".png"))) {
    const id = file.replace(/\.png$/, "");
    const key = `${group}/${id}`;
    if (only.length && !only.includes(key)) continue;
    if (overrides[key]?.skip) continue;
    try {
      manifest[key] = await processOne(group, id);
      console.log("OK  ", key, `${manifest[key].w}x${manifest[key].h}`);
    } catch (e) {
      console.log("FAIL", key, e.message);
    }
  }
}
fs.writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + "\n");
