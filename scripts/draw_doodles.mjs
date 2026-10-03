// Hand-coded SVG drawings in the site's doodle style (thick wobbly outline,
// flat colours, see wobble.mjs), for subjects the image model refuses or gets
// wrong: Perry the Platypus (pet + Agent P), the one-petal-missing daisy, and
// the clouds. Writes raw_art/childhood/<name>.png; then run prep_art.mjs.
//
//   node scripts/draw_doodles.mjs [name ...]
import fs from "fs";
import sharp from "sharp";
import { INK, doodleSvg, limb } from "./wobble.mjs";
import { extraDoodles } from "./doodles_pf_shaun.mjs";
import { gameDoodles } from "./doodles_games.mjs";
import { streetDoodles } from "./doodles_street.mjs";
import { cryptoDoodles } from "./doodles_crypto.mjs";

const TEAL = "#2FB3A8", TEAL_DARK = "#24918A";
const ORANGE = "#F39A3A";
const BROWN = "#8A5A35", BAND = "#4A2F1D";

const drawings = {
  // The everyday pet, after the enamel-pin reference: a fat teal blob on four
  // stubby legs, the near eye big on top, the far eye peeking out at the front,
  // flat orange bill, paddle tail up at the back.
  perry_normal: [1200, 800, `
    <path d="M905 430 L995 215 Q1015 182 1052 192 Q1085 206 1072 245 L962 470 Z" fill="${ORANGE}"/>
    <path d="M975 260 L1050 225 M955 320 L1040 285 M935 380 L1015 345 M1000 215 L960 440" fill="none" stroke-width="9"/>
    <!-- far legs, behind the body -->
    <path d="M425 560 L425 655 L505 655 L505 560 Z" fill="${TEAL_DARK}"/>
    <path d="M800 560 L800 655 L880 655 L880 560 Z" fill="${TEAL_DARK}"/>
    <path d="M400 650 L515 650 L528 688 L392 690 Z" fill="${ORANGE}"/>
    <path d="M775 650 L890 650 L903 688 L767 690 Z" fill="${ORANGE}"/>
    <!-- body -->
    <path d="M255 300 Q262 188 420 185 L765 192 Q930 205 940 365 Q946 525 860 582 Q700 612 480 606 Q300 602 268 522 Q242 420 255 300 Z" fill="${TEAL}"/>
    <!-- near legs -->
    <path d="M330 575 L330 668 L410 668 L410 575 Z" fill="${TEAL}"/>
    <path d="M700 575 L700 668 L780 668 L780 575 Z" fill="${TEAL}"/>
    <path d="M300 664 L420 664 L436 704 L292 706 Z" fill="${ORANGE}"/>
    <path d="M670 664 L790 664 L806 704 L662 706 Z" fill="${ORANGE}"/>
    <!-- hair tuft -->
    <path d="M380 192 Q370 140 405 150 Q400 118 440 132" fill="none"/>
    <!-- bill -->
    <path d="M285 405 Q185 400 148 445 Q132 497 205 503 Q268 508 338 482 Q378 462 360 428 Q330 402 285 405 Z" fill="${ORANGE}"/>
    <path d="M190 458 Q260 452 330 444" fill="none" stroke-width="10"/>
    <!-- far eye peeking out at the front, near eye big on top -->
    <circle cx="262" cy="300" r="58" fill="#fff"/>
    <circle cx="238" cy="312" r="21" fill="${INK}" stroke="none"/>
    <circle cx="470" cy="270" r="80" fill="#fff"/>
    <circle cx="500" cy="262" r="27" fill="${INK}" stroke="none"/>`],

  // Agent P, standing upright, fedora on, narrowed eyes, karate chop forward and
  // the other fist cocked back. Everything is drawn in place (no transforms) so
  // the parts line up.
  perry_agent: [1000, 1300, `
    <!-- tail on the ground behind -->
    <path d="M640 965 L885 1045 Q935 1068 905 1110 L630 1045 Z" fill="${ORANGE}"/>
    <path d="M710 985 L860 1080 M780 1005 L740 1065 M850 1030 L820 1088" fill="none" stroke-width="9"/>
    <!-- cocked fist behind -->
    ${limb("M630 700 Q748 692 755 598", TEAL)}
    <circle cx="755" cy="575" r="48" fill="${TEAL}"/>
    <path d="M728 560 Q755 545 782 560" fill="none" stroke-width="9"/>
    <!-- legs + feet -->
    ${limb("M470 1075 Q455 1140 432 1185", TEAL, 40)}
    ${limb("M590 1075 Q610 1140 632 1185", TEAL, 40)}
    <path d="M352 1180 L462 1176 L478 1222 L338 1228 Z" fill="${ORANGE}"/>
    <path d="M600 1176 L705 1174 L728 1222 L590 1228 Z" fill="${ORANGE}"/>
    <!-- body -->
    <path d="M400 470 Q396 378 522 374 Q646 372 652 470 L682 982 Q692 1110 530 1115 Q378 1115 380 990 Z" fill="${TEAL}"/>
    <!-- bill, sticking out from the front of the face -->
    <path d="M425 522 Q262 512 216 560 Q200 612 302 617 Q404 622 458 586 Q484 556 458 528 Z" fill="${ORANGE}"/>
    <path d="M246 576 Q332 570 432 560" fill="none" stroke-width="10"/>
    <!-- narrowed, determined eyes under the brim -->
    <path d="M425 452 L508 464 Q512 504 468 508 Q425 506 425 452 Z" fill="#fff"/>
    <circle cx="472" cy="482" r="13" fill="${INK}" stroke="none"/>
    <path d="M532 464 L615 452 Q615 506 573 508 Q532 504 532 464 Z" fill="#fff"/>
    <circle cx="560" cy="482" r="13" fill="${INK}" stroke="none"/>
    <path d="M414 444 L514 464 M526 464 L626 444" fill="none" stroke-width="20"/>
    <!-- karate chop forward -->
    ${limb("M440 705 Q345 725 262 695", TEAL)}
    <path d="M262 640 Q205 650 192 690 Q200 728 262 730 Q288 708 285 680 Z" fill="${TEAL}"/>
    <!-- fedora -->
    <path d="M408 398 Q400 258 472 236 Q530 222 590 236 Q656 256 642 398 Z" fill="${BROWN}"/>
    <path d="M410 372 Q524 352 643 368 L642 332 Q524 316 412 335 Z" fill="${BAND}"/>
    <path d="M452 250 Q522 284 586 248" fill="none" stroke-width="10"/>
    <path d="M300 402 Q522 362 752 386 Q770 414 740 424 Q522 402 318 440 Q288 430 300 402 Z" fill="${BROWN}"/>`],

  smoke: [520, 360, `
    <path d="M110 300 Q50 300 56 248 Q62 200 118 206 Q124 128 210 132 Q262 72 340 118 Q420 110 432 190 Q500 198 494 260 Q488 304 430 304 Z" fill="#ECECEC"/>
    <path d="M150 250 Q190 230 230 250 M300 220 Q340 200 380 222" fill="none" stroke="#BDBDBD" stroke-width="10"/>`],

  // Puffy clouds with a sleepy smile (two shapes for variety).
  cloud: [760, 420, `
    <path d="M135 345 Q62 345 70 280 Q80 222 148 228 Q150 140 245 142 Q298 68 390 112 Q462 60 532 128 Q624 122 626 214 Q700 224 690 296 Q680 348 612 348 Z" fill="#FFFFFF"/>
    <circle cx="318" cy="248" r="13" fill="${INK}" stroke="none"/>
    <circle cx="438" cy="248" r="13" fill="${INK}" stroke="none"/>
    <path d="M350 282 Q378 308 406 282" fill="none" stroke-width="11"/>
    <ellipse cx="270" cy="282" rx="24" ry="13" fill="#F7B5C5" stroke="none"/>
    <ellipse cx="486" cy="282" rx="24" ry="13" fill="#F7B5C5" stroke="none"/>`],
  cloud_b: [620, 380, `
    <path d="M120 300 Q58 300 64 246 Q72 196 130 202 Q140 120 232 128 Q290 70 372 118 Q452 112 470 190 Q550 196 546 258 Q540 304 480 304 Z" fill="#FFFFFF"/>
    <path d="M262 228 Q276 214 290 228 M352 228 Q366 214 380 228" fill="none" stroke-width="11"/>
    <path d="M296 256 Q321 278 346 256" fill="none" stroke-width="11"/>`],
};

