// Set pieces of the crypto sea, the last world: the sea itself (rows of paper
// waves), the whale spouting coins, the puppeteer pumping and dumping the
// candles, the anglerfish's "100x GEM" rug pull, the liquidation whirlpool, and
// the tangle of thoughts that follows me, grows, and finally bursts into the
// black feathers of my one wing.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import manifest from "../../content/art-manifest.json";
import rigs from "../../content/rigs.json";
import { rides } from "../../content/site";
import { HERO_Z, SLOT_Z, WALL_Z } from "../layout";
import { heroState } from "../heroState";
import { HAND, toTexture, whenFont } from "../textures";
import { ArtCard, layerZ, rigLayout, rigPart, usePassTrigger } from "./Events";
import { Art } from "./PaperCutout";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { const c = clamp01(x); return c * c * (3 - 2 * c); };
const ratioOf = (art) => (manifest[art] ? manifest[art].w / manifest[art].h : 1);
const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const _w = new THREE.Vector3();

/** Fat bubble letters in one colour with an ink outline (PUMP! / DUMP / RUG PULL!). */
function shoutTexture(text, fill, { W = 768, H = 220, size = 140, outline = 20 } = {}) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = `${size}px ${HAND}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = outline;
    ctx.strokeStyle = "#151515";
    ctx.strokeText(text, W / 2, H / 2);
    ctx.fillStyle = fill;
    ctx.fillText(text, W / 2, H / 2);
  };
  draw();
  const t = toTexture(c);
  whenFont(draw, t);
  return t;
}

/** A thought in my head: handwriting in ink with a paper-coloured halo. */
function thoughtTexture(text) {
  const W = 512, H = 128;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = `70px ${HAND}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#F4EDE0";
    ctx.strokeText(text, W / 2, H / 2);
    ctx.fillStyle = "#1A1A1A";
    ctx.fillText(text, W / 2, H / 2);
  };
  draw();
  const t = toTexture(c);
  whenFont(draw, t);
  return t;
}

