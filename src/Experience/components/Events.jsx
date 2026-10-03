// Little paper set pieces that react to me riding past (like Mr. Panda's pyramid
// door): each is a gsap timeline that plays when I arrive and reverses if I go back.
// The characters are rigs of separate paper parts (scripts/draw_rigs.mjs).
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import rigs from "../../content/rigs.json";
import { SLOT_Z } from "../layout";
import { heroState } from "../heroState";
import { toTexture } from "../textures";
import { Art, Card } from "./PaperCutout";

/** Play `onEnter` once I pass `ahead` units before the anchor; `onLeave` when I go back. */
export function usePassTrigger(anchor, ahead, onEnter, onLeave) {
  const s = useRef({ inside: false, v: new THREE.Vector3() });
  useFrame(() => {
    if (!anchor.current) return;
    const st = s.current;
    anchor.current.getWorldPosition(st.v);
    const d = heroState.x - st.v.x;
    if (!st.inside && d > -ahead) { st.inside = true; onEnter(); }
    else if (st.inside && d < -ahead - 0.4) { st.inside = false; onLeave(); }
  });
}

/** "BAKUGAN BRAWL!" in bouncy bubble letters, each its own colour, thick outline. */
function brawlTexture(text = "BAKUGAN BRAWL!") {
  const W = 1024, H = 300;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const t = toTexture(c);
  const colors = ["#F8D705", "#F5932A", "#E8432E", "#F49AB8", "#7C5CFA", "#2D9CDB", "#5DBE3F"];
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const size = 150;
    ctx.font = `${size}px "Patrick Hand", "Comic Sans MS", sans-serif`;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    const total = ctx.measureText(text).width;
    let x = (W - total) / 2;
    [...text].forEach((ch, k) => {
      const cw = ctx.measureText(ch).width;
      ctx.save();
      ctx.translate(x + cw / 2, H / 2 + Math.sin(k * 1.3) * 16);
      ctx.rotate(Math.sin(k * 2.1) * 0.14);
      ctx.lineWidth = 22;
      ctx.strokeStyle = "#151515";
      ctx.strokeText(ch, -cw / 2, 0);
      ctx.fillStyle = colors[k % colors.length];
      ctx.fillText(ch, -cw / 2, 0);
      ctx.restore();
      x += cw;
    });
  };
  draw();
  document.fonts?.load('150px "Patrick Hand"').then(() => { draw(); t.needsUpdate = true; });
  return t;
}

/** Comic "POW" burst in paper colours with an ink outline. */
export function burstTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const star = (r0, r1, n, fill) => {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r0 : r1 * (0.85 + 0.15 * Math.sin(i * 1.7));
      const a = (i / (n * 2)) * Math.PI * 2;
      ctx[i ? "lineTo" : "moveTo"](S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#151515";
    ctx.stroke();
  };
  star(S * 0.24, S * 0.47, 11, "#F8D705");
  star(S * 0.12, S * 0.27, 9, "#F5932A");
  return toTexture(c);
}

export function ArtCard({ art, h, center = false, offset = [0, 0, 0] }) {
  return (
    <Art art={art}>
      {({ texture, ratio, shapes }) => (
        <group position={[offset[0], offset[1] - (center ? h / 2 : 0), offset[2]]}>
          <Card texture={texture} shapes={shapes} w={h * ratio} h={h} />
        </group>
      )}
    </Art>
  );
}

// --- rigs (scripts/draw_rigs.mjs -> src/content/rigs.json) ----------------------

export const PAD = 6; // prep_art.mjs pads every trimmed drawing by 6px

/** Scale + canvas->local mapping for a rig drawn `height` world units tall. */
export function rigLayout(rig, height) {
  const boxes = Object.values(rig.parts);
  const top = Math.min(...boxes.map((p) => p.y));
  const bottom = Math.max(...boxes.map((p) => p.y + p.h));
  const s = height / (bottom - top);
  const toWorld = ([px, py]) => [(px - rig.anchor[0]) * s, (rig.anchor[1] - py) * s];
  return { s, toWorld };
}

/**
 * One rig part: a group at the part's pivot (rotating `partRef` turns the part
 * around its joint) holding the part's card at its place on the rig canvas.
 */
