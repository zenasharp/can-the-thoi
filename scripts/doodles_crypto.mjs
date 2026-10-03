// Hand-coded SVG doodles for the crypto sea (the last world), used by
// draw_doodles.mjs: the sea itself, the hero's surfboard, and the little parts
// the set pieces move (candles, coins, feathers, the tangle of thoughts...).
import { INK, limb } from "./wobble.mjs";

// --- the sea: tiles of scribbled waves --------------------------------------------
// One tile holds two waves of different sizes, drawn like a quick doodle: the
// crest is a shaky hand line (sampled finely, jittered by a slow random wander)
// traced twice, a bold pass and a thinner offset pass, with a little hooked
// curl under each lip, a lighter band of water under the crest and a few
// pencil hatch strokes. Every tile starts and ends flat in a trough at the same
// height, and the jitter fades to nothing at both ends (no wobble filter), so
// tiles abut edge to edge with no seam. Three variants per colour keep a row
// from repeating.
const WW = 900, WH = 300, TR = 214; // tile size, trough height
const rngW = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const LAYOUTS = [[480, 420], [400, 500], [450, 450]];
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};
/** Sample a chain of cubic segments ([p0, p1, p2, p3], ...) into points. */
const sampleChain = (segs, per = 16) => segs.flatMap((sg, i) => Array.from({ length: per + (i === segs.length - 1 ? 1 : 0) }, (_, k) => bez(...sg, k / per)));
/** Shaky hand: a slow random wander added to y (and a little x), fading out at the tile ends. */
const shake = (pts, r, amp) => {
  let wy = 0, wx = 0;
  return pts.map(([x, y]) => {
    wy = wy * 0.82 + (r() - 0.5) * amp;
    wx = wx * 0.8 + (r() - 0.5) * amp * 0.6;
    const fade = Math.min(1, x / 60, (WW - x) / 60);
    return [x + wx * Math.max(0, fade), y + wy * Math.max(0, fade)];
  });
};
const polyline = (pts) => "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");

const waveTile = (fill, band, light, variant, scale = 1) => {
  const r = rngW(1234 + variant * 977);
  const segs = [];
  let curls = "", hatch = "";
  let xs = 0, prev = [0, TR];
  for (const w of LAYOUTS[variant]) {
    const h = (118 + r() * 60) * scale;
    const X = (u) => xs + u * w, Y = (v) => TR - v * h;
    // up the face to the top, the lip thrown forward and down, then into the trough
    const top = [X(0.55), Y(1)], lip = [X(0.88), Y(0.56)], end = [xs + w, TR];
    segs.push([prev, [X(0.22), TR], [X(0.36), Y(1)], top]);
    segs.push([top, [X(0.72), Y(1)], [X(0.86), Y(0.86)], lip]);
    segs.push([lip, [X(0.9), Y(0.34)], [X(0.94), TR], end]);
    prev = end;
    // the curl rolling in under the lip, a lighter water inside, scribbled twice
    const curl = sampleChain([
      [lip, [X(0.86), Y(0.28)], [X(0.66), Y(0.3)], [X(0.66), Y(0.54)]],
      [[X(0.66), Y(0.54)], [X(0.66), Y(0.72)], [X(0.8), Y(0.74)], [X(0.79), Y(0.58)]],
    ], 10);
    curls += `<path d="${polyline(curl)} Z" fill="${band}" stroke="none"/>`;
    curls += `<path d="${polyline(shake(curl, r, 5))}" fill="none" stroke-width="15"/>`;
    curls += `<path d="${polyline(shake(curl, r, 7))}" fill="none" stroke-width="6"/>`;
    // pencil hatching on the face of the wave
    for (let k = 0; k < 4; k++) {
      const hx = X(0.3 + k * 0.08) + (r() - 0.5) * 10, hy = Y(0.55 - k * 0.04) + 20 + (r() - 0.5) * 10;
      hatch += `M${hx.toFixed(0)} ${hy.toFixed(0)} l${(16 + r() * 8).toFixed(0)} ${(-24 - r() * 10).toFixed(0)} `;
    }
    xs += w;
  }
  const crest = sampleChain(segs, 18);
  const surface = polyline(crest);
  const clip = `waveclip${variant}${fill.slice(1)}`;
  let ripples = "";
  for (let k = 0; k < 3; k++) {
    const x = 60 + r() * (WW - 180), y = TR + 30 + r() * (WH - TR - 50);
    ripples += `M${x.toFixed(0)} ${y.toFixed(0)} q${(24 + r() * 10).toFixed(0)} ${(-10 - r() * 4).toFixed(0)} ${(50 + r() * 14).toFixed(0)} 0 `;
  }
  return [WW, WH, `
    <defs><clipPath id="${clip}"><path d="${surface} L${WW} ${WH} L0 ${WH} Z"/></clipPath></defs>
    <path d="${surface} L${WW} ${WH} L0 ${WH} Z" fill="${fill}" stroke="none"/>
    <g clip-path="url(#${clip})"><path d="${surface}" transform="translate(0 30)" fill="none" stroke="${band}" stroke-width="44"/></g>
    <path d="${hatch}" fill="none" stroke="${light}" stroke-width="8"/>
    <path d="${ripples}" fill="none" stroke="${light}" stroke-width="8"/>
    <path d="${polyline(shake(crest, r, 5))}" fill="none" stroke-width="20"/>
    <path d="${polyline(shake(crest, r, 8).map(([x, y]) => [x, y - 9 * Math.min(1, x / 60, (WW - x) / 60)]))}" fill="none" stroke-width="6"/>
    ${curls}`, { transparent: true, wobble: false }];
};
const SEA = {
  back: ["#8EC3E6", "#B3D8F0", "#E6F4FC", 0.8],
  mid: ["#5E9FD0", "#80B6E0", "#CFE8F8", 0.9],
  front: ["#3F7FB8", "#5E97CB", "#BFE0F5", 1],
  dark: ["#2A4F78", "#3D6690", "#7FA6CC", 1],
};
const seaTiles = Object.fromEntries(Object.entries(SEA).flatMap(([k, [fill, band, light, sc]]) =>
  [0, 1, 2].map((v) => [`crypto/waves_${k}_${v + 1}`, waveTile(fill, band, light, v, sc)])));