function Shout({ refFn, map, w, h, position }) {
  return (
    <mesh ref={refFn} position={position} visible={false} renderOrder={6}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

// --- the sea ---------------------------------------------------------------------------

/**
 * Rows of paper waves across the whole world, like the wave flats of a toy
 * theatre: each row is a strip of tiles (variants mixed, see doodles_crypto.mjs)
 * that rocks side to side and bobs.
 * Tiles past `dark` (scene x) use the dark water, so the sea darkens as the
 * story does.
 */
export function SeaWaves({ position, width = 36, rows = [] }) {
  const refs = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rows.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x = Math.sin(t * r.speed + i * 1.7) * r.amp;
      g.position.y = (r.y || 0) + Math.sin(t * r.speed * 1.6 + i) * 0.03;
    });
  });
  return (
    <group position={[position[0], position[1] - 0.02, 0]}>
      {rows.map((r, i) => {
        // r.art / r.darkArt: a list of tile variants, picked pseudo-randomly
        const arts = [].concat(r.art), darks = [].concat(r.darkArt || r.art);
        const tw = r.h * ratioOf(arts[0]);
        const n = Math.ceil((width + r.amp * 2 + 1) / tw);
        return (
          <group key={i} ref={(el) => (refs.current[i] = el)} position={[0, r.y || 0, r.z]}>
            {Array.from({ length: n }, (_, k) => {
              const x = -r.amp - 0.5 + tw * (k + 0.5);
              const set = r.dark !== undefined && x > r.dark ? darks : arts;
              const art = set[Math.floor(rand(k * 13 + i * 71) * set.length)];
              return (
                <group key={k} position={[x, 0, 0]}>
                  <WaveTile art={art} w={tw} h={r.h} />
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/**
 * One tile of a wave row: a flat plane (no paper thickness), so the tiles of a
 * row sit edge to edge in one plane with no seam between them.
 */
function WaveTile({ art, w, h }) {
  return (
    <Art art={art}>
      {({ texture }) => <WavePlane texture={texture} w={w} h={h} />}
    </Art>
  );
}
function WavePlane({ texture, w, h }) {
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide }), [texture]);
  const depth = useMemo(() => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 }), [texture]);
  return (
    <mesh position={[0, h / 2, 0]} material={face} customDepthMaterial={depth} castShadow>
      <planeGeometry args={[w * 1.002, h]} />
    </mesh>
  );
}

// --- the whale -------------------------------------------------------------------------

/** A whale: it surfaces as I come by and spouts a fountain of coins. */
export function WhaleSpout({ position, h = 2.0, z = SLOT_Z.back + 0.05, ahead = 7 }) {
  const anchor = useRef();
  const whale = useRef();
  const coins = useRef([]);
  const st = useRef({ up: 0 });
  usePassTrigger(anchor, ahead, () => gsap.to(st.current, { up: 1, duration: 1.2, ease: "power2.out" }), () => gsap.to(st.current, { up: 0, duration: 0.8, ease: "power2.in" }));
  const w = h * ratioOf("crypto/whale");
  const hole = [(0.68 - 0.5) * w, 0.84 * h];
  const N = 16;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const up = st.current.up;
    whale.current.position.y = -h * 0.75 * (1 - up) + Math.sin(t * 1.2) * 0.06;
    whale.current.rotation.z = Math.sin(t * 0.8) * 0.03;
    coins.current.forEach((c, i) => {
      if (!c) return;
      const life = 1.6, u = (((t + (i / N) * life) % life) / life);
      const on = up > 0.85;
      c.visible = on;
      if (!on) return;
      const vx = (rand(i) - 0.5) * 2.2, vy = 3.2 + rand(i + 9) * 1.2;
      const tt = u * life;
      c.position.set(hole[0] + vx * tt, whale.current.position.y + hole[1] + vy * tt - 4.4 * tt * tt, 0.05 + i * 0.002);
      c.rotation.z = t * 5 + i;
      c.scale.x = Math.cos(t * 7 + i) || 0.05; // spinning coin
    });
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <group ref={whale}>
        <ArtCard art="crypto/whale" h={h} />
      </group>
      {Array.from({ length: N }, (_, i) => (
        <group key={i} ref={(el) => (coins.current[i] = el)} visible={false}>
          <ArtCard art="crypto/coin" h={0.24} center />
        </group>
      ))}
    </group>
  );
}

// --- the puppeteer ---------------------------------------------------------------------

const stringMat = new THREE.MeshBasicMaterial({ color: "#1A1A1A", side: THREE.DoubleSide });
// the fingertips of the hand drawing (uv, v up): pinky .. thumb
const TIPS = [[0.06, 0.32], [0.23, 0.12], [0.5, 0.03], [0.75, 0.085], [0.94, 0.21]];

/**
 * Market manipulation: a giant hand in the sky works the candles like a
 * marionette. They dance on their strings; as I come by it yanks them all up
 * (PUMP!), then lets go: the strings snap, the candles turn red and drop into
 * the sea (DUMP). It all hangs back up if I go back.
 */
export function PuppetMaster({ position, handH = 1.8, handY = 3.0, hang = 1.3, candleH = 0.7, ahead = 3.5 }) {
  const anchor = useRef();
  const hand = useRef();
  const candles = useRef([]);
  const strings = useRef([]);
  const pump = useRef();
  const dump = useRef();
  const st = useRef({ yank: 0, drop: 0, say: 0, sayDump: 0 });
  const tl = useRef();
  const pumpMap = useMemo(() => shoutTexture("PUMP!", "#3BB273"), []);
  const dumpMap = useMemo(() => shoutTexture("DUMP", "#E0453A"), []);
  const handW = handH * ratioOf("crypto/puppet_hand");
  const tips = TIPS.map(([u, v]) => [(u - 0.5) * handW, v * handH]);
  const zHand = SLOT_Z.sky - SLOT_Z.back; // the hand floats in front of the wall, the candles hang on the back strip
  usePassTrigger(
    anchor,
    ahead,
    () => {
      tl.current?.kill();
      const s = st.current;
      tl.current = gsap.timeline()
        .to(s, { yank: 1, duration: 0.45, ease: "back.out(1.4)" })
        .to(s, { say: 1, duration: 0.15, ease: "back.out(3)" }, 0.1)
        .to(s, { say: 0, duration: 0.15 }, 0.95)
        .to(s, { drop: 1, duration: 1.1, ease: "power2.in" }, 1.0)
        .to(s, { sayDump: 1, duration: 0.15, ease: "back.out(3)" }, 1.1)
        .to(s, { sayDump: 0, duration: 0.2 }, 2.1);
    },
    () => {
      tl.current?.kill();
      tl.current = gsap.to(st.current, { yank: 0, drop: 0, say: 0, sayDump: 0, duration: 0.6, ease: "power2.inOut" });
    },
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { yank, drop, say, sayDump } = st.current;
    const hy = handY + yank * 0.9 - drop * 0.3;
    hand.current.position.set(Math.sin(t * 0.7) * 0.12, hy + Math.sin(t * 1.1) * 0.05, zHand);
    hand.current.rotation.z = Math.sin(t * 0.9) * 0.04;
    tips.forEach(([tx, ty], i) => {
      const c = candles.current[i];
      const s = strings.current[i];
      if (!c || !s) return;
      const fx = hand.current.position.x + tx, fy = hand.current.position.y + ty;
      // dancing on the strings (each finger works its own), pulled up hard on the pump
      const len = hang * (1 - 0.55 * yank) + Math.sin(t * 2.4 + i * 1.9) * 0.18 * (1 - yank);
      const fall = drop * drop;
      const cx = fx + Math.sin(t * 1.3 + i) * 0.05, cy = fy - len - candleH - fall * 4.5;
      c.position.set(cx, cy, 0.02 * i);
      c.rotation.z = Math.sin(t * 1.7 + i) * 0.08 * (1 - drop) + drop * (i % 2 ? 1.2 : -1.2);
      const [green, red] = c.children;
      green.visible = drop < 0.05;
      red.visible = drop >= 0.05;
      c.visible = cy > -candleH * 2;
      // the string, from the fingertip to the wick (snapped once they drop)
      s.visible = drop < 0.02;
      const ax = fx, ay = fy, az = zHand * 0.5, bx = cx, by = cy + candleH;
      const len2 = Math.hypot(bx - ax, by - ay);
      s.position.set((ax + bx) / 2, (ay + by) / 2, az);
      s.scale.set(0.014, len2, 1);
      s.rotation.z = Math.atan2(-(bx - ax), by - ay);
    });
    pump.current.visible = say > 0.01;
    pump.current.scale.set(say, say, 1);
    dump.current.visible = sayDump > 0.01;
    dump.current.scale.set(sayDump, sayDump, 1);
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, SLOT_Z.back]}>
      <group ref={hand}>
        <ArtCard art="crypto/puppet_hand" h={handH} />
      </group>
      {tips.map((_, i) => (
        <group key={i} ref={(el) => (candles.current[i] = el)}>
          <ArtCard art="crypto/candle_green" h={candleH} />
          <group visible={false}>
            <ArtCard art="crypto/candle_red" h={candleH} />
          </group>
        </group>
      ))}
      {tips.map((_, i) => (
        <mesh key={i} ref={(el) => (strings.current[i] = el)} material={stringMat}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
      <Shout refFn={pump} map={pumpMap} w={2.3} h={0.66} position={[0.2, handY - 0.5, 0.3]} />
      <Shout refFn={dump} map={dumpMap} w={2.3} h={0.66} position={[0.2, 1.2, 0.3]} />
    </group>
  );
}

// --- the anglerfish ---------------------------------------------------------------------

/** The "100x GEM" lure. Come close and it snaps: RUG PULL! */
export function Anglerfish({ position, h = 1.6, z = SLOT_Z.back + 0.15, ahead = 2.6 }) {
  const anchor = useRef();
  const fish = useRef();
  const glow = useRef();
  const shout = useRef();
  const st = useRef({ snap: 0, say: 0 });
  const map = useMemo(() => shoutTexture("RUG PULL!", "#F8D705"), []);
  const w = h * ratioOf("crypto/anglerfish");
  const bulb = [(0.125 - 0.5) * w, 0.78 * h];
  usePassTrigger(
    anchor,
    ahead,
    () => gsap.timeline()
      .to(st.current, { snap: 1, duration: 0.18, ease: "power3.out" })
      .to(st.current, { say: 1, duration: 0.15, ease: "back.out(3)" }, 0.05)
      .to(st.current, { snap: 0, duration: 0.7, ease: "power2.inOut" }, 0.5)
      .to(st.current, { say: 0, duration: 0.2 }, 1.4),
    () => {},
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { snap, say } = st.current;
    fish.current.position.set(-0.9 * snap, Math.sin(t * 1.3) * 0.08 + 0.15 * snap - 0.35, 0);
    fish.current.rotation.z = Math.sin(t * 0.9) * 0.04 - 0.12 * snap;
    fish.current.scale.setScalar(1 + 0.12 * snap);
    const g = 1 + 0.25 * Math.sin(t * 3.2);
    glow.current.scale.set(g, g, 1);
    glow.current.position.set(fish.current.position.x + bulb[0] * fish.current.scale.x, fish.current.position.y + bulb[1] * fish.current.scale.y, -0.02);
    shout.current.visible = say > 0.01;
    shout.current.scale.set(say, say, 1);
  });
  return (
    <group ref={anchor} position={[position[0], position[1] - 0.02, z]}>
      <mesh ref={glow}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#FFF07A" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <group ref={fish}>
        <ArtCard art="crypto/anglerfish" h={h} />
      </group>
      <Shout refFn={shout} map={map} w={2.4} h={0.68} position={[-1.2, h + 0.3, 0.4]} />
    </group>
  );
}

// --- the liquidation whirlpool ---------------------------------------------------------------

/**
 * A whirlpool on the sea, spinning, swallowing red candles. Laid flat it would
 * hide behind the waves, so it leans towards the camera on the back strip.
 */
const TILT = 0.62; // from upright
export function Whirlpool({ position, r = 0.9, z = SLOT_Z.back + 0.1 }) {
  const disc = useRef();
  const orbit = useRef([]);
  const label = useRef();
  const map = useMemo(() => shoutTexture("LIQUIDATED", "#E0453A", { W: 900, size: 120 }), []);
  const cy = r * Math.cos(TILT) - 0.2; // centre height: its lower edge is under the waves
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    disc.current.rotation.z = -t * 1.4;
    orbit.current.forEach((c, i) => {
      if (!c) return;
      const life = 3.2, u = ((t / life + i / 3) % 1);
      const a = -t * 1.6 - i * 2.1 - u * 6;
      const rr = r * (1 - u) * 0.9;
      c.position.set(Math.cos(a) * rr, cy + Math.sin(a) * rr * Math.cos(TILT) - 0.2 - u * 0.15, 0.25 + Math.sin(a) * 0.1);
      c.rotation.z = a * 0.7;
      const s = 1 - u * 0.8;
      c.scale.set(s, s, 1);
      c.visible = u < 0.95;
    });
    label.current.position.y = cy + r + 0.35 + Math.sin(t * 1.8) * 0.05;
    label.current.rotation.z = Math.sin(t * 1.2) * 0.05;
  });
  return (
    <group position={[position[0], position[1] + 0.012, z]}>
      <group position={[0, cy, 0]} rotation={[-TILT, 0, 0]}>
        <group ref={disc}>
          <group position={[0, -r, 0]}>
            <ArtCard art="crypto/whirlpool" h={r * 2} />
          </group>
        </group>
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => (orbit.current[i] = el)}>
          <ArtCard art="crypto/candle_red" h={0.42} />
        </group>
      ))}
      <mesh ref={label} position={[0, 1.0, 0.1]} renderOrder={6}>
        <planeGeometry args={[1.7, 0.42]} />
        <meshBasicMaterial map={map} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

