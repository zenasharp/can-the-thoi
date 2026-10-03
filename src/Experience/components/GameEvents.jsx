// Set pieces of the games world (League of Legends, Gunny, Moly), built like the
// childhood ones in Events.jsx: paper cards and rigs moved by gsap timelines or
// little per-frame simulations, reacting to me riding past.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import rigs from "../../content/rigs.json";
import { rides } from "../../content/site";
import { HERO_Z, sceneRanges, SLOT_Z } from "../layout";
import { heroState } from "../heroState";
import { pilotTo } from "../scrollPilot";
import { ArtCard, burstTexture, layerZ, PAD, rigLayout, rigPart, usePassTrigger } from "./Events";
import { RiderCard, SINK_DEPTH, VehicleOnly } from "./Hero";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { const c = clamp01(x); return c * c * (3 - 2 * c); };

// --- Teemo's mushrooms ---------------------------------------------------------

/**
 * A big Noxious Trap at the edge of my lane. When I run into it, it squashes,
 * pops and a poison cloud billows up high while smaller puffs burst out (and I
 * jump). It grows back if I go back. Everything is a function of one progress
 * value, so nothing shows before it goes off.
 */
export function TeemoShroom({ position, h = 0.8, z = SLOT_Z.mid - 0.27, ahead = 0.95 }) {
  const clock = useThree((s) => s.clock);
  const anchor = useRef();
  const shroom = useRef();
  const cloud = useRef();
  const puffs = useRef();
  const st = useRef({ p: 0 });
  const tween = useRef();
  usePassTrigger(
    anchor,
    ahead,
    () => {
      tween.current?.kill();
      st.current.p = 0;
      tween.current = gsap.to(st.current, { p: 1, duration: 2.4, ease: "none" });
      heroState.jolt = clock.elapsedTime;
    },
    () => { tween.current?.kill(); tween.current = gsap.to(st.current, { p: 0, duration: 0.5, ease: "power2.out" }); },
  );
  useFrame(() => {
    const p = st.current.p;
    // squash, then pop (and grow back as p returns to 0)
    const k = clamp01(p / 0.03), gone = smooth((p - 0.03) / 0.04);
    shroom.current.scale.set((1 + 0.3 * k) * (1 - gone) + 0.001, (1 - 0.45 * k) * (1 - gone) + 0.001, 1);
    shroom.current.visible = gone < 0.999;
    // the poison cloud billows up high, then thins away
    const on = p > 0.04 && p < 0.999;
    cloud.current.visible = on;
    if (on) {
      const grow = smooth((p - 0.04) / 0.12), fade = 1 - smooth((p - 0.72) / 0.27);
      const s = (0.3 + 0.55 * grow + 0.25 * p) * fade + 0.001;
      cloud.current.scale.set(s, s, 1);
      cloud.current.position.y = h * 0.5 + 1.9 * (1 - (1 - clamp01((p - 0.04) / 0.8)) ** 2);
      cloud.current.rotation.z = Math.sin(p * 9) * 0.06;
    }
    // smaller puffs burst out in a fan and float up
    const n = puffs.current.children.length;
    puffs.current.children.forEach((q, i) => {
      const u = clamp01((p - 0.04) / 0.5);
      const show = p > 0.04 && u < 1;
      q.visible = show;
      if (!show) return;
      const a = Math.PI * (0.08 + (0.84 * i) / (n - 1));
      const r = 0.85 * (1 - (1 - u) ** 2);
      q.position.set(Math.cos(a) * r, h * 0.4 + Math.sin(a) * r * 1.1 + u * 0.8, 0.1 + i * 0.01);
      const s = smooth(u / 0.12) * (1 - smooth((u - 0.55) / 0.45)) + 0.001;
      q.scale.set(s, s, 1);
    });
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <group ref={shroom}>
        <ArtCard art="games/teemo_shroom" h={h} />
      </group>
      <group ref={cloud} position={[0, 0, 0.08]} visible={false}>
        <ArtCard art="games/poison_cloud" h={h * 1.1} center />
      </group>
      <group ref={puffs} position={[0, 0, 0.12]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} visible={false}>
            <ArtCard art="games/poison_cloud" h={h * 0.4} center />
          </group>
        ))}
      </group>
    </group>
  );
}

