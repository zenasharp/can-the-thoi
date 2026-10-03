// Canvas-drawn textures: notebook paper, handwritten notes, placeholder cut-outs
// and blurred drop shadows. Replaces the paid "crafty asset pack" paper the
// original used, so everything here is ours to ship.
import * as THREE from "three";

export const PALETTE = {
  paper: "#F4EDE0",
  ink: "#1A1A1A",
  pencil: "#8B7E6E",
  line: "#B8C5D0",
  margin: "#E3A1A1",
};

export const HAND = '"Patrick Hand", "Comic Sans MS", sans-serif';

// Redraw canvases once the handwriting font is ready (first paint may use a fallback).
const fontReady = typeof document !== "undefined" && document.fonts
  ? document.fonts.load(`40px ${HAND}`).catch(() => {})
  : Promise.resolve();
export const whenFont = (draw, texture) => fontReady.then(() => { draw(); texture.needsUpdate = true; });

export const toTexture = (canvas) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

// Deterministic noise so paper grain doesn't shimmer between reloads.
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

export const grain = (ctx, w, h, amount, seed = 7) => {
  const r = rng(seed);
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? "120,100,80" : "255,255,255"},${0.05 + r() * 0.07})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
};

/**
 * A notebook sheet: cream paper, blue rules, red margin, a soft shadow on the
 * left edge where it overlaps the previous sheet. `tint` multiplies the paper.
 */
export function notebookSheet({ width = 600, height = 1400, rule = 34, margin = 70, tint = null, seed = 7, edgeShadow = true } = {}) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, width, height);
  if (tint) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }
  grain(ctx, width, height, (width * height) / 90, seed);
  ctx.strokeStyle = PALETTE.line;
  ctx.globalAlpha = tint ? 0.55 : 0.9;
  ctx.lineWidth = 2;
  for (let y = rule * 2; y < height; y += rule) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  if (margin) {
    ctx.strokeStyle = PALETTE.margin;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, 0);
    ctx.lineTo(margin, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (edgeShadow) {
    const g = ctx.createLinearGradient(0, 0, 40, 0);
    g.addColorStop(0, "rgba(60,45,30,0.22)");
    g.addColorStop(1, "rgba(60,45,30,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 40, height);
  }
  return toTexture(c);
}

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const wrapLines = (text) => text.split("\n");

/**
 * Placeholder cut-out until the real drawing exists: a coloured paper shape
 * with a white cut border, ink outline and its label handwritten on it.
 * Returns { texture, ratio }.
 */
export function placeholderCutout(label, color, ratio = 1) {
  const h = 512;
  const w = Math.round(h * ratio);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const texture = toTexture(c);
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const pad = 14;
    // white paper border
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 60);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    // coloured body
    roundRect(ctx, pad + 16, pad + 16, w - (pad + 16) * 2, h - (pad + 16) * 2, 46);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = PALETTE.ink;
    ctx.stroke();
    grain(ctx, w, h, (w * h) / 200, label.length);
    // label
    const words = label.split(" ");
    const lines = [];
    let cur = "";
    const size = Math.min(80, w / 7);
    ctx.font = `${size}px ${HAND}`;
    for (const word of words) {
      const next = cur ? `${cur} ${word}` : word;
      if (ctx.measureText(next).width > w - 90 && cur) {
        lines.push(cur);
        cur = word;
      } else cur = next;
    }
    lines.push(cur);
    const light = isLight(color);
    ctx.fillStyle = light ? PALETTE.ink : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
  };
  draw();
  whenFont(draw, texture);
  return { texture, ratio };
}

const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
};

/**
 * A handwritten paper note with a strip of tape on top.
 * `size` is the text height in world units; returns { texture, ratio, height }.
 */
export function paperNote(text, { size = 0.2, worldHeight } = {}) {
  const lines = wrapLines(text);
  const px = 64; // text size on the canvas
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = `${px}px ${HAND}`;
  const textW = Math.max(...lines.map((l) => meas.measureText(l).width));
  const padX = px * 1.1;
  const padTop = px * 1.5;
  const lineH = px * 1.18;
  const w = Math.ceil(textW + padX * 2);
  const h = Math.ceil(padTop + lines.length * lineH + px * 0.9);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const texture = toTexture(c);
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFFDF7";
    roundRect(ctx, 6, 18, w - 12, h - 24, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(26,26,26,0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 2;
    for (let y = padTop + lineH * 0.25; y < h - 20; y += lineH) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }
    // tape
    ctx.save();
    ctx.translate(w / 2, 22);
    ctx.rotate(-0.04);
    ctx.fillStyle = "rgba(240,215,150,0.75)";
    ctx.fillRect(-90, -18, 180, 40);
    ctx.restore();
    ctx.font = `${px}px ${HAND}`;
    ctx.fillStyle = PALETTE.ink;
    ctx.textBaseline = "alphabetic";
    lines.forEach((l, i) => ctx.fillText(l, padX, padTop + lineH * (i + 0.15) - 6));
  };
  draw();
  whenFont(draw, texture);
  const ratio = w / h;
  // world height so that one text line is `size` units tall
  const height = worldHeight ?? (h / px) * size;
  return { texture, ratio, height };
}