// --- the tangle of thoughts, and the one wing ----------------------------------------------------

const THOUGHTS = ["it's over", "-87%", "sell?", "rekt", "why did I ape in?", "one more trade", "can't sleep", "ngmi"];

/**
 * The thoughts I carry through the dark half of the sea: a scribbled knot
 * above my head that follows me (scene x from `from`), grows heavier until
 * `peak`, with its words circling it. At `burst` it explodes into black
 * feathers (and my one wing unfolds, see ride.wing in site.js) while sunbeams
 * break through the clouds. Going back ties it all up again.
 */
export function ThoughtTangle({ position, from = 16, peak = 28, burst = 32.4, rays = { x: 34.2, top: 7.2, h: 5.8 } }) {
  const anchor = useRef();
  const knot = useRef();
  const knotInner = useRef();
  const words = useRef([]);
  const feathers = useRef([]);
  const flash = useRef();
  const raysRef = useRef();
  const wordMaps = useMemo(() => THOUGHTS.map(thoughtTexture), []);
  const st = useRef({ burst: 0, rays: 0, burstT: -10 });
  const NF = 18;
  const riderH = rides.adult.heroH;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    anchor.current.getWorldPosition(_w);
    const rel = heroState.x - _w.x;
    const s = st.current;
    // burst once I get there; tie it back up if I go back
    if (s.burst === 0 && rel >= burst) {
      s.burst = 1;
      s.burstT = t;
      gsap.to(s, { rays: 1, duration: 1.6, ease: "power2.out", delay: 0.2 });
    } else if (s.burst === 1 && rel < burst - 1) {
      s.burst = 0;
      gsap.to(s, { rays: 0, duration: 0.6 });
    }
    const since = t - s.burstT;
    const grow = smooth((rel - from) / (peak - from));
    const shown = rel > from - 0.5 && (s.burst === 0 || since < 0.3);
    const k = s.burst ? (since < 0.12 ? 1 + since * 3 : Math.max(0, 1.36 - (since - 0.12) * 8)) : 1;
    const cx = rel, cy = heroState.y - _w.y + riderH + 0.85 + 0.35 * grow;
    if (s.burst === 1 && since < 0.05) { s.fx = cx; s.fy = cy; }
    knot.current.visible = shown && grow > 0.01;
    const size = (0.35 + 1.0 * grow) * k;
    knot.current.position.set(cx, cy, HERO_Z + 0.05);
    knot.current.scale.set(size, size, 1);
    knotInner.current.rotation.z = Math.sin(t * 1.3) * 0.12;
    // flip-book: four scribbles of the knot, faster as it gets heavier
    const frame = Math.floor(t * (6 + 6 * grow)) % 4;
    knotInner.current.children.forEach((c, i) => (c.visible = i === frame));
    knotInner.current.position.x = Math.sin(t * 7.3) * 0.02 * grow; // the knot trembles
    // the words circle it, more and more of them
    words.current.forEach((m, i) => {
      if (!m) return;
      const on = shown && grow > (i + 0.5) / THOUGHTS.length;
      m.visible = on;
      if (!on) return;
      const a = t * 0.5 + (i / THOUGHTS.length) * Math.PI * 2;
      const rr = 0.75 * size + 0.35;
      m.position.set(cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.6, HERO_Z + 0.08 + (Math.sin(a) < 0 ? -0.1 : 0.1));
      m.rotation.z = Math.sin(t * 1.7 + i) * 0.12;
      const sc = 0.85 + 0.12 * Math.sin(t * 2 + i);
      m.scale.set(sc, sc, 1);
    });
    // black feathers burst out of it, then drift down
    feathers.current.forEach((f, i) => {
      if (!f) return;
      const life = 3.4, u = since / life;
      const on = s.burst === 1 && u >= 0 && u < 1;
      f.visible = on;
      if (!on) return;
      const a = (i / NF) * Math.PI * 2 + rand(i) * 0.4;
      const sp = 1.6 + rand(i + 3) * 1.4;
      const out = 1 - Math.exp(-since * 3);
      f.position.set(s.fx + Math.cos(a) * sp * out + Math.sin(since * 2 + i) * 0.15, s.fy + Math.sin(a) * sp * out * 0.8 - since * since * 0.12, HERO_Z + 0.12 + (i % 3) * 0.03);
      f.rotation.z = a + since * (rand(i + 5) - 0.5) * 3;
      const sc = (1 - smooth((u - 0.7) / 0.3)) * (0.8 + rand(i + 7) * 0.5);
      f.scale.set(sc, sc, 1);
    });
    flash.current.visible = s.burst === 1 && since < 0.5;
    if (flash.current.visible) {
      const fs = 0.3 + since * 6;
      flash.current.scale.set(fs, fs, 1);
      flash.current.material.opacity = 0.9 * (1 - since / 0.5);
      flash.current.position.set(s.fx ?? cx, s.fy ?? cy, HERO_Z + 0.15);
    }
    // sunbeams, unrolling down from the clouds
    raysRef.current.visible = s.rays > 0.01;
    raysRef.current.scale.set(1, Math.max(0.001, s.rays), 1);
  });
  return (
    <group ref={anchor} position={[position[0], 0, 0]}>
      <group ref={knot} visible={false}>
        <group ref={knotInner}>
          {[1, 2, 3, 4].map((i) => (
            <group key={i} visible={i === 1}>
              <ArtCard art={`crypto/thought_tangle_${i}`} h={1.1} center />
            </group>
          ))}
        </group>
      </group>
      {wordMaps.map((map, i) => (
        <mesh key={i} ref={(el) => (words.current[i] = el)} visible={false} renderOrder={6}>
          <planeGeometry args={[1.2, 0.3]} />
          <meshBasicMaterial map={map} transparent depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: NF }, (_, i) => (
        <group key={i} ref={(el) => (feathers.current[i] = el)} visible={false}>
          <ArtCard art="crypto/feather" h={0.42} center />
        </group>
      ))}
      <mesh ref={flash} visible={false} renderOrder={7}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {/* sunbeams on the wall, hung from the top */}
      <group ref={raysRef} position={[rays.x, position[1] + rays.top, WALL_Z + 0.07]} visible={false}>
        <group position={[0, -rays.h, 0]}>
          <ArtCard art="crypto/god_rays" h={rays.h} />
        </group>
      </group>
    </group>
  );
}