// --- the surfboard I ride, side view, nose to the right --------------------------
const surfboard = [1240, 260, `
  <path d="M120 150 L80 236 L190 168 Z" fill="#2E8C8C"/>
  <path d="M40 120 Q70 74 320 66 L1000 66 Q1170 72 1210 108 Q1170 140 1000 146 L320 146 Q70 140 40 120 Z" fill="#FFF6DF"/>
  <path d="M60 104 Q300 92 1196 98 L1196 116 Q300 124 62 128 Z" fill="#F5932A" stroke-width="9"/>
  <rect x="560" y="74" width="190" height="62" rx="12" fill="#7C5CFA" stroke-width="9"/>
  <text x="655" y="118" font-size="42" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#FFFFFF" stroke="none">WAGMI</text>`];

// --- candles, hanging on the puppeteer's strings ----------------------------------
const candle = (body, dark) => [140, 470, `
  <path d="M70 24 L70 110 M70 380 L70 446" fill="none" stroke="${INK}" stroke-width="16"/>
  <rect x="26" y="104" width="88" height="282" rx="10" fill="${body}"/>
  <path d="M46 130 L46 360" fill="none" stroke="${dark}" stroke-width="10"/>`];

// --- a gold coin -------------------------------------------------------------------
const coin = [220, 220, `
  <circle cx="110" cy="110" r="90" fill="#F2C230"/>
  <circle cx="110" cy="110" r="64" fill="#F8D96A" stroke="#C99A14" stroke-width="10"/>
  <text x="110" y="142" font-size="96" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#C99A14" stroke="none">₿</text>`];

// --- a shark fin cutting through the water --------------------------------------------
const sharkFin = [360, 260, `
  <path d="M60 220 Q150 180 190 30 Q230 140 300 220 Z" fill="#7D8C99"/>
  <path d="M170 90 Q180 160 150 214" fill="none" stroke="#9FB0BE" stroke-width="10"/>
  <path d="M10 226 Q60 204 110 226 Q160 248 210 226 Q260 204 310 226 Q340 240 350 232" fill="none" stroke="#FFFFFF" stroke-width="14"/>`];

// --- the liquidation whirlpool, seen from above (laid flat on the sea) ----------------
const spiral = (turns, r0, r1, a0) => {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, a = a0 + t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t;
    pts.push(`${(400 + Math.cos(a) * r).toFixed(0)} ${(400 + Math.sin(a) * r).toFixed(0)}`);
  }
  return "M" + pts.join(" L");
};
const whirlpool = [800, 800, `
  <circle cx="400" cy="400" r="370" fill="#2E5E8E"/>
  <circle cx="400" cy="400" r="250" fill="#24496F" stroke="none"/>
  <circle cx="400" cy="400" r="120" fill="#16263A" stroke="none"/>
  <circle cx="400" cy="400" r="46" fill="#05080D" stroke="none"/>
  <path d="${spiral(1.6, 60, 360, 0)}" fill="none" stroke="#A9D4F2" stroke-width="16"/>
  <path d="${spiral(1.6, 60, 360, Math.PI * 0.66)}" fill="none" stroke="#7FB4DB" stroke-width="14"/>
  <path d="${spiral(1.6, 60, 360, Math.PI * 1.33)}" fill="none" stroke="#A9D4F2" stroke-width="12"/>`];