/**
 * Vietnamese "ô ly" school-notebook paper (Hồng Hà style), seamlessly tileable:
 * a fine grid of light-blue squares with a stronger purple-blue line every 4
 * squares. One tile = 4 x 4 big squares (16 x 16 small ones). The ink is soft
 * like printed lines on cheap paper (Mr. Panda's notebook look): every line is
 * a faint halo plus a core, slightly blurred, its strength wavering along the
 * line, with paper grain on top. `tint` multiplies the paper (coloured ground
 * strips); `contrast` scales the ink. `cols` / `vertical` let callers draw a
 * narrower strip with horizontal rules only (the red-margin strip); `cells`
 * (16 per tile) lets one texture span several tiles.
 */
export function gridPaper({ tint = null, contrast = 1, size = 1024, seed = 5, cells = 16, cols = cells, vertical = true, draw } = {}) {
  const step = size / cells;
  const cw = Math.round(step * cols);
  const pad = Math.round(step); // drawn wider than the tile so the blur wraps cleanly

  // 1) the ink, on a padded transparent canvas
  const ink = document.createElement("canvas");
  ink.width = cw + pad * 2;
  ink.height = size + pad * 2;
  const ictx = ink.getContext("2d");
  // periodic wobble (whole cycles per tile) so the line strength also tiles
  const waver = (t, k) => 0.82 + 0.1 * Math.sin(2 * Math.PI * (3 * t) + k * 1.9) + 0.08 * Math.sin(2 * Math.PI * (7 * t) + k * 0.7);
  const drawLine = (pos, isVertical, width, rgb, alpha, k) => {
    const SEG = 24;
    const len = isVertical ? size : cw;
    for (let a = -pad; a < len + pad; a += SEG) {
      const t = (((a % size) + size) % size) / size;
      const strength = alpha * waver(t, k);
      ictx.fillStyle = `rgba(${rgb},${strength * 0.4})`; // halo: faint ink bleed
      if (isVertical) ictx.fillRect(pad + pos - width, pad + a, width * 3, SEG);
      else ictx.fillRect(pad + a, pad + pos - width, SEG, width * 3);
      ictx.fillStyle = `rgba(${rgb},${strength})`; // core
      if (isVertical) ictx.fillRect(pad + pos, pad + a, width, SEG);
      else ictx.fillRect(pad + a, pad + pos, SEG, width);
    }
  };
  const minor = ["150,170,228", 0.42 * contrast, 2.5];
  const major = ["98,112,205", 0.68 * contrast, 4];
  const style = (i) => ((((i % 4) + 4) % 4) === 0 ? major : minor);
  for (let i = -1; i <= Math.max(cells, cols); i++) {
    const [rgb, alpha, width] = style(i);
    if (i <= cells) drawLine(i * step, false, width, rgb, alpha, i + 11);
    if (vertical && i <= cols) drawLine(i * step, true, width, rgb, alpha, i + 3);
  }

  // 2) paper, then the blurred ink, then grain over everything
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#F7F5EC";
  ctx.fillRect(0, 0, cw, size);
  if (tint) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, cw, size);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.filter = `blur(${step / 32}px)`;
  ctx.drawImage(ink, -pad, -pad);
  ctx.filter = "none";
  draw?.(ctx, cw, size);
  grain(ctx, cw, size, (cw * size) / 90, seed);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// --- hand-coloured ground ---------------------------------------------------

const hexRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbHex = (c) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
/** a towards b by t, in sRGB */
const mix = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
const rgba = (hex, al) => `rgba(${hexRgb(hex).join(",")},${al})`;
/** the same hue, darker (t > 0) and a touch more saturated */
const deepen = (hex, t) => { const c = new THREE.Color(hex).offsetHSL(0, t * 0.15, 0); return mix(`#${c.getHexString()}`, "#1a1408", t); };
const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 1;

/**
 * Ground paper coloured in by hand, like a kid going over the ô ly sheet with
 * markers: the colour (a wash under the printed grid), then light marker
 * strokes of the same hue, slanted and laid side by side, a little darker where
 * they cross, and soft lighter and darker patches, so no strip is one flat
 * colour. Two tiles square (`repeat` 1/2), so the strokes repeat less often.
 */
