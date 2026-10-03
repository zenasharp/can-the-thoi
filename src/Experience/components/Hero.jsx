import { Suspense, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { rides, scenes, sillyLines } from "../../content/site";
import bikeRig from "../../content/bike-rig.json";
import copter from "../../content/copter.json";
import { GROOVE_DEPTH, heroCurve, initialHeroPoints, sceneIndexAt, sceneRanges, SHIFT_X_AMOUNT, WORLD_START_X } from "../layout";
import { useScrollCurve } from "../hooks/useScrollCurve";
import { Art, artUrl, Card, Stick } from "./PaperCutout";
import { layerZ, rigLayout, rigPart } from "./Events";
import rigs from "../../content/rigs.json";
import { heroState } from "../heroState";
import ScribbleBubble from "../../components/ScribbleBubble";

const BUBBLE_MS = 2600;
const SINK = 0.14; // vehicles ride slightly down in the groove, like the reference
export const SINK_DEPTH = 2.9; // heroState.sink = 1 puts all of me (and my ride) below the ground

/** My bike from Krita: frame + two wheels that really turn. */
function BikeRig({ height, motion }) {
  const back = useRef();
  const front = useRef();
  const { frame, wheel_back: wb, wheel_front: wf } = bikeRig;
  const left = Math.min(frame.x, wb.x, wf.x);
  const right = Math.max(frame.x + frame.w, wb.x + wb.w, wf.x + wf.w);
  const top = Math.min(frame.y, wb.y, wf.y);
  const bottom = Math.max(frame.y + frame.h, wb.y + wb.h, wf.y + wf.h);
  const s = height / (bottom - top);
  const cx = (left + right) / 2;
  const part = (p) => ({ x: (p.x + p.w / 2 - cx) * s, yBottom: (bottom - (p.y + p.h)) * s, yCenter: (bottom - (p.y + p.h / 2)) * s, w: p.w * s, h: p.h * s });
  const F = part(frame), B = part(wb), Fw = part(wf);
  useFrame(() => {
    const d = motion.current.dist;
    back.current.rotation.z = -d / (B.h / 2);
    front.current.rotation.z = -d / (Fw.h / 2);
  });
  const wheel = (art, P, ref) => (
    <group ref={ref} position={[P.x, P.yCenter, -0.015]}>
      <group position={[0, -P.h / 2, 0]}>
        <Art art={art}>{({ texture, ratio, shapes }) => <Card texture={texture} shapes={shapes} w={P.h * ratio} h={P.h} />}</Art>
      </group>
    </group>
  );
  return (
    <group>
      {wheel("vehicles/bike_wheel_back", B, back)}
      {wheel("vehicles/bike_wheel_front", Fw, front)}
      <group position={[F.x, F.yBottom, 0]}>
        <Art art="vehicles/bike_frame">{({ texture, ratio, shapes }) => <Card texture={texture} shapes={shapes} w={F.h * ratio} h={F.h} />}</Art>
      </group>
    </group>
  );
}

// Pad that prep_art.mjs adds around a trimmed drawing, in source pixels.
const padPx = (sourceH) => 6 / Math.min(1, 1400 / sourceH);

/**
 * The bamboo-copter's blades, cut off the childhood costume (split_copter.mjs)
 * and put back on the stick. They turn with my travel (the scroll), not on their
 * own: the distance ridden drives the spin, like the bike wheels.
 */
function CopterBlades({ heroH, motion }) {
  const spin = useRef();
  const { body, blades, hub, source } = copter;
  const pad = padPx(source.h);
  const s = heroH / (body.h + pad * 2);
  const cx = body.x + body.w / 2;
  const worldY = (rawY) => heroH - pad * s - (rawY - body.y) * s;
  const bladesH = (blades.h + 12) * s;
  const bladesCx = blades.x + blades.w / 2;
  useFrame(() => {
    spin.current.scale.x = Math.cos(motion.current.dist * 4.5);
  });
  return (
    <group ref={spin} position={[(hub[0] - cx) * s, worldY(blades.y + blades.h + 6), 0.004]}>
      <group position={[(bladesCx - hub[0]) * s, 0, 0]}>
        <Art art="hero/copter_blades">{({ texture, ratio, shapes }) => <Card texture={texture} shapes={shapes} w={bladesH * ratio} h={bladesH} />}</Art>
      </group>
    </group>
  );
}

/**
 * Something I hold (ride.props): a drawing whose `grip` point (uv of the drawing
 * after `flip`, v up) sits on my hand at `hand` (uv of my costume, v up),
 * turned `rot` radians about that point.
 */
function HeldProp({ prop, heroH, heroRatio }) {
  const hand = [(prop.hand[0] - 0.5) * heroH * heroRatio, prop.hand[1] * heroH];
  return (
    <group position={[hand[0], hand[1], prop.z ?? 0.012]} rotation={[0, 0, prop.rot || 0]}>
      <Art art={prop.art}>
        {({ texture, ratio, shapes }) => {
          const w = prop.h * ratio;
          return (
            <group position={[-(prop.grip[0] - 0.5) * w, -prop.grip[1] * prop.h, 0]}>
              <Card texture={texture} shapes={shapes} w={w} h={prop.h} flip={prop.flip} />
            </group>
          );
        }}
      </Art>
    </group>
  );
}

/**
 * A vehicle cut into paper parts (scripts/split_rig.mjs), e.g. Skaarl, running:
 * the two legs scissor at the hips, swapping places once per stride, and the leg
 * swinging forward lifts off the ground. `stride` is the gait phase per unit of
 * distance, chosen so the foot on the ground moves back exactly as fast as the
 * ground goes by (no skating). The body bobs in step (Ride, motion "run").
 */
export function RigVehicle({ name, height, motion, stride = 10.5 }) {
  const rig = rigs[name];
  const L = useMemo(() => rigLayout(rig, height), [rig, height]);
  const refs = useRef({});
  const part = (n) => rigPart(name, rig, L, n, (el) => (refs.current[n] = el), layerZ(rig, n, 0.006));
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { dist, moving } = motion.current;
    const ph = dist * stride;
    const r = refs.current;
    const s = ((1 - Math.cos(ph)) / 2) * moving; // 0: as drawn (back leg back, front leg forward) .. 1: swapped
    const lift = (leg, up) => {
      if (!leg) return;
      leg.userData.y0 ??= leg.position.y;
      leg.position.y = leg.userData.y0 + Math.max(0, up) * 0.07 * moving;
    };
    if (r.leg_back) r.leg_back.rotation.z = 0.62 * s; // swings forward (anticlockwise)...
    if (r.leg_front) r.leg_front.rotation.z = -0.62 * s; // ...while this one pushes back
    lift(r.leg_back, Math.sin(ph)); // the leg on its way forward is off the ground
    lift(r.leg_front, -Math.sin(ph));
    if (r.frill) r.frill.rotation.z = Math.sin(ph * 2 + 0.5) * 0.1 * moving + Math.sin(t * 3.1) * 0.05;
  });
  return <group>{rig.order.map(part)}</group>;
}