// --- a storm cloud, raining --------------------------------------------------------------
const bumps = (cx, cy, rx, ry, n, k = 1.22) => {
  const p = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry].map((v) => v.toFixed(0)).join(" ");
  let d = "M" + p(0);
  for (let i = 0; i < n; i++) {
    const am = ((i + 0.5) / n) * Math.PI * 2;
    d += ` Q${(cx + Math.cos(am) * rx * k).toFixed(0)} ${(cy + Math.sin(am) * ry * k).toFixed(0)} ${p(((i + 1) / n) * Math.PI * 2)}`;
  }
  return d + " Z";
};
const stormCloud = [900, 700, `
  <path d="M220 360 L170 520 M330 380 L290 560 M450 370 L410 600 M570 380 L530 540 M690 360 L650 520" fill="none" stroke="#6E8AA6" stroke-width="14"/>
  <path d="M260 470 L250 500 M520 520 L510 552 M380 600 L372 630" fill="none" stroke="#E0453A" stroke-width="16"/>
  <path d="${bumps(450, 240, 360, 150, 11)}" fill="#5B6270"/>
  <path d="${bumps(380, 210, 170, 80, 7, 1.18)}" fill="#6E7584" stroke="none"/>
  <path d="M500 330 L470 390 L510 390 L478 460" fill="none" stroke="#F8D705" stroke-width="16"/>`];

// --- a black feather (the wing to come) -------------------------------------------------
const feather = [160, 460, `
  <path d="M80 440 L80 60" fill="none" stroke="#2A2A30" stroke-width="10"/>
  <path d="M80 70 Q150 150 128 300 Q110 380 80 410 Q50 380 34 300 Q14 160 80 70 Z" fill="#26262C"/>
  <path d="M80 140 L118 120 M80 200 L124 186 M80 260 L120 252 M80 160 L44 144 M80 230 L38 220 M80 300 L46 296" fill="none" stroke="#4A4A55" stroke-width="7"/>`];

// --- the tangle of thoughts: one long scribbled line knotted into a ball ------------------
// Four frames of a flip-book: the same knot, each frame scribbled a little
// differently (shifted phases, and its own wobble from the filter), so it seems
// to writhe. No background: just the ink.
const tangleFrame = (k) => {
  const pts = [];
  const ph = k * 0.9;
  for (let i = 0; i <= 560; i++) {
    const t = (i / 560) * Math.PI * 2 * 9;
    const r = 220 * (0.55 + 0.45 * Math.sin(t * 0.37 + 1.3 + ph)) * (0.8 + 0.2 * Math.cos(t * 2.3 + ph * 1.7));
    pts.push(`${(360 + Math.cos(t * 1.07 + ph * 0.3) * r + Math.sin(t * 3.1 + ph) * 26).toFixed(0)} ${(300 + Math.sin(t) * r * 0.78 + Math.cos(t * 2.7 + ph * 1.3) * 22).toFixed(0)}`);
  }
  return [720, 600, `
    <path d="M${pts.join(" L")}" fill="none" stroke="#0E0E12" stroke-width="11"/>
    <path d="M${pts.slice(80 + k * 60, 300 + k * 60).join(" L")}" fill="none" stroke="#6A6A78" stroke-width="5"/>`, { transparent: true, seed: 11 + k * 7 }];
};

// --- buoys with little signs ------------------------------------------------------------------
const T = `font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" stroke="none"`;
const buoy = (lines, size, signFill) => [380, 560, `
  <rect x="180" y="190" width="20" height="200" fill="#5A5A5A"/>
  <rect x="30" y="40" width="320" height="170" rx="12" fill="${signFill}"/>
  ${lines.map((l, i) => `<text x="190" y="${100 + i * (size + 8)}" font-size="${size}" fill="${INK}" ${T}>${l}</text>`).join("")}
  <path d="M100 380 Q190 330 280 380 L300 470 Q190 520 80 470 Z" fill="#E0453A"/>
  <path d="M90 426 Q190 392 290 426 L294 448 Q190 414 86 448 Z" fill="#FFFFFF" stroke-width="9"/>
  <path d="M40 520 Q90 496 140 520 Q190 544 240 520 Q290 496 340 520" fill="none" stroke="#FFFFFF" stroke-width="12"/>`];