// --- minions vs. turret ------------------------------------------------------------

/**
 * A wave of blue caster minions pushing a red turret. Each walks up to its spot
 * and keeps throwing blue bolts at the turret; the turret answers with a red bolt
 * every second at the minion in front, which drops after three hits and comes
 * back in with the next wave. `position` is the turret's.
 */
export function MinionTurret({ position, turretH = 2.6, minionH = 0.62, z = SLOT_Z.back, count = 4 }) {
  const turret = useRef();
  const mRefs = useRef([]);
  const bars = useRef([]);
  const orbRefs = useRef([]);
  const MZ = 0.34; // minions stand in front of the turret's base
  const SLOT0 = -1.0, GAP = 0.62, SPAWN = -5.2, SPEED = 0.85;
  const sim = useRef(null);
  if (!sim.current) {
    sim.current = {
      minions: Array.from({ length: count }, (_, i) => ({ x: SPAWN + 0.3 - i * 0.55, state: "walk", hp: 3, t0: 0, next: 0, hit: -9 })),
      orbs: Array.from({ length: 10 }, () => ({ on: false })),
      nextTurret: 1.2,
      turretHit: -9,
    };
  }
  const fire = (o, a, b, dur, arc, onHit, t) => Object.assign(o, { on: true, a, b, dur, arc, onHit, t0: t });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const S = sim.current;
    const freeOrb = () => S.orbs.find((o) => !o.on);
    S.minions.forEach((m, i) => {
      const slot = SLOT0 - i * GAP;
      if (m.state === "walk") {
        m.x = Math.min(slot, m.x + SPEED * dt);
        if (m.x >= slot) { m.state = "attack"; m.next = t + 0.3 + Math.random() * 0.8; }
      } else if (m.state === "attack" && t >= m.next) {
        const o = freeOrb();
        if (o) fire(o, [m.x + 0.24 * minionH, 0.58 * minionH, MZ], [0.05 + (Math.random() - 0.5) * 0.3, turretH * (0.35 + Math.random() * 0.2), 0.05], 0.45, 0.25, () => (S.turretHit = state.clock.elapsedTime), t);
        m.next = t + 1.1 + Math.random() * 0.5;
      } else if (m.state === "die" && t - m.t0 > 1.8) {
        Object.assign(m, { x: SPAWN, state: "walk", hp: 3 });
      }
      // draw
      const g = mRefs.current[i];
      if (!g) return;
      const walking = m.state === "walk";
      const dying = m.state === "die" ? t - m.t0 : 0;
      const knock = Math.max(0, 1 - (t - m.hit) / 0.15);
      g.position.set(m.x - knock * 0.06, walking ? Math.abs(Math.sin(t * 9 + i)) * 0.045 : 0, MZ + i * 0.01);
      g.rotation.z = m.state === "die" ? 1.35 * smooth(dying / 0.3) : walking ? Math.sin(t * 9 + i) * 0.04 : Math.sin(t * 3 + i) * 0.02;
      const sc = m.state === "die" ? 1 - smooth((dying - 0.55) / 0.35) : 1;
      g.scale.set(sc, sc, 1);
      const bar = bars.current[i];
      if (bar) bar.scale.x = Math.max(0.001, m.hp / 3); // shrinks from its left end
    });
    // the turret shoots the minion nearest to it
    if (t >= S.nextTurret) {
      const target = S.minions.filter((m) => m.state === "attack").sort((a, b) => b.x - a.x)[0];
      const o = target && freeOrb();
      if (o) {
        fire(o, [0, turretH * 0.71, 0.04], [target.x, minionH * 0.5, MZ], 0.32, 0.15, () => {
          target.hit = state.clock.elapsedTime;
          if (target.state !== "attack") return;
          target.hp -= 1;
          if (target.hp <= 0) { target.state = "die"; target.t0 = state.clock.elapsedTime; }
        }, t);
        o.red = true;
      }
      S.nextTurret = t + 1.0;
    }
    const th = t - S.turretHit;
    turret.current.position.x = th < 0.12 ? Math.sin(th * 120) * 0.012 : 0;
    // bolts in flight: scribbled flip-books (two flickering frames, blue or red),
    // pointing the way they fly
    S.orbs.forEach((o, k) => {
      const g = orbRefs.current[k];
      if (!g) return;
      if (!o.on) { g.visible = false; return; }
      const u = (t - o.t0) / o.dur;
      if (u >= 1) { o.on = false; g.visible = false; o.onHit?.(); o.red = false; return; }
      g.visible = true;
      const dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1] + Math.cos(u * Math.PI) * Math.PI * o.arc;
      g.position.set(o.a[0] + dx * u, o.a[1] + (o.b[1] - o.a[1]) * u + Math.sin(u * Math.PI) * o.arc, o.a[2] + (o.b[2] - o.a[2]) * u + 0.02);
      g.rotation.z = Math.atan2(dy, dx);
      const frame = (o.red ? 2 : 0) + (Math.floor(t * 14 + k) % 2);
      g.children.forEach((c, i) => (c.visible = i === frame));
    });
  });

  return (
    <group position={[position[0], position[1] - 0.02, z]}>
      <group ref={turret}>
        <ArtCard art="games/turret_red" h={turretH} />
      </group>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(el) => (mRefs.current[i] = el)}>
          <ArtCard art="games/minion_blue" h={minionH} />
          {/* little scribbled health bar: the fill shrinks from its left end */}
          <group position={[0, minionH + 0.06, 0.01]}>
            <ArtCard art="games/hp_frame" h={0.105} />
            <group ref={(el) => (bars.current[i] = el)} position={[-0.155, 0.027, 0.012]}>
              <ArtCard art="games/hp_fill" h={0.06} offset={[0.155, 0, 0]} />
            </group>
          </group>
        </group>
      ))}
      {Array.from({ length: 10 }, (_, k) => (
        <group key={k} ref={(el) => (orbRefs.current[k] = el)} visible={false}>
          {["games/bolt_blue_1", "games/bolt_blue_2", "games/bolt_red_1", "games/bolt_red_2"].map((art) => (
            <group key={art} visible={false}>
              <ArtCard art={art} h={0.32} center />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// --- the Elder Dragon -------------------------------------------------------------

/**
 * The Elder Dragon gliding to and fro high over the Rift, its two wings cut off
 * the drawing as separate parts (scripts/split_rig.mjs) beating around their
 * roots; it turns round like a paper puppet at each end (it is drawn facing left).
 */
export function ElderDragon({ position, y = 3.3, h = 1.7, glide = 5, z = SLOT_Z.sky }) {
  const rig = rigs.elder;
  const L = useMemo(() => rigLayout(rig, h), [rig, h]);
  const root = useRef();
  const turn = useRef();
  const p = { wing_far: useRef(), body: useRef(), wing_near: useRef() };
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const u = t * 0.16;
    const beat = Math.sin(t * 4.2);
    root.current.position.x = Math.sin(u) * glide;
    root.current.position.y = Math.sin(u * 2.3) * 0.25 + beat * 0.06; // wings down, body up
    const facing = Math.cos(u) > 0 ? -1 : 1;
    turn.current.scale.x += (facing - turn.current.scale.x) * 0.05;
    turn.current.rotation.z = -Math.cos(u) * 0.06;
    p.wing_far.current.rotation.z = 0.3 * beat; // both tips go down together
    p.wing_near.current.rotation.z = -0.34 * beat;
  });
  const part = (n) => rigPart("elder", rig, L, n, p[n], layerZ(rig, n, 0.01));
  return (
    <group position={[position[0], position[1] + y, z]}>
      <group ref={root}>
        <group ref={turn}>{rig.order.map(part)}</group>
      </group>
    </group>
  );
}

// --- Moly ----------------------------------------------------------------------------

/** Moly sitting in the front row, waving hello: harder as I come by. */
export function MolyWave({ position, h = 1.15, z = SLOT_Z.front, ahead = 5 }) {
  const rig = rigs.moly;
  const L = useMemo(() => rigLayout(rig, h), [rig, h]);
  const anchor = useRef();
  const p = { body: useRef(), arm_wave: useRef() };
  const near = useRef({ v: 0 });
  usePassTrigger(anchor, ahead, () => gsap.to(near.current, { v: 1, duration: 0.4 }), () => gsap.to(near.current, { v: 0, duration: 0.6 }));
  useFrame((state) => {
    const t = state.clock.elapsedTime, v = near.current.v;
    const w = t * (3 + 5 * v);
    p.arm_wave.current.rotation.z = Math.sin(w) * (0.12 + 0.08 * v);
    p.body.current.rotation.z = Math.sin(t * 1.4) * 0.015 + Math.sin(w) * 0.01 * v;
    p.body.current.position.y = Math.abs(Math.sin(w)) * 0.015 * v;
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      {rig.order.map((n) => rigPart("moly", rig, L, n, p[n], layerZ(rig, n)))}
    </group>
  );
}

// --- Gunny ---------------------------------------------------------------------------

/**
 * The Gunny chick up on its tree's branch, lobbing its "lu gạch" (the brick jar)
 * down at a Rift Scuttler scuttling in the river below: it leans back, flings,
 * the jar spins down onto the crab, POW, the crab gets squashed flat and hops,
 * and again. The throw is aimed where the crab will be when the jar lands.
 */
export function GunnyTree({ position, treeH = 3.4, chickH = 0.8, jarH = 0.5, z = SLOT_Z.back, crab = { x: 2.3, range: 1.5, h: 0.55 }, period = 2.6 }) {
  const rig = rigs.gunny_tree;
  const L = useMemo(() => rigLayout(rig, treeH), [rig, treeH]);
  const [px, py] = L.toWorld(rig.perch);
  const chick = useRef();
  const jar = useRef();
  const spin = useRef();
  const pow = useRef();
  const crabRef = useRef();
  const crabBody = useRef();
  const powMap = useMemo(burstTexture, []);
  const RELEASE = 0.42, FLIGHT = 0.8;
  const crabZ = SLOT_Z.laneB + 0.03 - z;
  const crabY = -0.14; // standing in the river (groove B), like the traffic
  const crabX = (t) => crab.x + crab.range * Math.sin(t * 0.55);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ph = t % period;
    const t0 = t - ph;
    // lean back to wind up, then fling forward
    const wind = smooth(ph / 0.35) * (1 - smooth((ph - 0.35) / 0.1));
    const fling = smooth((ph - 0.35) / 0.1) * (1 - smooth((ph - 0.6) / 0.4));
    chick.current.rotation.z = 0.22 * wind - 0.2 * fling;
    chick.current.scale.set(1 + 0.04 * wind, 1 - 0.06 * wind, 1);
    // the jar: from the chick's wing down onto where the crab will be
    const hitT = t0 + RELEASE + FLIGHT;
    const sx = px + 0.3 * chickH, sy = py + 0.55 * chickH, sz = 0.06;
    const ex = crabX(hitT), ey = crabY + crab.h * 0.6;
    const u = (ph - RELEASE) / FLIGHT;
    const flying = u >= 0 && u < 1;
    jar.current.visible = flying;
    if (flying) {
      jar.current.position.set(sx + (ex - sx) * u, sy + (ey - sy) * u + 4 * 1.0 * u * (1 - u), sz + (crabZ - sz) * u);
      spin.current.rotation.z = -u * Math.PI * 3;
    }
    // the crab scuttles sideways; when hit it is squashed flat, then hops
    const cx = crabX(t);
    const since = ph - RELEASE - FLIGHT;
    const hit = since >= 0 && since < 0.6 ? since / 0.6 : -1;
    crabRef.current.position.set(cx, crabY, crabZ);
    const squash = hit >= 0 ? 1 - 0.5 * (1 - smooth(hit / 0.35)) : 1;
    crabBody.current.scale.set(2 - squash, squash, 1);
    crabBody.current.position.y = hit >= 0.35 ? Math.sin(((hit - 0.35) / 0.65) * Math.PI) * 0.25 : Math.abs(Math.sin(t * 14)) * 0.035;
    crabBody.current.rotation.z = Math.sin(t * 14) * 0.035;
    const powOn = hit >= 0 && hit < 0.75;
    pow.current.visible = powOn;
    if (powOn) {
      const s = 0.4 + 0.7 * smooth(hit / 0.25);
      pow.current.scale.set(s, s, 1);
      pow.current.position.set(cx, ey + 0.3, crabZ + 0.1);
      pow.current.material.opacity = 1 - smooth((hit - 0.45) / 0.3);
    }
  });
  return (
    <group position={[position[0], position[1] - 0.02, z]}>
      {rigPart("gunny_tree", rig, L, "tree", null)}
      <group ref={chick} position={[px, py, 0.05]}>
        <ArtCard art="games/gunny_chick" h={chickH} />
      </group>
      <group ref={jar} visible={false}>
        <group ref={spin}>
          <ArtCard art="games/lu_gach" h={jarH} center />
        </group>
      </group>
      <group ref={crabRef}>
        <group ref={crabBody}>
          <ArtCard art="games/scuttle" h={crab.h} />
        </group>
      </group>
      <mesh ref={pow} visible={false} renderOrder={5}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshBasicMaterial map={powMap} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

// --- Blitzcrank ------------------------------------------------------------------------

const LINKS = 20;
const _aw = new THREE.Vector3();
const _c = new THREE.Vector3();

/**
 * Blitzcrank, hiding in a bush near the end of the Rift. Fast, because people
 * scroll fast: while I am still a few units away he jumps out and fires Rocket
 * Grab (his fist flies out on its chain), hooks me off Skaarl and yanks me over to
 * his side, turns round and Power Fists me into the next world. The camera takes
 * over meanwhile (scrollPilot) and follows me as I spin through the air and land
 * in the Vietnamese street, crash into the ground, and pop back up out of it on
 * my bike in my school jacket. Skaarl, scared stiff, jumps, turns
 * round and runs back the way we came.
 *
 * While I am off my ride, my ride's rider is hidden (heroState.rider.hidden) and
 * this component shows a copy of me (RiderCard) in the air instead; my ride is
 * hidden too (heroState.hideRide) while a copy of Skaarl (VehicleOnly) runs off.
 */
export function BlitzHook({ position, h = 1.75, z = SLOT_Z.back + 0.12, ahead = 5.5, bushH = 1.2 }) {
  const clock = useThree((s) => s.clock);
  const rig = rigs.blitz;
  const L = useMemo(() => rigLayout(rig, h), [rig, h]);
  const riderH = rides.games.heroH;
  // where I land: just inside the next world, on whatever I ride there
  const nextX0 = (sceneRanges.find((r) => r.x0 > position[0]) || sceneRanges[0]).x0;
  const anchor = useRef();
  const blitz = useRef(); // jump + idle
  const flipper = useRef(); // facing (1 = left, the way he is drawn; -1 = right)
  const p = { arm_far: useRef(), body: useRef(), head: useRef(), arm_near: useRef() };
  const fist = useRef();
  const fistFlip = useRef();
  const chain = useRef();
  const pow = useRef();
  const me = useRef(); // the copy of me while I am off my ride
  const skaarl = useRef(); // ...and of Skaarl, running away
  const skaarlTurn = useRef();
  const fleeMotion = useRef({ dist: 0, moving: 1 });
  const fleeFrom = useMemo(() => new THREE.Vector3(), []);
  const powMap = useMemo(burstTexture, []);
  const st = useRef({ pop: 0, shoot: 0, pull: 0, turn: 0, punch: 0, fly: 0, dive: 0, flee: 0, grabbed: false, launched: false });
  const tl = useRef();

  // the fist card around its own pivot, so it can fly off the arm and be mirrored
  const fp = rig.parts.fist;
  const [fx, fy] = L.toWorld(rig.pivots.fist);
  const [fcx] = L.toWorld([fp.x + fp.w / 2, 0]);
  const [, fby] = L.toWorld([0, fp.y + fp.h + PAD]);
  const fistH = (fp.h + PAD * 2) * L.s;
  const [sx, sy] = L.toWorld(rig.socket);
  const fistZ = layerZ(rig, "fist") + 0.01;

  const G = useMemo(() => new THREE.Vector3(), []); // my middle (Blitz-local), live until grabbed
  const G0 = useMemo(() => new THREE.Vector3(), []); // ...frozen at the grab
  const R = useMemo(() => new THREE.Vector3(1.0, 0.75, 0.5), []); // his right side, where the punch lands
  const from = useMemo(() => new THREE.Vector3(), []); // world, where the punch launched me
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const fistPos = useMemo(() => new THREE.Vector3(), []);
  const pathAt = (u, out) => {
    // yanked along a curve over in front of him to his right side
    const C = _c.set(0.15, 2.0, 0.6);
    const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    return out.set(a * G0.x + b * C.x + c * R.x, a * G0.y + b * C.y + c * R.y, a * G0.z + b * C.z + c * R.z);
  };

  useEffect(() => {
    const s = st.current;
    const grab = () => {
      s.grabbed = true;
      G0.copy(G);
      heroState.rider.hidden = true;
      // Skaarl bolts: from here on the one on screen is our copy
      fleeFrom.set(heroState.x, heroState.y, HERO_Z);
      heroState.hideRide = "games";
      // the camera runs up to him with me
      anchor.current.getWorldPosition(_aw);
      pilotTo(_aw.x - 0.3, 0.5);
    };
    const launch = () => {
      s.launched = true;
      anchor.current.getWorldPosition(_aw);
      from.copy(R).add(_aw).add(_c.set(0, -riderH * 0.5, -0.06));
      // ...and follows me into the next world, where I land on my ride
      const landX = _aw.x + (nextX0 + 1.8 - position[0]);
      pilotTo(landX, 1.05);
    };
    // under the street: from here on it is me on my bike, still out of sight
    const swap = () => {
      s.grabbed = s.launched = false;
      heroState.rider.hidden = false;
      heroState.hideRide = null;
    };
    const land = () => (heroState.land = clock.elapsedTime);
    const t = gsap.timeline({ paused: true });
    t.to(s, { pop: 1, duration: 0.16, ease: "power2.out" }, 0)
      .to(s, { shoot: 1, duration: 0.2, ease: "power1.out" }, 0.1)
      .call(grab, null, 0.3)
      .to(s, { pull: 1, duration: 0.34, ease: "power2.inOut" }, 0.3)
      .to(s, { flee: 1, duration: 2.2, ease: "none" }, 0.3)
      .set(s, { shoot: 0 }, 0.62) // the fist is back on his arm: it no longer follows me
      .to(s, { turn: 1, duration: 0.12, ease: "power2.inOut" }, 0.62)
      .to(s, { punch: 1, duration: 0.06, ease: "power3.out" }, 0.72)
      .call(launch, null, 0.76)
      .set(heroState, { sink: 1 }, 0.76) // my next ride waits underground
      .to(s, { fly: 1, duration: 1.15, ease: "none" }, 0.76)
      .to(s, { punch: 0, duration: 0.25, ease: "power2.inOut" }, 0.9)
      .to(s, { dive: 1, duration: 0.22, ease: "power2.in" }, 1.91) // crash into the ground...
      .call(swap, null, 2.16)
      .to(heroState, { sink: 0, duration: 0.5, ease: "back.out(1.6)" }, 2.24) // ...and pop up on my bike
      .call(land, null, 2.7);
    tl.current = t;
    if (import.meta.env.DEV) (window.__tl ||= {}).blitz = t;
    return () => { t.kill(); heroState.rider.hidden = false; heroState.hideRide = null; heroState.sink = 0; };
  }, []);
  usePassTrigger(
    anchor,
    ahead,
    () => {
      // already well past him (a jump, not a scroll): he just stands there. The
      // scroll position (curveX), not my smoothed one, which still has to catch up
      anchor.current.getWorldPosition(_aw);
      if (heroState.curveX - _aw.x > 1.5) { st.current.pop = 1; return; }
      tl.current?.restart();
    },
    () => {
      // gone back: he ducks back into the bush, and I am on Skaarl again
      tl.current?.pause();
      const s = st.current;
      s.grabbed = s.launched = false;
      s.flee = 0;
      heroState.rider.hidden = false;
      heroState.hideRide = null;
      heroState.sink = 0;
      gsap.to(s, { pop: 0, shoot: 0, pull: 0, turn: 0, punch: 0, fly: 0, dive: 0, duration: 0.25, ease: "power2.inOut" });
    },
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = st.current;
    anchor.current.getWorldPosition(_aw);
    if (!s.grabbed) G.copy(heroState.rider.rest).sub(_aw).add(tmp.set(0, riderH * 0.5, 0.06));

    // jump out of the bush, then idle
    blitz.current.visible = s.pop > 0.001;
    blitz.current.position.y = -1.1 * (1 - s.pop) + Math.sin(s.pop * Math.PI) * 0.45 + (s.pop >= 1 ? Math.abs(Math.sin(t * 2.2)) * 0.02 : 0);
    const facing = Math.cos(s.turn * Math.PI); // 1 -> -1 (paper puppet turning)
    flipper.current.scale.x = Math.abs(facing) < 0.03 ? 0.03 * Math.sign(facing || 1) : facing;
    p.head.current.rotation.z = Math.sin(t * 1.7) * 0.04;
    p.arm_far.current.rotation.z = Math.sin(t * 2.1) * 0.08;

    // the fist: on the arm, flying out to me, dragging me back, punching
    const restX = fx * facing, restY = fy + blitz.current.position.y;
    const rest = tmp.set(restX, restY, fistZ);
    if (s.grabbed && s.pull > 0) {
      const released = smooth((s.pull - 0.55) / 0.45);
      pathAt(Math.min(s.pull, 0.55), fistPos).lerp(rest, released);
    } else {
      const target = s.grabbed ? G0 : G;
      fistPos.copy(rest).lerp(target, s.shoot);
      // it comes forward out of the bush first, so it flies in front of me, not behind
      fistPos.z = rest.z + (target.z - rest.z) * (1 - (1 - s.shoot) ** 4);
    }
    const dir = -facing; // punch the way he faces, out in front of the bush
    fistPos.x += dir * 0.55 * s.punch;
    fistPos.z += (R.z + 0.08 - fistPos.z) * s.punch;
    fist.current.position.copy(fistPos);
    fistFlip.current.scale.x = flipper.current.scale.x;

    // the chain, from the arm's socket to the fist
    const ax = sx * facing, ay = sy + blitz.current.position.y, az = fistZ - 0.005;
    const dx = fistPos.x - ax, dy = fistPos.y - ay, dz = fistPos.z - az;
    const len = Math.hypot(dx, dy);
    const showChain = len > 0.2;
    chain.current.visible = showChain;
    if (showChain) {
      const ang = Math.atan2(dy, dx);
      chain.current.children.forEach((c, i) => {
        const u = (i + 0.5) / LINKS;
        c.position.set(ax + dx * u, ay + dy * u, az + dz * u);
        c.rotation.z = ang;
        c.visible = u * len > 0.08 && u * len < len - 0.08;
      });
    }
    // knuckles first along the chain (the fist is drawn facing left)
    fist.current.rotation.z = showChain && s.turn === 0 ? Math.atan2(Math.sin(Math.atan2(dy, dx) - Math.PI), Math.cos(Math.atan2(dy, dx) - Math.PI)) : 0;

    // me, while I am off my ride: yanked over, then punched across to my next ride
    const m = me.current;
    m.visible = s.grabbed;
    if (s.grabbed) {
      if (s.launched) {
        // from the punch to where my seat will come up (my ride waits underground),
        // high over the camera's path, then straight down into the street
        const f = s.fly;
        const to = tmp.copy(heroState.rider.rest).setY(heroState.rider.rest.y + heroState.sink * SINK_DEPTH);
        const cx = (from.x + to.x) / 2, cy = Math.max(from.y, to.y) + 3.2, cz = (from.z + to.z) / 2;
        const a = (1 - f) * (1 - f), b = 2 * f * (1 - f), c = f * f;
        m.position.set(a * from.x + b * cx + c * to.x - _aw.x, a * from.y + b * cy + c * to.y - _aw.y - s.dive * 2.2, a * from.z + b * cz + c * to.z - _aw.z);
        m.rotation.z = -f * Math.PI * 4; // two flips, landing upright
      } else {
        pathAt(s.pull, m.position);
        m.position.y -= riderH * 0.5;
        m.position.z -= 0.06; // just behind the fist that holds me
        m.rotation.z = -0.5 * s.pull;
      }
    }

    // Skaarl, scared: a jump of fright, a turn, then it runs back the way we came
    const fl = s.flee;
    const sk = skaarl.current;
    sk.visible = fl > 0.001 && fl < 0.999;
    if (sk.visible) {
      // the first quarter second: jump of fright and turn round; then it runs, faster and faster
      const run = 12 * clamp01((fl - 0.1) / 0.9) ** 1.4;
      fleeMotion.current.dist = run + fl * 3;
      sk.position.set(fleeFrom.x - _aw.x - run, fleeFrom.y - _aw.y + Math.sin(clamp01(fl / 0.12) * Math.PI) * 0.55 + Math.abs(Math.sin(run * 4.5)) * 0.08, fleeFrom.z - _aw.z);
      skaarlTurn.current.scale.x = Math.cos(clamp01((fl - 0.02) / 0.09) * Math.PI) || 0.01;
    }

    // POW as the fist lands
    const powOn = s.punch > 0.05 && s.fly < 0.3;
    pow.current.visible = powOn;
    if (powOn) {
      const k = 0.5 + 0.8 * s.punch;
      pow.current.scale.set(k, k, 1);
      pow.current.position.set(R.x + 0.1, R.y + 0.1, R.z + 0.1);
    }
  });

  const part = (name) => rigPart("blitz", rig, L, name, p[name], layerZ(rig, name));
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      {/* the bush he hides in */}
      <group position={[-0.5, 0, 0.32]}>
        <ArtCard art="childhood/grass" h={bushH} />
      </group>
      <group position={[0.45, 0, 0.36]}>
        <ArtCard art="childhood/grass" h={bushH * 0.92} />
      </group>
      <group ref={blitz} visible={false}>
        <group ref={flipper}>
          {part("arm_far")}
          {part("body")}
          {part("head")}
          {part("arm_near")}
        </group>
      </group>
      <group ref={fist}>
        <group ref={fistFlip}>
          <ArtCard art="games/blitz_fist" h={fistH} offset={[fcx - fx, fby - fy, 0]} />
        </group>
      </group>
      <group ref={chain} visible={false}>
        {Array.from({ length: LINKS }, (_, i) => (
          <group key={i}>
            <ArtCard art="games/blitz_link_rig_link" h={0.075} center />
          </group>
        ))}
      </group>
      <group ref={me} visible={false}>
        <RiderCard ride={rides.games} />
      </group>
      <group ref={skaarl} visible={false}>
        <group ref={skaarlTurn}>
          <VehicleOnly ride={rides.games} motion={fleeMotion} />
        </group>
      </group>
      <mesh ref={pow} visible={false} renderOrder={5}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={powMap} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

export const GAME_EVENTS = { teemoShroom: TeemoShroom, minionTurret: MinionTurret, elderDragon: ElderDragon, molyWave: MolyWave, gunnyTree: GunnyTree, blitzHook: BlitzHook };