// --- memes, animated -------------------------------------------------------------------

/** Rest positions of rig parts, so a part can be nudged around its place. */
const nudge = (g, dx = 0, dy = 0) => {
  if (!g) return;
  g.userData.p0 ??= g.position.clone();
  g.position.set(g.userData.p0.x + dx, g.userData.p0.y + dy, g.userData.p0.z);
};

/**
 * "This is fine", animated by bending one mesh instead of cutting the drawing
 * up (cut parts tore apart at their edges): a finely subdivided plane where the
 * vertices over the flames lick up and sway (more towards the tips, none at the
 * gunwale), the dog's vertices tilt back as he sips his coffee, and the bubble
 * puffs as he talks. Region weights are blurred over the grid, so nothing ever
 * opens a gap. The whole boat rocks on the swell.
 */
const FINE = {
  W: 1036, H: 824,
  rim: [[0, 535], [150, 580], [300, 605], [500, 622], [700, 615], [850, 595], [1036, 545]],
  dog: [[305, 135], [470, 125], [565, 225], [645, 268], [700, 330], [688, 385], [648, 412], [650, 535], [605, 565], [632, 626], [298, 626], [306, 520], [316, 420], [296, 318]],
  bubble: [[548, 0], [1036, 0], [1036, 218], [690, 218], [612, 268], [604, 218], [548, 205]],
  dogPivot: [470, 622],
  tail: [612, 262],
};
const inPolyJS = (poly, x, y) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const lineYJS = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