const DUST = 10;

/**
 * A light trail of dust kicked up behind a runner (ride.dust): one puff at every
 * footfall, left behind in the world where it was kicked up, drifting back and up
 * as it swells and fades. `active()` says whether my runner is on screen.
 */
const PUFFS = { dust: [1, 2, 3].map((i) => artUrl(`hero/dust_${i}`)), foam: [1, 2, 3].map((i) => artUrl(`hero/foam_${i}`)) };
// Loaded with the rest, as the very sets useTexture asks for (it caches a list
// under the whole list, not per drawing): a set first asked for mid-ride (the
// foam, at the sea) would otherwise suspend and blank the world for a moment.
useTexture.preload(PUFFS.dust);
useTexture.preload(PUFFS.foam);

function DustTrail({ motion, follow, stride, active, kind }) {
  const meshes = useRef([]);
  const puffs = useRef(Array.from({ length: DUST }, () => ({ t: -9, x: 0, y: 0, z: 0, s: 1, dir: 1 })));
  const step = useRef(0);
  const next = useRef(0);
  // scribbled puffs (SVG, three of each): dust, or white sea spray ("foam") behind my surfboard
  const texs = useTexture(kind === "foam" ? PUFFS.foam : PUFFS.dust);
  const mats = useMemo(() => Array.from({ length: DUST }, (_, i) => {
    const map = texs[i % texs.length];
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, opacity: 0 });
  }), [texs]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = motion.current;
    const footfall = Math.floor((m.dist * stride) / Math.PI); // twice per stride
    if (footfall !== step.current && m.moving > 0.2 && active()) {
      const p = puffs.current[next.current];
      next.current = (next.current + 1) % DUST;
      const g = follow.current.position;
      Object.assign(p, { t, x: g.x - m.dir * (0.45 + Math.random() * 0.25), y: g.y + 0.12 + Math.random() * 0.1, z: g.z + 0.1 + Math.random() * 0.06, s: (0.42 + Math.random() * 0.16) * (0.6 + 0.4 * m.moving), dir: m.dir });
    }
    step.current = footfall;
    puffs.current.forEach((p, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const age = (t - p.t) / 0.75;
      mesh.visible = age >= 0 && age < 1;
      if (!mesh.visible) return;
      const s = p.s * (0.6 + 0.9 * Math.sqrt(age));
      mesh.scale.set(s, s * 0.8, 1);
      mesh.position.set(p.x - p.dir * age * 0.3, p.y + age * 0.22, p.z);
      mats[i].opacity = 0.9 * (1 - age) ** 1.4;
    });
  });
  return (
    <group>
      {mats.map((mat, i) => (
        <mesh key={i} ref={(el) => (meshes.current[i] = el)} material={mat} visible={false} renderOrder={3}>
          <planeGeometry args={[1, 0.75]} />
        </mesh>
      ))}
    </group>
  );
}

