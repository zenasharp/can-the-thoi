// Lets the loading cover (NotebookIntro) borrow the world's canvas. Filled in
// by <IntroBridge> inside the Canvas (Experience.jsx):
// - capture(Z, paperWidth): renders the world's current frame and returns a copy of it, plus
//   the wall's paper alone seen Z times wider (src/Experience/introCapture.js),
//   so the cover can draw the scene on the notebook's first page, on the same paper;
// - frame(): the element that holds the world's canvas, which the cover
//   transforms to sit exactly on that page, then zooms up to full screen.
export const introBridge = { capture: null, frame: null };