function FineMesh({ texture, w, h }) {
  const SX = 104, SY = 84;
  const { geometry, base, wts, px } = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, SX, SY);
    const pos = g.attributes.position, uv = g.attributes.uv, n = pos.count;
    const base = Float32Array.from(pos.array);
    const px = new Float32Array(n * 2); // each vertex in drawing pixels (y down)
    const raw = [new Float32Array(n), new Float32Array(n), new Float32Array(n)]; // flame, dog, bubble
    for (let i = 0; i < n; i++) {
      const x = uv.getX(i) * FINE.W, y = (1 - uv.getY(i)) * FINE.H;
      px[i * 2] = x;
      px[i * 2 + 1] = y;
      const dog = inPolyJS(FINE.dog, x, y) && y < lineYJS(FINE.rim, x) + 12;
      const bub = inPolyJS(FINE.bubble, x, y);
      raw[1][i] = dog ? 1 : 0;
      raw[2][i] = bub ? 1 : 0;
      raw[0][i] = !dog && !bub && y < lineYJS(FINE.rim, x) - 4 ? 1 : 0;
    }
    // blur each mask over the vertex grid so regions fade into each other
    const cols = SX + 1, rows = SY + 1;
    const blur = (a, passes) => {
      let cur = a;
      for (let p = 0; p < passes; p++) {
        const next = new Float32Array(n);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          let s = 0, k = 0;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
            s += cur[rr * cols + cc];
            k++;
          }
          next[r * cols + c] = s / k;
        }
        cur = next;
      }
      return cur;
    };
    const flame = blur(raw[0], 2), dog = blur(raw[1], 3), bub = blur(raw[2], 2);
    const wts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = px[i * 2], y = px[i * 2 + 1];
      // flames: none at the gunwale, most at the tips
      const above = Math.min(1, Math.max(0, (lineYJS(FINE.rim, x) - y) / 430));
      wts[i * 3] = flame[i] * above * above * (1 - dog[i]);
      wts[i * 3 + 1] = dog[i];
      // the bubble puffs about its tail, which stays put (it points at the dog's head)
      const dt = Math.hypot(x - FINE.tail[0], y - FINE.tail[1]);
      wts[i * 3 + 2] = bub[i] * smooth((dt - 20) / 90);
    }
    return { geometry: g, base, wts, px };
  }, [w, h]);
  const face = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide }), [texture]);
  const depth = useMemo(() => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: 0.5 }), [texture]);
  const k = w / FINE.W; // world units per drawing pixel
  const toLocal = (x, y) => [(x / FINE.W - 0.5) * w, (0.5 - y / FINE.H) * h];
  const piv = toLocal(...FINE.dogPivot), tail = toLocal(...FINE.tail);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const arr = geometry.attributes.position.array;
    // the sip: every 4.5 s he tips back to drink
    const c = t % 4.5;
    const sip = c < 1.0 ? Math.sin((c / 1.0) * Math.PI) : 0;
    const a = 0.09 * sip + Math.sin(t * 0.8) * 0.015;
    const ca = Math.cos(a), sa = Math.sin(a);
    // the bubble: a little puff every syllable while it's "said", then a rest
    const b = (t + 1.2) % 4.5;
    const puff = b < 2.4 ? 1 + 0.06 * Math.abs(Math.sin(b * 9)) : 1 - 0.03 * Math.sin(b * 2);
    for (let i = 0, n = arr.length / 3; i < n; i++) {
      let x = base[i * 3], y = base[i * 3 + 1];
      const wf = wts[i * 3], wd = wts[i * 3 + 1], wb = wts[i * 3 + 2];
      if (wf > 0.001) {
        const X = px[i * 2], Y = px[i * 2 + 1];
        const ph = X < 470 ? 0 : 2.1;
        const sway = Math.sin(t * 6.3 + Y * 0.022 + ph) * 0.65 + Math.sin(t * 11.7 + Y * 0.05 + X * 0.01) * 0.35;
        const lick = 0.5 + 0.5 * Math.sin(t * 8.9 + X * 0.03 + ph);
        x += sway * 26 * k * wf;
        y += lick * 34 * k * wf;
      }
      if (wd > 0.001) {
        const dx = x - piv[0], dy = y - piv[1];
        const rx = piv[0] + dx * ca - dy * sa, ry = piv[1] + dx * sa + dy * ca;
        x += (rx - x) * wd;
        y += (ry - y) * wd;
      }
      if (wb > 0.001) {
        x += (tail[0] + (x - tail[0]) * puff - x) * wb;
        y += (tail[1] + (y - tail[1]) * puff - y) * wb;
      }
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
    }
    geometry.attributes.position.needsUpdate = true;
  });
  return <mesh geometry={geometry} material={face} customDepthMaterial={depth} castShadow position={[0, h / 2, 0]} />;
}