export function rigPart(rigName, rig, layout, name, partRef, z = 0) {
  const p = rig.parts[name];
  const [px, py] = layout.toWorld(rig.pivots[name]);
  const [cx] = layout.toWorld([p.x + p.w / 2, 0]);
  const [, by] = layout.toWorld([0, p.y + p.h + PAD]);
  const h = (p.h + PAD * 2) * layout.s;
  return (
    <group key={name} ref={partRef} position={[px, py, z]}>
      <ArtCard art={`${rig.group || "childhood"}/${rigName}_${name}`} h={h} offset={[cx - px, by - py, 0]} />
    </group>
  );
}

/** Depth of each part: later in the rig's draw order = nearer the camera. */
export const layerZ = (rig, name, step = 0.012) => rig.order.indexOf(name) * step;

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Drago (the AI drawing the artist picked), animated by bending its mesh
 * instead of cutting it into parts: the card is a finely subdivided plane, and
 * every vertex in a wing turns around that wing's root by an amount that grows
 * towards the tip, so the wings flap with no seams. The tail and head sway the
 * same way. Regions are in the drawing's uv space (u right, v up).
 */
function DragoFlap({ art = "childhood/drago", h }) {
  return <Art art={art}>{({ texture, ratio }) => <DragoMesh texture={texture} w={h * ratio} h={h} />}</Art>;
}

function DragoMesh({ texture, w, h }) {
  const mesh = useRef();
  const { geometry, base, weights, pivots } = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 64, 52);
    const pos = g.attributes.position, uv = g.attributes.uv;
    const base = Float32Array.from(pos.array);
    const P = (u, v) => [(u - 0.5) * w, (v - 0.5) * h];
    const pivots = { L: P(0.36, 0.5), R: P(0.5, 0.4), T: P(0.62, 0.17), H: P(0.42, 0.38) };
    const dist = (x, y, p) => Math.hypot(x - p[0], y - p[1]);
    const weights = new Float32Array(pos.count * 4);
    const head = P(0.27, 0.41); // the head: never moved by a wing, and drawn in front of the wings
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i), v = uv.getY(i), x = pos.getX(i), y = pos.getY(i);
      const headness = 1 - sstep(0.1, 0.17, dist(x, y, head) / w);
      base[i * 3 + 2] = 0.012 * headness;
      const mL = Math.max(sstep(0.5, 0.55, v), sstep(0.4, 0.44, v) * sstep(0.26, 0.2, u)) * sstep(0.47, 0.42, u);
      const vb = 0.38 - 0.11 * sstep(0.53, 0.7, u); // lower edge of the right wing
      const mR = sstep(0.45, 0.5, u) * sstep(vb - 0.015, vb + 0.025, v);
      const mT = sstep(0.58, 0.64, u) * sstep(0.27, 0.22, v);
      const mH = sstep(0.47, 0.42, u) * sstep(0.27, 0.3, v) * sstep(0.55, 0.5, v) * (1 - mL);
      weights[i * 4] = mL * (1 - headness) * sstep(0.04, 0.55, dist(x, y, pivots.L) / (0.45 * w));
      weights[i * 4 + 1] = mR * sstep(0.03, 0.5, dist(x, y, pivots.R) / (0.45 * w));
      weights[i * 4 + 2] = mT * sstep(0, 0.4, dist(x, y, pivots.T) / (0.35 * w));
      weights[i * 4 + 3] = mH * (1 - headness) * sstep(0, 0.3, dist(x, y, pivots.H) / (0.3 * w));
    }
    return { geometry: g, base, weights, pivots };
  }, [w, h]);
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide }), [texture]);
  const depth = useMemo(() => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 }), [texture]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ang = [0.24 * Math.sin(t * 5.2), -0.24 * Math.sin(t * 5.2 - 0.3), 0.13 * Math.sin(t * 2.1), 0.07 * Math.sin(t * 2.6 + 1)];
    const piv = [pivots.L, pivots.R, pivots.T, pivots.H];
    const arr = geometry.attributes.position.array;
    for (let i = 0, n = arr.length / 3; i < n; i++) {
      let x = base[i * 3], y = base[i * 3 + 1];
      for (let k = 0; k < 4; k++) {
        const wk = weights[i * 4 + k];
        if (!wk) continue;
        const a = ang[k] * wk, c = Math.cos(a), sn = Math.sin(a), [px, py] = piv[k];
        const dx = x - px, dy = y - py;
        x = px + dx * c - dy * sn;
        y = py + dx * sn + dy * c;
      }
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = base[i * 3 + 2];
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return <mesh ref={mesh} geometry={geometry} material={face} customDepthMaterial={depth} castShadow />;
}

