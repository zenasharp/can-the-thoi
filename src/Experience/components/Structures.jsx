// Paper structures that straddle groove A so I ride *through* them, after
// Mr. Panda's torii gate: every part is a thin hand-cut card (wobbly edges, thick
// ink outline, flat colour, notebook rules), and the parts are layered at
// slightly different depths. A door / gate leaf swings open as I arrive (gsap,
// like the reference's Pyramid_Door).
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { HERO_Z } from "../layout";
import { heroState } from "../heroState";
import { HAND, grain, toTexture, whenFont } from "../textures";

// Turned so the opening faces along the lane (+x) but leans ~29° toward the camera.
const THETA = -Math.PI / 2 + 0.5;
// Leaf rotation that lays it parallel to the wall (forward along the lane).
const OPEN_FLAT = -THETA;
const OPEN_BEFORE = 3.4; // start opening this far before I reach it
const CLOSE_AFTER = 2.2; // close again once I'm this far past
const THICK = 0.022;
const PPU = 230; // canvas pixels per world unit
const INK = "#1A1A1A";

const edgeMaterial = new THREE.MeshBasicMaterial({ color: "#E6DCC8" });
const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
/** Quad with a slightly narrower top, like a hand-cut post. */
const post = (cx, w, y0, y1, taper = 0.12) => [[cx - w / 2, y0], [cx + w / 2, y0], [cx + (w / 2) * (1 - taper), y1], [cx - (w / 2) * (1 - taper), y1]];

/** Subdivide a polygon and nudge it sideways: scissors never cut a straight line. */
function wobble(pts, seed, amp = 0.012, step = 0.07) {
  const out = [];
  let k = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / step));
    const nx = -(by - ay) / (len || 1), ny = (bx - ax) / (len || 1);
    for (let s = 0; s < n; s++, k++) {
      const t = s / n;
      const d = amp * (0.6 * Math.sin(k * 2.31 + seed * 1.7) + 0.4 * Math.sin(k * 0.73 + seed * 3.1));
      out.push([ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d]);
    }
  }
  return out;
}

/**
 * One hand-cut card: polygon `pts` (+ optional `holes`) in local units, painted
 * on a canvas (fill, notebook rules, grain, `deco`, ink outline) and extruded to
 * paper thickness. Returns { geometry, texture }.
 */
function makePart({ pts, holes = [], fill, rules = "v", deco, seed = 1, amp = 0.012 }) {
  const outer = wobble(pts, seed, amp);
  const inner = holes.map((h, i) => wobble(h, seed + i * 7 + 3, amp * 0.5, 0.05));
  const xs = outer.map((p) => p[0]), ys = outer.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = maxX - minX, H = maxY - minY;
  const cw = Math.ceil(W * PPU), ch = Math.ceil(H * PPU);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  const texture = toTexture(canvas);
  const px = ([x, y]) => [(x - minX) * PPU, (maxY - y) * PPU];
  const trace = () => {
    ctx.beginPath();
    for (const loop of [outer, ...inner]) {
      loop.forEach((p, i) => (i ? ctx.lineTo(...px(p)) : ctx.moveTo(...px(p))));
      ctx.closePath();
    }
  };
  const draw = () => {
    ctx.clearRect(0, 0, cw, ch);
    trace();
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.save();
    trace();
    ctx.clip("evenodd");
    if (rules) {
      ctx.strokeStyle = "rgba(120,140,165,0.32)";
      ctx.lineWidth = 2;
      const gap = 0.16 * PPU;
      for (let v = gap * 0.6; v < (rules === "v" ? cw : ch); v += gap) {
        ctx.beginPath();
        if (rules === "v") { ctx.moveTo(v, 0); ctx.lineTo(v, ch); } else { ctx.moveTo(0, v); ctx.lineTo(cw, v); }
        ctx.stroke();
      }
    }
    grain(ctx, cw, ch, (cw * ch) / 150, seed);
    deco?.(ctx, px);
    ctx.restore();
    // half of the stroke falls outside the cut, so this reads as ~0.022 units
    trace();
    ctx.lineWidth = 0.045 * PPU;
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    ctx.stroke();
  };
  draw();
  whenFont(draw, texture);

  const norm = ([x, y]) => new THREE.Vector2((x - minX) / W, (y - minY) / H);
  const shape = new THREE.Shape(outer.map(norm));
  shape.holes = inner.map((h) => new THREE.Path(h.map(norm)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 1 });
  geometry.scale(W, H, THICK);
  geometry.translate(minX, minY, -THICK / 2);
  geometry.computeVertexNormals();
  return { geometry, texture };
}