// --- sunbeams breaking through the clouds at the very end ---------------------------------------
const godRays = [1000, 1000, `
  ${[[-0.55, -0.42], [-0.26, -0.15], [0.0, 0.1], [0.26, 0.37], [0.52, 0.62]].map(([a, b], i) => {
    const L = 1100 - (i % 2) * 160; // uneven lengths
    const top = (a) => `${(500 + Math.sin(a) * 300).toFixed(0)} 0`;
    const bot = (a) => `${(500 + Math.sin(a) * L).toFixed(0)} ${(Math.cos(a) * L * 0.9).toFixed(0)}`;
    return `<path d="M${top(a)} L${top(b)} L${bot(b)} L${bot(a)} Z" fill="#FFF3B0" stroke-width="8"/>`;
  }).join("")}`];

// the storm cloud on its own (rain and lightning are animated in code), and its bolt
const stormBody = [900, 460, `
  <path d="${bumps(450, 240, 360, 150, 11)}" fill="#5B6270"/>
  <path d="${bumps(380, 210, 170, 80, 7, 1.18)}" fill="#6E7584" stroke="none"/>
  <path d="M250 330 q30 16 60 0 M520 340 q30 16 60 0" fill="none" stroke="#454B57" stroke-width="10"/>`];
const bolt = [220, 420, `
  <path d="M120 20 L40 220 L104 220 L64 400 L190 160 L120 160 L170 20 Z" fill="#F8D705"/>`];

// --- the Dharma wheel (Bát Chánh Đạo), after the classic emblem -------------------------
// Eight handles with knobbed ends round a double rim, eight spokes each swelling
// into a four-pointed diamond, and a hub with the three-swirl gankyil.
const dharmaWheel = (() => {
  const C = 500, GOLD = "#F6C21A", DARK = "#C9930A", LIGHT = "#FBE38A";
  const rot = (x, y, a) => [C + x * Math.cos(a) - y * Math.sin(a), C + x * Math.sin(a) + y * Math.cos(a)];
  const P = (a) => (x, y) => rot(x, y, a).map((v) => v.toFixed(1)).join(" ");
  const poly = (pts, a) => pts.map(([x, y]) => P(a)(x, y)).join(" L");
  let handles = "", spokes = "";
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 - Math.PI / 2, p = P(a);
    // handle: a bar out of the rim and a rounded knob at its end
    handles += `<path d="M${poly([[372, -17], [436, -13], [436, 13], [372, 17]], a)} Z" fill="${GOLD}"/>`;
    handles += `<path d="M${p(432, -12)} Q${p(436, -36)} ${p(462, -36)} Q${p(498, -32)} ${p(498, 0)} Q${p(498, 32)} ${p(462, 36)} Q${p(436, 36)} ${p(432, 12)} Z" fill="${GOLD}"/>`;
    handles += `<path d="M${p(450, -18)} Q${p(468, 0)} ${p(450, 18)}" fill="none" stroke="${DARK}" stroke-width="7"/>`;
    // spoke: swelling at the hub and the rim, a diamond in the middle
    spokes += `<path d="M${poly([[96, -22], [140, -16], [178, -18], [206, -44], [234, -18], [272, -16], [316, -22], [316, 22], [272, 16], [234, 18], [206, 44], [178, 18], [140, 16], [96, 22]], a)} Z" fill="${GOLD}"/>`;
    spokes += `<path d="M${poly([[184, 0], [206, -22], [228, 0], [206, 22]], a)} Z" fill="${DARK}" stroke-width="5"/>`;
  }
  // the gankyil: three commas swirling round the centre
  let swirl = "";
  for (let k = 0; k < 3; k++) {
    const p = P((k / 3) * Math.PI * 2);
    swirl += `<path d="M${p(0, 0)} Q${p(0, -46)} ${p(30, -40)} Q${p(52, -6)} ${p(22, 12)} Q${p(6, 10)} ${p(0, 0)} Z" fill="${LIGHT}" stroke-width="5"/>`;
  }
  return [1000, 1000, `<g stroke-width="10">
    ${handles}
    <path d="M${C - 392} ${C} a392 392 0 1 0 784 0 a392 392 0 1 0 -784 0 Z M${C - 318} ${C} a318 318 0 1 1 636 0 a318 318 0 1 1 -636 0 Z" fill="${GOLD}" fill-rule="evenodd"/>
    <circle cx="${C}" cy="${C}" r="355" fill="none" stroke="${DARK}" stroke-width="7"/>
    ${spokes}
    <circle cx="${C}" cy="${C}" r="104" fill="${GOLD}"/>
    <circle cx="${C}" cy="${C}" r="72" fill="${DARK}" stroke-width="7"/>
    ${swirl}</g>`, { transparent: true }];
})();

