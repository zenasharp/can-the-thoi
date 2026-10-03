// Hand-coded SVG doodles for the games scene (League of Legends / Gunny / Moly),
// used by draw_doodles.mjs. Keys carry their art group ("games/...").
import { INK, limb } from "./wobble.mjs";

// Teemo's Noxious Trap: a green cap with purple spots on a creamy stem.
const shroom = [600, 560, `
  <path d="M232 330 Q222 430 236 500 Q300 524 368 500 Q382 430 372 330 Z" fill="#EEDC9A"/>
  <path d="M60 340 Q62 120 300 96 Q538 120 540 340 Q300 372 60 340 Z" fill="#4FB33A"/>
  <ellipse cx="170" cy="232" rx="44" ry="36" fill="#A34D9C" stroke-width="10"/>
  <ellipse cx="318" cy="168" rx="38" ry="30" fill="#A34D9C" stroke-width="10"/>
  <ellipse cx="430" cy="262" rx="46" ry="38" fill="#A34D9C" stroke-width="10"/>
  <ellipse cx="290" cy="290" rx="28" ry="22" fill="#A34D9C" stroke-width="10"/>`];

// The toxic puff when a trap goes off: a lumpy green cloud with purple blotches.
const bumps = (cx, cy, rx, ry, n, k = 1.22) => {
  const p = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry].map((v) => v.toFixed(0)).join(" ");
  let d = "M" + p(0);
  for (let i = 0; i < n; i++) {
    const am = ((i + 0.5) / n) * Math.PI * 2;
    d += ` Q${(cx + Math.cos(am) * rx * k).toFixed(0)} ${(cy + Math.sin(am) * ry * k).toFixed(0)} ${p(((i + 1) / n) * Math.PI * 2)}`;
  }
  return d + " Z";
};
const poison = [760, 600, `
  <path d="${bumps(380, 330, 290, 210, 11)}" fill="#8BD64A"/>
  <path d="${bumps(300, 300, 90, 70, 7, 1.18)}" fill="#B66BC0" stroke-width="10"/>
  <path d="${bumps(500, 380, 70, 54, 7, 1.18)}" fill="#B66BC0" stroke-width="10"/>
  <circle cx="420" cy="230" r="26" fill="#B66BC0" stroke-width="9"/>
  <!-- little skull -->
  <path d="M352 300 Q352 250 400 250 Q448 250 448 300 Q448 330 430 336 L430 360 L370 360 L370 336 Q352 330 352 300 Z" fill="#F4F1E6" stroke-width="10"/>
  <circle cx="384" cy="302" r="12" fill="${INK}" stroke="none"/><circle cx="416" cy="302" r="12" fill="${INK}" stroke="none"/>
  <path d="M388 344 L388 360 M400 344 L400 360 M412 344 L412 360" fill="none" stroke-width="7"/>`];

// A blue caster minion, after the cute hooded-blob references: a blue hood, a
// dark face with two white eyes, a stubby arm holding a staff with a glowing orb.
const minion = [640, 760, `
  ${limb("M470 360 L470 690", "#8B5A2B", 16)}
  <circle cx="470" cy="330" r="44" fill="#9FE8FF"/>
  <circle cx="470" cy="330" r="22" fill="#FFFFFF" stroke="none"/>
  <path d="M120 690 Q96 470 160 330 Q216 170 300 120 Q340 150 352 210 Q440 290 452 470 Q470 640 440 690 Z" fill="#4C7CF0"/>
  <path d="M300 120 Q330 92 360 110 Q342 140 352 210" fill="#4C7CF0"/>
  <path d="M196 300 Q300 250 392 312 Q400 420 300 438 Q190 430 196 300 Z" fill="#2B2B33"/>
  <ellipse cx="262" cy="350" rx="20" ry="28" fill="#FFFFFF" stroke="none"/>
  <ellipse cx="334" cy="350" rx="20" ry="28" fill="#FFFFFF" stroke="none"/>
  ${limb("M420 520 Q460 520 470 500", "#4C7CF0", 30)}
  <path d="M150 690 L430 690" fill="none" stroke-width="12"/>`];