/** A hand-cut card in the scene: casts and receives soft shadows. */
function Part({ position = [0, 0, 0], rotation, ...spec }) {
  const { geometry, texture } = useMemo(() => makePart(spec), []); // eslint-disable-line react-hooks/exhaustive-deps
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }), [texture]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} material={[face, edgeMaterial]} castShadow />
      <mesh geometry={geometry} material={shadowMaterial} receiveShadow />
    </group>
  );
}

/** Call `onChange(open)` when I come close to / move away from `anchor`. */
function useOpenNear(anchor, onChange) {
  const state = useRef({ open: false, v: new THREE.Vector3() });
  useFrame(() => {
    if (!anchor.current) return;
    const s = state.current;
    anchor.current.getWorldPosition(s.v);
    const d = heroState.x - s.v.x;
    const near = d > -OPEN_BEFORE && d < CLOSE_AFTER;
    if (near !== s.open) {
      s.open = near;
      onChange(near);
    }
  });
}

/**
 * Doraemon's Anywhere Door: a pink frame of three cards and a door leaf that
 * swings open as I ride up.
 */
export function AnywhereDoor({ position }) {
  const W = 1.25, H = 2.55, T = 0.17;
  const PINK = "#F27AAE", PINK_DARK = "#D85A93", KNOB = "#F7C948";
  const anchor = useRef();
  const leaf = useRef();
  useOpenNear(anchor, (open) => {
    gsap.to(leaf.current.rotation, { y: open ? OPEN_FLAT - 0.12 : 0, duration: open ? 1.1 : 0.8, ease: open ? "back.out(1.4)" : "power2.inOut" });
  });
  const leafDeco = (ctx, px) => {
    // inset panel + knob, drawn like the rest: flat colour and ink
    const [x0, y0] = px([0.16, H - 0.2]);
    const [x1, y1] = px([W - 0.16, 0.22]);
    ctx.fillStyle = PINK_DARK;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.022 * PPU;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    const [kx, ky] = px([W - 0.1, H * 0.47]);
    ctx.beginPath();
    ctx.arc(kx, ky, 0.065 * PPU, 0, Math.PI * 2);
    ctx.fillStyle = KNOB;
    ctx.fill();
    ctx.stroke();
  };
  return (
    <group ref={anchor} position={[position[0], position[1], HERO_Z]} rotation={[0, THETA, 0]}>
      <Part pts={post(-(W + T) / 2, T, 0, H + T, 0.06)} fill={PINK} seed={11} />
      <Part pts={post((W + T) / 2, T, 0, H + T, 0.06)} fill={PINK} seed={12} />
      <Part pts={[[-W / 2 - T - 0.06, H], [W / 2 + T + 0.06, H - 0.02], [W / 2 + T + 0.03, H + T + 0.04], [-W / 2 - T - 0.03, H + T + 0.06]]} fill={PINK} rules="h" seed={13} position={[0, 0, 0.03]} />
      {/* the leaf, hinged on the wall-side post */}
      <group ref={leaf} position={[-W / 2, 0, 0]}>
        <Part pts={rect(0.02, 0.02, W - 0.02, H - 0.02)} fill={PINK} seed={14} deco={leafDeco} />
      </group>
    </group>
  );
}

/** Holes that turn a leaf card into a grille: cells between bars and rails. */
function grilleHoles(w, bars, bar, rails) {
  const holes = [];
  const pitch = (w - bar) / (bars - 1);
  for (let r = 0; r < rails.length - 1; r++) {
    const ya = rails[r][1], yb = rails[r + 1][0];
    for (let i = 0; i < bars - 1; i++) holes.push(rect(i * pitch + bar, ya, (i + 1) * pitch, yb));
  }
  return holes;
}

