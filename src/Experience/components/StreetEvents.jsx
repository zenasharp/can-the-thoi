// Set pieces of the Vietnamese street: power poles strung with a tangle of
// sagging wires, sparrows on the wires that fly off as I ride by, the ward
// loudspeaker (loa phường) playing its morning tune, and a sidewalk beer table
// whose glasses clink "DZÔ!" as I pass.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import rigs from "../../content/rigs.json";
import { SLOT_Z } from "../layout";
import { HAND, toTexture, whenFont } from "../textures";
import { ArtCard, rigLayout, rigPart, usePassTrigger } from "./Events";

const wireMaterial = new THREE.MeshBasicMaterial({ color: "#1A1A1A", side: THREE.DoubleSide });

// deterministic "random" so the tangle looks the same on every visit
const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** A wire sagging from a to b (3D points), as a thin ribbon facing the camera. */
function wirePoints(a, b, sag, n = 26) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  });
}
function ribbonGeometry(lines, width = 0.022) {
  const pos = [];
  for (const pts of lines) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0, z0] = pts[i], [x1, y1, z1] = pts[i + 1];
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * width / 2, ny = (dx / len) * width / 2 + (len < 0.02 ? width / 2 : 0);
      pos.push(x0 - nx, y0 - ny, z0, x0 + nx, y0 + ny, z0, x1 + nx, y1 + ny, z1, x0 - nx, y0 - ny, z0, x1 + nx, y1 + ny, z1, x1 - nx, y1 - ny, z1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** "♪" / "♫" in ink with a paper-white outline. */
function noteTexture(ch) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  ctx.font = `bold 100px "Segoe UI Symbol", "DejaVu Sans", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#F4EDE0";
  ctx.strokeText(ch, S / 2, S / 2);
  ctx.fillStyle = "#1A1A1A";
  ctx.fillText(ch, S / 2, S / 2);
  return toTexture(c);
}

/**
 * A row of power poles along the street (`poles`: x offsets), strung with sagging
 * wires between their insulators plus a few stray ones crossing every span (the
 * famous tangle), and drop wires to the houses behind (`houseDrops`). Sparrows
 * sit on one span and fly off when I come by. One pole carries the ward
 * loudspeakers, which keep sending music notes floating out.
 */
export function PowerLines({ position, poles = [0, 8, 16, 23], h = 4.3, z = SLOT_Z.back + 0.55, loaAt = 1, birdsOn = 1, houseDrops = [], houseZ = SLOT_Z.back - 0.1, ahead = 4.5 }) {
  const rig = rigs.power_pole, rigLoa = rigs.power_pole_loa;
  const L = useMemo(() => rigLayout(rig, h), [rig, h]);
  const attach = useMemo(() => poles.map((px) => rig.wires.map((p) => { const [x, y] = L.toWorld(p); return [px + x, y, 0]; })), [poles, rig, L]);
  const { geometry, birdSpots } = useMemo(() => {
    const lines = [];
    let seed = 1;
    for (let i = 0; i < poles.length - 1; i++) {
      const A = attach[i], B = attach[i + 1];
      for (let k = 0; k < A.length; k++) lines.push(wirePoints(A[k], B[k], 0.3 + 0.07 * k + rand(seed++) * 0.1));
      // stray wires crossing over from one insulator to another
      for (let j = 0; j < 2; j++) {
        const k1 = Math.floor(rand(seed++) * 4), k2 = (k1 + 1 + Math.floor(rand(seed++) * 3)) % 4;
        lines.push(wirePoints(A[k1], B[k2], 0.55 + rand(seed++) * 0.35));
      }
    }
    // drop wires from a pole back to a house wall: [poleIndex, dx, y]
    for (const [pi, dx, y] of houseDrops) {
      const a = attach[pi][dx < 0 ? 0 : 3];
      lines.push(wirePoints(a, [poles[pi] + dx, y, houseZ - z], 0.25));
    }
    const span = attach[birdsOn] && attach[birdsOn + 1] ? wirePoints(attach[birdsOn][1], attach[birdsOn + 1][1], 0.3 + 0.07 + rand(birdsOn * 6 + 2) * 0.1) : null;
    return { geometry: ribbonGeometry(lines), birdSpots: span ? [0.28, 0.43, 0.6, 0.74].map((t) => span[Math.round(t * (span.length - 1))]) : [] };
  }, [attach, poles, birdsOn, houseDrops, houseZ, z]);

  // --- sparrows on the wire, flying off as I come by
  const birdAnchor = useRef();
  const birds = useRef([]);
  const fly = useRef(birdSpots.map(() => ({ f: 0 })));
  usePassTrigger(
    birdAnchor,
    ahead,
    () => fly.current.forEach((b, i) => gsap.to(b, { f: 1, duration: 1.8, delay: i * 0.12, ease: "power1.in" })),
    () => fly.current.forEach((b) => gsap.to(b, { f: 0, duration: 0.7, ease: "power2.out" })),
  );

  // --- the loudspeaker's tune
  const loa = useMemo(() => (rigLoa.loa || []).map((p) => { const [x, y] = L.toWorld(p); return [poles[loaAt] + x, y]; }), [rigLoa, L, poles, loaAt]);
  const noteMaps = useMemo(() => [noteTexture("♪"), noteTexture("♫")], []);
  const noteMats = useMemo(() => Array.from({ length: 5 }, (_, i) => new THREE.MeshBasicMaterial({ map: noteMaps[i % 2], transparent: true, depthWrite: false, opacity: 0 })), [noteMaps]);
  const notes = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    birds.current.forEach((g, i) => {
      if (!g) return;
      const f = fly.current[i].f;
      const [sx, sy, sz] = birdSpots[i];
      const dir = i % 2 ? -1 : 1;
      const flying = f > 0.001;
      g.position.set(sx + dir * 3.8 * f, sy + 3.2 * f - 0.4 * f * f + (flying ? Math.sin(t * 9 + i) * 0.05 : Math.abs(Math.sin(t * 2.2 + i * 1.7)) ** 8 * 0.06), sz + 0.02);
      g.scale.x = dir;
      g.visible = f < 0.995;
      // flip-book: sitting, or flapping between the two frames
      const [sit, up] = g.children;
      const flap = flying && Math.floor(t * 12 + i) % 2 === 0;
      sit.visible = !flying || !flap;
      up.visible = flying && flap;
    });
    // a note every 0.9 s, alternating horns, rising and drifting outwards
    notes.current.forEach((m, i) => {
      if (!m || !loa.length) return;
      const life = 2.4, period = 0.9 * noteMats.length;
      const age = (((t - i * 0.9) % period) + period) % period / life;
      const on = age < 1;
      m.visible = on;
      if (!on) return;
      const [hx, hy] = loa[i % loa.length];
      const out = i % loa.length === 0 ? -1 : 1;
      m.position.set(hx + out * (0.15 + age * 0.9), hy + age * 1.1 + Math.sin(age * 9 + i) * 0.06, 0.05);
      m.rotation.z = Math.sin(age * 6 + i) * 0.25;
      const s = 0.42 + 0.12 * Math.sin(age * Math.PI);
      m.scale.set(s, s, 1);
      noteMats[i].opacity = Math.min(1, age * 6) * (1 - age);
    });
  });

  const spanMid = birdSpots.length ? (poles[birdsOn] + poles[birdsOn + 1]) / 2 : 0;
  return (
    <group position={[position[0], position[1] - 0.02, z]}>
      {poles.map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          {rigPart(i === loaAt ? "power_pole_loa" : "power_pole", i === loaAt ? rigLoa : rig, L, "post", null)}
        </group>
      ))}
      <mesh geometry={geometry} material={wireMaterial} castShadow />
      <group ref={birdAnchor} position={[spanMid, 0, 0]} />
      {birdSpots.map((_, i) => (
        <group key={i} ref={(el) => (birds.current[i] = el)}>
          <ArtCard art="street/sparrow" h={0.24} />
          <group visible={false}>
            <ArtCard art="street/sparrow_fly" h={0.26} />
          </group>
        </group>
      ))}
      {noteMats.map((mat, i) => (
        <mesh key={i} ref={(el) => (notes.current[i] = el)} material={mat} visible={false} renderOrder={4}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

/** "DZÔ!" (cheers!) in fat bubble letters, each letter its own colour. */
function cheersTexture(text = "DZÔ!") {
  const W = 512, H = 220;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const colors = ["#F8D705", "#F5932A", "#E8432E", "#F8D705"];
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = `150px ${HAND}`;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    let x = (W - ctx.measureText(text).width) / 2;
    [...text].forEach((ch, k) => {
      const cw = ctx.measureText(ch).width;
      ctx.save();
      ctx.translate(x + cw / 2, H / 2 + Math.sin(k * 1.6) * 12);
      ctx.rotate(Math.sin(k * 2.3) * 0.15);
      ctx.lineWidth = 20;
      ctx.strokeStyle = "#151515";
      ctx.strokeText(ch, -cw / 2, 0);
      ctx.fillStyle = colors[k % colors.length];
      ctx.fillText(ch, -cw / 2, 0);
      ctx.restore();
      x += cw;
    });
  };
  draw();
  const t = toTexture(c);
  whenFont(draw, t);
  return t;
}

/**
 * Bia vỉa hè: a low plastic table with stools, peanuts, an ice bucket and a beer
 * crate (AI drawing), with three glasses of bia hơi on its front edge (SVG, so
 * they can move). As I ride past they lift, swing in and clink with a "DZÔ!"
 * and a splash of foam, then settle back on the table. Plays again every time I
 * come by.
 */
export function BeerTable({ position, h = 1.05, z = SLOT_Z.front + 0.6, ahead = 2.5, glassH = 0.27 }) {
  const anchor = useRef();
  const glasses = useRef([]);
  const cheers = useRef();
  const splash = useRef();
  const st = useRef({ lift: 0, clink: 0, say: 0 });
  const tl = useRef();
  const cheersMap = useMemo(() => cheersTexture(), []);
  // the drawing is 1036 x 739, seen a little from above: the table's front edge
  // is at v ≈ 0.56. It stands at the very front of the pavement, so only the
  // tops of the bottles reach a little over the road behind it.
  const w = h * (1036 / 739);
  const rest = [0.27, 0.47, 0.64].map((u) => [(u - 0.5) * w, 0.55 * h]);
  const meet = [(0.47 - 0.5) * w, 0.55 * h + 0.4];
  usePassTrigger(
    anchor,
    ahead,
    () => {
      tl.current?.kill();
      const s = st.current;
      Object.assign(s, { lift: 0, clink: 0, say: 0 });
      tl.current = gsap.timeline()
        .to(s, { lift: 1, duration: 0.35, ease: "back.out(1.6)" })
        .to(s, { clink: 1, duration: 0.09, ease: "power2.in" })
        .to(s, { say: 1, duration: 0.18, ease: "back.out(3)" }, "<0.06")
        .to(s, { clink: 0.4, duration: 0.14, ease: "power2.out" })
        .to(s, { clink: 1, duration: 0.09, ease: "power2.in" })
        .to(s, { clink: 0, duration: 0.25, ease: "power2.out" }, "+=0.1")
        .to(s, { say: 0, duration: 0.3, ease: "power2.in" }, "+=0.35")
        .to(s, { lift: 0, duration: 0.45, ease: "power2.inOut" }, "<");
      if (import.meta.env.DEV) (window.__tl ||= {}).beer = tl.current;
    },
    () => {},
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { lift, clink, say } = st.current;
    glasses.current.forEach((g, i) => {
      if (!g) return;
      const [rx, ry] = rest[i];
      const side = i - 1; // -1, 0, 1
      // lifted up around the meeting point, then swung in to touch rims
      const ux = rx + (meet[0] + side * (0.36 - 0.24 * clink) - rx) * lift;
      const uy = ry + (meet[1] - (side === 0 ? 0.08 : 0) - ry) * lift;
      g.position.set(ux, uy + Math.sin(t * 2 + i) * 0.006, 0.04 + i * 0.004);
      g.rotation.z = -side * (0.12 + 0.3 * clink) * lift;
    });
    cheers.current.visible = say > 0.01;
    cheers.current.scale.set(say, say, 1);
    // a splash of foam where the rims meet
    splash.current.visible = clink > 0.85 && lift > 0.9;
    const k = 0.6 + 0.4 * Math.sin(t * 40);
    splash.current.scale.set(k, k, 1);
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <ArtCard art="street/beer_table" h={h} />
      {rest.map((_, i) => (
        <group key={i} ref={(el) => (glasses.current[i] = el)}>
          <ArtCard art="street/beer_glass" h={glassH} />
        </group>
      ))}
      <mesh ref={splash} position={[meet[0], meet[1] + glassH * 1.0, 0.07]} visible={false} renderOrder={4}>
        <circleGeometry args={[0.07, 9]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh ref={cheers} position={[meet[0] + 0.75, meet[1] + glassH + 0.15, 0.1]} visible={false} renderOrder={5}>
        <planeGeometry args={[1.15, 0.5]} />
        <meshBasicMaterial map={cheersMap} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

export const STREET_EVENTS = { powerLines: PowerLines, beerTable: BeerTable };
