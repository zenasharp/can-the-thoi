// Boy phố: Phineas and Ferb on a Honda Dream doing a wheelie, Ferb dragging a
// spear behind, hand-coded as a rig for draw_rigs.mjs (the image service won't
// draw the blade or the boys by name). Parts: the two spoked wheels (they spin),
// the bike, the spear, Ferb and Phineas.
//
// Everything but the spear is designed on the level (ground at y 921, the back
// wheel's contact at x 520), then shifted onto the canvas and tipped back
// WHEELIE degrees about that contact point. The spear is drawn on the canvas
// itself, from Ferb's (tipped) hand down to the road behind.
//
// The bike is traced over a photo of a real Honda Dream
// (raw_art/_refs/street/honda_dream.png, 500 x 305, facing left): its parts are
// written in the photo's pixels and mirrored and scaled into the design by
// `photo()` (PS design units per photo pixel). The boys sit on its seat (`RIDE`
// shifts them there).
import { INK, limb } from "./wobble.mjs";

const WHEELIE = -17;
const OFF = [240, 80]; // design -> canvas, before the tip
const RC = [520 + OFF[0], 921 + OFF[1]]; // the back wheel's contact, on the canvas
const a = (WHEELIE * Math.PI) / 180;
/** a design point on the canvas, tipped back with the bike */
const tip = ([x, y]) => {
  const dx = x + OFF[0] - RC[0], dy = y + OFF[1] - RC[1];
  return [RC[0] + dx * Math.cos(a) - dy * Math.sin(a), RC[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
const tipped = (body) => `<g transform="rotate(${WHEELIE} ${RC[0]} ${RC[1]}) translate(${OFF[0]} ${OFF[1]})">${body}</g>`;

// colours
const MAROON = "#5A1A2B", CHROME = "#D9DCE1", CHROME_DARK = "#A9AEB7", TYRE = "#1E1E1E", CREAM = "#F1ECDD";
const SKIN = "#F6C79F", RED_HAIR = "#E2352B", GREEN_HAIR = "#5DBE3F";
const ORANGE = "#F28C28", YELLOW = "#FFD54A", DENIM = "#2F5FB8", PURPLE = "#6A3FA0";

// the design points the site needs
const PS = 2.2; // design units per photo pixel
const R = [520, 780], F = [520 + 283 * PS, 780], WHEEL = 64 * PS; // the photo's wheels: centres 283 px apart, 64 px tyres
const RIDE = [-65, -40]; // the boys, moved onto the Dream's seat
const FERB_HAND = [575 + RIDE[0], 598 + RIDE[1]], EXHAUST = [1371.4 - 433 * PS, 285 + 223 * PS];

/** photo pixels (the Dream facing left) -> design (facing right); strokes stay as thick as elsewhere */
const photo = (body) => `<g transform="translate(${520 + 387 * PS} ${780 - 225 * PS}) scale(${-PS} ${PS})" stroke-width="${(17 / PS).toFixed(2)}">${body}</g>`;
/** a tube in photo pixels: an ink stroke under a coloured one (ink: the extra width) */
const tube = (d, color, w, ink = 28 / PS) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${(w + ink).toFixed(2)}"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"/>`;

const wheel = ([cx, cy]) => {
  const rim = 54 * PS, hub = 15 * PS;
  // laced spokes: from the hub's edge, out at a slant to the rim, both ways
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const t = (i / 24) * Math.PI * 2, k = i % 2 ? 0.55 : -0.55;
    return `M${(cx + Math.cos(t) * hub * 0.8).toFixed(1)} ${(cy + Math.sin(t) * hub * 0.8).toFixed(1)} L${(cx + Math.cos(t + k) * (rim - 6)).toFixed(1)} ${(cy + Math.sin(t + k) * (rim - 6)).toFixed(1)}`;
  }).join(" ");
  return tipped(`
    <circle cx="${cx}" cy="${cy}" r="${WHEEL}" fill="${TYRE}"/>
    <circle cx="${cx}" cy="${cy}" r="${rim}" fill="${CHROME}" stroke-width="10"/>
    <circle cx="${cx}" cy="${cy}" r="${rim - 10}" fill="#ECEAE4" stroke-width="7"/>
    <path d="${spokes}" fill="none" stroke="#7D828A" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy}" r="${hub}" fill="${CHROME}" stroke-width="10"/>
    <circle cx="${cx}" cy="${cy}" r="${hub * 0.4}" fill="${CHROME_DARK}" stroke-width="7"/>`);
};

// the Honda Dream, in the photo's pixels (facing left; photo() turns it round)
export const dream = `
  <!-- the rear body and rear mudguard, maroon, with the gold stripe and the side decal -->
  <path d="M272 127 L452 108 Q461 110 459 124 Q459 140 452 149 Q469 166 481 191 L471 197 Q455 179 441 169 Q413 153 383 153 Q353 156 341 173 L335 199 L300 203 L249 201 L246 179 Q262 172 268 158 Q266 140 272 127 Z" fill="${MAROON}"/>
  <path d="M292 142 L438 125 L438 131 L294 148 Z" fill="#C9A24A" stroke-width="2.5"/>
  <path d="M283 196 L293 182 L331 176 L326 191 Z" fill="#D8343A" stroke-width="3"/>
  <path d="M297 187 L326 182" fill="none" stroke="#F2F2F2" stroke-width="2.5"/>
  <path d="M441 112 L459 110 L458 128 L441 131 Z" fill="#F5A23A" stroke-width="3"/>
  <!-- the long black seat -->
  <path d="M262 118 Q255 104 268 99 Q296 92 340 92 L424 89 Q438 90 437 102 L435 118 Z" fill="#2B2B2E"/>
  <path d="M300 112 Q360 104 430 104" fill="none" stroke="#55555C" stroke-width="2.5"/>
  <!-- the chrome grab rail along the back of the seat -->
  ${tube("M372 133 L436 113 Q446 107 444 95", CHROME, 3.5, 8)}
  <!-- the rear shock -->
  ${tube("M372 136 L384 218", CHROME, 6, 9)}
  <path d="M370 146 l9 -2 M371 153 l9 -2 M372 160 l9 -2 M373 167 l9 -2" fill="none" stroke="#7D828A" stroke-width="2"/>
  <!-- the chrome muffler under the swingarm (this side), its slotted heat shield, the tail pipe -->
  <path d="M258 238 Q300 236 335 229 L414 212 Q433 211 433 223 Q432 235 414 237 L335 246 Q298 251 258 249 Z" fill="${CHROME}"/>
  <path d="M300 233 L372 222 L374 236 L302 244 Z" fill="${CHROME_DARK}" stroke-width="2.5"/>
  <path d="M318 231 l2 10 M332 229 l2 10 M346 227 l2 10 M360 225 l2 10" fill="none" stroke="#7D828A" stroke-width="2"/>
  <circle cx="431" cy="223" r="4.5" fill="#333333" stroke-width="2.5"/>
  <!-- the passenger's footpeg -->
  ${tube("M350 214 L370 208", "#2A2A2A", 5, 6)}
  <!-- the engine: crankcase, finned cylinder in front, the round side cover; the rider's footpeg -->
  <path d="M231 188 L262 184 Q298 186 303 204 L301 238 Q281 247 250 246 L231 241 Z" fill="#C3C6CC"/>
  <rect x="229" y="192" width="14" height="44" rx="3" fill="#8E929A"/>
  <path d="M231 200 L241 200 M231 208 L241 208 M231 216 L241 216 M231 224 L241 224" fill="none" stroke="#5E6168" stroke-width="2"/>
  <circle cx="264" cy="217" r="16" fill="#DADDE2"/>
  <circle cx="264" cy="217" r="6" fill="#A9AEB7" stroke-width="2.5"/>
  ${tube("M228 241 L255 241", "#2A2A2A", 5, 6)}
  <!-- the front fork below the mudguard, an orange reflector -->
  ${tube("M150 150 L105 224", CHROME, 7, 9)}
  <rect x="144" y="164" width="6" height="12" rx="2" fill="#F5932A" stroke-width="2"/>
  <!-- the maroon front mudguard, high over the wheel -->
  <path d="M66 160 Q78 143 118 139 Q148 139 157 150 L151 158 Q122 150 94 155 Q79 158 70 164 Z" fill="${MAROON}"/>
  <!-- the cream leg shield: the Dream's big white front, the round emblem -->
  <path d="M165 84 L201 84 Q203 118 206 143 Q215 167 239 177 L241 187 L233 240 Q206 253 182 253 Q170 216 162 186 Q151 152 156 118 Q160 96 165 84 Z" fill="${CREAM}"/>
  <path d="M181 96 Q176 150 190 205" fill="none" stroke="#D8D0B8" stroke-width="3"/>
  <ellipse cx="200" cy="183" rx="8" ry="10" fill="#B89A5A" stroke-width="2.5"/>
  <!-- the chrome front rack, on the mudguard -->
  ${tube("M96 127 L141 127 L151 113 L127 113 Z", CHROME, 2.5, 6)}
  ${tube("M134 113 L127 127 M142 113 L135 127 M110 127 L112 140", CHROME, 2.5, 6)}
  <!-- the dark underbone tube, from the shield back to the rear body -->
  ${tube("M204 141 Q212 167 238 172 L272 168", "#3B3B42", 7, 9)}
  <!-- the maroon head: the square headlight in front, the orange indicator; the handlebar -->
  <path d="M158 45 L176 40 Q201 41 209 50 L211 70 Q202 83 191 89 L177 91 Q165 85 161 73 Z" fill="${MAROON}"/>
  <rect x="158" y="45" width="16" height="24" rx="3" fill="#F3F1E6" stroke-width="3"/>
  <path d="M181 56 L201 55 L203 66 L183 68 Z" fill="#F5A23A" stroke-width="2.5"/>
  ${tube("M205 61 L238 60", "#232326", 6, 8)}`;
const bike = tipped(photo(dream));

const ferb = tipped(`<g transform="translate(${RIDE[0]} ${RIDE[1]})">
  <!-- purple trousers, white sneakers on the back footpeg -->
  ${limb("M620 540 L720 526", PURPLE, 44)}
  ${limb("M720 526 L708 628", PURPLE, 38)}
  <path d="M676 626 L734 624 Q752 636 746 654 L672 654 Z" fill="#FFFFFF"/>
  <!-- the open white shirt, a black vest showing in front -->
  <path d="M590 542 L585 412 Q590 386 620 382 L662 384 Q692 392 694 420 L697 542 Z" fill="#FFFFFF"/>
  <path d="M654 394 L692 402 L695 542 L662 542 Z" fill="#222222"/>
  <path d="M640 392 L652 540" fill="none" stroke-width="8"/>
  <!-- popped collar, neck -->
  <rect x="612" y="330" width="34" height="62" fill="${SKIN}"/>
  <path d="M604 392 L592 344 L628 378 Z" fill="#FFFFFF"/>
  <path d="M634 380 L664 348 L664 394 Z" fill="#FFFFFF"/>
  <!-- the tall head: sleepy eye, little nose, flat mouth, ear -->
  <rect x="588" y="150" width="96" height="190" rx="14" fill="${SKIN}"/>
  <path d="M612 250 Q596 262 612 276" fill="none" stroke-width="9"/>
  <ellipse cx="656" cy="232" rx="25" ry="23" fill="#FFFFFF" stroke-width="10"/>
  <circle cx="666" cy="240" r="9" fill="${INK}" stroke="none"/>
  <path d="M630 230 Q656 204 682 230 Z" fill="${SKIN}" stroke="none"/>
  <path d="M628 231 L684 231" fill="none" stroke-width="11"/>
  <path d="M684 246 Q704 262 684 278" fill="${SKIN}"/>
  <path d="M652 304 L680 304" fill="none" stroke-width="9"/>
  <!-- undercut: shaved sides, green quiff slicked up and forward -->
  <rect x="590" y="152" width="92" height="30" rx="8" fill="#B9C9A8" stroke="none"/>
  <path d="M584 172 Q584 96 638 70 Q700 46 734 92 Q700 86 688 108 L686 164 Q636 140 584 172 Z" fill="${GREEN_HAIR}"/>
  <path d="M610 128 Q640 88 700 76 M630 146 Q656 112 704 98" fill="none" stroke="#3E8E2A" stroke-width="7"/>
  <!-- his arm down at his side, hand round the spear; rolled-up sleeve -->
  ${limb("M640 420 L606 500 L578 590", SKIN, 26)}
  ${limb("M640 418 L626 456", "#FFFFFF", 40)}
  <circle cx="575" cy="598" r="18" fill="${SKIN}"/></g>`);

const phineas = tipped(`<g transform="translate(${RIDE[0]} ${RIDE[1]})">
  <defs><clipPath id="tee"><path d="M758 542 L758 420 Q768 394 800 392 L842 395 Q862 401 864 430 L864 542 Z"/></clipPath></defs>
  <!-- ripped jeans, white sneakers on the floorboard -->
  ${limb("M792 540 L902 520", DENIM, 46)}
  ${limb("M902 520 L958 636", DENIM, 40)}
  <path d="M856 506 L884 504 M858 516 L882 514 M914 566 L934 558 M918 578 L938 570" fill="none" stroke="#FFFFFF" stroke-width="6"/>
  <path d="M934 634 L992 636 Q1010 648 1002 666 L930 666 Z" fill="#FFFFFF"/>
  <!-- tight orange tee with wide yellow stripes -->
  <path d="M758 542 L758 420 Q768 394 800 392 L842 395 Q862 401 864 430 L864 542 Z" fill="${ORANGE}"/>
  <g clip-path="url(#tee)" stroke="none" fill="${YELLOW}">
    <rect x="740" y="420" width="140" height="20"/><rect x="740" y="462" width="140" height="20"/><rect x="740" y="504" width="140" height="20"/>
  </g>
  <path d="M758 542 L758 420 Q768 394 800 392 L842 395 Q862 401 864 430 L864 542 Z" fill="none"/>
  <!-- neck and the gold chain -->
  <rect x="796" y="372" width="30" height="26" fill="${SKIN}"/>
  <path d="M800 400 Q826 438 852 402" fill="none" stroke="#F5C518" stroke-width="7"/>
  <!-- the triangle head: flat back, the point in front is his nose -->
  <path d="M772 238 L772 396 L1002 382 Z" fill="${SKIN}"/>
  <circle cx="788" cy="350" r="16" fill="${SKIN}"/>
  <!-- the cheeky grin, the big round eye up on the brow -->
  <path d="M884 352 Q930 364 968 370 Q950 388 916 384 Q890 376 884 352 Z" fill="#6A1E1E" stroke-width="9"/>
  <path d="M914 380 Q930 371 948 378 Q932 388 914 380 Z" fill="#E86A7A" stroke="none"/>
  <circle cx="848" cy="290" r="31" fill="#FFFFFF"/>
  <circle cx="857" cy="293" r="11" fill="${INK}" stroke="none"/>
  <!-- red mohawk, gelled up in tall spikes along the top of his head -->
  <path d="M768 262 L752 190 L778 222 L776 146 L800 206 L810 128 L824 206 L840 154 L838 236 L826 268 Q796 268 768 262 Z" fill="${RED_HAIR}"/>
  <path d="M786 238 L790 188 M810 236 L812 176" fill="none" stroke="#B5251C" stroke-width="7"/>
  <!-- his arm reaching for the grip, the rolled-up sleeve -->
  ${limb("M836 420 L884 462 L928 458", SKIN, 26)}
  ${(() => { // the sleeve hugging his upper arm, a yellow rolled cuff
    const d = [0.752, 0.658], n = [-0.658, 0.752], q = (p, k, w) => [p[0] + d[0] * k + n[0] * w, p[1] + d[1] * k + n[1] * w].map((v) => v.toFixed(1)).join(" ");
    const s0 = [830, 416];
    return `<path d="M${q(s0, 0, 24)} L${q(s0, 38, 22)} L${q(s0, 38, -22)} L${q(s0, 0, -24)} Z" fill="${ORANGE}"/><path d="M${q(s0, 38, 22)} L${q(s0, 50, 21)} L${q(s0, 50, -21)} L${q(s0, 38, -22)} Z" fill="${YELLOW}"/>`;
  })()}
  <circle cx="930" cy="458" r="17" fill="${SKIN}"/></g>`);

// the spear: from Ferb's tipped hand, down to the road far behind the back wheel
const hand = tip(FERB_HAND);
const TIP_PT = [120, RC[1] - 4];
const dir = [TIP_PT[0] - hand[0], TIP_PT[1] - hand[1]];
const len = Math.hypot(...dir), u = [dir[0] / len, dir[1] / len];
const deg = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
const BLADE = 240;
const P = (d) => [hand[0] + u[0] * d, hand[1] + u[1] * d].map((v) => v.toFixed(1)).join(" ");
const nodes = [0.25, 0.45, 0.65].map((k) => {
  const c = P(len * k).split(" ").map(Number);
  return `M${(c[0] - u[1] * 12).toFixed(1)} ${(c[1] + u[0] * 12).toFixed(1)} L${(c[0] + u[1] * 12).toFixed(1)} ${(c[1] - u[0] * 12).toFixed(1)}`;
}).join(" ");
const base = P(len - BLADE).split(" ").map(Number);
const spear = `
  ${limb(`M${P(-50)} L${P(len - BLADE + 10)}`, "#D8B25C", 18)}
  <path d="${nodes}" fill="none" stroke="#A88A3E" stroke-width="6"/>
  <g transform="translate(${base[0].toFixed(1)} ${base[1].toFixed(1)}) rotate(${deg.toFixed(2)})">
    <path d="M14 0 Q70 -112 ${BLADE} 0 Q70 112 14 0 Z" fill="#C9CDD4"/>
    <path d="M34 0 L${BLADE - 22} 0" fill="none" stroke="#8A8F98" stroke-width="8"/>
    <path d="M70 -26 Q130 -38 190 -12" fill="none" stroke="#F4F5F7" stroke-width="8"/>
    <rect x="-30" y="-21" width="50" height="42" rx="7" fill="#4A4A4A"/>
  </g>`;

export const pfBoyphoRig = {
  pf_boypho: {
    group: "street",
    canvas: [1700, 1060], anchor: RC,
    // where the blade scrapes the road and where the exhaust puffs (canvas points)
    blade: TIP_PT, exhaust: tip(EXHAUST),
    parts: {
      rear_wheel: [tip(R), wheel(R)],
      front_wheel: [tip(F), wheel(F)],
      bike: [RC, bike],
      spear: [hand, spear],
      ferb: [tip([620 + RIDE[0], 540 + RIDE[1]]), ferb],
      phineas: [tip([792 + RIDE[0], 540 + RIDE[1]]), phineas],
    },
  },
};