/**
 * Probe, the Bakugan robot, rigged: it hovers, its claw arms swing, its dome
 * chatters its teeth and the antenna wobbles. As I ride up, the lid flips open,
 * a Bakugan ball shoots up out of the dome, spins, and with a POW turns into
 * Drago (DragoFlap), who keeps flapping over the scene. It all reverses if I go back.
 */
export function ProbeBakugan({ position, probeH = 1.25, ballH = 0.42, drago = { dx: 1.6, y: 3.3, h: 2.3 }, z = SLOT_Z.back, ahead = 10 }) {
  const pr = rigs.probe;
  const P = useMemo(() => rigLayout(pr, probeH), [pr, probeH]);
  const [holeX, holeY] = P.toWorld(pr.hole);
  const [lidX, lidY] = P.toWorld(pr.pivots.lid);
  const domeY = P.toWorld(pr.pivots.dome)[1];

  const anchor = useRef();
  const hover = useRef();
  const p = { arm_left: useRef(), arm_right: useRef(), body: useRef(), dome: useRef(), lid: useRef() };
  const lidOpen = useRef();
  const ball = useRef();
  const ballSpin = useRef();
  const dragon = useRef();
  const dragonIdle = useRef();
  const burst = useRef();
  const burstMap = useMemo(burstTexture, []);
  const brawl = useRef();
  const brawlMap = useMemo(() => brawlTexture(), []);
  const tl = useRef();

  useEffect(() => {
    const t = gsap.timeline({ paused: true });
    t.to(lidOpen.current.rotation, { z: 1.3, duration: 0.45, ease: "back.out(2)" }, 0)
      .set(ball.current.scale, { x: 1, y: 1, z: 1 }, 0.25)
      .fromTo(ball.current.position, { x: holeX, y: holeY }, { x: drago.dx, y: drago.y, duration: 0.9, ease: "power2.out" }, 0.28)
      .to(ballSpin.current.rotation, { z: -Math.PI * 5, duration: 0.95, ease: "power1.out" }, 0.28)
      .to(burst.current.scale, { x: 1, y: 1, duration: 0.22, ease: "power2.out" }, 1.15)
      .to(burst.current.material, { opacity: 1, duration: 0.08 }, 1.15)
      .to(ball.current.scale, { x: 0, y: 0, z: 0, duration: 0.14 }, 1.2)
      .to(dragon.current.scale, { x: 1, y: 1, z: 1, duration: 0.65, ease: "back.out(1.8)" }, 1.24)
      .to(burst.current.material, { opacity: 0, duration: 0.45 }, 1.38)
      .to(burst.current.scale, { x: 1.5, y: 1.5, duration: 0.45 }, 1.38)
      .to(lidOpen.current.rotation, { z: 0, duration: 0.5, ease: "power2.inOut" }, 1.5)
      // "BAKUGAN BRAWL!" pops up as the ball launches, then drifts away
      // "BAKUGAN BRAWL!" flashes up as the ball launches: pop, hold, gone
      .to(brawl.current.material, { opacity: 1, duration: 0.05 }, 0.3)
      .fromTo(brawl.current.scale, { x: 0.3, y: 0.3 }, { x: 1.1, y: 1.1, duration: 0.18, ease: "back.out(3)" }, 0.3)
      .to(brawl.current.scale, { x: 1, y: 1, duration: 0.12 }, 0.48)
      .to(brawl.current.material, { opacity: 0, duration: 0.12 }, 1.0)
      .to(brawl.current.scale, { x: 1.25, y: 1.25, duration: 0.12 }, 1.0);
    tl.current = t;
    return () => t.kill();
  }, [holeX, holeY, drago.dx, drago.y]);

  usePassTrigger(anchor, ahead, () => tl.current?.timeScale(1).play(), () => tl.current?.timeScale(1.6).reverse());

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Probe: hover, swinging claws, teeth chatter in bursts, antenna wobble
    hover.current.position.y = 0.06 + Math.sin(t * 1.8) * 0.05;
    hover.current.rotation.z = Math.sin(t * 1.1) * 0.03;
    p.arm_left.current.rotation.z = Math.sin(t * 2.2) * 0.2;
    p.arm_right.current.rotation.z = Math.sin(t * 2.2 + Math.PI) * 0.2;
    p.dome.current.position.y = domeY + (Math.sin(t * 0.8) > 0.3 ? Math.max(0, Math.sin(t * 14)) * 0.03 : 0);
    p.lid.current.rotation.z = Math.sin(t * 3.1) * 0.04;
    // Drago hovers, bobbing with each wing beat (the wings bend in DragoMesh)
    dragonIdle.current.position.y = Math.sin(t * 1.6) * 0.12 - Math.sin(t * 5.2) * 0.03;
    dragonIdle.current.rotation.z = Math.sin(t * 1.1) * 0.04;
  });

  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <group ref={hover}>
        {rigPart("probe", pr, P, "arm_left", p.arm_left, layerZ(pr, "arm_left"))}
        {rigPart("probe", pr, P, "arm_right", p.arm_right, layerZ(pr, "arm_right"))}
        {rigPart("probe", pr, P, "body", p.body, layerZ(pr, "body"))}
        {rigPart("probe", pr, P, "dome", p.dome, layerZ(pr, "dome"))}
        {/* the lid (with its antenna) on its hinge; the ball launches from under it */}
        <group ref={lidOpen} position={[lidX, lidY, layerZ(pr, "lid")]}>
          <group position={[-lidX, -lidY, 0]}>{rigPart("probe", pr, P, "lid", p.lid)}</group>
        </group>
        <group ref={ball} position={[holeX, holeY, layerZ(pr, "dome") + 0.006]} scale={0}>
          <group ref={ballSpin}>
            <ArtCard art="childhood/bakugan_ball" h={ballH} center />
          </group>
        </group>
      </group>
      {/* BAKUGAN BRAWL! */}
      <mesh ref={brawl} position={[-0.2, probeH + 0.6, 0.12]} scale={[0.2, 0.2, 1]} renderOrder={5}>
        <planeGeometry args={[3.0, 0.88]} />
        <meshBasicMaterial map={brawlMap} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* POW */}
      <mesh ref={burst} position={[drago.dx, drago.y, 0.08]} scale={[0.2, 0.2, 1]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial map={burstMap} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={dragon} position={[drago.dx, drago.y, 0.04]} scale={0}>
        <group ref={dragonIdle}>
          <DragoFlap h={drago.h} />
        </group>
      </group>
    </group>
  );
}

