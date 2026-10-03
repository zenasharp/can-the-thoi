// More hand-coded SVG doodles (used by draw_doodles.mjs): the Phineas and Ferb
// rocket, its four flame frames, and Shaun the Sheep.
import { INK, limb } from "./wobble.mjs";

const SKIN = "#F7C79A";

// Phineas and Ferb backyard rocket (white, red nose cone, two red-tipped side
// boosters), the brothers riding on the outside, dressed as in the show:
//   Phineas - triangle head pointing forward, red hair ridge, big eye, orange
//     shirt with pale-yellow stripes, blue shorts, white socks, sneakers;
//   Ferb - tall head, tall swept green hair, half-lidded eyes, pale-yellow
//     shirt with a white collar, purple trousers, dark shoes.
const pf_rocket = [1300, 1650, `
  <!-- boosters -->
  <path d="M330 1100 L330 1400 L450 1400 L450 1100 Z" fill="#EEF1F4"/>
  <path d="M390 990 Q344 1046 330 1104 L450 1104 Q436 1046 390 990 Z" fill="#E8432E"/>
  <path d="M850 1100 L850 1400 L970 1400 L970 1100 Z" fill="#EEF1F4"/>
  <path d="M910 990 Q864 1046 850 1104 L970 1104 Q956 1046 910 990 Z" fill="#E8432E"/>
  <!-- body -->
  <path d="M650 150 Q822 380 830 800 L830 1430 Q650 1470 470 1430 L470 800 Q478 380 650 150 Z" fill="#F4F6F8"/>
  <path d="M650 150 Q736 268 768 380 Q650 404 532 380 Q564 268 650 150 Z" fill="#E8432E"/>
  <path d="M474 900 Q650 924 828 900 M472 1180 Q650 1204 830 1180" fill="none" stroke-width="10"/>
  <circle cx="650" cy="640" r="86" fill="#BFE3F5"/>
  <rect x="600" y="1240" width="100" height="160" rx="8" fill="#9AA6B2"/>

  <!-- Phineas, on the left booster -->
  <path d="M300 986 L378 984 L380 1012 L294 1014 Z" fill="#FFFFFF"/><path d="M300 1002 L380 1000" fill="none" stroke="#2F6BCB" stroke-width="10"/>
  <path d="M392 984 L466 986 L472 1014 L390 1012 Z" fill="#FFFFFF"/><path d="M392 1000 L470 1002" fill="none" stroke="#2F6BCB" stroke-width="10"/>
  ${limb("M352 895 L346 982", SKIN, 18)}
  ${limb("M412 895 L420 982", SKIN, 18)}
  <path d="M336 950 L360 950 L360 982 L334 982 Z M406 950 L430 950 L432 982 L408 982 Z" fill="#FFFFFF" stroke-width="10"/>
  <path d="M318 832 L444 832 L448 904 L316 904 Z" fill="#2F6BCB"/>
  <path d="M314 702 L446 702 L450 838 L312 838 Z" fill="#F58A1F"/>
  <path d="M313 738 L449 738 M313 772 L449 772 M313 806 L449 806" fill="none" stroke="#F9E27C" stroke-width="15"/>
  <path d="M314 702 L446 702 L450 838 L312 838 Z" fill="none"/>
  ${limb("M444 738 L470 728", SKIN, 18)}
  ${limb("M318 722 Q270 700 248 636", SKIN, 18)}
  <circle cx="244" cy="620" r="22" fill="${SKIN}"/>
  <path d="M372 676 L396 676 L396 706 L372 706 Z" fill="${SKIN}" stroke-width="10"/>
  <path d="M172 612 Q300 520 442 470 L432 692 Q300 682 172 612 Z" fill="${SKIN}"/>
  <path d="M300 536 l18 -44 l14 30 l18 -48 l14 34 l20 -46 l16 30 L444 470 L440 504 Z" fill="#E2452B" stroke-width="12"/>
  <circle cx="430" cy="604" r="22" fill="${SKIN}"/>
  <ellipse cx="358" cy="566" rx="30" ry="34" fill="#FFFFFF" stroke-width="10"/><circle cx="348" cy="572" r="11" fill="${INK}" stroke="none"/>
  <path d="M212 640 Q280 694 352 664 Q300 706 212 640 Z" fill="#8E2A22" stroke-width="10"/>

  <!-- Ferb, on the right booster: pale-yellow short-sleeve shirt with a white
       collar and one button, mostly hidden by high-waisted purple trousers (belt
       loops, cuffed hems), black sneakers with white toes -->
  ${limb("M864 668 L834 656", SKIN, 18)}
  ${limb("M958 668 Q1004 654 1012 598", SKIN, 18)}
  <path d="M852 990 L908 988 L910 1014 L844 1016 Z" fill="#231F20"/><path d="M846 1004 L870 1004" fill="none" stroke="#FFFFFF" stroke-width="9"/>
  <path d="M916 988 L972 990 L980 1016 L914 1014 Z" fill="#231F20"/><path d="M954 1004 L976 1004" fill="none" stroke="#FFFFFF" stroke-width="9"/>
  <path d="M860 636 L962 636 L976 676 L960 690 L860 690 L844 676 Z" fill="#FFF6A8"/>
  ${limb("M880 930 L878 990", SKIN, 16)}
  ${limb("M944 930 L946 990", SKIN, 16)}
  <path d="M862 680 L960 680 L966 916 L922 916 L912 800 L902 916 L856 916 Z" fill="#5A2F96"/>
  <path d="M852 912 L906 912 L908 942 L850 942 Z M918 912 L972 912 L974 942 L916 942 Z" fill="#5A2F96"/>
  <rect x="872" y="694" width="14" height="22" fill="#8D8FE0" stroke-width="7"/><rect x="904" y="694" width="14" height="22" fill="#8D8FE0" stroke-width="7"/><rect x="936" y="694" width="14" height="22" fill="#8D8FE0" stroke-width="7"/>
  <path d="M884 634 L908 662 L912 638 Z M936 634 L912 662 L908 638 Z" fill="#FFFFFF" stroke-width="9"/>
  <circle cx="910" cy="672" r="7" fill="#FFFFFF" stroke-width="6"/>
  <path d="M996 600 Q996 572 1012 566 L1018 540 Q1034 542 1030 572 Q1040 584 1030 610 Z" fill="${SKIN}" stroke-width="10"/>
  <path d="M898 606 L922 606 L922 634 L898 634 Z" fill="${SKIN}" stroke-width="10"/>
  <path d="M866 612 Q850 474 868 384 Q910 352 952 384 Q970 474 954 612 Q910 630 866 612 Z" fill="${SKIN}"/>
  <path d="M862 414 Q848 332 902 300 L912 332 Q932 286 974 298 L958 332 Q996 346 990 384 Q962 400 862 414 Z" fill="#5DBE3F"/>
  <circle cx="890" cy="452" r="27" fill="#FFFFFF" stroke-width="10"/><circle cx="932" cy="452" r="27" fill="#FFFFFF" stroke-width="10"/>
  <circle cx="896" cy="462" r="9" fill="${INK}" stroke="none"/><circle cx="938" cy="462" r="9" fill="${INK}" stroke="none"/>
  <path d="M863 448 A27 27 0 0 1 917 448 Z M905 448 A27 27 0 0 1 959 448 Z" fill="${SKIN}" stroke-width="10"/>
  <path d="M922 494 Q936 508 920 520" fill="none" stroke-width="9"/>
  <path d="M896 566 L926 566" fill="none" stroke-width="9"/>
  <path d="M866 478 Q850 486 856 508 Q864 514 870 506" fill="${SKIN}" stroke-width="10"/>`];