// Gunny's "lu gạch", after the in-game icon: a dark olive cloth sack bulging
// with red bricks (the red belly with brick lines), tied at the neck with a thick
// cream braided rope whose end hangs down in a knot and tassel, and an orange
// heart-shaped brick and a brown brick sticking out of the top.
const BELLY = "M176 398 Q300 362 430 380 Q556 402 568 492 Q552 620 362 636 Q196 630 150 520 Q146 442 176 398 Z";
const luGach = [700, 720, `
  <defs><clipPath id="belly"><path d="${BELLY}"/></clipPath></defs>
  <path d="M368 282 C290 226 262 160 310 132 C344 114 366 140 368 166 C372 140 396 114 430 132 C478 160 446 226 368 282 Z" fill="#E8642A"/>
  <path d="M420 270 L452 168 L536 190 L508 290 Z" fill="#8A4A2A"/>
  <path d="M444 222 L522 242" fill="none" stroke-width="9"/>
  <path d="M215 300 Q118 362 128 488 Q148 628 334 646 Q530 646 566 500 Q590 380 500 300 Z" fill="#56632B"/>
  <path d="${BELLY}" fill="#D63A28"/>
  <g clip-path="url(#belly)" stroke="#7E1A12" stroke-width="10" fill="none">
    <path d="M120 440 L600 440 M120 494 L600 494 M120 548 L600 548 M120 602 L600 602 M260 370 L260 440 M380 370 L380 440 M500 370 L500 440 M200 440 L200 494 M320 440 L320 494 M440 440 L440 494 M260 494 L260 548 M380 494 L380 548 M500 494 L500 548 M200 548 L200 602 M320 548 L320 602 M440 548 L440 602 M380 602 L380 660"/>
  </g>
  <path d="M236 302 Q350 262 484 302 L474 250 Q350 222 246 252 Z" fill="#46521F"/>
  <path d="M206 306 Q350 360 514 302" fill="none" stroke="${INK}" stroke-width="86"/>
  <path d="M206 306 Q350 360 514 302" fill="none" stroke="#EAD9AE" stroke-width="58"/>
  <path d="M240 300 l24 32 M282 312 l24 32 M324 320 l24 32 M366 322 l24 32 M408 318 l24 30 M450 308 l22 30 M490 296 l18 26" fill="none" stroke="#B9A47A" stroke-width="9"/>
  ${limb("M514 302 Q604 326 612 420 Q616 474 594 520", "#EAD9AE", 44)}
  <path d="M600 360 l22 18 M610 410 l22 14 M604 462 l22 10" fill="none" stroke="#B9A47A" stroke-width="8"/>
  <circle cx="592" cy="530" r="34" fill="#EAD9AE"/>
  ${limb("M572 556 L560 618 M592 562 L594 628 M612 556 L628 614", "#EAD9AE", 18)}`];

// --- a minion's health bar: a scribbled dark frame and a blue fill (scaled in code)
const hpFrame = [420, 110, `
  <rect x="20" y="22" width="380" height="66" rx="16" fill="#2A2A30"/>
  <path d="M40 40 L380 38 M44 70 L378 72" fill="none" stroke="#3E3E46" stroke-width="6"/>`];
const hpFill = [360, 70, `
  <path d="M14 16 Q180 6 346 14 L344 54 Q180 64 16 56 Z" fill="#4C9BF0" stroke="none"/>
  <path d="M30 22 L330 18" fill="none" stroke="#9FD0FF" stroke-width="8"/>
  <path d="M60 50 l18 -26 M130 52 l18 -26 M200 52 l18 -26 M270 52 l18 -26" fill="none" stroke="#2F74C8" stroke-width="6"/>`, { transparent: true }];

// --- magic bolts: a scribbled ball of light with flame licks and a streak behind
// (two frames each, so they flicker); drawn heading right
const bolt = (fill, core, k) => {
  const n = 9, pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + k * 0.35;
    const r = i % 2 ? 58 : 84 + ((i / 2 + k) % 3) * 9;
    pts.push(`${(130 + Math.cos(a) * r).toFixed(0)} ${(100 + Math.sin(a) * r).toFixed(0)}`);
  }
  return [260, 200, `
    <path d="M6 ${86 + k * 6} L64 94 M2 ${114 - k * 6} L64 106" fill="none" stroke="${fill}" stroke-width="14"/>
    <path d="M${pts.join(" L")} Z" fill="${fill}" stroke-width="10"/>
    <circle cx="130" cy="100" r="40" fill="${core}" stroke-width="8"/>`];
};

export const gameDoodles = {
  "games/hp_frame": hpFrame,
  "games/hp_fill": hpFill,
  "games/bolt_blue_1": bolt("#5FD3FF", "#FFFFFF", 0),
  "games/bolt_blue_2": bolt("#5FD3FF", "#FFFFFF", 1),
  "games/bolt_red_1": bolt("#FF5A4E", "#FFE08A", 0),
  "games/bolt_red_2": bolt("#FF5A4E", "#FFE08A", 1),
  "games/lu_gach": luGach,
  "games/teemo_shroom": shroom,
  "games/poison_cloud": poison,
  "games/minion_blue": minion,
};