/**
 * Perry the platypus, just a plain pet... until I ride past: he hops, flips like
 * a paper puppet and lands as Agent P in a karate stance.
 */
export function PerryAgent({ position, normalH = 0.55, agentH = 1.15, z = SLOT_Z.mid + 0.07, ahead = 6.5 }) {
  const anchor = useRef();
  const hop = useRef();
  const normal = useRef();
  const agent = useRef();
  const state = useRef({ p: 0 });
  usePassTrigger(
    anchor,
    ahead, // transforms while I am still `ahead` units away, so you see it happen
    () => gsap.to(state.current, { p: 1, duration: 0.7, ease: "power2.inOut" }),
    () => gsap.to(state.current, { p: 0, duration: 0.5, ease: "power2.inOut" }),
  );
  useFrame((s) => {
    const p = state.current.p;
    const t = s.clock.elapsedTime;
    normal.current.visible = p < 0.5;
    agent.current.visible = p >= 0.5;
    normal.current.scale.x = Math.max(0.02, 1 - 2 * p);
    agent.current.scale.x = Math.max(0.02, 2 * p - 1);
    hop.current.position.y = Math.sin(p * Math.PI) * 0.55;
    // idle: the pet waddles, the agent holds his stance with a little bounce
    hop.current.rotation.z = p < 0.5 ? Math.sin(t * 5) * 0.03 : 0;
    agent.current.position.y = p >= 0.5 ? Math.abs(Math.sin(t * 3)) * 0.03 : 0;
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <group ref={hop}>
        <group ref={normal}>
          <ArtCard art="childhood/perry_normal" h={normalH} />
        </group>
        <group ref={agent} visible={false}>
          <ArtCard art="childhood/perry_agent" h={agentH} />
        </group>
      </group>
    </group>
  );
}

/**
 * Totoro at the bus stop, rigged: he breathes, flicks his ears, blinks, sways his
 * leaf umbrella and wiggles his free arm; when I ride up he hops twice and lifts
 * the leaf in greeting.
 */
export function TotoroRig({ position, height = 2.4, z = SLOT_Z.back, ahead = 2.4 }) {
  const rig = rigs.totoro;
  const L = useMemo(() => rigLayout(rig, height), [rig, height]);
  const DEPTH = { bus_stop: -0.07, ear_left: -0.03, ear_right: -0.03, body: 0, eyes: 0.007, arm_left: 0.013, leaf_arm: 0.02 };
  const anchor = useRef();
  const root = useRef();
  const hop = useRef();
  const r = { bus_stop: useRef(), ear_left: useRef(), ear_right: useRef(), body: useRef(), eyes: useRef(), arm_left: useRef(), leaf_arm: useRef() };
  const lift = useRef({ v: 0 });

  usePassTrigger(anchor, ahead, () => {
    gsap.timeline()
      .to(hop.current.position, { y: 0.3, duration: 0.2, ease: "power2.out" })
      .to(hop.current.position, { y: 0, duration: 0.18, ease: "power2.in" })
      .to(hop.current.position, { y: 0.22, duration: 0.18, ease: "power2.out" })
      .to(hop.current.position, { y: 0, duration: 0.16, ease: "power2.in" });
    gsap.timeline().to(lift.current, { v: 1, duration: 0.3, ease: "power2.out" }).to(lift.current, { v: 0, duration: 0.9, ease: "power2.inOut" }, "+=0.6");
  }, () => {});

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const b = Math.sin(t * 1.7);
    root.current.scale.set(1 - 0.009 * b, 1 + 0.018 * b, 1);
    // ear flicks: a quick twitch every few seconds, the two ears out of step
    const flick = (phase) => (phase < 0.32 ? Math.sin((phase / 0.32) * Math.PI) : 0);
    r.ear_left.current.rotation.z = 0.3 * flick(t % 3.4);
    r.ear_right.current.rotation.z = -0.3 * flick((t + 1.6) % 4.1);
    const bp = (t + 0.7) % 3.9; // blink
    r.eyes.current.scale.y = bp < 0.16 ? 0.12 + 0.88 * Math.abs(bp / 0.08 - 1) : 1;
    r.leaf_arm.current.rotation.z = Math.sin(t * 0.9) * 0.05 + 0.22 * lift.current.v;
    r.arm_left.current.rotation.z = Math.sin(t * 1.3 + 1) * 0.07 - 0.25 * lift.current.v;
  });

  const part = (name) => rigPart("totoro", rig, L, name, r[name], DEPTH[name]);
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      {part("bus_stop")}
      <group ref={hop}>
        <group ref={root}>
          {["ear_left", "ear_right", "body", "eyes", "arm_left", "leaf_arm"].map(part)}
        </group>
      </group>
    </group>
  );
}

