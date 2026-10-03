// Preview a rigged vehicle with me sitting on it, at the sizes the site uses:
//   node scripts/preview_ride.mjs <rig> <vehicleH> <heroArt> <heroH> [out]
import sharp from "sharp";
import fs from "fs";
const [rigName, vehicleH, heroArt, heroH, out = `raw_art/_screens/ride_${rigName}.png`] = process.argv.slice(2);
const rig = JSON.parse(fs.readFileSync("src/content/rigs.json", "utf8"))[rigName];
const boxes = Object.values(rig.parts);
const top = Math.min(...boxes.map((p) => p.y)), bottom = Math.max(...boxes.map((p) => p.y + p.h));
const s = Number(vehicleH) / (bottom - top);
const heroPx = Math.round(Number(heroH) / s);
const meta = await sharp(`public/art/${heroArt}.webp`).metadata();
const heroW = Math.round((heroPx * meta.width) / meta.height);
const hero = await sharp(`public/art/${heroArt}.webp`).resize(heroW, heroPx).png().toBuffer();
const W = rig.canvas.w, H = rig.canvas.h + heroPx;
const composed = await sharp({ create: { width: W, height: H, channels: 3, background: "#F4EDE0" } })
  .composite([
    { input: rig.src ? await sharp(`public/art/${rig.src}.webp`).png().toBuffer() : `raw_art/_screens/rig_${rigName}.png`, left: 0, top: heroPx },
    { input: hero, left: Math.round(rig.seat[0] - heroW / 2), top: Math.round(rig.seat[1]) },
  ]).png().toBuffer();
await sharp(composed).resize(null, 640).toFile(out);
console.log(out, "scale", s.toFixed(5));
