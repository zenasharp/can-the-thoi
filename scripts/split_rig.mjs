// Cut a finished drawing into rig parts along hand-placed polygons, so an AI
// drawing can move like the hand-coded rigs (draw_rigs.mjs): the Elder Dragon's
// wings flap, Moly waves. It reads the processed card (public/art/<src>.webp, so
// every part keeps exactly the same colours and paper texture), writes each part
// to raw_art/<group>/<rig>_<part>.png and adds the rig to src/content/rigs.json
// (canvas = the webp's pixels). Then run prep_art.mjs on the parts (overrides:
// flatten and paper off, they already have both).
//
// A part keeps a pixel when `keep(x, y)` says so. Parts may overlap: a part drawn
// behind keeps a bit of its neighbour around the joint, a part drawn in front
// lets the one behind keep a bit under it, so turning a joint never opens a gap.
//
//   node scripts/split_rig.mjs [rig ...]
import fs from "fs";
import sharp from "sharp";
import { wobbleDefs } from "./wobble.mjs";

// --- touch-ups painted on a drawing before it is cut (def.paint) ---------------------

/**
 * Paint out tears drawn on a face: inside each box, the tear's fill (pixels
 * close to `tear`) and the ink ring around it become `skin`, except ink that
 * borders empty paper (the face's own outline) or sits above `keepAbove` (the
 * eye's lower lid the tear hangs from).
 */
function paintOutTears(px, W, H, boxes, tear, skin) {
  const at = (x, y) => (y * W + x) * 4;
  const near = (i, c, d) => Math.abs(px[i] - c[0]) + Math.abs(px[i + 1] - c[1]) + Math.abs(px[i + 2] - c[2]) < d;
  for (const { x0, y0, x1, y1, keepAbove } of boxes) {
    const isTear = new Uint8Array(W * H);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (px[at(x, y) + 3] && near(at(x, y), tear, 120)) isTear[y * W + x] = 1;
    const within = (x, y, r, test) => {
      for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && dx * dx + dy * dy <= r * r && test(xx, yy)) return true;
      }
      return false;
    };
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = at(x, y);
      if (!px[i + 3]) continue;
      // the ring: ink and the soft half-ink pixels around it (anything not skin)
      const ring = !near(i, skin, 45);
      const paint = isTear[y * W + x] || (ring && y > keepAbove && within(x, y, 17, (a, b) => isTear[b * W + a]) && !within(x, y, 9, (a, b) => !px[at(a, b) + 3]));
      if (paint) { px[i] = skin[0]; px[i + 1] = skin[1]; px[i + 2] = skin[2]; }
    }
  }
}

/** Composite an SVG (drawn on the image's own canvas, wobbled like the doodles) over it. */
async function overlaySvg(px, W, H, body, seed = 9) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${wobbleDefs(W, H, seed)}<g filter="url(#wob)" stroke="#151515" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  const { data } = await sharp(Buffer.from(px), { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: Buffer.from(svg) }]).raw().toBuffer({ resolveWithObject: true });
  return data;
}

const inPoly = (poly, x, y) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const near = ([px, py], r) => (x, y) => (x - px) ** 2 + (y - py) ** 2 < r * r;

// y of a polyline [[x, y], ...] at x (linear between its points)
const lineY = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

