// Hand-coded SVG doodles for the Vietnamese street scene, used by draw_doodles.mjs.
import { INK, limb } from "./wobble.mjs";
import { puff } from "./doodles_crypto.mjs";

// A sparrow sitting on the wire (side view, facing right) and the same bird
// flapping away (wings up): the two frames of its flip-book.
const sparrowBody = `
  <path d="M30 80 L6 66 L12 92 Z" fill="#6E5440" stroke-width="8"/>
  <path d="M28 82 Q40 44 82 44 Q118 44 126 70 Q128 100 92 108 Q50 112 28 82 Z" fill="#9A7650" stroke-width="8"/>
  <path d="M60 96 Q86 112 112 96 Q100 84 76 86 Z" fill="#E9DCC0" stroke-width="7"/>
  <circle cx="106" cy="44" r="26" fill="#9A7650" stroke-width="8"/>
  <path d="M96 30 Q108 18 124 30 Q112 34 96 30 Z" fill="#5A4030" stroke-width="6"/>
  <path d="M130 46 L150 52 L130 58 Z" fill="#E2B33A" stroke-width="6"/>
  <circle cx="114" cy="42" r="6" fill="${INK}" stroke="none"/>`;
const sparrow = [170, 150, `
  ${sparrowBody}
  <path d="M46 70 Q74 58 96 74 Q76 90 46 70 Z" fill="#6E5440" stroke-width="7"/>
  <path d="M74 110 L70 132 M90 110 L94 132" fill="none" stroke-width="7"/>`];
const sparrowFly = [170, 170, `
  <g transform="translate(0 20)">${sparrowBody}</g>
  <path d="M58 92 Q40 30 70 6 Q86 48 90 90 Z" fill="#6E5440" stroke-width="7"/>
  <path d="M74 94 Q96 40 130 28 Q118 70 98 96 Z" fill="#7E6248" stroke-width="7"/>`];

// The little ad slips plastered over walls and poles: a paper rectangle, a bold
// headline and a phone number (fake), slightly crooked, with a strip of tape.
const T = `font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" stroke="none"`;
const adSlip = (w, h, paper, lines, phone, ink) => [w + 40, h + 50, `
  <rect x="20" y="30" width="${w}" height="${h}" rx="6" fill="${paper}" stroke-width="9"/>
  <rect x="${20 + w / 2 - 40}" y="16" width="80" height="30" fill="#E9E2CF" stroke-width="6" opacity="0.9"/>
  ${lines.map(([text, size, y], i) => `<text x="${20 + w / 2}" y="${30 + y}" font-size="${size}" fill="${i === 0 ? ink : INK}" ${T}>${text}</text>`).join("")}
  <text x="${20 + w / 2}" y="${30 + h - 22}" font-size="30" fill="${INK}" ${T}>${phone}</text>`];

// A glass of bia hơi: the classic thick ribbed glass, golden beer with two ice
// cubes, and a fat head of white foam spilling over the rim.
const beerGlass = [200, 300, `
  <path d="M40 70 L160 70 L148 270 Q100 286 52 270 Z" fill="#F2B83A"/>
  <path d="M60 110 L66 250 M100 110 L100 262 M140 110 L134 250" fill="none" stroke="#D99A22" stroke-width="9"/>
  <rect x="62" y="150" width="34" height="34" rx="6" fill="#FFF6D8" stroke-width="7" transform="rotate(12 79 167)"/>
  <rect x="104" y="196" width="30" height="30" rx="6" fill="#FFF6D8" stroke-width="7" transform="rotate(-8 119 211)"/>
  <path d="M30 78 Q28 40 62 42 Q72 18 100 26 Q128 14 140 40 Q174 40 170 78 Q150 92 120 84 Q100 96 78 84 Q48 94 30 78 Z" fill="#FFFFFF"/>
  <path d="M150 84 Q160 104 152 116" fill="none" stroke="#FFFFFF" stroke-width="14"/>`];

// Điếu cày, the bamboo water pipe that lives next to every trà đá stall: a long
// bamboo tube with its nodes, the little wooden bowl (nõ) sticking out low on
// its side, and a few wisps of smoke curling out of the top.
const dieuCay = [300, 1000, `
  <path d="M150 40 Q118 70 146 100 Q172 130 140 160" fill="none" stroke="#B9B4AA" stroke-width="14"/>
  <path d="M178 20 Q206 46 182 74" fill="none" stroke="#C9C4BA" stroke-width="11"/>
  <rect x="100" y="170" width="90" height="790" rx="20" fill="#D8B46A"/>
  <ellipse cx="145" cy="174" rx="44" ry="14" fill="#5E4220"/>
  <path d="M102 360 Q145 376 188 360 M102 560 Q145 576 188 560 M102 780 Q145 796 188 780" fill="none" stroke="#A47E3A" stroke-width="12"/>
  <path d="M120 230 L120 340 M120 400 L120 530 M120 600 L120 750" fill="none" stroke="#F0D79A" stroke-width="10"/>
  <rect x="98" y="452" width="94" height="40" rx="8" fill="#D6392B" stroke-width="10"/>
  ${limb("M184 700 L250 640", "#8A5A2B", 22)}
  <path d="M232 612 L286 612 L276 652 L242 652 Z" fill="#5E3E1F" stroke-width="10"/>
  <ellipse cx="259" cy="612" rx="27" ry="8" fill="#2A1A0E" stroke-width="8"/>
  <rect x="96" y="930" width="98" height="40" rx="12" fill="#A47E3A"/>`];

// --- the boy phố's blade scraping the road: scribbled sparks (three variants); the
// grey smoke from the exhaust is the dust puff, in grey
const spark = (k) => {
  const n = 5 + k, pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + k * 0.4;
    const r = i % 2 ? 26 + k * 4 : 78 + ((i * 37) % 3) * 12;
    pts.push(`${(100 + Math.cos(a) * r).toFixed(0)} ${(100 + Math.sin(a) * r).toFixed(0)}`);
  }
  return [200, 200, `<path d="M${pts.join(" L")} Z" fill="#FFD23F" stroke-width="11"/>
    <circle cx="100" cy="100" r="${16 + k * 2}" fill="#FF8A1F" stroke="none"/>`, { transparent: true, seed: 5 + k }];
};

export const streetDoodles = {
  "street/spark_1": spark(0),
  "street/spark_2": spark(1),
  "street/spark_3": spark(2),
  "street/smoke_1": puff("#E4E4E4", "#6E6E6E", "#CFCFCF", 0),
  "street/smoke_2": puff("#E4E4E4", "#6E6E6E", "#CFCFCF", 1),
  "street/smoke_3": puff("#E4E4E4", "#6E6E6E", "#CFCFCF", 2),
  "street/dieu_cay": dieuCay,
  "street/beer_glass": beerGlass,
  "street/ad_khoan": adSlip(330, 200, "#FFFFFF", [["KHOAN CẮT", 46, 62], ["BÊ TÔNG", 46, 114]], "090x.xxx.xxx", "#D6392B"),
  "street/ad_phong": adSlip(300, 220, "#FFF3A8", [["CHO THUÊ", 44, 62], ["PHÒNG", 52, 120], ["giá rẻ - có gác", 26, 156]], "098x.xxx.xxx", "#2B5BD6"),
  "street/ad_daykem": adSlip(320, 230, "#E3F1FF", [["DẠY KÈM", 46, 62], ["TOÁN • LÝ • HOÁ", 30, 108], ["lớp 1 - 12", 28, 150]], "091x.xxx.xxx", "#D6392B"),
  "street/sparrow": sparrow,
  "street/sparrow_fly": sparrowFly,
};