export function groundPaper(color) {
  const TILES = 2;
  const seed = hash(color);
  const t = gridPaper({ tint: color, size: 512 * TILES, cells: 16 * TILES, contrast: 0.7, seed, draw: (ctx, W, H) => colourIn(ctx, W, H, color, seed, 16 * TILES) });
  t.repeat.set(1 / TILES, 1 / TILES);
  return t;
}

function colourIn(ctx, W, H, color, seed, across) {
  const r = rng(seed * 7 + 3);
  const rr = (lo, hi) => lo + (hi - lo) * r();
  const u = W / across; // one small square
  // drawn nine times, a tile apart, so strokes crossing an edge wrap round
  const tiled = (fn) => {
    for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
      ctx.save();
      ctx.translate(ox, oy);
      fn();
      ctx.restore();
    }
  };
  ctx.lineCap = "round";

  // marker strokes: light tints of the colour, multiplied, so they only deepen it a little
  const strokes = Array.from({ length: 64 }, () => ({
    x: rr(0, W), y: rr(0, H), len: rr(0.2, 0.5) * W, ang: Math.PI / 2 + rr(-0.6, -0.32),
    w: rr(1.1, 2.2) * u, bend: rr(-0.6, 0.6) * u,
    c: mix(color, "#ffffff", rr(0.45, 0.7)), a: rr(0.35, 0.6),
  }));
  ctx.globalCompositeOperation = "multiply";
  tiled(() => strokes.forEach((st) => {
    ctx.globalAlpha = st.a;
    ctx.strokeStyle = st.c;
    ctx.lineWidth = st.w;
    const dx = (Math.cos(st.ang) * st.len) / 2, dy = (Math.sin(st.ang) * st.len) / 2;
    ctx.beginPath();
    ctx.moveTo(st.x - dx, st.y - dy);
    ctx.quadraticCurveTo(st.x + st.bend, st.y - st.bend, st.x + dx, st.y + dy);
    ctx.stroke();
  }));

  // soft patches, lighter and darker
  const patches = Array.from({ length: 9 }, () => ({ x: rr(0, W), y: rr(0, H), rad: rr(3, 7) * u, dark: r() < 0.5, a: rr(0.1, 0.2) }));
  tiled(() => patches.forEach((p) => {
    const c = p.dark ? deepen(color, 0.25) : "#ffffff";
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad);
    g.addColorStop(0, rgba(c, p.a));
    g.addColorStop(1, rgba(c, 0));
    ctx.globalCompositeOperation = p.dark ? "multiply" : "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(p.x - p.rad, p.y - p.rad, p.rad * 2, p.rad * 2);
  }));
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/** Width of the red-margin strip, in small grid squares. */
export const MARGIN_CELLS = 1.6;

/**
 * The red margin of a Vietnamese notebook: a strip of the same paper with only
 * the horizontal rules, so it hides the vertical grid line it is centred on, and
 * two thin soft red lines with clear paper on both sides. Same tile height as
 * gridPaper, so map it with the wall's vertical repeat/offset.
 */
export function marginStrip() {
  return gridPaper({
    seed: 9,
    cols: MARGIN_CELLS,
    vertical: false,
    draw: (ctx, w, h) => {
      ctx.filter = "blur(0.9px)";
      for (const x of [w * 0.32, w * 0.68]) {
        for (let y = 0; y < h; y += 32) {
          const a = 0.8 + 0.12 * Math.sin(2 * Math.PI * (2 * y / h) + x) + 0.08 * Math.sin(2 * Math.PI * (5 * y / h));
          ctx.fillStyle = `rgba(226,74,64,${a * 0.38})`;
          ctx.fillRect(x - 2.5, y, 9, 32);
          ctx.fillStyle = `rgba(226,74,64,${Math.min(1, a * 1.1)})`;
          ctx.fillRect(x, y, 4, 32);
        }
      }
      ctx.filter = "none";
    },
  });
}

/** Handwriting straight on the paper (transparent background). Returns { texture, ratio }. */
export function handwriting(text, { px = 96, color = PALETTE.ink } = {}) {
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = `${px}px ${HAND}`;
  const lines = wrapLines(text);
  // measured before the font may have loaded: leave room for the real glyphs
  const w = Math.ceil(Math.max(...lines.map((l) => meas.measureText(l).width)) * 1.2 + px * 0.4);
  const h = Math.ceil(lines.length * px * 1.15 + px * 0.3);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const texture = toTexture(c);
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${px}px ${HAND}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    lines.forEach((l, i) => ctx.fillText(l, px * 0.2, px * 0.1 + i * px * 1.15));
  };
  draw();
  whenFont(draw, texture);
  return { texture, ratio: w / h, em: h / (px * 1.15) };
}