// --- puffs kicked up behind a runner: three scribbled dust clouds (pale, pencil
// outline, a few specks) and three sea-spray versions (white, blue outline)
const puff = (fill, ink, speck, k) => {
  const n = 7 + k;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 1 + 0.22 * Math.sin(i * 2.3 + k);
    return [160 + Math.cos(a) * 110 * r, 120 + Math.sin(a) * 78 * r];
  });
  let d = `M${pts[0].map((v) => v.toFixed(0)).join(" ")}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const am = ((i + 0.5) / n) * Math.PI * 2;
    d += ` Q${(160 + Math.cos(am) * 150).toFixed(0)} ${(120 + Math.sin(am) * 108).toFixed(0)} ${q.map((v) => v.toFixed(0)).join(" ")}`;
  }
  return [320, 240, `
    <path d="${d} Z" fill="${fill}" stroke="${ink}" stroke-width="12"/>
    <path d="M110 ${126 + k * 6} q24 -18 50 0 M170 ${96 - k * 4} q20 -14 42 0" fill="none" stroke="${ink}" stroke-width="7"/>
    <circle cx="${40 + k * 8}" cy="${54 + k * 10}" r="9" fill="${speck}" stroke="${ink}" stroke-width="6"/>
    <circle cx="${282 - k * 6}" cy="${68 + k * 12}" r="7" fill="${speck}" stroke="${ink}" stroke-width="6"/>
    <circle cx="${250 + k * 4}" cy="210" r="6" fill="${speck}" stroke="${ink}" stroke-width="5"/>`];
};

export const cryptoDoodles = {
  "hero/dust_1": puff("#EDE2CA", "#6E5E4C", "#D9CBAE", 0),
  "hero/dust_2": puff("#EDE2CA", "#6E5E4C", "#D9CBAE", 1),
  "hero/dust_3": puff("#EDE2CA", "#6E5E4C", "#D9CBAE", 2),
  "hero/foam_1": puff("#FFFFFF", "#3F7FB8", "#E6F4FC", 0),
  "hero/foam_2": puff("#FFFFFF", "#3F7FB8", "#E6F4FC", 1),
  "hero/foam_3": puff("#FFFFFF", "#3F7FB8", "#E6F4FC", 2),
  "crypto/dharma_wheel": dharmaWheel,
  "crypto/storm_body": stormBody,
  "crypto/bolt": bolt,
  ...seaTiles,
  "vehicles/surfboard": surfboard,
  "crypto/candle_green": candle("#3BB273", "#2A8A57"),
  "crypto/candle_red": candle("#E0453A", "#B8322A"),
  "crypto/coin": coin,
  "crypto/shark_fin": sharkFin,
  "crypto/whirlpool": whirlpool,
  "crypto/storm_cloud": stormCloud,
  "crypto/feather": feather,
  "crypto/thought_tangle_1": tangleFrame(0),
  "crypto/thought_tangle_2": tangleFrame(1),
  "crypto/thought_tangle_3": tangleFrame(2),
  "crypto/thought_tangle_4": tangleFrame(3),
  // the pump.fun pill: just the capsule, green and white, tilted
  "crypto/pill": [420, 520, `
    <g transform="rotate(-32 210 260)">
      <path d="M130 260 L130 150 Q130 70 210 70 Q290 70 290 150 L290 260 Z" fill="#FFFFFF"/>
      <path d="M130 260 L290 260 L290 370 Q290 450 210 450 Q130 450 130 370 Z" fill="#5DD39E"/>
      <path d="M156 150 Q156 104 196 96" fill="none" stroke="#DCDCDC" stroke-width="12"/>
      <path d="M156 290 L156 360" fill="none" stroke="#3FB07E" stroke-width="12"/>
    </g>`],
  "crypto/buoy_nfa": buoy(["NOT", "FINANCIAL", "ADVICE"], 40, "#FFFFFF"),
  "crypto/buoy_wagmi": buoy(["WAGMI?"], 66, "#FFF3A8"),
  "crypto/god_rays": godRays,
};
