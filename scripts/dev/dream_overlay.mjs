// Check the hand-traced Honda Dream (scripts/rig_pf_boypho.mjs) against its photo:
// the trace, half see-through, over the photo at 3x. Writes raw_art/_screens/dream_overlay.png.
import sharp from "sharp";
import { dream } from "../rig_pf_boypho.mjs";
import { STROKE } from "../wobble.mjs";
const S = 3, W = 500, H = 305;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * S}" height="${H * S}"><g transform="scale(${S})" opacity="0.55"><g ${STROKE.replace(/stroke-width="[^"]*"/, `stroke-width="${(17 / 2.2).toFixed(2)}"`)}>${dream}</g></g></svg>`;
await sharp("raw_art/_refs/street/honda_dream.png").resize(W * S, H * S).composite([{ input: Buffer.from(svg) }]).toFile("raw_art/_screens/dream_overlay.png");
console.log("wrote raw_art/_screens/dream_overlay.png");
