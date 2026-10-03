// Shared "drawn with a mouse" look for the hand-coded SVG art: two displacement
// passes (a slow wobble + a fine jitter) bend every outline like the artist's
// Krita lines. Displacement is in canvas coordinates, so parts of one rig that
// are drawn on the same canvas wobble identically and still fit together.
export const INK = "#151515";
export const STROKE = `stroke="${INK}" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"`;

export const wobbleDefs = (W, H, seed = 7) => `<defs><filter id="wob" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="-60" y="-60" width="${W + 120}" height="${H + 120}">
  <feTurbulence type="fractalNoise" baseFrequency="0.0085" numOctaves="2" seed="${seed}" result="n1"/>
  <feDisplacementMap in="SourceGraphic" in2="n1" scale="22" xChannelSelector="R" yChannelSelector="G" result="d1"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="1" seed="${seed + 4}" result="n2"/>
  <feDisplacementMap in="d1" in2="n2" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter></defs>`;

/** A full SVG document: white background (optional), wobbly ink group. */
// wobble: false skips the filter (for tiles that must match edge to edge; they
// get their hand-drawn jitter in the drawing itself)
export const doodleSvg = (W, H, body, { background = "#fff", seed, wobble = true } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${wobble ? wobbleDefs(W, H, seed) : ""}${background ? `<rect width="${W}" height="${H}" fill="${background}"/>` : ""}<g${wobble ? ` filter="url(#wob)"` : ""}><g ${STROKE}>${body}</g></g></svg>`;

/** A thick limb: an ink stroke under a coloured stroke. */
export const limb = (d, color, w = 34) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 28}"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