/** Where I sit on a ride: from the rig's seat point, or the ride's own `seat`. */
export function rideSeat(ride) {
  if (!ride.vehicleRig) return ride.seat;
  const rig = rigs[ride.vehicleRig];
  return rigLayout(rig, ride.vehicleH).toWorld(rig.seat);
}

/** One costume + vehicle combination, animated from the shared motion state. */
function Ride({ rideKey, ride, visible, motion }) {
  const whole = useRef();
  const body = useRef();
  const rider = useRef();
  const seat = useMemo(() => rideSeat(ride), [ride]);
  const heroZ = ride.heroInFront ? 0.05 : -0.05;
  useFrame((state) => {
    const { dist, moving } = motion.current;
    const t = state.clock.elapsedTime;
    const b = body.current;
    // a Teemo mushroom going off under me: a quick startled hop
    const jt = t - heroState.jolt;
    const jolt = jt >= 0 && jt < 0.45 ? Math.sin((jt / 0.45) * Math.PI) * 0.35 : 0;
    switch (ride.motion) {
      case "trot": {
        const ph = dist * 7;
        b.position.y = Math.abs(Math.sin(ph)) * 0.05 * moving + Math.sin(t * 2) * 0.01;
        b.rotation.z = Math.sin(ph) * 0.02 * moving;
        break;
      }
      case "run": { // a rigged runner: bob at every footfall, in step with its legs
        const ph = dist * (ride.stride || 10.5);
        b.position.y = Math.abs(Math.sin(ph)) * 0.06 * moving + Math.sin(t * 2.2) * 0.01;
        b.rotation.z = -0.03 * moving + Math.sin(ph * 2) * 0.015 * moving;
        break;
      }
      case "gallop": {
        const ph = dist * 4.5;
        b.position.y = Math.abs(Math.sin(ph)) * 0.08 * moving + Math.sin(t * 2.2) * 0.012;
        b.rotation.z = Math.sin(ph) * 0.06 * moving;
        break;
      }
      case "pedal":
        b.position.y = Math.abs(Math.sin(dist * 5)) * 0.015 * moving;
        b.rotation.z = Math.sin(t * 2) * 0.008;
        break;
      case "hover": // the time machine floats along, tilting a little as it moves
        b.position.y = 0.12 + Math.sin(t * 2.1) * 0.05;
        b.rotation.z = Math.sin(t * 1.4) * 0.025 - 0.03 * moving;
        break;
      case "surf": { // riding the waves: up and down the swell, nose following the slope
        const ph = dist * 1.7;
        b.position.y = Math.sin(ph) * 0.07 + Math.sin(t * 1.6) * 0.035;
        b.rotation.z = Math.cos(ph) * 0.07 + Math.sin(t * 1.1) * 0.02;
        break;
      }
      case "fly":
        b.position.y = Math.sin(t * 2) * 0.06;
        b.rotation.z = Math.sin(t * 1.3) * 0.04;
        break;
    }
    b.position.y += jolt;
    if (!visible) return;
    whole.current.visible = heroState.hideRide !== rideKey;
    // where my seat is right now (set pieces aim at me: Blitzcrank's hook), and
    // whether I am on it at all (heroState.rider.hidden while I am flying about)
    b.updateWorldMatrix(true, false);
    heroState.rider.rest.set(seat[0], seat[1], heroZ).applyMatrix4(b.matrixWorld);
    rider.current.visible = !heroState.rider.hidden;
    if (ride.wing?.lift) rider.current.position.y = seat[1] + wingGrowth(ride.wing) * ride.wing.lift;
  });
  return (
    <group visible={visible}>
      <group ref={whole}>
      <group ref={body}>
        {ride.vehicle === "bike" ? (
          <BikeRig height={ride.vehicleH} motion={motion} />
        ) : ride.vehicleRig ? (
          <RigVehicle name={ride.vehicleRig} height={ride.vehicleH} motion={motion} stride={ride.stride} />
        ) : ride.vehicle ? (
          <Art art={ride.vehicle}>{({ texture, ratio, shapes }) => <Card texture={texture} shapes={shapes} w={ride.vehicleH * ratio} h={ride.vehicleH} flip={ride.vehicleFlip} />}</Art>
        ) : null}
        <group ref={rider} position={[seat[0], seat[1], heroZ]}>
          <RiderCard ride={ride} />
          {ride.hero === "hero/hero_childhood" && <CopterBlades heroH={ride.heroH} motion={motion} />}
        </group>
      </group>
      {ride.motion !== "fly" && (ride.vehicle || ride.vehicleRig) && <Stick from={ride.vehicleH * 0.35} to={-GROOVE_DEPTH.grooveA + SINK - 0.05} z={-0.07} />}
      </group>
    </group>
  );
}