/**
 * A square sticky note with a bubble-letter title (each letter its own pastel
 * colour, thick dark outline) and little doodle rays, like Mr. Panda's "ABOUT ME".
 */
export function stickyNote(title, color) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const texture = toTexture(c);
  const letterColors = ["#F28B82", "#FBBC04", "#81C995", "#78D9EC", "#AECBFA", "#D7AEFB", "#FDCFE8"];
  const draw = () => {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = color;
    ctx.fillRect(10, 10, S - 20, S - 20);
    grain(ctx, S, S, 2600, title.length);
    // peeled corner shadow
    const g = ctx.createLinearGradient(S - 120, S - 120, S - 10, S - 10);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(10, 10, S - 20, S - 20);
    // title, wrapped to two lines when long
    const words = title.split(" ");
    const lines = words.length > 1 && title.length > 7 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [title];
    const size = Math.min(150, (S * 0.78) / Math.max(...lines.map((l) => l.length)) * 1.7);
    ctx.font = `${size}px ${HAND}`;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    let k = 0;
    lines.forEach((line, li) => {
      const y = S / 2 + (li - (lines.length - 1) / 2) * size * 0.95;
      const total = ctx.measureText(line).width;
      let x = (S - total) / 2;
      for (const ch of line) {
        const w = ctx.measureText(ch).width;
        ctx.save();
        ctx.translate(x + w / 2, y + Math.sin(k * 1.7) * size * 0.06);
        ctx.rotate(Math.sin(k * 2.3) * 0.12);
        ctx.lineWidth = size * 0.1;
        ctx.strokeStyle = "#3A3A3A";
        ctx.strokeText(ch, -w / 2, 0);
        ctx.fillStyle = letterColors[k % letterColors.length];
        ctx.fillText(ch, -w / 2, 0);
        ctx.restore();
        x += w;
        k++;
      }
    });
    // doodle rays
    ctx.strokeStyle = "#3A3A3A";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const r0 = S * 0.36, r1 = S * 0.44;
      ctx.beginPath();
      ctx.moveTo(S / 2 + Math.cos(a) * r0, S / 2 + Math.sin(a) * r0 * 0.85);
      ctx.lineTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1 * 0.85);
      ctx.stroke();
    }
  };
  draw();
  whenFont(draw, texture);
  return { texture, ratio: 1 };
}

/** White dashed centre line for the street scene's road strip. */
export function roadDashes() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#FBF8F0";
  ctx.beginPath();
  ctx.roundRect(8, 6, 150, 20, 8);
  ctx.fill();
  const t = toTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/**
 * Soft contact shadow where the ground meets the wall: darkest at the ground,
 * easing out upwards, and fading out over `endFade` units at both ends so the
 * strip never shows a hard edge. `width` is the strip length in world units.
 */
export function contactShadow(width, endFade = 0.9, strength = 0.26) {
  const W = 512, H = 96;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(W, H);
  const fadePx = Math.min(W / 2, (endFade / width) * W);
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < H; y++) {
    const v = 1 - y / (H - 1); // 1 at the top of the strip, 0 at the ground
    const vertical = Math.pow(1 - v, 2.2); // eases out quickly upwards
    for (let x = 0; x < W; x++) {
      const e = smooth(Math.min(1, Math.min(x, W - 1 - x) / fadePx));
      const i = (y * W + x) * 4;
      img.data[i] = 58; img.data[i + 1] = 46; img.data[i + 2] = 34;
      img.data[i + 3] = Math.round(255 * strength * vertical * e);
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c);
}

/** Blurred silhouette of an image/canvas texture for soft drop shadows. */
export function shadowFrom(texture, blur = 18) {
  const img = texture.image;
  const src = img && (img.width || img.naturalWidth) ? img : null;
  const w = 256;
  const h = src ? Math.max(8, Math.round((w * (src.height || src.naturalHeight)) / (src.width || src.naturalWidth))) : 256;
  const pad = blur * 2;
  const c = document.createElement("canvas");
  c.width = w + pad * 2;
  c.height = h + pad * 2;
  const ctx = c.getContext("2d");
  const t = toTexture(c);
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    if (!src) return;
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(src, pad, pad, w, h);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#3A2E22";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "source-over";
  };
  draw();
  fontReady.then(() => { draw(); t.needsUpdate = true; }); // placeholders redraw after the font loads
  return { texture: t, padX: pad / w, padY: pad / h };
}
