// The sticker on the notebook cover (NotebookIntro): me in my childhood costume
// WITH the bamboo-copter. In the site the blades are a separate drawing put back
// on my head while I fly (split_copter.mjs, CopterBlades in Hero.jsx), so the
// costume alone has only the stub; here they are glued back on, at the same spot
// (src/content/copter.json, in the raw drawing's pixels).
//
//   node scripts/dev/intro_sticker.mjs   (writes public/art/intro/sticker_childhood.webp)
import fs from "fs";
import sharp from "sharp";

const copter = JSON.parse(fs.readFileSync("src/content/copter.json", "utf8"));
const BODY = "public/art/hero/hero_childhood.webp", BLADES = "public/art/hero/copter_blades.webp";
const OUT = "public/art/intro/sticker_childhood.webp";

const { body, blades, source } = copter;
const bodyMeta = await sharp(BODY).metadata();
const bladesMeta = await sharp(BLADES).metadata();
// prep_art pads every trimmed drawing by 6 px (in raw px, before any downscale to 1400 tall)
const padBody = 6 / Math.min(1, 1400 / source.h);
const s = bodyMeta.height / (body.h + padBody * 2); // webp px per raw px
const toBody = (rx, ry) => [(rx - body.x + padBody) * s, (ry - body.y + padBody) * s];
// the blades' webp starts 6 px (unscaled) before their trimmed box
const [bx, by] = toBody(blades.x - 6, blades.y - 6);
const bw = Math.round(bladesMeta.width * s), bh = Math.round(bladesMeta.height * s);
const top = Math.max(0, Math.ceil(-by));

const bladesImg = await sharp(BLADES).resize(bw, bh).png().toBuffer();
await sharp({ create: { width: bodyMeta.width, height: bodyMeta.height + top, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    { input: await sharp(BODY).png().toBuffer(), left: 0, top },
    { input: bladesImg, left: Math.round(bx), top: Math.round(by + top) },
  ])
  .webp({ quality: 90 })
  .toFile(OUT);
console.log(`wrote ${OUT} ${bodyMeta.width}x${bodyMeta.height + top}; blades at ${Math.round(bx)}, ${Math.round(by + top)} (${bw}x${bh})`);