/** Just a ride's vehicle on its stick, no rider (Skaarl running off without me). */
export function VehicleOnly({ ride, motion }) {
  return (
    <group>
      {ride.vehicleRig ? (
        <RigVehicle name={ride.vehicleRig} height={ride.vehicleH} motion={motion} stride={ride.stride} />
      ) : (
        <Art art={ride.vehicle}>{({ texture, ratio, shapes }) => <Card texture={texture} shapes={shapes} w={ride.vehicleH * ratio} h={ride.vehicleH} flip={ride.vehicleFlip} />}</Art>
      )}
      <Stick from={ride.vehicleH * 0.35} to={-GROOVE_DEPTH.grooveA + SINK - 0.05} z={-0.07} />
    </group>
  );
}

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const localX = (x) => ((((x - WORLD_START_X) % SHIFT_X_AMOUNT) + SHIFT_X_AMOUNT) % SHIFT_X_AMOUNT) + WORLD_START_X;

/**
 * How far my wing has grown (0..1). wing.grow: { scene, from, to } in that
 * scene's own x; without it the wing is fully grown.
 */
export function wingGrowth(wing) {
  if (!wing.grow) return 1;
  wing._range ??= (() => { const s = sceneRanges.find((r) => r.id === wing.grow.scene); return [s.x0 + wing.grow.from, s.x0 + wing.grow.to]; })();
  return sstep(wing._range[0], wing._range[1], localX(heroState.x));
}