export function ThisIsFine({ position, h = 1.8, z = SLOT_Z.back + 0.25 }) {
  const root = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    root.current.rotation.z = Math.sin(t * 1.3) * 0.05;
    root.current.position.y = Math.sin(t * 1.3 + 0.8) * 0.05;
  });
  return (
    <group position={[position[0], position[1] + 0.05, z]}>
      <group ref={root}>
        <Art art="crypto/this_is_fine">{({ texture, ratio }) => <FineMesh texture={texture} w={h * ratio} h={h} />}</Art>
      </group>
    </group>
  );
}

/**
 * The sad frog in his life ring (no tears, no phone): he bobs on the water and
 * his head heaves with sobs every few seconds.
 */
export function SadPepe({ position, h = 1.1, z = SLOT_Z.front - 0.3 }) {
  const rig = rigs.pepe;
  const L = useMemo(() => rigLayout(rig, h), [rig, h]);
  const root = useRef();
  const p = { body: useRef(), head: useRef() };
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    root.current.position.y = Math.sin(t * 1.2) * 0.05;
    root.current.rotation.z = Math.sin(t * 0.9) * 0.05;
    // sobs: bursts of quick little heaves
    const burst = (t % 2.6) < 1.1 ? Math.pow(Math.max(0, Math.sin(t * 13)), 3) : 0;
    p.head.current.rotation.z = 0.035 * burst + Math.sin(t * 0.7) * 0.02;
    nudge(p.head.current, 0, -0.025 * burst);
  });
  return (
    <group position={[position[0], position[1] - 0.1, z]}>
      <group ref={root}>
        {rigPart("pepe", rig, L, "body", p.body, layerZ(rig, "body"))}
        {rigPart("pepe", rig, L, "head", p.head, layerZ(rig, "head"))}
      </group>
    </group>
  );
}

/**
 * The cabal: a black speedboat of hooded insiders with a laptop and a pile of
 * coins, idling in the bright half. As I come by they whisper "psst... we're
 * early." and speed off with everything, leaving a wake. They're back if I go back.
 */
