import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GRID_TILE, GROOVE_DEPTH, LIP_DROP, SLOT_Z, STRIPS, WALL_Z } from "../layout";
import { HAND, MARGIN_CELLS, contactShadow, gridPaper, groundPaper, handwriting, marginStrip, roadDashes, stickyNote, toTexture, whenFont } from "../textures";
import PaperCutout, { Art, Card, Stick } from "./PaperCutout";
import { STRUCTURES } from "./Structures";
import { EVENTS } from "./Events";
import { GAME_EVENTS } from "./GameEvents";
import { STREET_EVENTS } from "./StreetEvents";
import { CRYPTO_EVENTS } from "./CryptoEvents";

const WALL_BOTTOM = -4;
const WALL_TOP = 13;
const BOTTOM = -4;
const UV_UNIT = GRID_TILE;
const GRID_CELL = GRID_TILE / 16; // one small ô ly square
const MARGIN_W = GRID_CELL * MARGIN_CELLS;
// The margin replaces one vertical grid line, like in a real notebook.
const snapToLine = (x) => Math.round(x / GRID_CELL) * GRID_CELL;
const INK = "#2C2C2C";

const shadowOn = (opacity) => new THREE.ShadowMaterial({ opacity, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
const wallShadow = shadowOn(0.4);
const groundShadow = shadowOn(0.32);

const wallPaper = gridPaper({ seed: 3 });
const marginMap = marginStrip();

/**
 * The back wall: one continuous sheet of ô ly notebook paper from x0 to x1, its
 * grid anchored to world coordinates, plus a red margin line at the start of
 * every page (scene).
 */
export function PaperWall({ x0, x1, margins = [] }) {
  const w = x1 - x0;
  const h = WALL_TOP - WALL_BOTTOM;
  const material = useMemo(() => {
    const map = wallPaper.clone();
    map.repeat.set(w / GRID_TILE, h / GRID_TILE);
    map.offset.set(x0 / GRID_TILE, WALL_BOTTOM / GRID_TILE);
    map.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map });
  }, [x0, w, h]);
  const marginMaterial = useMemo(() => {
    const map = marginMap.clone();
    map.repeat.set(1, h / GRID_TILE);
    map.offset.set(0, WALL_BOTTOM / GRID_TILE); // horizontal rules line up with the wall's
    map.needsUpdate = true;
    return new THREE.MeshBasicMaterial({ map });
  }, [h]);
  return (
    <group position={[(x0 + x1) / 2, WALL_BOTTOM + h / 2, WALL_Z]}>
      <mesh name="paperWall" material={material}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {margins.map((x, i) => (
        <mesh key={i} name="paperMargin" position={[snapToLine(x) - (x0 + x1) / 2, 0, 0.001]} material={marginMaterial}>
          <planeGeometry args={[MARGIN_W, h]} />
        </mesh>
      ))}
      <mesh material={wallShadow} receiveShadow position={[0, 0, 0.003]}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

// --- ground -----------------------------------------------------------------

// `shade`: one shade for the face, or [foot, top] to darken it towards its foot (the sides,
// lit from above), by height between y0 and y1
let foot = [0, 1];
const quad = (pos, uv, col, a, b, c, d, ua, ub, uc, ud, shade) => {
  for (const [p, u] of [[a, ua], [b, ub], [c, uc], [a, ua], [c, uc], [d, ud]]) {
    pos.push(...p);
    uv.push(...u);
    const k = Array.isArray(shade) ? shade[0] + (shade[1] - shade[0]) * Math.min(1, Math.max(0, (p[1] - foot[0]) / (foot[1] - foot[0]))) : shade;
    col.push(k, k, k);
  }
};

/** Box without a bottom face; world-space UVs so the notebook rules line up across strips. */
function paperBox(x0, x1, y0, y1, z0, z1) {
  const pos = [], uv = [], col = [];
  foot = [Math.max(y0, y1 - 2.2), y1]; // the shading runs over the top 2.2 units
  const U = (v) => v / UV_UNIT;
  // top: rules run front-to-back (constant x)
  quad(pos, uv, col, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [U(z1), U(x0)], [U(z1), U(x1)], [U(z0), U(x1)], [U(z0), U(x0)], 1);
  // front (+z) and back (-z): vertical rules
  quad(pos, uv, col, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [U(y0), U(x0)], [U(y0), U(x1)], [U(y1), U(x1)], [U(y1), U(x0)], [0.62, 0.86]);
  quad(pos, uv, col, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [U(y0), U(x1)], [U(y0), U(x0)], [U(y1), U(x0)], [U(y1), U(x1)], [0.52, 0.74]);
  // sides
  quad(pos, uv, col, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [U(y0), U(z1)], [U(y0), U(z0)], [U(y1), U(z0)], [U(y1), U(z1)], [0.66, 0.88]);
  quad(pos, uv, col, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [U(y0), U(z0)], [U(y0), U(z1)], [U(y1), U(z1)], [U(y1), U(z0)], [0.66, 0.88]);
  return finish(pos, uv, col);
}

/** The bevelled front lip: slopes down from the front strip, then drops vertically. */
function lipGeometry(x0, x1, g) {
  const pos = [], uv = [], col = [];
  const [z0, z1] = STRIPS.lip;
  const yb = g - LIP_DROP;
  const U = (v) => v / UV_UNIT;
  const slope = Math.hypot(z1 - z0, LIP_DROP);
  foot = [Math.max(BOTTOM, yb - 2.2), yb];
  quad(pos, uv, col, [x0, yb, z1], [x1, yb, z1], [x1, g, z0], [x0, g, z0], [0, U(x0)], [0, U(x1)], [U(slope), U(x1)], [U(slope), U(x0)], 0.95);
  quad(pos, uv, col, [x0, BOTTOM, z1], [x1, BOTTOM, z1], [x1, yb, z1], [x0, yb, z1], [U(BOTTOM), U(x0)], [U(BOTTOM), U(x1)], [U(yb), U(x1)], [U(yb), U(x0)], [0.62, 0.88]);
  // side triangles closing the lip
  for (const [x, s] of [[x0, 1], [x1, -1]]) {
    const tri = s > 0 ? [[x, g, z0], [x, yb, z1], [x, BOTTOM, z1], [x, g, z0], [x, BOTTOM, z1], [x, BOTTOM, z0]] : [[x, g, z0], [x, BOTTOM, z1], [x, yb, z1], [x, g, z0], [x, BOTTOM, z0], [x, BOTTOM, z1]];
    for (const p of tri) { pos.push(...p); uv.push(U(p[1]), U(p[2])); col.push(0.82, 0.82, 0.82); }
  }
  return finish(pos, uv, col);
}

function finish(pos, uv, col) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// hand-coloured ground paper (textures.js groundPaper): one texture per colour,
// shared; a groove reuses its neighbour's, dimmed by the material colour
const groundMaps = new Map();
const paperMaterials = new Map();
function paperMaterial(color, dim = 1) {
  const key = `${color}|${dim}`;
  if (!paperMaterials.has(key)) {
    if (!groundMaps.has(color)) groundMaps.set(color, groundPaper(color));
    paperMaterials.set(key, new THREE.MeshBasicMaterial({ map: groundMaps.get(color), color: new THREE.Color(dim, dim, dim), vertexColors: true, side: THREE.DoubleSide }));
  }
  return paperMaterials.get(key);
}

/**
 * The stage a scene stands on, with Mr. Panda's measured profile plus a second
 * groove: back strip | groove A | mid strip | groove B | front strip | lip.
 */
export function Ground({ x0, x1, height: g, strips, roadDashes: dashes }) {
  const parts = useMemo(() => {
    const back = strips.back, mid = strips.mid || back, front = strips.front || back;
    const list = [
      { geo: paperBox(x0, x1, BOTTOM, g, ...STRIPS.back), color: back },
      { geo: paperBox(x0, x1, BOTTOM, g - GROOVE_DEPTH.grooveA, ...STRIPS.grooveA), color: strips.grooveA || back, dim: strips.grooveA ? 1 : 0.62 },
      { geo: paperBox(x0, x1, BOTTOM, g, ...STRIPS.mid), color: mid },
      { geo: paperBox(x0, x1, BOTTOM, g - GROOVE_DEPTH.grooveB, ...STRIPS.grooveB), color: strips.grooveB || mid, dim: strips.grooveB ? 1 : 0.66 },
      { geo: paperBox(x0, x1, BOTTOM, g, ...STRIPS.front), color: front },
      { geo: lipGeometry(x0, x1, g), color: front },
    ];
    return list.map((p) => ({ ...p, material: paperMaterial(p.color, p.dim) }));
  }, [x0, x1, g, strips]);
  const fade = useMemo(() => contactShadow(x1 - x0), [x0, x1]);
  const dashMaterial = useMemo(() => {
    if (!dashes) return null;
    const t = roadDashes();
    t.repeat.set((x1 - x0) / 1.5, 1);
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
  }, [dashes, x0, x1]);
  const midZ = (STRIPS.mid[0] + STRIPS.mid[1]) / 2;
  return (
    <group>
      {parts.map((p, i) => (
        <group key={i}>
          <mesh geometry={p.geo} material={p.material} />
          <mesh geometry={p.geo} material={groundShadow} receiveShadow />
        </group>
      ))}
      {/* soft contact shadow where the back strip meets the wall */}
      <mesh position={[(x0 + x1) / 2, g + 0.45, WALL_Z + 0.006]}>
        <planeGeometry args={[x1 - x0, 0.9]} />
        <meshBasicMaterial map={fade} transparent depthWrite={false} />
      </mesh>
      {dashMaterial && (
        <mesh position={[(x0 + x1) / 2, g + 0.003, midZ]} rotation={[-Math.PI / 2, 0, 0]} material={dashMaterial}>
          <planeGeometry args={[x1 - x0, 0.09]} />
        </mesh>
      )}
    </group>
  );
}

// --- the wall's mood -----------------------------------------------------------

/**
 * A shade laid over the wall that deepens along a scene (wall.gloom: [[x, alpha],
 * ...] in scene x), a little lighter towards the foot of the wall: the light
 * going out of the day. Wall writing and everything standing in front stays
 * as it is.
 */
function WallGloom({ x0, x1, stops, color = "#151a2c" }) {
  const material = useMemo(() => {
    const W = 512, H = 64, w = x1 - x0;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, W, 0);
    for (const [x, a] of stops) {
      const v = Math.round(255 * a);
      g.addColorStop(Math.min(1, Math.max(0, x / w)), `rgb(${v},${v},${v})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const foot = ctx.createLinearGradient(0, 0, 0, H); // the image's foot is the wall's foot
    foot.addColorStop(0, "rgba(0,0,0,0)");
    foot.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = foot;
    ctx.fillRect(0, 0, W, H);
    return new THREE.MeshBasicMaterial({ color, alphaMap: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  }, [x0, x1, stops, color]);
  return (
    <mesh position={[(x0 + x1) / 2, (WALL_BOTTOM + WALL_TOP) / 2, WALL_Z + 0.004]} material={material}>
      <planeGeometry args={[x1 - x0, WALL_TOP - WALL_BOTTOM]} />
    </mesh>
  );
}

// --- wall writing -------------------------------------------------------------

/** Handwriting straight on the paper, anchored at its bottom-left corner. */
export function WallText({ body, x, y, size = 0.24, color = INK, tilt = 0 }) {
  const { texture, ratio, em } = useMemo(() => handwriting(body, { px: 96, color }), [body, color]);
  const h = size * em;
  const w = h * ratio;
  return (
    <mesh position={[x + w / 2, y + h / 2, WALL_Z + 0.012]} rotation={[0, 0, tilt]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.08} depthWrite={false} />
    </mesh>
  );
}

/** A sticky note pinned on the wall with a bubble-letter header. */
export function StickyNote({ title, color, x, y, tilt = 0, size = 1.25 }) {
  const { texture } = useMemo(() => stickyNote(title, color), [title, color]);
  return (
    <group position={[x, y, WALL_Z + 0.05]} rotation={[0, 0, tilt]}>
      <Card texture={texture} w={size} h={size} depth={0.012} receive={false} />
    </group>
  );
}

// --- groove B traffic ---------------------------------------------------------

/** "BÍP BÍP!" in bubble letters: a Vietnamese motorbike saying hello. */
let honkMap = null;
function honkTexture() {
  if (honkMap) return honkMap;
  const W = 512, H = 200;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = `120px ${HAND}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 18;
    ctx.strokeStyle = "#151515";
    ctx.strokeText("BÍP BÍP!", W / 2, H / 2);
    ctx.fillStyle = "#F8D705";
    ctx.fillText("BÍP BÍP!", W / 2, H / 2);
  };
  draw();
  honkMap = toTexture(c);
  whenFont(draw, honkMap);
  return honkMap;
}

/**
 * Something that strolls back and forth along groove B, turning round at the
 * ends. honk: a motorbike that toots "BÍP BÍP!" every few seconds. dz: its own
 * depth in the groove, so two movers passing each other never z-fight.
 */
function TrafficMover({ mover, x0, x1, g, dz = 0 }) {
  const ref = useRef();
  const body = useRef();
  const honk = useRef();
  const honkMat = useMemo(() => (mover.honk ? new THREE.MeshBasicMaterial({ map: honkTexture(), transparent: true, depthWrite: false }) : null), [mover.honk]);
  const margin = 0.7;
  const L = x1 - x0 - margin * 2;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = (((t * mover.speed) / L + mover.phase * 2) % 2 + 2) % 2;
    const dir = p < 1 ? 1 : -1;
    const x = x0 + margin + (p < 1 ? p : 2 - p) * L;
    ref.current.position.x = x;
    // art faces right unless marked otherwise; flip like a paper puppet turning
    // (noTurn: a crab scuttles sideways both ways without turning round)
    const facing = (mover.faces === "left" ? -1 : 1) * (mover.noTurn ? 1 : dir);
    ref.current.scale.x += (facing - ref.current.scale.x) * 0.12;
    if (honk.current) {
      const h = (t + mover.phase * 9) % 5.5;
      const on = h < 0.8;
      honk.current.visible = on;
      const s = on ? 0.6 + 0.4 * Math.min(1, h / 0.12) : 0.01;
      honk.current.scale.set(s * Math.sign(ref.current.scale.x || 1), s, 1); // never mirrored
    }
    const step = mover.noTurn ? 14 : 7; // little legs go faster
    body.current.position.y = Math.abs(Math.sin(t * step + mover.phase * 10)) * 0.045;
    body.current.rotation.z = Math.sin(t * step + mover.phase * 10) * 0.035;
  });
  return (
    <group ref={ref} position={[x0 + margin, g - 0.16, SLOT_Z.laneB + dz]}>
      <group ref={body}>
        <Art art={mover.art}>{({ texture, ratio, shapes }) => <Card texture={texture} shapes={shapes} w={mover.h * ratio} h={mover.h} />}</Art>
      </group>
      <Stick from={0.15} to={-GROOVE_DEPTH.grooveB + 0.12} />
      {honkMat && (
        <mesh ref={honk} material={honkMat} position={[0.2, mover.h + 0.35, 0.1]} visible={false} renderOrder={5}>
          <planeGeometry args={[1.1, 0.43]} />
        </mesh>
      )}
    </group>
  );
}

/** A whole scene: ground, wall writing, cut-outs and its traffic. */
export function PaperScene({ scene }) {
  const g = scene.ground;
  const w = scene.wall || {};
  return (
    <group>
      <Ground x0={scene.x0} x1={scene.x1} height={g} strips={scene.strips} roadDashes={scene.roadDashes} />
      {w.gloom && <WallGloom x0={scene.x0} x1={scene.x1} stops={w.gloom} />}
      {w.sticky && <StickyNote {...w.sticky} x={scene.x0 + w.sticky.x} y={g + w.sticky.y} />}
      {w.text && <WallText {...w.text} x={scene.x0 + w.text.x} y={g + w.text.y} />}
      {(w.extra || []).map((t, i) => <WallText key={i} {...t} x={scene.x0 + t.x} y={g + t.y} />)}
      {scene.items.map((item, i) => (
        <PaperCutout key={i} item={item} base={[scene.x0, g]} />
      ))}
      {(scene.structures || []).map((s, i) => {
        const Structure = STRUCTURES[s.type] || EVENTS[s.type] || GAME_EVENTS[s.type] || STREET_EVENTS[s.type] || CRYPTO_EVENTS[s.type];
        return <Structure key={i} {...s} position={[scene.x0 + s.x, g]} />;
      })}
      {(scene.traffic || []).map((m, i) => (
        // range: [from, to] in scene x keeps it to part of the groove
        <TrafficMover key={i} mover={m} x0={scene.x0 + (m.range ? m.range[0] : 0)} x1={m.range ? scene.x0 + m.range[1] : scene.x1} g={g} dz={(i - (scene.traffic.length - 1) / 2) * 0.08} />
      ))}
    </group>
  );
}
