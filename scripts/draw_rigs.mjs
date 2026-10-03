// Rigged characters: each one is a set of separate paper parts hand-coded as SVG
// in the site's doodle style (thick near-black outline, flat colours), so every
// part can animate on its own (Mr. Panda's dragon / camel legs are built the
// same way). Each part is rendered on its rig's shared canvas, trimmed and
// written to raw_art/childhood/<rig>_<part>.png; boxes, pivots and the canvas
// anchor go to src/content/rigs.json. Then run prep_art.mjs.
//
//   node scripts/draw_rigs.mjs [rig ...]
import fs from "fs";
import sharp from "sharp";
import { INK, STROKE as S, limb, wobbleDefs } from "./wobble.mjs";
const hexagon = (cx, cy, r, fill, inner) => {
  const pts = (rr) => Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + Math.cos(a) * rr).toFixed(0)},${(cy + Math.sin(a) * rr).toFixed(0)}`;
  }).join(" ");
  return `<polygon points="${pts(r)}" fill="${fill}"/><polygon points="${pts(r * 0.55)}" fill="${inner}" stroke-width="10"/>`;
};

// A lumpy blob (tree canopies, bushes): an ellipse with n bulges.
const bumps = (cx, cy, rx, ry, n, k = 1.22) => {
  const p = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry].map((v) => v.toFixed(0)).join(" ");
  let d = "M" + p(0);
  for (let i = 0; i < n; i++) {
    const am = ((i + 0.5) / n) * Math.PI * 2;
    d += ` Q${(cx + Math.cos(am) * rx * k).toFixed(0)} ${(cy + Math.sin(am) * ry * k).toFixed(0)} ${p(((i + 1) / n) * Math.PI * 2)}`;
  }
  return d + " Z";
};

const RIGS = {
  // Totoro at the bus stop
  totoro: {
    canvas: [1100, 1250], anchor: [620, 1205], // anchor: canvas point at the rig's position (feet)
    parts: (() => {
      const GREY = "#9A9A9A", GREY_DARK = "#7E7E7E", CREAM = "#EFE8D2", GREEN = "#74B562", GREEN_DARK = "#4F8A43", BLUE = "#2E5FB8";
      return {
        bus_stop: [[127, 1200], `
          <rect x="98" y="555" width="58" height="640" rx="10" fill="#C2C2C2"/>
          <ellipse cx="127" cy="1192" rx="74" ry="22" fill="${GREY_DARK}"/>
          <circle cx="127" cy="470" r="96" fill="${BLUE}"/>
          <rect x="50" y="446" width="154" height="48" rx="8" fill="#FFFFFF"/>`],
        ear_left: [[536, 445], `<path d="M500 455 Q468 285 520 188 Q574 300 572 435 Z" fill="${GREY}"/>`],
        ear_right: [[704, 445], `<path d="M668 435 Q666 300 720 188 Q772 285 740 455 Z" fill="${GREY}"/>`],
        body: [[620, 1200], `
          <path d="M620 400 C430 400 350 540 345 720 C335 920 320 1070 400 1150 C470 1212 770 1212 840 1150 C920 1070 905 920 895 720 C890 540 810 400 620 400 Z" fill="${GREY}"/>
          <path d="M620 705 C470 705 412 822 412 960 C412 1082 472 1150 620 1150 C768 1150 828 1082 828 960 C828 822 770 705 620 705 Z" fill="${CREAM}"/>
          <path d="M548 790 l26 -20 l26 20 M594 772 l26 -20 l26 20 M640 790 l26 -20 l26 20" fill="none" stroke="${GREY_DARK}" stroke-width="12"/>
          <path d="M600 572 Q620 560 640 572 Q620 590 600 572 Z" fill="${INK}"/>
          <path d="M505 628 Q620 742 735 628 Q620 668 505 628 Z" fill="#FFFFFF"/>
          <path d="M470 588 L385 572 M470 610 L382 616 M770 588 L855 572 M770 610 L858 616" fill="none" stroke-width="10"/>
          <path d="M480 1188 l-8 -34 M505 1192 l0 -36 M530 1188 l8 -34 M710 1188 l-8 -34 M735 1192 l0 -36 M760 1188 l8 -34" fill="none" stroke-width="10"/>`],
        eyes: [[620, 528], `
          <circle cx="520" cy="528" r="36" fill="#FFFFFF"/><circle cx="532" cy="534" r="15" fill="${INK}" stroke="none"/>
          <circle cx="720" cy="528" r="36" fill="#FFFFFF"/><circle cx="708" cy="534" r="15" fill="${INK}" stroke="none"/>`],
        arm_left: [[388, 700], `<path d="M380 690 Q300 760 296 862 Q300 925 350 918 Q384 862 404 760 Z" fill="${GREY}"/>`],
        leaf_arm: [[848, 692], `
          <path d="M948 508 L880 236" fill="none" stroke="${INK}" stroke-width="26"/>
          <path d="M948 508 L880 236" fill="none" stroke="${GREEN_DARK}" stroke-width="10"/>
          <path d="M555 232 Q870 70 1086 214 Q905 312 555 232 Z" fill="${GREEN}"/>
          <path d="M585 230 Q830 200 1060 214 M700 222 L650 175 M820 214 L780 150 M940 212 L915 150 M760 222 L720 268 M880 216 L860 275" fill="none" stroke-width="10"/>
          <path d="M846 702 Q930 642 960 545 Q975 498 932 494 Q898 560 836 642 Z" fill="${GREY}"/>`],
      };
    })(),
  },

  // Probe, the Bakugan battle robot: a purple saucer with an angry dome, a lid
  // that flips open (antenna on it), and two arms with hexagon claws.
  probe: {
    canvas: [1200, 900], anchor: [600, 800],
    parts: (() => {
      const P = "#7B55C9", P_LIGHT = "#9C7BE0", P_DARK = "#4E3390", STEEL = "#8C9BB8", CLAW = "#A9C2E8", RED = "#E2352B";
      return {
        arm_left: [[318, 585], `
          ${limb("M318 585 L215 650 L190 730", STEEL, 32)}
          <circle cx="215" cy="650" r="24" fill="${P_DARK}"/>
          ${hexagon(178, 770, 66, P, CLAW)}`],
        arm_right: [[882, 585], `
          ${limb("M882 585 L985 650 L1010 730", STEEL, 32)}
          <circle cx="985" cy="650" r="24" fill="${P_DARK}"/>
          ${hexagon(1022, 770, 66, P, CLAW)}`],
        body: [[600, 800], `
          <!-- round dark belly under the saucer rim, with hexagon panels and two curved fangs -->
          <path d="M498 690 Q474 770 516 812 Q528 762 548 706 Z" fill="#EEF1F6"/>
          <path d="M702 690 Q726 770 684 812 Q672 762 652 706 Z" fill="#EEF1F6"/>
          <path d="M292 575 Q296 708 600 724 Q904 708 908 575 Z" fill="${P_DARK}"/>
          ${hexagon(420, 645, 46, P, P_LIGHT)}
          ${hexagon(600, 668, 50, P, P_LIGHT)}
          ${hexagon(780, 645, 46, P, P_LIGHT)}
          <path d="M180 520 Q600 462 1020 520 Q1034 560 1004 588 Q600 632 196 588 Q166 560 180 520 Z" fill="${P_LIGHT}"/>
          <rect x="250" y="532" width="90" height="24" rx="8" fill="${P_DARK}"/>
          <rect x="860" y="532" width="90" height="24" rx="8" fill="${P_DARK}"/>
          <rect x="545" y="548" width="110" height="26" rx="8" fill="${P_DARK}"/>`],
        dome: [[600, 500], `
          <path d="M300 470 Q318 268 600 238 Q882 268 900 470 Z" fill="${P}"/>
          <ellipse cx="600" cy="262" rx="118" ry="24" fill="${P_DARK}"/>
          <path d="M418 368 L528 396 L520 428 Q462 424 422 400 Z" fill="${RED}"/>
          <path d="M782 368 L672 396 L680 428 Q738 424 778 400 Z" fill="${RED}"/>
          <path d="M290 456 L910 456 L904 510 L296 510 Z" fill="#FFFFFF"/>
          <path d="M296 458 ${Array.from({ length: 12 }, (_, i) => `L${(322 + i * 51).toFixed(0)} 506 L${(347 + i * 51).toFixed(0)} 458`).join(" ")}" fill="none" stroke-width="10"/>`],
        lid: [[470, 262], `
          <path d="M600 186 Q640 120 690 60" fill="none" stroke-width="12"/>
          <circle cx="694" cy="56" r="20" fill="${P_LIGHT}"/>
          <path d="M466 264 Q600 160 734 264 Q600 284 466 264 Z" fill="${P_LIGHT}"/>`],
      };
    })(),
    hole: [600, 262], // where the Bakugan ball comes out
  },

  // Blitzcrank, chibi, facing left (towards the hero coming in): a big dome head
  // with two glowing cyan eyes on a round brass body with the blue lightning core,
  // spindly piston legs, exhaust pipes, a blocky far arm and a near arm whose fist
  // comes off for Rocket Grab (the chain is drawn in code from `socket` to the fist).
  blitz: {
    group: "games",
    canvas: [1100, 1220], anchor: [560, 1175],
    parts: (() => {
      const G = "#E3A93B", G_DARK = "#B47A22", G_LIGHT = "#F2C766", PIPE = "#55505A", BLUE = "#49B6F2", EYE = "#7DEBFA";
      const fist = (x, y) => `
        <rect x="${x}" y="${y}" width="190" height="170" rx="22" fill="${G}"/>
        <rect x="${x + 96}" y="${y - 44}" width="70" height="56" rx="12" fill="${G_LIGHT}"/>
        <path d="M${x + 4} ${y + 58} L${x + 92} ${y + 58} M${x + 4} ${y + 112} L${x + 92} ${y + 112} M${x + 92} ${y + 4} L${x + 92} ${y + 166}" fill="none" stroke-width="10"/>
        <circle cx="${x + 40}" cy="${y + 30}" r="15" fill="#8C8C94" stroke-width="9"/>
        <circle cx="${x + 40}" cy="${y + 85}" r="15" fill="#8C8C94" stroke-width="9"/>
        <circle cx="${x + 40}" cy="${y + 140}" r="15" fill="#8C8C94" stroke-width="9"/>`;
      return {
        arm_far: [[800, 640], `
          ${limb("M800 640 L880 820", G_DARK, 70)}
          ${fist(800, 820)}`],
        body: [[560, 1175], `
          ${limb("M770 520 Q900 470 880 610", PIPE, 34)}
          ${limb("M720 470 Q820 380 840 500", PIPE, 30)}
          ${limb("M480 930 L455 1110", G_DARK, 34)}
          ${limb("M650 930 L675 1110", G_DARK, 34)}
          <path d="M370 1170 L408 1100 L500 1100 L528 1170 Z" fill="${G}"/>
          <path d="M610 1170 L638 1100 L730 1100 L768 1170 Z" fill="${G}"/>
          <path d="M406 1170 L418 1140 M452 1170 L452 1140 M492 1170 L482 1140 M646 1170 L658 1140 M690 1170 L690 1140 M730 1170 L720 1140" fill="none" stroke-width="9"/>
          <circle cx="560" cy="700" r="262" fill="${G}"/>
          <path d="M330 600 Q560 520 790 600" fill="none" stroke="${G_DARK}" stroke-width="12"/>
          <path d="M318 800 Q560 880 802 800" fill="none" stroke="${G_DARK}" stroke-width="12"/>
          <circle cx="388" cy="560" r="10" fill="${G_DARK}" stroke="none"/><circle cx="732" cy="560" r="10" fill="${G_DARK}" stroke="none"/>
          <circle cx="360" cy="860" r="10" fill="${G_DARK}" stroke="none"/><circle cx="760" cy="860" r="10" fill="${G_DARK}" stroke="none"/>
          <circle cx="520" cy="715" r="98" fill="#3A3A44"/>
          <circle cx="520" cy="715" r="64" fill="${BLUE}" stroke-width="10"/>
          <path d="M532 660 L496 718 L526 718 L506 772 L548 704 L518 704 Z" fill="#FFFFFF" stroke-width="8"/>`],
        head: [[500, 470], `
          <ellipse cx="500" cy="468" rx="132" ry="30" fill="#6E5A3A"/>
          <path d="M366 462 Q352 262 500 240 Q648 262 634 462 Q500 482 366 462 Z" fill="${G}"/>
          <path d="M500 242 Q488 350 496 470" fill="none" stroke="${G_DARK}" stroke-width="10"/>
          <circle cx="436" cy="372" r="42" fill="#FFFFFF"/>
          <circle cx="436" cy="372" r="27" fill="${EYE}" stroke-width="8"/>
          <circle cx="428" cy="363" r="9" fill="#FFFFFF" stroke="none"/>
          <circle cx="560" cy="372" r="42" fill="#FFFFFF"/>
          <circle cx="560" cy="372" r="27" fill="${EYE}" stroke-width="8"/>
          <circle cx="552" cy="363" r="9" fill="#FFFFFF" stroke="none"/>`],
        arm_near: [[330, 650], `
          <path d="M360 590 L250 620 Q196 660 206 728 L330 742 Q382 700 372 640 Z" fill="${G_DARK}"/>
          <path d="M262 640 L250 724 M300 628 L292 736" fill="none" stroke-width="9"/>
          <ellipse cx="206" cy="682" rx="30" ry="58" fill="${PIPE}"/>`],
        fist: [[180, 690], fist(8, 605)],
      };
    })(),
    socket: [206, 682], // where the Rocket Grab chain leaves the arm
  },

  // The tree the Gunny chick stands on: a lumpy canopy, a trunk and one sturdy
  // branch sticking out to the right (the chick's perch).
  gunny_tree: {
    group: "games",
    canvas: [1000, 1400], anchor: [430, 1380],
    perch: [770, 774],
    parts: {
      tree: [[430, 1380], `
        <path d="M372 1380 Q402 1060 392 820 Q386 700 410 600 L476 600 Q494 760 482 960 Q474 1160 512 1380 Z" fill="#8B5A2B"/>
        ${limb("M470 830 Q640 800 860 790", "#8B5A2B", 54)}
        <path d="${bumps(860, 772, 70, 46, 7, 1.2)}" fill="#6DBB4F"/>
        <path d="${bumps(400, 380, 340, 300, 13)}" fill="#4E9A3F"/>
        <path d="${bumps(430, 420, 250, 210, 10, 1.18)}" fill="#6DBB4F" stroke-width="12"/>
        <path d="M300 300 q20 -30 50 -10 M520 250 q24 -26 52 -6 M430 520 q22 -28 50 -8 M250 470 q18 -24 46 -8 M590 430 q20 -26 48 -6" fill="none" stroke-width="10"/>`],
    },
  },

  // A Vietnamese street power pole: a tapered concrete post, two crossarms with
  // insulators (where the wires hang: `wires`), a transformer, a tangle of spare
  // cable coiled round it and the little "khoan cắt bê tông" ad slips stuck on it.
  // The _loa variant also carries the ward loudspeakers (loa phường) on top.
  ...(() => {
    const insulators = [52, 124, 256, 328];
    const post = (loa) => `
      <path d="M168 140 L212 140 L230 1540 L150 1540 Z" fill="#BDB9AE"/>
      <circle cx="190" cy="760" r="7" fill="#8E897E" stroke="none"/><circle cx="192" cy="1120" r="7" fill="#8E897E" stroke="none"/>
      <rect x="30" y="200" width="320" height="34" rx="6" fill="#4A4A4A"/>
      ${insulators.map((x) => `<path d="M${x - 15} 202 L${x - 10} 170 L${x + 10} 170 L${x + 15} 202 Z" fill="#E8E2D2" stroke-width="10"/>`).join("")}
      <rect x="74" y="330" width="232" height="26" rx="6" fill="#4A4A4A"/>
      <rect x="214" y="430" width="118" height="168" rx="22" fill="#8E9AA0"/>
      <rect x="230" y="408" width="86" height="28" rx="8" fill="#6F7B80"/>
      <path d="M240 470 L240 560 M262 470 L262 560 M284 470 L284 560 M306 470 L306 560" fill="none" stroke="#6F7B80" stroke-width="9"/>
      <path d="M118 650 C40 600 330 590 268 664 C210 736 50 712 112 652 C170 596 334 640 270 708 C214 768 82 736 136 688 C180 650 300 668 248 716" fill="none" stroke="${INK}" stroke-width="10"/>
      <path d="M328 236 Q356 420 300 520 M52 236 Q20 380 70 470" fill="none" stroke="${INK}" stroke-width="9"/>
      <rect x="150" y="880" width="80" height="54" rx="4" fill="#FFFFFF" stroke-width="8" transform="rotate(-6 190 907)"/>
      <path d="M162 896 L214 892 M162 912 L206 908" fill="none" stroke="#D6392B" stroke-width="7" transform="rotate(-6 190 907)"/>
      <rect x="148" y="960" width="84" height="50" rx="4" fill="#FFF6C8" stroke-width="8" transform="rotate(5 190 985)"/>
      <path d="M160 978 L218 980 M160 994 L204 996" fill="none" stroke-width="6" transform="rotate(5 190 985)"/>
      <rect x="152" y="1040" width="76" height="46" rx="4" fill="#FFFFFF" stroke-width="8" transform="rotate(-3 190 1063)"/>
      <path d="M162 1056 L214 1054 M162 1070 L198 1069" fill="none" stroke="#2B5BD6" stroke-width="6" transform="rotate(-3 190 1063)"/>
      ${loa ? `
      <rect x="178" y="40" width="24" height="110" fill="#6F6F6F"/>
      <path d="M186 64 L96 26 L82 112 L186 92 Z" fill="#D8D4C8"/>
      <ellipse cx="88" cy="69" rx="14" ry="44" fill="#9C978A" stroke-width="9"/>
      <path d="M194 64 L284 26 L298 112 L194 92 Z" fill="#D8D4C8"/>
      <ellipse cx="292" cy="69" rx="14" ry="44" fill="#9C978A" stroke-width="9"/>` : ""}`;
    const def = (loa) => ({
      group: "street",
      canvas: [380, 1560], anchor: [190, 1540],
      wires: insulators.map((x) => [x, 172]),
      ...(loa ? { loa: [[84, 69], [296, 69]] } : {}),
      parts: { post: [[190, 1540], post(loa)] },
    });
    return { power_pole: def(false), power_pole_loa: def(true) };
  })(),

  // The family's Panasonic CRT (a TX-21FG50T), at a three-quarter angle: the
  // silver front turned a little to the left, and behind it the bulky dark grey
  // back narrowing away to the upper right (seen a little from above, so its top
  // shows), with a handle recess and vent slits. Parts: the TV, and four frames
  // of scribbled snow drawn on its screen through the same slant, so they fit it.
  ...(() => {
    // the front is designed flat (fx 0..1120 across, fy 0..760 down, the base to
    // fy 820), then turned (narrowed); depth d goes straight back to the right,
    // so the whole underside stays on the ground line
    const SX = 0.8, K = 0, X0 = 40, Y0 = 40, DX = 0.62, DY = 0;
    const P = (fx, fy, d = 0) => [X0 + SX * fx + DX * d, Y0 + fy + K * fx + DY * d].map((v) => v.toFixed(1)).join(" ");
    const slant = (body) => `<g transform="matrix(${SX} ${K} 0 1 ${X0} ${Y0})">${body}</g>`;
    const SILVER = "#CDCFD0", SILVER_LIGHT = "#DCDEDF", SILVER_DARK = "#B4B6B8", GREY = "#6E7072", GREY_TOP = "#86888A", GREY_DARK = "#5A5C5E";
    const grille = (x0, y0, x1, y1, step = 13, r = 2.8) => {
      let s = "";
      for (let y = y0; y <= y1; y += step) for (let x = x0 + (((y - y0) / step) % 2 ? step / 2 : 0); x <= x1; x += step) s += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
      return `<g fill="#9C9EA0" stroke="none">${s}</g>`;
    };
    const SCREEN = { x: 222, y: 78, w: 676, h: 494 }; // flat front coordinates
    // the grey back: from just behind the front (d 30) to the back (d 560), narrowing
    const front = { l: 50, r: 1080, t: 24, b: 812 }, back = { l: 300, r: 1080, t: 240, b: 800 }, D0 = 30, D1 = 560;
    const at = (s, f, d) => [s, f, d];
    const lerp = (a, b, u) => a + (b - a) * u;
    const sect = (u) => { const d = lerp(D0, D1, u); return { l: lerp(front.l, back.l, u), r: lerp(front.r, back.r, u), t: lerp(front.t, back.t, u), b: lerp(front.b, back.b, u), d }; };
    const s0 = sect(0), s1 = sect(1);
    const topFace = `M${P(s0.l, s0.t, s0.d)} L${P(s1.l, s1.t, s1.d)} L${P(s1.r, s1.t, s1.d)} L${P(s0.r, s0.t, s0.d)} Z`; // mostly hidden behind the front
    // The right side, after the photos: the shell's top curves down to the back;
    // its underside runs along the ground just behind the front, then sweeps up in
    // a big S-shaped chamfer to the narrower tube at the back, a lighter bevel
    // band along both curves. Under the cut-away a darker, recessed stand carries
    // the back, so the whole set still sits on the ground. Side points: (d, fy).
    const R = front.r, G = 812;
    const S = (d, fy) => P(R, fy, d);
    const shell = `M${S(30, 24)} Q${S(300, 60)} ${S(560, 240)} L${S(560, 560)} L${S(360, 560)} C${S(260, 560)} ${S(230, G)} ${S(130, G)} L${S(30, G)} Z`;
    const bevelLow = `M${S(30, G - 26)} L${S(120, G - 26)} C${S(214, G - 26)} ${S(250, 534)} ${S(368, 534)} L${S(560, 534)} L${S(560, 560)} L${S(360, 560)} C${S(260, 560)} ${S(230, G)} ${S(130, G)} L${S(30, G)} Z`;
    const bevelTop = `M${S(30, 24)} Q${S(300, 60)} ${S(560, 240)} L${S(560, 264)} Q${S(300, 86)} ${S(30, 50)} Z`;
    // the stand is tucked up under the shell (no gap between them)
    const stand = `M${S(140, 520)} L${S(548, 520)} L${S(548, G)} L${S(140, G)} Z`;
    const standVents = Array.from({ length: 5 }, (_, i) => `M${S(300 + i * 48, 760)} L${S(328 + i * 48, 760)} M${S(300 + i * 48, 784)} L${S(328 + i * 48, 784)}`).join(" ");
    let vents = "";
    for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) {
      const d = 300 + i * 40, fy = 300 + j * 32;
      vents += `M${S(d, fy)} L${S(d + 22, fy)} `;
    }
    const handle = `M${S(70, 150)} L${S(240, 150)} L${S(240, 196)} L${S(70, 196)} Z`;
    const handle2 = `M${S(60, 690)} L${S(165, 690)} L${S(165, 722)} L${S(60, 722)} Z`;
    // the silver front's own thickness (top and right edges)
    const thickTop = `M${P(0, 0, 0)} L${P(0, 0, 30)} L${P(1120, 0, 30)} L${P(1120, 0, 0)} Z`;
    const thickRight = `M${P(1120, 0, 0)} L${P(1120, 0, 30)} L${P(1120, 760, 30)} L${P(1120, 760, 0)} Z`;
    // One continuous outline round the whole body: every piece drawn first as a
    // fat ink shape, then filled again without a stroke on top, so where pieces
    // meet there is no seam and no broken line, only the outer contour. The few
    // inner edges that should show are drawn on top as lines.
    const pieces = [topFace, stand, shell, thickRight]; // (the top edge has no height in this view)
    const body = `
      <g fill="${INK}" stroke="${INK}" stroke-width="20">${pieces.map((d) => `<path d="${d}"/>`).join("")}</g>
      <!-- ...and round the silver front and its base, which the slant would otherwise thin out on the left -->
      ${slant(`<g fill="${INK}" stroke="${INK}" stroke-width="26"><rect x="0" y="0" width="1120" height="760" rx="16"/><path d="M30 750 L1090 750 L1072 810 Q560 840 48 810 Z"/></g>`)}
      <g stroke="none">
        <path d="${topFace}" fill="${GREY_TOP}"/>
        <path d="${stand}" fill="#4A4C4E"/>
        <path d="${shell}" fill="${GREY}"/>
        <path d="${bevelTop}" fill="${GREY_TOP}"/>
        <path d="${bevelLow}" fill="#7E8082"/>
        <path d="${thickRight}" fill="${SILVER_DARK}"/>
      </g>
      <g fill="none">
        <path d="M${S(560, 264)} Q${S(300, 86)} ${S(30, 50)}" stroke-width="9"/>
        <path d="M${S(30, G - 26)} L${S(120, G - 26)} C${S(214, G - 26)} ${S(250, 534)} ${S(368, 534)} L${S(560, 534)}" stroke-width="9"/>
        <path d="M${S(560, 560)} L${S(360, 560)} C${S(260, 560)} ${S(230, G)} ${S(130, G)}" stroke-width="13"/>
        <path d="M${S(548, 560)} L${S(548, G)}" stroke-width="11"/>
        <path d="M${P(1120, 0, 30)} L${P(1120, 760, 30)}" stroke-width="9"/>
        <path d="${standVents}" stroke="#2E3032" stroke-width="10"/>
        <path d="${vents}" stroke="#2E3032" stroke-width="12"/>
      </g>
      <path d="${handle}" fill="${GREY_DARK}" stroke-width="9"/>
      <path d="${handle2}" fill="${GREY_DARK}" stroke-width="9"/>
      ${slant(`
        <path d="M30 750 L1090 750 L1072 810 Q560 840 48 810 Z" fill="${SILVER_DARK}"/>
        <path d="M150 772 Q560 806 970 772" fill="none" stroke="${SILVER_LIGHT}" stroke-width="10"/>
        <rect x="0" y="0" width="1120" height="760" rx="16" fill="${SILVER}"/>
        <rect x="46" y="44" width="104" height="666" rx="8" fill="#BEC0C2" stroke="none"/>
        ${grille(58, 56, 140, 698)}
        <rect x="970" y="44" width="104" height="666" rx="8" fill="#BEC0C2" stroke="none"/>
        ${grille(982, 56, 1064, 698)}
        <rect x="170" y="42" width="780" height="610" rx="10" fill="#1F1B1A"/>
        <rect x="${SCREEN.x}" y="${SCREEN.y}" width="${SCREEN.w}" height="${SCREEN.h}" rx="16" fill="#3C3E3D" stroke-width="12"/>
        <text x="560" y="626" font-size="42" font-family="Arial, sans-serif" font-weight="bold" fill="#ECECE8" stroke="none" text-anchor="middle">Panasonic</text>
        <rect x="278" y="680" width="40" height="40" rx="6" fill="${SILVER_LIGHT}" stroke-width="8"/>
        <circle cx="344" cy="700" r="6" fill="${INK}" stroke="none"/>
        <rect x="362" y="686" width="26" height="26" rx="4" fill="${SILVER_DARK}" stroke-width="7"/>
        <path d="M412 658 L766 658 L766 736 L412 736 Z" fill="${SILVER_LIGHT}" stroke-width="9"/>
        <path d="M560 658 Q589 642 618 658" fill="${SILVER_LIGHT}" stroke-width="8"/>
        ${[430, 460, 490, 520, 550, 580].map((x) => `<rect x="${x}" y="672" width="20" height="30" rx="3" fill="#E8E9EA" stroke-width="6"/>`).join("")}
        <rect x="614" y="668" width="138" height="40" rx="20" fill="#2A2A2C" stroke-width="7"/>
        ${[["#F2C230", 638], ["#F4F1E6", 668], ["#E0453A", 698]].map(([c, x]) => `<circle cx="${x}" cy="688" r="11" fill="${c}" stroke-width="5"/>`).join("")}
        <circle cx="730" cy="688" r="8" fill="#8E9092" stroke-width="5"/>`)}`;
    // scribbled snow on the screen, drawn flat then slanted like the front
    const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const snow = (k) => {
      const r = rnd(97 + k * 131);
      const { x, y, w, h } = SCREEN;
      const band = y + h * (0.15 + 0.23 * k);
      let marks = "";
      for (let i = 0; i < 520; i++) {
        const mx = x + 14 + r() * (w - 28), my = y + 14 + r() * (h - 28);
        const inBand = Math.abs(my - band) < 34;
        const c = inBand ? ["#FFFFFF", "#F2F2EE", "#D6D8D5"][Math.floor(r() * 3)] : ["#F2F2EE", "#C9CBC8", "#9A9C99", "#6E706D", "#262827"][Math.floor(r() * 5)];
        const len = 4 + r() * (inBand ? 22 : 14), tilt = (r() - 0.5) * 6;
        marks += `<path d="M${mx.toFixed(0)} ${my.toFixed(0)} l${len.toFixed(0)} ${tilt.toFixed(0)}" stroke="${c}" stroke-width="${(5 + r() * 5).toFixed(0)}"/>`;
      }
      let scans = "";
      for (let sy = y + 30 + k * 7; sy < y + h - 14; sy += 46) scans += `<path d="M${x + 16} ${sy} L${x + w - 16} ${sy + (r() - 0.5) * 6}" stroke="#2E302F" stroke-width="4"/>`;
      return slant(`
        <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="14" fill="#4A4C4B" stroke="none"/>
        <g fill="none">${scans}${marks}</g>`);
    };
    return {
      crt_tv: {
        group: "childhood",
        canvas: [1290, 920], anchor: [645, 884],
        parts: {
          body: [[645, 884], body],
          static_1: [[560, 400], snow(0)],
          static_2: [[560, 400], snow(1)],
          static_3: [[560, 400], snow(2)],
          static_4: [[560, 400], snow(3)],
        },
      },
    };
  })(),

  // One chain link for the Rocket Grab chain (instanced along the chain in code).
  blitz_link_rig: {
    group: "games",
    canvas: [160, 100], anchor: [80, 50],
    parts: {
      link: [[80, 50], `<rect x="16" y="22" width="128" height="56" rx="28" fill="#8C8C94" stroke-width="12"/><rect x="50" y="42" width="60" height="16" rx="8" fill="#55505A" stroke="none"/>`],
    },
  },

};

// Write a file even while a viewer (Windows Photos) has it open: writing over
// it is refused then, but writing a temp file and renaming it over works.
const writeOver = (file, data) => {
  try { fs.writeFileSync(file, data); } catch {
    fs.writeFileSync(file + ".tmp", data);
    fs.renameSync(file + ".tmp", file);
  }
};

const only = process.argv.slice(2);
fs.mkdirSync("raw_art/childhood", { recursive: true });
const outFile = "src/content/rigs.json";
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : {};
for (const [rig, def] of Object.entries(RIGS)) {
  if (only.length && !only.includes(rig)) continue;
  const [W, H] = def.canvas;
  // offset: shifts the whole drawing on its canvas (and every point given with it)
  const [ox, oy] = def.offset || [0, 0];
  const at = (p) => p && [p[0] + ox, p[1] + oy];
  const shift = (body) => (ox || oy ? `<g transform="translate(${ox} ${oy})">${body}</g>` : body);
  const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${wobbleDefs(W, H, rig.length * 5)}<g filter="url(#wob)"><g ${S}>${shift(body)}</g></g></svg>`;
  // named points (shifted with the drawing); "wires" and "loa" are lists of points
  const points = Object.fromEntries(["hole", "socket", "seat", "perch", "wires", "loa", "mouth"].filter((k) => def[k]).map((k) => [k, Array.isArray(def[k][0]) ? def[k].map(at) : at(def[k])]));
  const entry = { group: def.group || "childhood", canvas: { w: W, h: H }, anchor: at(def.anchor), order: Object.keys(def.parts), pivots: {}, parts: {}, ...points };
  for (const [name, [pivot, body]] of Object.entries(def.parts)) {
    const { data, info } = await sharp(Buffer.from(svg(body))).png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    const group = def.group || "childhood";
    fs.mkdirSync(`raw_art/${group}`, { recursive: true });
    writeOver(`raw_art/${group}/${rig}_${name}.png`, data);
    entry.parts[name] = { x: -info.trimOffsetLeft, y: -info.trimOffsetTop, w: info.width, h: info.height };
    entry.pivots[name] = at(pivot);
  }
  out[rig] = entry;
  // preview of the assembled rig
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${wobbleDefs(W, H, rig.length * 5)}<rect width="${W}" height="${H}" fill="#F4EDE0"/><g filter="url(#wob)"><g ${S}>${shift(Object.values(def.parts).map((p) => p[1]).join(""))}</g></g></svg>`))
    .png().toFile(`raw_art/_screens/rig_${rig}.png`);
  console.log("rig", rig, Object.keys(def.parts).join(", "));
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