export function CabalBoat({ position, h = 1.3, z = SLOT_Z.back + 0.05, ahead = 3 }) {
  const anchor = useRef();
  const boat = useRef();
  const whisper = useRef();
  const wake = useRef([]);
  const st = useRef({ go: 0, say: 0 });
  const map = useMemo(() => thoughtTexture("psst... we're early."), []);
  usePassTrigger(
    anchor,
    ahead,
    () => gsap.timeline()
      .to(st.current, { say: 1, duration: 0.2, ease: "back.out(2)" })
      .to(st.current, { go: 1, duration: 2.2, ease: "power2.in" }, 0.9)
      .to(st.current, { say: 0, duration: 0.3 }, 1.4),
    () => gsap.to(st.current, { go: 0, say: 0, duration: 0.8, ease: "power2.out" }),
  );
  const w = h * ratioOf("crypto/cabal_boat");
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { go, say } = st.current;
    const x = go * 12;
    boat.current.visible = go < 0.97; // gone over the horizon
    boat.current.position.set(x, Math.sin(t * 1.6) * 0.04 + go * 0.08, 0);
    boat.current.rotation.z = Math.sin(t * 1.3) * 0.03 + go * 0.06; // nose up as it speeds off
    whisper.current.visible = say > 0.01;
    whisper.current.scale.set(say * 1.1, say * 1.1, 1);
    // the wake: foam puffs left behind it while it speeds off
    wake.current.forEach((m, i) => {
      if (!m) return;
      const on = go > 0.02 && go < 0.98;
      m.visible = on;
      if (!on) return;
      const life = 0.6, u = ((t + i * 0.1) % life) / life;
      m.position.set(x - w * 0.5 - u * 0.9, 0.12 + u * 0.15, 0.05);
      const s = 0.18 + u * 0.25;
      m.scale.set(s, s * 0.7, 1);
      m.material.opacity = 0.9 * (1 - u);
    });
  });
  return (
    <group ref={anchor} position={[position[0], position[1] + 0.12, z]}>
      <group ref={boat}>
        <ArtCard art="crypto/cabal_boat" h={h} />
        <mesh ref={whisper} position={[0.1, h + 0.35, 0.1]} visible={false} renderOrder={6}>
          <planeGeometry args={[2.0, 0.5]} />
          <meshBasicMaterial map={map} transparent depthWrite={false} />
        </mesh>
      </group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} ref={(el) => (wake.current[i] = el)} visible={false} renderOrder={4}>
          <circleGeometry args={[1, 14]} />
          <meshBasicMaterial color="#FFFFFF" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// --- storm clouds ----------------------------------------------------------------------

const rainMat = new THREE.MeshBasicMaterial({ color: "#6E8AA6" });
const redRainMat = new THREE.MeshBasicMaterial({ color: "#E0453A" });

/**
 * A storm cloud over the dark half: it drifts and swells, rain streaks keep
 * falling from it into the sea (a few of them red, like the candles), and every
 * few seconds lightning flickers out of it.
 */
export function StormCloud({ position, y = 3.2, h = 1.4, flip = false, phase = 0, z = SLOT_Z.sky, fall = 2.6 }) {
  const cloud = useRef();
  const drops = useRef([]);
  const bolt = useRef();
  const w = h * ratioOf("crypto/storm_body");
  const N = 28;
  const lanes = useMemo(() => Array.from({ length: N }, (_, i) => ({ x: (rand(i + phase * 10) - 0.5) * w * 0.72, speed: 0.55 + rand(i + 40) * 0.35, off: rand(i + 77), red: i % 6 === 2 })), [w, phase]);
  useFrame((state) => {
    const t = state.clock.elapsedTime + phase * 3.7;
    const dx = Math.sin(t * 0.25) * 0.45;
    cloud.current.position.set(dx, Math.sin(t * 0.9) * 0.05, 0);
    const br = 1 + Math.sin(t * 1.3) * 0.025;
    cloud.current.scale.set((flip ? -1 : 1) * br, br, 1);
    drops.current.forEach((d, i) => {
      if (!d) return;
      const L = lanes[i];
      const u = (t / L.speed + L.off) % 1;
      d.position.set(dx + L.x - u * 0.25, h * 0.28 - u * fall, 0.01);
      d.visible = u > 0.03;
    });
    // lightning: a double flicker every ~4.6 s
    const c = t % 4.6;
    const on = (c > 0 && c < 0.08) || (c > 0.16 && c < 0.3);
    bolt.current.visible = on;
    bolt.current.position.x = dx + (flip ? 0.25 : -0.25) * w * 0.3;
  });
  return (
    <group position={[position[0], position[1] + y, z]}>
      {lanes.map((L, i) => (
        <mesh key={i} ref={(el) => (drops.current[i] = el)} material={L.red ? redRainMat : rainMat} rotation={[0, 0, -0.1]}>
          <planeGeometry args={[0.022, L.red ? 0.1 : 0.17]} />
        </mesh>
      ))}
      <group ref={bolt} position={[0, h * 0.25 - 0.85, 0.03]} visible={false}>
        <ArtCard art="crypto/bolt" h={0.95} />
      </group>
      <group ref={cloud}>
        <ArtCard art="crypto/storm_body" h={h} />
      </group>
    </group>
  );
}