/**
 * One black wing on my back (the One Winged Angel): the drawing's `root` (uv,
 * v up) sits on my back at `at` (uv of my costume), behind me, and it beats
 * around that root. It unfolds as it grows (wing.grow).
 */
function Wing({ wing, heroH, heroRatio }) {
  const grow = useRef();
  const flap = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const k = wingGrowth(wing);
    grow.current.visible = k > 0.005;
    grow.current.scale.set(Math.max(0.001, k), Math.max(0.001, k), 1);
    grow.current.rotation.z = (1 - k) * 0.9; // folded down while it grows, then spread
    flap.current.rotation.z = Math.sin(t * (wing.speed || 3.2)) * (wing.flap ?? 0.16) * k;
  });
  const at = [(wing.at[0] - 0.5) * heroH * heroRatio, wing.at[1] * heroH];
  return (
    <group position={[at[0], at[1], -0.03]}>
      <group ref={grow}>
        <group ref={flap}>
          <Art art={wing.art}>
            {({ texture, ratio, shapes }) => {
              const w = wing.h * ratio;
              return (
                <group position={[-(wing.root[0] - 0.5) * w, -wing.root[1] * wing.h, 0]}>
                  <Card texture={texture} shapes={shapes} w={w} h={wing.h} />
                </group>
              );
            }}
          </Art>
        </group>
      </group>
    </group>
  );
}

/** Me in a ride's costume, with whatever I hold (feet at the origin). */
export function RiderCard({ ride }) {
  return (
    <Art art={ride.hero}>
      {({ texture, ratio, shapes }) => (
        <>
          {ride.wing && <Wing wing={ride.wing} heroH={ride.heroH} heroRatio={ratio} />}
          <Card texture={texture} shapes={shapes} w={ride.heroH * ratio} h={ride.heroH} />
          {(ride.props || []).map((p, i) => <HeldProp key={i} prop={p} heroH={ride.heroH} heroRatio={ratio} />)}
        </>
      )}
    </Art>
  );
}

/**
 * Me, after Mr. Panda's Panda.jsx: rides its own looping curve in step with the
 * camera along groove A, on a different vehicle in every world; talks when clicked.
 */