/**
 * Phineas and Ferb backyard rocket, parked behind their house. As I ride up it
 * shakes, fires, puffs smoke, climbs, loops the loop over the house (nose
 * following its path) and then blasts off out of the sky; it lands back behind
 * the house if I scroll back. The flame is a flip-book of four drawings.
 */
const smooth01 = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
function rocketPath(u, h, top) {
  // centre of the rocket, from parked (y = h/2) to gone (y = top)
  const start = h / 2, climb = start + 1.5, r = 1.15;
  if (u < 0.18) return [0, start + (climb - start) * smooth01(u / 0.18)];
  if (u < 0.7) {
    const th = ((u - 0.18) / 0.52) * Math.PI * 2; // one full loop, counter-clockwise
    return [-r + r * Math.cos(th), climb + r * Math.sin(th)];
  }
  const v = (u - 0.7) / 0.3;
  return [0, climb + (top - climb) * v * v];
}

export function PFRocket({ position, h = 3.0, z = SLOT_Z.back - 0.32, ahead = 7, top = 12 }) {
  const anchor = useRef();
  const rocket = useRef();
  const flame = useRef();
  const smoke = useRef();
  const st = useRef({ fire: 0, lift: 0, puff: 0 });
  const tl = useRef();
  useEffect(() => {
    const t = gsap.timeline({ paused: true });
    t.to(st.current, { fire: 1, duration: 0.35, ease: "power2.out" }, 0)
      .to(st.current, { puff: 1, duration: 0.7, ease: "power2.out" }, 0.1)
      .to(st.current, { lift: 1, duration: 4.2, ease: "none" }, 0.55)
      .to(st.current, { puff: 0, duration: 1.2, ease: "power1.in" }, 1.4);
    tl.current = t;
    if (import.meta.env.DEV) (window.__tl ||= {}).pfRocket = t;
    return () => t.kill();
  }, []);
  usePassTrigger(anchor, ahead, () => tl.current?.timeScale(1).play(), () => tl.current?.timeScale(1.8).reverse());
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { fire, lift, puff } = st.current;
    const [x, y] = rocketPath(lift, h, top);
    const [x2, y2] = rocketPath(Math.min(1, lift + 0.004), h, top);
    const shake = fire > 0 && lift < 0.02 ? Math.sin(t * 60) * 0.015 : 0;
    rocket.current.position.set(x + shake, y, 0);
    // the nose points along the path (straight up while parked)
    rocket.current.rotation.z = lift > 0 && lift < 1 ? Math.atan2(-(x2 - x), y2 - y) : 0;
    // flip-book: four hand-drawn flame frames, ~14 per second
    const frame = Math.floor(t * 14) % 4;
    flame.current.children.forEach((c, i) => (c.visible = i === frame));
    flame.current.scale.set(fire * 1.25, fire, 1);
    smoke.current.scale.set(puff * 1.3, puff, 1);
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <group ref={smoke} position={[0, -0.05, 0.05]} scale={0}>
        <ArtCard art="childhood/smoke" h={0.9} />
      </group>
      {/* rocket group sits at the rocket's centre, so it turns about its middle */}
      <group ref={rocket} position={[0, h / 2, 0]}>
        <group position={[0, -h / 2, 0]}>
          <group ref={flame} position={[0.105 * (h / 3), 0.34, -0.02]} scale={0}>
            {[1, 2, 3, 4].map((i) => (
              <group key={i} rotation={[0, 0, Math.PI]}>
                <ArtCard art={`childhood/rocket_flame_${i}`} h={1.9} />
              </group>
            ))}
          </group>
          <ArtCard art="childhood/pf_rocket" h={h} />
        </group>
      </group>
    </group>
  );
}

