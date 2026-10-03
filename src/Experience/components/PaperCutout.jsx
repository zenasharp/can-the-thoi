import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import manifest from "../../content/art-manifest.json";
import { SLOT_Z, WALL_Z } from "../layout";
import { placeholderCutout } from "../textures";
import { heroState } from "../heroState";

const _v = new THREE.Vector3();
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const CARD_DEPTH = 0.035;
const EDGE_COLOR = "#E2D8C4";
const STICK_COLOR = "#B08155";
const RECT = [[0, 0, 1, 0, 1, 1, 0, 1]];

// Start every drawing loading at once (React 19 would otherwise suspend on one
// texture at a time).
// drawings are served from public/art, under the site's base path (see vite.config.js)
export const artUrl = (key) => `${import.meta.env.BASE_URL}art/${key}.webp`;
for (const key of Object.keys(manifest)) useTexture.preload(artUrl(key));

/**
 * A drawing extruded into a piece of card: the silhouette traced by
 * scripts/prep_art.mjs is the outline, the drawing is printed on both faces and
 * the sides are bare paper. Anchored at its bottom centre, front face at z = 0.
 */
export function cardGeometry(shapes, w, h, depth = CARD_DEPTH) {
  const list = (shapes && shapes.length ? shapes : RECT).map((flat) => {
    const pts = [];
    for (let i = 0; i < flat.length; i += 2) pts.push(new THREE.Vector2(flat[i], flat[i + 1]));
    return new THREE.Shape(pts);
  });
  const g = new THREE.ExtrudeGeometry(list, { depth: 1, bevelEnabled: false, curveSegments: 1 });
  // Cap UVs are the shape coordinates (0..1), i.e. exactly the texture space.
  g.translate(-0.5, 0, -1);
  g.scale(w, h, depth);
  g.computeVertexNormals();
  return g;
}

const edgeMaterial = new THREE.MeshBasicMaterial({ color: EDGE_COLOR });
const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });

/** The drawing's texture + silhouette, or a generated placeholder card. Render prop. */
export function Art({ art, label, color, ratio = 1, children }) {
  const meta = art && manifest[art];
  return meta
    ? <LoadedArt art={art} meta={meta}>{children}</LoadedArt>
    : <PlaceholderArt label={label || art || "?"} color={color} ratio={ratio}>{children}</PlaceholderArt>;
}

function LoadedArt({ art, meta, children }) {
  const texture = useTexture(artUrl(art));
  const value = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { texture, ratio: meta.w / meta.h, shapes: meta.shapes, strings: meta.strings };
  }, [texture, meta]);
  return children(value);
}

function PlaceholderArt({ label, color, ratio, children }) {
  const value = useMemo(() => ({ ...placeholderCutout(label, color || "#ddd", ratio), shapes: RECT }), [label, color, ratio]);
  return children(value);
}

/**
 * The card mesh itself: casts a shadow, receives shadows from cards in front of
 * it (ShadowMaterial overlay, so the drawing keeps its exact colours).
 */
// alphaTest: lower it for drawings with very thin lines (balloon strings) so they
// survive being shown small (mipmapping averages them with the empty paper).
export function Card({ texture, shapes, w, h, flip = false, depth = CARD_DEPTH, receive = true, alphaTest = 0.5, onPointerEnter, onPointerLeave, onClick, visible = true }) {
  const geometry = useMemo(() => cardGeometry(shapes, w, h, depth), [shapes, w, h, depth]);
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, alphaTest, side: THREE.DoubleSide }), [texture, alphaTest]);
  return (
    <group scale={[flip ? -1 : 1, 1, 1]} visible={visible}>
      <mesh geometry={geometry} material={[face, edgeMaterial]} castShadow onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onClick={onClick} />
      {receive && <mesh geometry={geometry} material={shadowMaterial} receiveShadow />}
    </group>
  );
}

export function Stick({ from, to, x = 0, z = -CARD_DEPTH - 0.03 }) {
  const len = from - to;
  return (
    <mesh position={[x, (from + to) / 2, z]} castShadow>
      <cylinderGeometry args={[0.022, 0.022, len, 6]} />
      <meshBasicMaterial color={STICK_COLOR} />
    </mesh>
  );
}

/**
 * One drawing standing in the paper world. `base` is [x, y] of the scene's left
 * edge on the ground.
 */
export default function PaperCutout({ item, base }) {
  return (
    <Art art={item.art} label={item.label} color={item.color} ratio={item.ratio}>
      {(tex) => <CutoutBody item={item} base={base} {...tex} />}
    </Art>
  );
}

const stringMaterial = new THREE.MeshBasicMaterial({ color: "#1A1A1A", side: THREE.DoubleSide });

/**
 * Strings (e.g. balloon strings) drawn as thin ink ribbons with a slight
 * hand-drawn wobble, from uv segments exported by prep_art.mjs. They sit just
 * behind the card, so the drawing hides their ends and they show through the
 * empty paper in between.
 */