// The rocket exhaust: four flickering frames, played in turn (a flip-book, not a rig).
// Teardrop flames (round at the nozzle, flicking tail), four frames. Drawn tail-up;
// the site turns them upside down under the rocket.
const flameOuter = [
  "M160 20 Q232 150 254 300 Q262 420 160 432 Q58 420 66 300 Q88 150 160 20 Z",
  "M176 12 Q240 160 258 300 Q264 424 160 434 Q56 424 62 300 Q92 170 176 12 Z",
  "M146 30 Q226 150 250 300 Q258 418 160 430 Q62 418 70 300 Q80 150 146 30 Z",
  "M164 6 Q248 140 260 296 Q266 426 160 436 Q54 426 60 296 Q84 140 164 6 Z",
];
const flames = Object.fromEntries(flameOuter.map((outer, i) => {
  const tip = 110 + (i % 2) * 24, lean = (i % 3) * 8 - 8;
  return [`rocket_flame_${i + 1}`, [320, 450, `
  <path d="${outer}" fill="#F59A2A"/>
  <path d="M${160 + lean} ${tip} Q218 240 214 330 Q210 398 160 402 Q110 398 106 330 Q102 240 ${160 + lean} ${tip} Z" fill="#F8D705"/>`]];
}));

// Shaun the Sheep: woolly cream body, black face, big eyes, floppy ears, a curly
// tuft, a fluffy tail and four skinny black legs.
const bumps = (cx, cy, rx, ry, n, k = 1.18) => {
  const p = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry].map((v) => v.toFixed(0)).join(" ");
  let d = "M" + p(0);
  for (let i = 0; i < n; i++) {
    const am = ((i + 0.5) / n) * Math.PI * 2;
    d += ` Q${(cx + Math.cos(am) * rx * k).toFixed(0)} ${(cy + Math.sin(am) * ry * k).toFixed(0)} ${p(((i + 1) / n) * Math.PI * 2)}`;
  }
  return d + " Z";
};
const LEG = "#2B2B33", WOOL = "#F4F1E6";
const hoof = (x) => `<path d="M${x - 24} 812 L${x + 22} 812 Q${x + 32} 838 ${x + 6} 842 L${x - 28} 840 Q${x - 36} 826 ${x - 24} 812 Z" fill="${LEG}"/>`;
const shaun = [1100, 900, `
  ${limb("M330 600 L322 812", LEG, 28)}${limb("M700 610 L706 812", LEG, 28)}${hoof(322)}${hoof(706)}
  <path d="${bumps(900, 450, 74, 66, 9)}" fill="${WOOL}"/>
  <path d="${bumps(590, 470, 300, 150, 22)}" fill="${WOOL}"/>
  <path d="M430 420 q18 -18 36 0 M560 400 q18 -18 36 0 M690 430 q18 -18 36 0 M500 520 q18 -18 36 0 M640 540 q18 -18 36 0 M770 500 q18 -18 36 0" fill="none" stroke="#B9B2A0" stroke-width="9"/>
  ${limb("M380 600 L388 812", LEG, 28)}${limb("M770 600 L764 812", LEG, 28)}${hoof(388)}${hoof(764)}
  <path d="M150 300 Q60 268 30 330 Q80 362 168 344 Z" fill="${LEG}"/>
  <path d="M300 266 Q384 214 430 256 Q384 300 312 312 Z" fill="${LEG}"/>
  <path d="M150 300 Q140 210 240 205 Q345 205 335 320 L330 450 Q310 520 236 522 Q160 518 148 440 Z" fill="${LEG}"/>
  <path d="${bumps(245, 214, 70, 46, 10, 1.3)}" fill="${WOOL}"/>
  <circle cx="206" cy="318" r="34" fill="#FFFFFF" stroke-width="10"/><circle cx="278" cy="318" r="34" fill="#FFFFFF" stroke-width="10"/>
  <circle cx="214" cy="324" r="13" fill="${INK}" stroke="none"/><circle cx="286" cy="324" r="13" fill="${INK}" stroke="none"/>
  <path d="M206 452 Q240 474 282 452" fill="none" stroke="#8C8C96" stroke-width="10"/>
  <circle cx="222" cy="420" r="7" fill="#5A5A64" stroke="none"/><circle cx="262" cy="420" r="7" fill="#5A5A64" stroke="none"/>`];

