// Split the bamboo-copter blades off the childhood costume so they can spin.
// Reads raw_art/hero/hero_childhood_full.png (the generated costume), writes
//   raw_art/hero/hero_childhood.png  the costume with the blades erased (stick kept)
//   raw_art/hero/copter_blades.png   the blades on their own
// and src/content/copter.json with both trimmed boxes and the hub (raw px), so
// Hero.jsx can put the blades back exactly where they were. Then run prep_art.mjs.
import fs from "fs";
import sharp from "sharp";

const SRC = "raw_art/hero/hero_childhood_full.png";
const CUT_Y = 88; // everything above this row is the propeller (blades + hub)
const HUB = [472, 45];

if (!fs.existsSync(SRC)) fs.copyFileSync("raw_art/hero/hero_childhood.png", SRC);
const img = sharp(SRC).flatten({ background: "#ffffff" });
const { width: W, height: H } = await img.metadata();

// costume without the blades
const body = await sharp(SRC).flatten({ background: "#ffffff" })
  .composite([{ input: { create: { width: W, height: CUT_Y, channels: 3, background: "#ffffff" } }, left: 0, top: 0 }])
  .png().toBuffer();
fs.writeFileSync("raw_art/hero/hero_childhood.png", body);
const bodyTrim = await sharp(body).trim({ background: "#ffffff", threshold: 12 }).toBuffer({ resolveWithObject: true });

// the blades alone (a few rows of overlap so nothing gaps at the hub)
const blades = await sharp(SRC).flatten({ background: "#ffffff" }).extract({ left: 0, top: 0, width: W, height: CUT_Y + 4 }).png().toBuffer();
const bladesTrim = await sharp(blades).trim({ background: "#ffffff", threshold: 12 }).toBuffer({ resolveWithObject: true });
fs.writeFileSync("raw_art/hero/copter_blades.png", bladesTrim.data);

const box = (t) => ({ x: -t.info.trimOffsetLeft, y: -t.info.trimOffsetTop, w: t.info.width, h: t.info.height });
const out = { source: { w: W, h: H }, body: box(bodyTrim), blades: box(bladesTrim), hub: HUB };
fs.writeFileSync("src/content/copter.json", JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out));