function Strings({ segments, w, h, width = 0.022, z = -CARD_DEPTH - 0.004 }) {
  const geometry = useMemo(() => {
    const pos = [];
    const N = 8;
    segments.forEach(([u0, v0, u1, v1], k) => {
      const ax = (u0 - 0.5) * w, ay = v0 * h, bx = (u1 - 0.5) * w, by = v1 * h;
      const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
      const pts = Array.from({ length: N + 1 }, (_, i) => {
        const t = i / N, j = Math.sin(t * Math.PI) * 0.025 * Math.sin(k * 1.7 + 0.5) + Math.sin(t * 9 + k) * 0.004;
        return [ax + (bx - ax) * t + nx * j, ay + (by - ay) * t + ny * j];
      });
      for (let i = 0; i < N; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], o = width / 2;
        pos.push(x0 - nx * o, y0 - ny * o, z, x0 + nx * o, y0 + ny * o, z, x1 + nx * o, y1 + ny * o, z,
          x0 - nx * o, y0 - ny * o, z, x1 + nx * o, y1 + ny * o, z, x1 - nx * o, y1 - ny * o, z);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [segments, w, h, width, z]);
  return <mesh geometry={geometry} material={stringMaterial} castShadow />;
}

function CutoutBody({ item, base, texture, ratio, shapes, strings }) {
  const h = item.h;
  const w = h * ratio;
  const onWall = item.z === "wall";
  // A tiny per-item depth offset so two cards in the same slot never z-fight.
  const jitter = onWall ? 0 : (((Math.round(item.x * 100) * 37) % 11) - 5) * 0.004;
  const z = (typeof item.z === "number" ? item.z : SLOT_Z[item.z || "mid"]) + jitter;
  const outer = useRef();
  const inner = useRef();
  const hovered = useRef(false);
  const seed = useMemo(() => (item.x * 7.13 + h * 3.7) % 10, [item.x, h]);

  // Animation presets, after the useFrame wobbles in Mr. Panda's SceneOne / Moving_Objects.
  useFrame((state) => {
    const t = state.clock.elapsedTime + seed;
    const o = inner.current;
    if (!o) return;
    switch (item.anim) {
      case "bob":
        o.position.y = Math.abs(Math.sin(t * 2.2)) * 0.07;
        break;
      case "sway":
        o.rotation.z = (item.tilt || 0) + Math.sin(t * 0.9) * 0.05;
        break;
      case "grass":
        o.scale.y = 0.9 + 0.1 * Math.sin(t * 3);
        break;
      case "dangle": // hanging from its string: swings around the attachment point
        o.rotation.z = Math.sin(t * 1.5) * 0.11 + Math.sin(t * 0.6) * 0.04;
        break;
      case "rise": { // lifts off as I ride past it: up to `rise` units over ±`riseSpan`
        outer.current.getWorldPosition(_v);
        const span = item.riseSpan || 7;
        const target = sstep(-span, span, heroState.x - _v.x) * (item.rise || 2.2);
        o.position.y += (target + Math.sin(t * 1.1) * 0.06 - o.position.y) * 0.06;
        o.rotation.z = Math.sin(t * 0.8) * 0.04;
        break;
      }
      case "float":
        o.position.y = Math.sin(t * 1.3) * 0.12;
        o.rotation.z = (item.tilt || 0) + Math.sin(t * 0.7) * 0.07; // tilt: lies at an angle, like flotsam
        break;
      case "glide": { // a big flyer drifting to and fro over the scene (glide: x range),
        // turning round like a paper puppet at each end; the art faces left
        const range = item.glide || 3;
        const u = t * 0.16;
        o.position.x = Math.sin(u) * range;
        o.position.y = Math.sin(u * 2.3) * 0.25 + Math.sin(t * 2.6) * 0.06;
        const facing = Math.cos(u) > 0 ? -1 : 1;
        o.scale.x += (facing - o.scale.x) * 0.05;
        o.scale.y = 1 + Math.sin(t * 2.6) * 0.035; // wing beats
        o.rotation.z = -Math.cos(u) * 0.06 + Math.sin(t * 2.6) * 0.02;
        break;
      }
      case "pop": {
        const target = hovered.current ? 0.35 : 0;
        o.position.z += (target - o.position.z) * 0.1;
        o.rotation.z = hovered.current ? Math.sin(t * 8) * 0.05 : 0;
        break;
      }
    }
  });

  const pointer = item.anim === "pop"
    ? {
        onPointerEnter: () => { hovered.current = true; document.body.style.cursor = "pointer"; },
        onPointerLeave: () => { hovered.current = false; document.body.style.cursor = ""; },
      }
    : {};

  // Hanging items (hang: string length): `y` is the attachment point; the card
  // hangs below it on a thread and swings around that point.
  if (item.hang) {
    const len = item.hang;
    return (
      <group position={[base[0] + item.x, base[1] + item.y, z + (item.dz || 0)]}>
        <group ref={inner}>
          <mesh position={[0, -len / 2, -0.005]}>
            <boxGeometry args={[0.012, len, 0.004]} />
            <meshBasicMaterial color="#3A3A3A" />
          </mesh>
          <group position={[0, -len - h, 0]}>
            <Card texture={texture} shapes={shapes} w={w} h={h} flip={item.flip} {...pointer} />
          </group>
        </group>
      </group>
    );
  }

  // Wall items are pinned flat; everything else stands with its feet slightly
  // sunk into the paper so there is no gap between card and ground.
  const y = base[1] + (item.y || 0) - (onWall ? 0 : 0.02);
  return (
    <group ref={outer} position={[base[0] + item.x, y, (onWall ? WALL_Z + 0.06 : z) + (item.dz || 0)]}>
      <group ref={inner} rotation={[0, 0, item.tilt || 0]}>
        <Card texture={texture} shapes={shapes} w={w} h={h} flip={item.flip} depth={onWall ? 0.02 : CARD_DEPTH} alphaTest={item.alphaTest} {...pointer} />
        {strings && <Strings segments={strings} w={w} h={h} />}
        {item.stick && <Stick from={h * 0.4} to={-1.2} />}
      </group>
    </group>
  );
}