// --- the sky, on the way up ---------------------------------------------------------------

/** The Dharma wheel (Bát Chánh Đạo) high in the sky, turning slowly. */
export function DharmaWheel({ position, y = 2.6, h = 2.8, z = SLOT_Z.sky - 0.15, speed = 0.18 }) {
  const wheel = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    wheel.current.rotation.z = -t * speed;
    wheel.current.position.y = y + h / 2 + Math.sin(t * 0.7) * 0.06;
  });
  return (
    <group position={[position[0], position[1], z]}>
      <group ref={wheel}>
        <ArtCard art="crypto/dharma_wheel" h={h} center />
      </group>
    </group>
  );
}

const DOVE_FRAMES = ["crypto/dove_1", "crypto/dove_2", "crypto/dove_3", "crypto/dove_2"];

/**
 * The dove of peace with its red ribbon, flying up beside me while I rise
 * through the sky on my wing: a flip-book of three wingbeats (wings up, level,
 * down). It comes out from behind a little cloud as I enter the sky (growing
 * as if flying in from far away), keeps a little ahead of me and above my head,
 * and near the top flies off into another little cloud, shrinking away into
 * it. It flies behind the clouds' layer (and both behind me). Everything follows my position, so scrolling back plays it
 * backwards.
 */
export function Dove({ position, w = 1.0, offset = [2.6, 2.9], emerge = [0.4, 2.6], vanish = [12.0, 14.2], cloudH = 0.75, z = HERO_Z - 0.3 }) {
  const anchor = useRef();
  const dove = useRef();
  const frames = useRef();
  const clouds = useRef([]);
  // my height on the way up (layout initialHeroPoints: the seam climbs 0.32 per
  // unit, my group rides SINK = 0.14 below the curve); seam items stand 1.5
  // above the last world's ground, which is what \`position[1]\` is
  const g = position[1] - 1.5;
  const heroYAt = (rel) => g + 0.46 + 0.32 * rel;
  const A = [emerge[0] + offset[0], heroYAt(emerge[0]) + offset[1]]; // the cloud it comes out of
  const B = [vanish[1] + offset[0], heroYAt(vanish[1]) + offset[1]]; // the cloud it flies into
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    anchor.current.getWorldPosition(_w);
    const rel = heroState.x - _w.x; // where I am in the sky (0 = its start)
    clouds.current.forEach((c, i) => c && (c.position.y = Math.sin(t * 0.6 + i * 2) * 0.05));
    const on = rel > emerge[0] && rel < vanish[1];
    dove.current.visible = on;
    if (!on) return;
    const out = smooth((rel - emerge[0]) / (emerge[1] - emerge[0])); // 0 inside cloud A .. 1 out
    const into = smooth((rel - vanish[0]) / (vanish[1] - vanish[0])); // 0 free .. 1 inside cloud B
    const free = out * (1 - into);
    const fx = rel + offset[0] + Math.sin(t * 0.8) * 0.3 * free;
    const fy = heroState.y + offset[1] + Math.sin(t * 1.4) * 0.15 * free;
    let x = A[0] + (fx - A[0]) * out, y = A[1] + (fy - A[1]) * out;
    x += (B[0] - x) * into;
    y += (B[1] - y) * into;
    dove.current.position.set(x, y, 0);
    const s = (0.3 + 0.7 * out) * (1 - 0.7 * into); // far away inside the clouds
    dove.current.scale.set(s, s, 1);
    dove.current.rotation.z = 0.12 + Math.sin(t * 1.4) * 0.05; // climbing
    const f = Math.floor(t * 9) % DOVE_FRAMES.length;
    frames.current.children.forEach((c, i) => (c.visible = i === f));
  });
  return (
    <group ref={anchor} position={[position[0], 0, z]}>
      {/* the two clouds, in front of the dove */}
      {[[A, "childhood/cloud", false], [B, "childhood/cloud_b", true]].map(([[cx, cy], art, flip], i) => (
        <group key={i} position={[cx, cy, 0.2]}>
          <group ref={(el) => (clouds.current[i] = el)}>
            <group scale={[flip ? -1 : 1, 1, 1]}>
              <ArtCard art={art} h={cloudH} center />
            </group>
          </group>
        </group>
      ))}
      <group ref={dove} visible={false}>
        <group ref={frames}>
          {DOVE_FRAMES.map((art, i) => (
            <group key={i} visible={i === 0}>
              <ArtCard art={art} h={w / ratioOf(art)} center />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

export const CRYPTO_EVENTS = { dharmaWheel: DharmaWheel, dove: Dove, stormCloud: StormCloud, thisIsFine: ThisIsFine, sadPepe: SadPepe, cabalBoat: CabalBoat, seaWaves: SeaWaves, whaleSpout: WhaleSpout, puppetMaster: PuppetMaster, anglerfish: Anglerfish, whirlpool: Whirlpool, thoughtTangle: ThoughtTangle };