// The daisy from the reference: white petals all round a yellow centre, with one
// petal missing (G-Dragon's PEACEMINUSONE daisy), on a stem with one leaf.
{
  // 18 wide petals; the missing one is the lower-left petal (225°), as in the reference.
  const W = 1000, H = 1350, cx = 500, cy = 460, N = 18, missing = 11;
  let petals = "";
  for (let i = 0; i < N; i++) {
    if (i === missing) continue;
    const a = (i / N) * 360 + 5;
    const len = 268 + ((i * 37) % 5) * 12;
    const b = cy - 64, tip = b - len;
    petals += `<path d="M${cx - 22} ${b} C${cx - 78} ${b - len * 0.3} ${cx - 62} ${tip} ${cx} ${tip} C${cx + 62} ${tip} ${cx + 78} ${b - len * 0.3} ${cx + 22} ${b} Z" fill="#FFFFFF" transform="rotate(${a.toFixed(1)} ${cx} ${cy})"/>`;
  }
  let dots = "";
  for (let i = 1; i < 44; i++) {
    const r = 12.5 * Math.sqrt(i), a = i * 2.39996;
    dots += `<circle cx="${(cx + Math.cos(a) * r).toFixed(0)}" cy="${(cy + Math.sin(a) * r).toFixed(0)}" r="7" fill="#E08A12" stroke="none"/>`;
  }
  drawings.flower_daisy = [W, H, `
    <path d="M500 700 Q520 950 490 1300" fill="none" stroke="${INK}" stroke-width="46"/>
    <path d="M500 700 Q520 950 490 1300" fill="none" stroke="#5FA052" stroke-width="20"/>
    <path d="M512 1010 Q610 910 740 930 Q670 1050 516 1060 Z" fill="#74B562"/>
    <path d="M520 1035 Q620 980 700 950" fill="none" stroke-width="9"/>
    ${petals}
    <circle cx="${cx}" cy="${cy}" r="112" fill="#F6B623"/>
    ${dots}`];
}

Object.assign(drawings, extraDoodles, gameDoodles, streetDoodles, cryptoDoodles);

const only = process.argv.slice(2);
fs.mkdirSync("raw_art/childhood", { recursive: true });
// an optional 4th entry: { transparent: true } (no paper behind it: drawings with
// closed loops of line, so the gaps inside stay see-through), { seed }
for (const [name, [w, h, body, opts = {}]] of Object.entries(drawings)) {
  if (only.length && !only.includes(name)) continue;
  // names with a slash pick their own group (games/minion_blue), others go to childhood
  const out = `raw_art/${name.includes("/") ? name : "childhood/" + name}.png`;
  fs.mkdirSync(out.slice(0, out.lastIndexOf("/")), { recursive: true });
  await sharp(Buffer.from(doodleSvg(w, h, body, { seed: opts.seed ?? name.length * 3, ...(opts.transparent ? { background: null } : {}), ...(opts.wobble === false ? { wobble: false } : {}) }))).png().toFile(out);
  console.log("wrote", name);
}