// Timmy, the baby lamb: a round ball of wool with a big dark head, floppy ears,
// little dark arms and stubby legs, and his yellow dummy with a white ring.
const HEAD = "#3A3A42";
const timmy = [900, 900, `
  <ellipse cx="320" cy="808" rx="66" ry="46" fill="${LEG}"/>
  <ellipse cx="584" cy="814" rx="66" ry="46" fill="${LEG}"/>
  <path d="${bumps(450, 590, 250, 230, 20, 1.1)}" fill="${WOOL}"/>
  <path d="M360 560 q18 -18 36 0 M500 640 q18 -18 36 0 M420 720 q18 -18 36 0 M560 520 q18 -18 36 0" fill="none" stroke="#B9B2A0" stroke-width="9"/>
  ${limb("M205 470 Q150 560 168 680", HEAD, 46)}
  ${limb("M695 470 Q752 560 736 676", HEAD, 46)}
  <path d="M286 236 Q150 150 66 222 Q140 296 282 290 Z" fill="${HEAD}"/>
  <path d="M614 236 Q750 150 834 222 Q760 296 618 290 Z" fill="${HEAD}"/>
  <path d="M272 300 Q262 162 450 150 Q638 162 628 300 Q620 410 450 424 Q280 410 272 300 Z" fill="${HEAD}"/>
  <path d="${bumps(450, 150, 52, 30, 9, 1.35)}" fill="${WOOL}"/>
  <circle cx="398" cy="252" r="40" fill="#FFFFFF" stroke-width="10"/><circle cx="502" cy="252" r="40" fill="#FFFFFF" stroke-width="10"/>
  <circle cx="408" cy="258" r="16" fill="${INK}" stroke="none"/><circle cx="492" cy="258" r="16" fill="${INK}" stroke="none"/>
  <circle cx="450" cy="440" r="32" fill="none" stroke="${INK}" stroke-width="30"/>
  <circle cx="450" cy="440" r="32" fill="none" stroke="#F4F4F4" stroke-width="12"/>
  <ellipse cx="450" cy="368" rx="66" ry="46" fill="#F6C431"/>
  <path d="M432 386 L438 350 M468 386 L462 350 M440 386 Q450 398 460 386" fill="none" stroke="#6BA9D8" stroke-width="8"/>`];