const RIGS = {
  // "This is fine" (AI drawing, made scribblier with prep wobble): the flames
  // flicker behind the dog, the dog sips calmly, the boat rocks, the bubble pops.
  fine: (() => {
    const RIM = [[0, 535], [150, 580], [300, 605], [500, 622], [700, 615], [850, 595], [1036, 545]];
    const BUBBLE = [[548, 0], [1036, 0], [1036, 218], [690, 218], [612, 268], [604, 218], [548, 205]];
    const DOG = [[305, 135], [470, 125], [565, 225], [645, 268], [700, 330], [688, 385], [648, 412], [650, 535], [605, 565], [632, 626], [298, 626], [306, 520], [316, 420], [296, 318]];
    const above = (x, y) => y < lineY(RIM, x);
    const dog = (x, y) => inPoly(DOG, x, y) && y < lineY(RIM, x) + 12;
    const bubble = (x, y) => inPoly(BUBBLE, x, y);
    const flame = (x, y) => above(x, y) && !dog(x, y) && !bubble(x, y);
    return {
      src: "crypto/this_is_fine", group: "crypto", anchor: [520, 824],
      parts: {
        flame_left: { pivot: [200, 570], keep: (x, y) => flame(x, y) && x < 470 },
        flame_right: { pivot: [830, 580], keep: (x, y) => flame(x, y) && x >= 470 },
        dog: { pivot: [470, 622], keep: dog },
        boat: { pivot: [520, 824], keep: (x, y) => !above(x, y) || (y > lineY(RIM, x) - 16 && !dog(x, y) && !bubble(x, y) && x > 4 && x < 1032 && y > 520) },
        bubble: { pivot: [612, 262], keep: bubble },
      },
    };
  })(),

  // The sad frog in his life ring (redrawn with no tears and no phone): the
  // head sobs (nods) on its own above the body, the two overlapping round the jaw.
  pepe: (() => {
    const HEAD = [[150, 0], [870, 0], [870, 470], [150, 470]];
    return {
      src: "crypto/sad_pepe", group: "crypto", anchor: [520, 859],
      parts: {
        body: { pivot: [520, 859], keep: (x, y) => !inPoly(HEAD, x, y) || y > 440 },
        head: { pivot: [480, 470], keep: (x, y) => inPoly(HEAD, x, y) },
      },
    };
  })(),

  // Moly sitting in the front row (AI drawing): the raised arm waves at the
  // shoulder. It is cut along the drawing's own outlines (head, scarf) and drawn
  // BEHIND the body, so its root stays tucked under the scarf when it turns.
  moly: (() => {
    const ARM = [[700, 100], [983, 100], [983, 430], [880, 430], [790, 540], [700, 625], [664, 620], [646, 588], [624, 542], [613, 502], [611, 478], [624, 452], [652, 413], [670, 390], [690, 383], [700, 330]];
    return {
      src: "games/moly_sit", group: "games", anchor: [490, 1032],
      parts: {
        arm_wave: { pivot: [636, 540], keep: (x, y) => inPoly(ARM, x, y) },
        body: { pivot: [490, 1032], keep: (x, y) => !inPoly(ARM, x, y) },
      },
    };
  })(),

  // The Elder Dragon (faces left): the far wing behind the body, the near wing in front.
  elder: (() => {
    const FAR = [[0, 0], [520, 0], [520, 120], [470, 250], [455, 300], [445, 345], [400, 352], [300, 342], [250, 330], [0, 330]];
    const NEAR = [[520, 0], [1036, 0], [1036, 425], [860, 425], [720, 365], [600, 392], [560, 428], [500, 425], [462, 388], [445, 345], [455, 300], [470, 250], [520, 120]];
    const farRoot = [390, 335], nearRoot = [500, 382];
    const underFar = near(farRoot, 62), underNear = near(nearRoot, 78);
    return {
      src: "games/elder_dragon", group: "games", anchor: [518, 349],
      parts: {
        wing_far: { pivot: farRoot, keep: (x, y) => inPoly(FAR, x, y) || underFar(x, y) },
        body: { pivot: [518, 349], keep: (x, y) => !inPoly(FAR, x, y) && (!inPoly(NEAR, x, y) || underNear(x, y)) },
        wing_near: { pivot: nearRoot, keep: (x, y) => inPoly(NEAR, x, y) },
      },
    };
  })(),
};

const only = process.argv.slice(2);
const outFile = "src/content/rigs.json";
const out = JSON.parse(fs.readFileSync(outFile, "utf8"));
for (const [rig, def] of Object.entries(RIGS)) {
  if (only.length && !only.includes(rig)) continue;
  const src = await sharp(`public/art/${def.src}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = src.info.width, H = src.info.height;
  const data = def.paint ? await def.paint(Buffer.from(src.data), W, H) : src.data;
  if (def.paint) await sharp(Buffer.from(data), { raw: { width: W, height: H, channels: 4 } }).png().toFile(`raw_art/_screens/painted_${rig}.png`);
  const entry = { group: def.group, src: def.src, canvas: { w: W, h: H }, anchor: def.anchor, order: Object.keys(def.parts), pivots: {}, parts: {}, ...(def.seat ? { seat: def.seat } : {}) };
  fs.mkdirSync(`raw_art/${def.group}`, { recursive: true });
  for (const [name, part] of Object.entries(def.parts)) {
    const px = Buffer.from(data);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!part.keep(x, y)) px[(y * W + x) * 4 + 3] = 0;
    const { data: png, info: t } = await sharp(px, { raw: { width: W, height: H, channels: 4 } })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).png().toBuffer({ resolveWithObject: true });
    fs.writeFileSync(`raw_art/${def.group}/${rig}_${name}.png`, png);
    entry.parts[name] = { x: -t.trimOffsetLeft, y: -t.trimOffsetTop, w: t.width, h: t.height };
    entry.pivots[name] = part.pivot;
  }
  out[rig] = entry;
  console.log("rig", rig, Object.keys(def.parts).join(", "));
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
