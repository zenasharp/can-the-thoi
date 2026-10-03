// World layout, after the measured Mr. Panda ground profile (see DESIGN.md):
//
//  wall | back strip | groove A | mid strip | groove B | front strip | lip
//       |  landmarks |  me +    | characters|  traffic |  framing    | bevel
//       |            |  vehicle |           |          |             |
//
// Coordinates are three.js (Y up). The camera flies along +x looking towards -z.
import * as THREE from "three";
import { scenes } from "../content/site";

export const SCENE_WIDTH = 12; // default; a scene can set its own `width`
export const WORLD_START_X = -21;
export const WALL_Z = -2.8;

// Ground cross-section (z ranges), shared by every scene.
export const STRIPS = {
  back: [WALL_Z, -1.65],
  grooveA: [-1.65, -1.2],
  mid: [-1.2, -0.45],
  grooveB: [-0.45, -0.1],
  front: [-0.1, 1.2],
  lip: [1.2, 1.85],
};
export const GROOVE_DEPTH = { grooveA: 0.75, grooveB: 0.5 };
export const LIP_DROP = 1.6;

// Where things stand, by depth slot.
export const SLOT_Z = {
  wall: WALL_Z + 0.03,
  back: -2.25,
  laneA: (STRIPS.grooveA[0] + STRIPS.grooveA[1]) / 2,
  mid: -0.85,
  laneB: (STRIPS.grooveB[0] + STRIPS.grooveB[1]) / 2,
  front: 0.45,
  sky: WALL_Z + 0.5, // clouds: floating off the wall so they cast a shadow on it
};
export const HERO_Z = SLOT_Z.laneA;

let cursor = WORLD_START_X;
export const sceneRanges = scenes.map((s, i) => {
  const x0 = cursor;
  cursor += s.width || SCENE_WIDTH;
  return { ...s, index: i, x0, x1: cursor };
});
export const WORLD_END_X = sceneRanges[sceneRanges.length - 1].x1;

// After the last scene comes the sky "seam" (Mr. Panda's single-sheet zone): the
// world jumps one loop ahead while the camera is up here. It must be wider than
// the zoomed-out view (~15 units) so neither world end is visible at the jump.
export const SEAM_WIDTH = 17;
const FIRST_X = -20.2;
const LAST_X = WORLD_END_X + SEAM_WIDTH;
export const WORLD_LENGTH = LAST_X - FIRST_X; // scroll-progress 0..1 covers this
export const SHIFT_X_AMOUNT = LAST_X - FIRST_X + 6.62;
// One tile of the ô ly paper (4 x 4 big squares, ~1.78 units). Chosen so the loop
// shift is a whole number of tiles: the grid lines up again after every loop.
export const GRID_TILE = SHIFT_X_AMOUNT / Math.round(SHIFT_X_AMOUNT / 1.78);

export const groundAt = (x) => {
  const s = sceneRanges.find((r) => x >= r.x0 && x < r.x1);
  if (s) return s.ground;
  return x < WORLD_START_X ? sceneRanges[0].ground : sceneRanges[sceneRanges.length - 1].ground;
};

export const sceneIndexAt = (x) => {
  const local = ((((x - WORLD_START_X) % SHIFT_X_AMOUNT) + SHIFT_X_AMOUNT) % SHIFT_X_AMOUNT) + WORLD_START_X;
  const s = sceneRanges.find((r) => local >= r.x0 && local < r.x1);
  return s ? s.index : -1; // -1 = sky seam
};

// Camera, after the reference: it opens close up on the hello note and me, low
// and looking straight at the wall, then pulls back over the first ~8 units
// into the zoomed-out diorama view: high above the ground (~4.5), ~13.5 from the
// wall and tilted down so the stage sits in the lower third and the frame
// bottom lands on the front lip. A gentle in/out breathing keeps the paper
// layers parallaxing.
export const CAMERA = {
  intro: { height: 1.55, z: 5.6, tilt: -0.03 }, // the opening close-up
  height: 4.5,
  z: 10.7,
  breathe: 0.6,
  tilt: -0.2,
  zoomOutOver: 8, // world units after the start
};
const smooth = (t) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };
const STEPS = Math.max(12, Math.round(WORLD_LENGTH / 2.7));
export const initialCameraPoints = Array.from({ length: STEPS }, (_, i) => {
  const t = i / (STEPS - 1);
  const x = FIRST_X + t * (LAST_X - FIRST_X);
  const out = smooth((x - FIRST_X) / CAMERA.zoomOutOver); // 0 close-up .. 1 zoomed out
  const inSeam = x > WORLD_END_X;
  const g = groundAt(Math.min(x, WORLD_END_X - 0.01));
  const height = CAMERA.intro.height + (CAMERA.height - CAMERA.intro.height) * out;
  const y = g + height + (inSeam ? 0.4 + (x - WORLD_END_X) * 0.25 : 0);
  const z = CAMERA.intro.z + (CAMERA.z - CAMERA.intro.z) * out + Math.sin(t * Math.PI * 3) * CAMERA.breathe * out;
  return new THREE.Vector3(x, y, z);
});
export const cameraCurve = new THREE.CatmullRomCurve3(initialCameraPoints);
cameraCurve.curveType = "centripetal";

export const progressAt = (x) => (x - FIRST_X) / (LAST_X - FIRST_X);
// Loop bookkeeping (see Scene.jsx): the world jumps ahead while the camera is in
// the middle of the seam; the seam sheets switch sides mid-world.
export const TRIGGERS = {
  worldForward: progressAt(WORLD_END_X + SEAM_WIDTH * 0.55),
  worldBack: progressAt(WORLD_END_X + SEAM_WIDTH * 0.5),
  seamForward: 0.5,
  seamBack: 0.35,
};
export const rotationTargets = [
  { progress: 0, rotation: new THREE.Euler(CAMERA.intro.tilt, -0.16, 0) },
  { progress: progressAt(FIRST_X + CAMERA.zoomOutOver * 0.5), rotation: new THREE.Euler((CAMERA.intro.tilt + CAMERA.tilt) / 2, -0.08, 0) },
  { progress: progressAt(FIRST_X + CAMERA.zoomOutOver), rotation: new THREE.Euler(CAMERA.tilt, -0.03, 0) },
  ...sceneRanges.slice(1).map((s, i) => ({
    progress: progressAt(s.x0 + 2),
    rotation: new THREE.Euler(CAMERA.tilt - 0.02, i % 2 ? -0.04 : 0.05, 0),
  })),
  { progress: progressAt(WORLD_END_X), rotation: new THREE.Euler(CAMERA.tilt + 0.08, 0.04, 0) },
  { progress: 1, rotation: new THREE.Euler(-0.02, 0.05, 0) },
];

// Hero path: same x stations as the camera so the hero stays centred; rides at
// ground level in groove A, and lifts off with the rocket through the seam.
export const initialHeroPoints = initialCameraPoints.map((p) => {
  const inSeam = p.x > WORLD_END_X;
  const g = groundAt(Math.min(p.x, WORLD_END_X - 0.01));
  const y = inSeam ? g + 0.6 + (p.x - WORLD_END_X) * 0.32 : g;
  return new THREE.Vector3(p.x, y, HERO_Z);
});
export const heroCurve = new THREE.CatmullRomCurve3(initialHeroPoints);