// Mr. Bean's Teddy, after the reference: slumped back, the big pear-shaped head
// tilted to the right (wide at the top between two little round ears, the muzzle
// with a big glossy black nose at the bottom), both legs stuck out to the left
// with tan pads on the soles, the near arm hanging down in front with a tan paw.
const BEAR = "#9B6A3C", PAD = "#E0A866";
const teddy = [900, 1050, `
  <circle cx="410" cy="150" r="52" fill="${BEAR}"/><circle cx="404" cy="146" r="25" fill="${PAD}" stroke-width="9"/>
  <circle cx="850" cy="64" r="52" fill="${BEAR}"/><circle cx="856" cy="60" r="25" fill="${PAD}" stroke-width="9"/>
  <!-- back leg, out to the left -->
  <path d="M500 640 Q300 600 95 598 Q32 608 34 652 Q40 694 98 694 Q300 704 500 742 Z" fill="${BEAR}"/>
  <path d="M118 600 Q44 600 34 650 Q42 696 118 694 Q92 648 118 600 Z" fill="${PAD}"/>
  <!-- the far arm, a tan paw tucked between the legs -->
  <path d="M440 668 Q392 670 376 700 Q388 728 438 724 Z" fill="${PAD}"/>
  <!-- body, leaning back -->
  <path d="M600 480 Q470 540 418 660 Q386 790 446 902 Q540 980 662 952 Q760 902 762 760 Q760 610 700 500 Z" fill="${BEAR}"/>
  <path d="M520 600 Q530 700 520 800" fill="none" stroke-width="9"/>
  <!-- front leg, out to the left -->
  <path d="M560 822 Q360 806 158 818 Q100 830 104 872 Q112 912 164 912 Q370 918 572 930 Z" fill="${BEAR}"/>
  <path d="M182 818 Q108 822 104 870 Q112 914 182 912 Q154 866 182 818 Z" fill="${PAD}"/>
  <!-- near arm hanging down in front -->
  <path d="M700 590 Q742 750 726 930 Q716 978 668 974 Q634 966 640 918 Q666 762 640 626 Z" fill="${BEAR}"/>
  <path d="M642 912 Q634 968 672 976 Q718 974 724 918 Q684 932 642 912 Z" fill="${PAD}"/>
  <!-- head: a tilted pear, wide at the top, muzzle at the bottom right -->
  <path d="M410 168 Q520 52 760 40 Q878 46 872 190 Q866 320 790 430 Q722 520 640 516 Q570 506 530 420 Q470 300 410 168 Z" fill="${BEAR}"/>
  <circle cx="640" cy="300" r="15" fill="${INK}" stroke="none"/><circle cx="700" cy="282" r="15" fill="${INK}" stroke="none"/>
  <ellipse cx="712" cy="386" rx="66" ry="46" transform="rotate(-12 712 386)" fill="${INK}"/>
  <ellipse cx="690" cy="370" rx="20" ry="10" transform="rotate(-12 690 370)" fill="#FFFFFF" stroke="none"/>`];

export const extraDoodles = { pf_rocket, ...flames, shaun, timmy, teddy };
