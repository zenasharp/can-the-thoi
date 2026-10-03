// "Cấn Thế Thôi", handwritten: the pen strokes in the order a Vietnamese hand
// writes them (each word's letters first, then its marks: the circumflex, then
// the acute), as SVG paths in a 480 x 130 box (baseline at y 100, x-height 40,
// ascenders up to y 20). Each path is one stroke: the pen goes down at its
// start and lifts at its end. Used by NotebookIntro to write the title as the
// site loads.
export const HAND_VIEWBOX = [0, 0, 480, 130];

export const HAND_STROKES = [
  // C
  "M47 33 C40 21 20 22 12 42 C4 63 9 91 29 98 C39 101 47 96 51 89",
  // a, joined to n
  "M89 70 C85 60 69 58 63 71 C57 85 62 100 72 98 C80 96 86 85 89 71 C89 85 89 97 93 99 C97 99 99 84 100 66 C101 80 101 92 101 100 C103 80 111 63 121 64 C129 65 128 82 128 99 C129 103 133 102 137 97",
  // â's circumflex
  "M64 53 L72 43 L80 53",
  // the acute
  "M83 39 L94 25",
  // T: the bar, then the stem with a little hook
  "M160 29 C176 25 196 24 216 27",
  "M188 28 C188 50 187 78 185 98 C184 104 178 104 175 99",
  // h: the stem, then the arch running on into e
  "M224 19 C224 48 222 78 220 100",
  "M221 80 C225 64 242 60 246 72 C248 81 247 92 248 100 C251 102 254 93 259 87 C269 87 282 85 281 74 C280 63 264 62 258 72 C252 85 256 100 268 100 C276 100 281 96 284 91",
  // ê's circumflex, then the acute
  "M260 54 L268 44 L277 54",
  "M280 40 L291 26",
  // T
  "M318 30 C334 26 354 25 372 27",
  "M345 28 C345 50 344 78 342 98 C341 104 336 104 333 99",
  // h, o
  "M380 19 C380 48 378 78 376 100",
  "M377 80 C381 64 398 60 402 72 C404 81 403 92 404 100 C406 102 409 92 414 84 C420 72 434 72 438 84 C442 96 432 103 422 100 C413 97 412 85 418 79 C424 74 434 76 440 80",
  // i
  "M447 70 C447 82 446 92 448 100 C450 103 455 101 459 95",
  // ô's circumflex, then the dot on the i
  "M412 56 L420 46 L429 56",
  "M447 53 L449 56",
];
