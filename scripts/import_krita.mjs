// Copy the hand-drawn Krita art into raw_art/ (then run prep_art.mjs).
// .kra files are zip archives; their flattened picture is `mergedimage.png`.
//
//   node scripts/import_krita.mjs [kritaDir=E:/Krita]
import fs from "fs";
import path from "path";
import zlib from "zlib";
import sharp from "sharp";

const KRITA = process.argv[2] || "E:/Krita";

// raw_art target  <-  Krita source (.kra or .png)
const SOURCES = {
  "hero/hero_base": "newwww/Main Char.PNG",
  "hero/hero_games": "new char.kra",
  "street/yellow_wall": "tường.kra",
  "street/street_sign": "Street Sign.kra",
  "street/sun": "Sun.kra",
  "street/apple_tree": "Tree apple.kra",
  "street/bike": "Bike.kra",
  "childhood/robo_apple": "robo fruity apple.kra",
};

function readZipEntry(file, name) {
  const buf = fs.readFileSync(file);
  // End of central directory record
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip");
  let p = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const entry = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (entry === name) {
      const lnl = buf.readUInt16LE(local + 26);
      const lel = buf.readUInt16LE(local + 28);
      const data = buf.subarray(local + 30 + lnl + lel, local + 30 + lnl + lel + size);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found`);
}

const load = (rel) => {
  const file = path.join(KRITA, rel);
  return rel.endsWith(".kra") ? readZipEntry(file, "mergedimage.png") : fs.readFileSync(file);
};

// Trim the white / transparent canvas around a drawing.
// (Two passes: sharp may trim before flattening, which fails on transparent canvases.)
const trimmed = async (input) => {
  const flat = await sharp(input).flatten({ background: "#ffffff" }).png().toBuffer();
  return sharp(flat).trim({ background: "#ffffff", threshold: 12 }).png().toBuffer();
};

for (const [target, rel] of Object.entries(SOURCES)) {
  const out = path.join("raw_art", `${target}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await trimmed(load(rel)));
  console.log("imported", target, "<-", rel);
}

// The street costume: the base character riding the bike (character behind the frame).
const bike = sharp(fs.readFileSync("raw_art/street/bike.png"));
const bm = await bike.metadata();
const charH = Math.round(bm.height * 1.45);
const char = await sharp(fs.readFileSync("raw_art/hero/hero_base.png")).resize({ height: charH }).png().toBuffer();
const cm = await sharp(char).metadata();
const bikeTop = charH - Math.round(bm.height * 0.7); // feet around the pedals
const H = bikeTop + bm.height;
const left = Math.round(bm.width * 0.45 - cm.width / 2); // between saddle and handlebar
const W = Math.max(bm.width, left + cm.width) + Math.max(0, -left);
await sharp({ create: { width: W, height: H, channels: 4, background: "#ffffff" } })
  .composite([
    { input: char, left: Math.max(0, left), top: 0 },
    // multiply: the bike's white canvas vanishes, its frame and wheels sit over the legs
    { input: await bike.png().toBuffer(), left: Math.max(0, -left), top: bikeTop, blend: "multiply" },
  ])
  .png()
  .toBuffer()
  .then((b) => fs.writeFileSync("raw_art/hero/hero_street.png", b));
console.log("composed hero/hero_street (character on the bike)");

// Bike rig: frame and wheels are separate, canvas-aligned layers in Krita, so the
// wheels can spin on the site. Positions are kept in canvas pixels (bike-rig.json).
const BIKE = {
  frame: "Bike/2-Khung xe.PNG",
  wheel_back: "Bike/0-Paint Layer 1 Merged.PNG",
  wheel_front: "Bike/front wheel.PNG",
};
const rig = {};
for (const [part, rel] of Object.entries(BIKE)) {
  const { data, info } = await sharp(path.join(KRITA, rel)).ensureAlpha().trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join("raw_art", "vehicles", `bike_${part}.png`), data);
  rig[part] = { x: -info.trimOffsetLeft, y: -info.trimOffsetTop, w: info.width, h: info.height };
  console.log("imported vehicles/bike_" + part, rig[part]);
}
fs.writeFileSync("src/content/bike-rig.json", JSON.stringify(rig, null, 2) + "\n");