export default function Hero({ scrollProgress, cameraScrollCurve }) {
  const group = useRef();
  const facing = useRef();
  const pop = useRef();
  const heroScrollCurve = useScrollCurve(heroCurve, initialHeroPoints, SHIFT_X_AMOUNT);
  const [rideKey, setRideKey] = useState(scenes[0].id);
  const [bubble, setBubble] = useState(null);
  const lastScene = useRef(null);
  const bubbleTimer = useRef();
  const motion = useRef({ dist: 0, moving: 0, prevX: null, dir: 1, popT: 0, landSeen: -1 });
  const keys = useMemo(() => Object.keys(rides), []);

  const say = (text) => {
    setBubble(text);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), BUBBLE_MS);
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    const progress = scrollProgress.current;

    // Follow the camera's loop state (transition curve on/off, loop count).
    if (cameraScrollCurve.transitionCurveActive.current !== heroScrollCurve.transitionCurveActive.current) {
      heroScrollCurve.transitionCurveActive.current = cameraScrollCurve.transitionCurveActive.current;
      if (cameraScrollCurve.transitionCurveActive.current) {
        heroScrollCurve.loopCounter.current = cameraScrollCurve.loopCounter.current;
        heroScrollCurve.initiateTransitionCurve();
      } else {
        const direction = cameraScrollCurve.loopCounter.current > heroScrollCurve.loopCounter.current ? "forward" : "backward";
        heroScrollCurve.shiftCurvePoints(direction);
        heroScrollCurve.loopCounter.current = cameraScrollCurve.loopCounter.current;
      }
    }

    const p = heroScrollCurve.getCurrentPoint(progress);
    const g = group.current;
    g.position.x = THREE.MathUtils.lerp(g.position.x, p.x, 0.1);
    g.position.y = THREE.MathUtils.lerp(g.position.y, p.y - SINK, 0.12);
    g.position.z = THREE.MathUtils.lerp(g.position.z, p.z, 0.1);

    heroState.x = g.position.x;
    heroState.curveX = p.x;
    heroState.y = g.position.y;

    // Motion state shared by the rides: distance travelled drives legs and wheels.
    const m = motion.current;
    const dx = m.prevX === null || Math.abs(g.position.x - m.prevX) > 2 ? 0 : g.position.x - m.prevX;
    m.prevX = g.position.x;
    m.dist += dx;
    m.moving = THREE.MathUtils.lerp(m.moving, Math.min(1, (Math.abs(dx) / Math.max(delta, 1e-3)) * 0.6), 0.15);
    if (Math.abs(dx) > 0.004) m.dir = Math.sign(dx);
    facing.current.scale.x += (m.dir - facing.current.scale.x) * 0.15; // paper puppet turning round

    // Little squash when hopping onto a new vehicle (or landing on one).
    if (heroState.land > m.landSeen) { m.landSeen = heroState.land; m.popT = 1; }
    m.popT = Math.max(0, m.popT - delta * 3);
    const s = 1 - 0.22 * Math.sin(m.popT * Math.PI);
    pop.current.scale.set(s, s, 1);
    // pushed underground by a set piece (heroState.sink: 0 normal .. 1 out of sight)
    pop.current.position.y = -heroState.sink * SINK_DEPTH;

    const sceneIndex = sceneIndexAt(g.position.x);
    const key = sceneIndex < 0 ? "seam" : scenes[sceneIndex].id;
    if (key !== rideKey && rides[key]) {
      setRideKey(key);
      m.popT = 1;
    }
    if (sceneIndex !== lastScene.current) {
      if (lastScene.current !== null && sceneIndex >= 0) say(scenes[sceneIndex].greeting);
      lastScene.current = sceneIndex;
    }
    if (import.meta.env.DEV) window.__hero = { x: g.position.x, y: g.position.y, sceneIndex, rideKey: key };
  });

  const onClick = (e) => {
    e.stopPropagation();
    say(sillyLines[Math.floor(Math.random() * sillyLines.length)]);
  };
  const ride = rides[rideKey];

  return (
    <>
    <group ref={group} position={initialHeroPoints[0].toArray()}>
      <group ref={pop}>
        <group
          ref={facing}
          onClick={onClick}
          onPointerEnter={() => (document.body.style.cursor = "pointer")}
          onPointerLeave={() => (document.body.style.cursor = "")}
        >
          {keys.map((k) => (
            <Ride key={k} rideKey={k} ride={rides[k]} visible={k === rideKey} motion={motion} />
          ))}
        </group>
      </group>
      {bubble && (
        <Html position={[0.25, rideSeat(ride)[1] + ride.heroH + 0.3, 0]} zIndexRange={[20, 0]}>
          <ScribbleBubble>{bubble}</ScribbleBubble>
        </Html>
      )}
    </group>
    {/* dust kicked up behind me while I run (rides with dust: Skaarl), in its own
        Suspense so a late texture can only cost a few puffs, never the whole world */}
    <Suspense fallback={null}>
      <DustTrail
        motion={motion}
        follow={group}
        stride={ride.stride || 10.5}
        kind={ride.dust}
        active={() => ride.dust && heroState.hideRide !== rideKey && heroState.sink === 0}
      />
    </Suspense>
    </>
  );
}