/**
 * The family's Panasonic CRT (a TX-21FG50T) at the very start of the childhood
 * world, at a three-quarter angle (a rig from draw_rigs.mjs: the TV, and four
 * frames of scribbled snow drawn through the same slant as its screen). The
 * snow is a flip-book of those frames, ~10 a second.
 */
const STATIC_PARTS = ["static_1", "static_2", "static_3", "static_4"];
export function CrtTv({ position, h = 1.35, z = SLOT_Z.back + 0.05, fps = 10 }) {
  const rig = rigs.crt_tv;
  const L = useMemo(() => rigLayout(rig, h), [rig, h]);
  const frames = useRef();
  useFrame((state) => {
    const f = Math.floor(state.clock.elapsedTime * fps) % STATIC_PARTS.length;
    frames.current.children.forEach((c, i) => (c.visible = i === f));
  });
  return (
    <group position={[position[0], position[1] - 0.02, z]}>
      {rigPart("crt_tv", rig, L, "body", null)}
      <group ref={frames} position={[0, 0, 0.008]}>
        {STATIC_PARTS.map((n, i) => (
          <group key={n} visible={i === 0}>
            {rigPart("crt_tv", rig, L, n, null)}
          </group>
        ))}
      </group>
    </group>
  );
}

export const EVENTS = { crtTv: CrtTv, probeBakugan: ProbeBakugan, perryAgent: PerryAgent, totoro: TotoroRig, pfRocket: PFRocket };