/**
 * A Vietnamese school gate: two yellow pillars, a red arched sign on little posts
 * and a two-leaf grille gate that swings open for me. Graduation: through it into
 * adult life.
 */
export function SchoolGate({ position, sign = "TRƯỜNG TIỂU HỌC" }) {
  const W = 1.5, H = 2.35, P = 0.34;
  const YELLOW = "#F2CB4A", CAP = "#D9A93A", RED = "#DD3F2E", GREY = "#9AA1A8", CREAM = "#FFF6DF";
  const anchor = useRef();
  const left = useRef();
  const right = useRef();
  const leafW = W / 2 - 0.03, leafY0 = 0.06, leafY1 = 1.45, bar = 0.05;
  const rails = [[leafY0, leafY0 + 0.07], [0.72, 0.79], [leafY1 - 0.07, leafY1]];
  const leafSpec = { pts: rect(0, leafY0, leafW, leafY1), holes: grilleHoles(leafW, 6, bar, rails), fill: GREY, rules: null, amp: 0.006 };
  useOpenNear(anchor, (open) => {
    gsap.to(left.current.rotation, { y: open ? OPEN_FLAT + 0.1 : 0, duration: 1.2, ease: open ? "power2.out" : "power2.inOut" });
    gsap.to(right.current.rotation, { y: open ? OPEN_FLAT - Math.PI - 0.1 : 0, duration: 1.2, ease: open ? "power2.out" : "power2.inOut", delay: open ? 0.12 : 0 });
  });
  const signW = W + P * 2 + 0.34, signH = 0.5, signY = H + 0.38;
  // gently arched top edge, hand-cut
  const signPts = [[-signW / 2, signY], [signW / 2, signY], ...Array.from({ length: 9 }, (_, i) => {
    const t = 1 - i / 8;
    return [-signW / 2 + t * signW, signY + signH + Math.sin(t * Math.PI) * 0.12];
  })];
  const signDeco = (ctx, px) => {
    const [cx, cy] = px([0, signY + signH * 0.5]);
    ctx.font = `${0.27 * PPU}px ${HAND}`;
    ctx.fillStyle = CREAM;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sign, cx, cy);
  };
  const pillarX = W / 2 + P / 2;
  return (
    <group ref={anchor} position={[position[0], position[1], HERO_Z]} rotation={[0, THETA, 0]}>
      {[-1, 1].map((s, i) => (
        <group key={s}>
          <Part pts={post(s * pillarX, P, 0.08, H, 0.08)} fill={YELLOW} seed={21 + i} />
          <Part pts={rect(s * pillarX - P / 2 - 0.06, H - 0.02, s * pillarX + P / 2 + 0.06, H + 0.11)} fill={CAP} rules="h" seed={23 + i} position={[0, 0, 0.025]} />
          <Part pts={rect(s * pillarX - P / 2 - 0.05, 0, s * pillarX + P / 2 + 0.05, 0.12)} fill={CAP} rules="h" seed={25 + i} position={[0, 0, 0.025]} />
          <Part pts={rect(s * pillarX - 0.03, H + 0.08, s * pillarX + 0.03, signY + 0.04)} fill={GREY} rules={null} seed={27 + i} position={[0, 0, -0.02]} amp={0.004} />
        </group>
      ))}
      <Part pts={signPts} fill={RED} rules="h" seed={29} deco={signDeco} position={[0, 0, 0.015]} />
      <group ref={left} position={[-W / 2, 0, 0]}>
        <Part {...leafSpec} seed={31} />
      </group>
      <group ref={right} position={[W / 2, 0, 0]} scale={[-1, 1, 1]}>
        <Part {...leafSpec} seed={32} />
      </group>
    </group>
  );
}

export const STRUCTURES = { anywhereDoor: AnywhereDoor, schoolGate: SchoolGate };
