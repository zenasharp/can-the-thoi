import sharp from "sharp";
import { HAND_STROKES, HAND_VIEWBOX } from "../../src/components/handwriting.js";
const [x, y, w, h] = HAND_VIEWBOX;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 3}" height="${h * 3}" viewBox="${x} ${y} ${w} ${h}">
<defs><filter id="ink" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter></defs>
<rect width="100%" height="100%" fill="#fff"/>
<path d="M0 100 L480 100 M0 60 L480 60" stroke="#cdd" stroke-width="0.6"/>
<g filter="url(#ink)" fill="none" stroke="#1d3c8f" stroke-linecap="round" stroke-linejoin="round">
${HAND_STROKES.map((d, i) => `<path d="${d}" stroke-width="4.2"/>`).join("")}
</g>
${HAND_STROKES.map((d, i) => { const m = d.match(/M(\S+) (\S+)/); return `<text x="${m[1]}" y="${m[2]}" font-size="8" fill="red">${i}</text>`; }).join("")}
</svg>`;
await sharp(Buffer.from(svg)).png().toFile("raw_art/_screens/hand.png");
console.log("ok");
