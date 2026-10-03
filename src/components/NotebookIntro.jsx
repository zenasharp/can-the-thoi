import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { site } from "../content/site";
import { HAND_STROKES } from "./handwriting";
import { introBridge } from "../introBridge";
import "./NotebookIntro.css";

// The loading cover: a school notebook (vở) lying on a wooden desk. Its cover
// has only a name label, and a ballpoint pen writes "Cấn Thế Thôi" on it as the
// site loads: the writing is the progress bar (the pen never outruns what has
// loaded, nor a hand). Once it is written, the pen is taken away and a scroll
// sign appears, while the cover's edge springs up now and then. A scroll, a
// click, a key or a tap opens the notebook in 3D:
// - The cover is cut into narrow strips that turn in a chain, so it bends:
//   the free edge leads while it is lifted, then trails as it falls open.
//   Each strip is shaded for its angle, and the cover's shadow sweeps over the
//   first page. It lands on the desk with a little bounce.
// - The first page has the world's opening scene on it, drawn across the page
//   (sideways on a landscape screen): a copy of the world's first frame.
// - The camera comes round to look straight down, turns to landscape so the
//   scene stands upright, and dives into it. Once the book lies flat, the
//   world's own canvas takes the drawing's place on the page (src/introBridge.js),
//   so the dive ends inside the live world, with nothing to swap or fade.
// It never hangs: it finishes once the canvas is ready and nothing is loading.

const STRIPS = 16; // the cover, cut into strips turning in a chain
const BEND = 26; // how far the free edge leads (lifting) or trails (falling), in degrees
const WRITE_S = 3.2; // the whole title, at the pen's own pace (seconds)
const APPROACH_S = 0.55; // the pen coming in to the first stroke
const SKEW = Math.tan((-9 * Math.PI) / 180); // the writing leans right
const PEN_SCALE = 3.3;
const WALL_SQ = 59 / 720; // a 4-cell square of the world's wall, against the screen height (as the camera sees it)
// light from the upper left, in front: [x, y, z], normalised
const LIGHT = (() => { const v = [-0.45, -0.35, 0.82]; const n = Math.hypot(...v); return v.map((c) => c / n); })();

const art = (key) => `${import.meta.env.BASE_URL}art/${key}.webp`;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const toLabel = (x, y) => [x + SKEW * (y - 100), y]; // handwriting units -> the slanted label

/** Book size from the viewport: a vở is about 17 x 24 cm. */
function bookSize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  let h = Math.min(vh * 0.6, 560);
  let w = h * 0.71;
  if (w > vw * 0.62) { w = vw * 0.62; h = w / 0.71; }
  return { w: Math.round(w), h: Math.round(h) };
}

/**
 * Where the scene goes on the first page: the world's frame, nearly as big as
 * the page, turned a quarter (its top towards the spine) when the screen is
 * landscape. Q turns it on the page, R turns the camera back; k is its size
 * against the screen.
 */
function sceneLayout(w, h) {
  const a = window.innerWidth / window.innerHeight;
  const turned = a > 1;
  const Dw = turned ? Math.min(0.96 * h, 0.96 * w * a) : Math.min(0.96 * w, 0.96 * h * a);
  return { Dw, Dh: Dw / a, Q: turned ? -90 : 0, R: turned ? 90 : 0, k: Dw / window.innerWidth };
}

/** The title on the label. Live: the strokes are drawn by the writing loop; static: all written. */
function Writing({ pathRefs }) {
  return (
    <svg className="nb-hand" viewBox="-14 -6 508 136" aria-hidden="true">
      <line className="nb-dots" x1="-6" y1="104" x2="494" y2="104" />
      <g transform={`matrix(1 0 ${SKEW} 1 ${-SKEW * 100} 0)`} filter="url(#nb-ink)">
        {HAND_STROKES.map((d, i) => (
          <path key={i} ref={pathRefs ? (el) => (pathRefs.current[i] = el) : undefined} d={d} className="nb-ink" style={pathRefs ? { opacity: 0 } : undefined} />
        ))}
      </g>
    </svg>
  );
}

/** A Thiên Long-style ballpoint lying along +x, its ball tip at (0, 0). */
function PenBody() {
  return (
    <>
      <path d="M0.4 0 L14 -3.4 L14 3.4 Z" fill="url(#nb-metal)" />
      <circle cx="0.9" cy="0" r="0.9" fill="#222" />
      <rect x="13.5" y="-5.2" width="30" height="10.4" rx="2.6" fill="url(#nb-blue)" />
      <path d="M18 -5 V5 M22 -5 V5 M26 -5 V5 M30 -5 V5 M34 -5 V5 M38 -5 V5" stroke="#9db8f2" strokeWidth="0.7" opacity="0.6" />
      <rect x="43" y="-5.8" width="114" height="11.6" rx="2.8" fill="url(#nb-barrel)" />
      <rect x="45" y="-1.3" width="100" height="2.6" rx="1.3" fill="#2f55c2" opacity="0.45" />
      <rect x="150" y="-6.5" width="36" height="13" rx="4.2" fill="url(#nb-blue)" />
      <rect x="152" y="-1.7" width="31" height="3.4" rx="1.7" fill="#5b88e8" stroke="#163a8c" strokeWidth="0.6" />
    </>
  );
}

function Pen({ pen }) {
  return (
    <g ref={(el) => (pen.current.root = el)}>
      <g ref={(el) => (pen.current.shadow = el)} filter="url(#nb-soft)" opacity="0.3">
        <path d="M0 0 L14 -3.6 L186 -6.4 L186 6.4 L14 3.6 Z" fill="#1a0f05" />
      </g>
      <g ref={(el) => (pen.current.body = el)}>
        <PenBody />
      </g>
    </g>
  );
}

/** The cover's outside: the print, the binding tape, the gloss and the name label. */
function CoverArt({ pathRefs, pen }) {
  return (
    <div className="nb-cover-art">
      <div className="nb-print" />
      <img className="nb-sticker" src={art("intro/sticker_childhood")} alt="" draggable={false} />
      <div className="nb-tape" />
      <div className="nb-gloss" />
      <div className="nb-label">
        <div className="nb-writing">
          <Writing pathRefs={pathRefs} />
          {pen && (
            <svg className="nb-pen" viewBox="-14 -6 508 136" aria-hidden="true">
              <Pen pen={pen} />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/** The cover cut into strips; each is a child of the one before, so their turns add up. */
function StripChain({ i, w, faces }) {
  const sw = w / STRIPS;
  const last = i === STRIPS - 1;
  const f = faces.current[i];
  return (
    <div className="nb-strip" ref={(el) => (f.strip = el)} style={{ left: i === 0 ? 0 : sw, width: sw }}>
      <div className={`nb-face nb-front ${last ? "last" : ""}`}>
        <div className="nb-slice" style={{ left: 1 - i * sw, width: w }}>
          <CoverArt />
        </div>
        <div className="nb-shade" ref={(el) => (f.front = el)} />
      </div>
      <div className={`nb-face nb-back ${last ? "last" : ""}`}>
        <div className="nb-slice nb-inside" style={{ left: 1 - (STRIPS - 1 - i) * sw, width: w }} />
        <div className="nb-shade" ref={(el) => (f.back = el)} />
      </div>
      {!last && <StripChain i={i + 1} w={w} faces={faces} />}
    </div>
  );
}

/** The light on a face with normal (nx, 0, nz), against lying flat: a glint towards the lamp, shade away from it. */
function tone(nx, nz) {
  const d = nx * LIGHT[0] + nz * LIGHT[2] - LIGHT[2];
  return d >= 0 ? `rgba(255,250,240,${(d * 1.4).toFixed(3)})` : `rgba(14,9,4,${Math.min(0.42, -d * 0.5).toFixed(3)})`;
}

export default function NotebookIntro({ ready }) {
  const { active, progress } = useProgress();
  const [phase, setPhase] = useState("writing"); // writing -> written -> opening -> gone
  const [size, setSize] = useState(bookSize);
  const loaded = useRef(0);
  loaded.current = ready && !active ? 1 : Math.min(progress, 95) / 100;

  const root = useRef();
  const zoom = useRef();
  const light = useRef();
  const book = useRef();
  const flat = useRef();
  const chain = useRef();
  const coverRef = useRef();
  const pageShade = useRef();
  const sceneCanvas = useRef();
  const handoff = useRef({ painted: false, allowed: false, el: null });
  const deskShade = useRef();
  const pathRefs = useRef([]);
  const pen = useRef({});
  const faces = useRef(Array.from({ length: STRIPS }, () => ({})));
  const geo = useRef(null);
  const anim = useRef({ A: 0, tilt: 1, cam: 0, fade: 0 });
  const peek = useRef(null);

  useEffect(() => {
    const onResize = () => setSize(bookSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // measure the strokes: each one's length, and the time (as ink length) of the pen lift before it
  useLayoutEffect(() => {
    const paths = pathRefs.current;
    const lens = paths.map((p) => p.getTotalLength());
    const starts = [];
    let at = 0;
    paths.forEach((p, i) => {
      if (i > 0) {
        const a = paths[i - 1].getPointAtLength(lens[i - 1]), b = p.getPointAtLength(0);
        at += 22 + Math.hypot(b.x - a.x, b.y - a.y) * 0.35; // longer jumps take longer
      }
      starts.push(at);
      at += lens[i];
      p.style.strokeDasharray = `${lens[i]} ${lens[i] + 20}`;
      p.style.strokeDashoffset = lens[i];
    });
    geo.current = { lens, starts, total: at };
  }, []);

  /** The pen's tip at (x, y) in handwriting units, `lift` 0 (on the paper) .. 1 (in the air). */
  const placePen = (x, y, lift, fade = 1) => {
    const p = pen.current;
    if (!p.root) return;
    const [sx, sy] = toLabel(x, y);
    const ang = 50 - (sx - 240) * 0.014; // the wrist turns a little along the line
    p.root.setAttribute("transform", `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
    p.root.setAttribute("opacity", fade.toFixed(3));
    p.body.setAttribute("transform", `translate(${(-3 * lift).toFixed(2)} ${(-11 * lift).toFixed(2)}) rotate(${ang.toFixed(2)}) scale(${(PEN_SCALE * (1 + 0.05 * lift)).toFixed(3)})`);
    p.shadow.setAttribute("transform", `translate(${(1.5 + 9 * lift).toFixed(2)} ${(2 + 7 * lift).toFixed(2)}) rotate(${(ang - 7).toFixed(2)}) scale(${PEN_SCALE})`);
    p.shadow.setAttribute("opacity", (0.3 - 0.1 * lift).toFixed(3));
  };

  // the pen writes as things load: at a hand's pace, never past what has loaded
  useEffect(() => {
    if (phase !== "writing") return;
    const g = geo.current;
    const paths = pathRefs.current;
    const speed = g.total / WRITE_S;
    const first = paths[0].getPointAtLength(0);
    let raf, last = performance.now(), written = 0, hover = 0, stall = 0;
    const t0 = last;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const since = (now - t0) / 1000;
      if (since < APPROACH_S) {
        const u = ease(since / APPROACH_S);
        placePen(first.x + (1 - u) * 240, first.y + (1 - u) * 150, 1 - u);
        raf = requestAnimationFrame(tick);
        return;
      }
      const before = written;
      written = Math.min(loaded.current * g.total, written + speed * dt);
      stall = written - before < speed * dt * 0.5 ? stall + dt : 0;
      let tip = null, lift = 0;
      g.lens.forEach((len, i) => {
        const drawn = clamp(written - g.starts[i], 0, len);
        paths[i].style.strokeDashoffset = len - drawn;
        paths[i].style.opacity = drawn > 0 ? 1 : 0;
        if (!tip && written >= g.starts[i] && written <= g.starts[i] + len) tip = paths[i].getPointAtLength(drawn);
      });
      if (!tip) {
        // in the air, from the end of one stroke to the start of the next
        const k = g.starts.findIndex((s) => s > written);
        const a = paths[k - 1].getPointAtLength(g.lens[k - 1]), b = paths[k].getPointAtLength(0);
        const end = g.starts[k - 1] + g.lens[k - 1];
        const u = clamp((written - end) / (g.starts[k] - end));
        tip = { x: a.x + (b.x - a.x) * ease(u), y: a.y + (b.y - a.y) * ease(u) };
        lift = Math.sin(u * Math.PI) * clamp(Math.hypot(b.x - a.x, b.y - a.y) / 110, 0.35, 1);
      }
      // waiting for the site: the pen hovers, as if thinking
      hover += ((stall > 0.3 ? 0.4 : 0) - hover) * Math.min(1, dt * 7);
      placePen(tip.x, tip.y, Math.max(lift, hover));
      if (written >= g.total - 0.01) { setPhase("written"); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // everything placed for the current open angle, tilt, zoom and fade
  const apply = () => {
    if (!book.current) return;
    const { A, tilt, cam, fade } = anim.current;
    const { w, h } = size;
    const T = Math.max(5, Math.round(w * 0.022));
    const turn = ease(clamp(cam / 0.42)); // the camera turning to landscape
    const dive = ease(clamp((cam - 0.12) / 0.88)); // and diving into the scene
    // the book on the desk: tilted away, a little turned; moves right as it opens, back as the camera turns
    const off = -w / 2 + w * 0.3 * ease(clamp(A / 180)) * (1 - turn);
    book.current.style.transform = `translateX(${off.toFixed(1)}px) rotateX(${(27 * tilt).toFixed(2)}deg) rotateZ(${(-6 * tilt).toFixed(2)}deg)`;
    // the strips: lifting, the free edge leads; falling, it trails
    const bend = Math.sin((2 * A * Math.PI) / 180) * BEND;
    const phis = Array.from({ length: STRIPS }, (_, i) => clamp(A + bend * (i / (STRIPS - 1)) ** 1.5, 0, 180));
    // the light where two strips meet, so the shading runs smoothly across the bend
    const edges = phis.map((p, i) => (i === 0 ? p : (phis[i - 1] + p) / 2)).concat(phis[STRIPS - 1]);
    const rad = edges.map((e) => (e * Math.PI) / 180);
    const front = rad.map((r) => tone(-Math.sin(r), Math.cos(r)));
    const back = rad.map((r) => tone(Math.sin(r), -Math.cos(r)));
    for (let i = 0; i < STRIPS; i++) {
      const f = faces.current[i];
      if (!f.strip) continue;
      f.strip.style.transform = `rotateY(${((i ? phis[i - 1] : 0) - phis[i]).toFixed(3)}deg)`;
      f.front.style.background = `linear-gradient(90deg, ${front[i]}, ${front[i + 1]})`;
      f.back.style.background = `linear-gradient(90deg, ${back[i + 1]}, ${back[i]})`; // mirrored
    }
    // once past upright the cover drops to the desk (the stack's height) and shades it
    coverRef.current.style.transform = `translateZ(${(1 - (T + 1) * smooth(110, 180, A)).toFixed(2)}px)`;
    deskShade.current.style.opacity = (0.9 * smooth(95, 180, A)).toFixed(3);
    // the cover's shadow on the first page, thrown right by the light from the left
    const r = (A * Math.PI) / 180;
    const reach = clamp(Math.cos(r) + 0.55 * Math.sin(r), 0, 1);
    pageShade.current.style.width = `${(reach * 100).toFixed(2)}%`;
    pageShade.current.style.opacity = (A > 0.5 ? 0.5 * (1 - smooth(15, 125, A)) : 0).toFixed(3);
    // the camera: turned so the scene stands upright, then in until the scene is the screen
    // (without a scene, it just leans into the page and fades)
    const L = sceneLayout(w, h);
    const live = handoff.current.painted;
    const S = live ? 1 / L.k : 1.04 * Math.max(window.innerWidth / w, window.innerHeight / h);
    const s = S ** dive, rot = (live ? L.R : 0) * turn;
    zoom.current.style.transform = `scale(${s.toFixed(4)}) rotate(${rot.toFixed(3)}deg)`;
    light.current.style.opacity = (live ? tilt : 1 - dive).toFixed(3); // the lamp's mood goes as we look straight down
    root.current.style.opacity = (1 - fade).toFixed(3);
    // the scene's soft edge (in page px), gone by the time it fills the screen
    const f = 0.05 * L.Dh * (1 - smooth(0.55, 0.92, cam));
    // the hand-off: once the book lies flat, the world's canvas is laid exactly over the
    // drawing (same spot, turn and size) and rides the dive up to full screen
    const ho = handoff.current;
    if (live && ho.allowed && tilt === 0 && !ho.el) {
      ho.el = introBridge.frame?.() || null;
      ho.el?.classList.add("nb-handoff");
    }
    if (ho.el) {
      const offc = off + w / 2, rr = (rot * Math.PI) / 180;
      ho.el.style.transform = `translate(${(s * Math.cos(rr) * offc).toFixed(2)}px, ${(s * Math.sin(rr) * offc).toFixed(2)}px) rotate(${(rot + L.Q).toFixed(3)}deg) scale(${(s * L.k).toFixed(5)})`;
      ho.el.style.setProperty("--f", `${(f / L.k).toFixed(2)}px`);
    }
  };

  useLayoutEffect(() => { apply(); }); // keep everything placed on resize and re-render

  /**
   * Paints the first page: the wall's paper alone, seen wider by the same camera,
   * over the whole page (so its grid and margin run on from the scene's), then
   * the world's current frame, its edges fading into that paper. False when the
   * world can't be borrowed.
   */
  const paintScene = () => {
    const c = sceneCanvas.current;
    const { w, h } = size;
    const L = sceneLayout(w, h);
    const vw = window.innerWidth, vh = window.innerHeight;
    // how much wider than the screen the paper must be seen to cover the page
    const Z = 1.15 * Math.max(L.Q ? h / L.Dw : w / L.Dw, L.Q ? w / L.Dh : h / L.Dh);
    // sharp enough to be blown up by the dive (and the paper as sharp, laid at that size)
    const rho = Math.min(3 * Math.min(window.devicePixelRatio || 1, 2), 2800 / Math.max(w, h));
    const shot = c && introBridge.capture?.(Z, vw * Z * L.k * rho);
    if (!shot) return false;
    c.width = Math.round(w * rho);
    c.height = Math.round(h * rho);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f7f5ec";
    ctx.fillRect(0, 0, c.width, c.height);
    // page px <- screen px: the scene centred on the page, turned by Q, scaled by k
    const page = new DOMMatrix().scale(rho).translate(w / 2, h / 2).rotate(L.Q).scale(L.k).translate(-vw / 2, -vh / 2);
    ctx.setTransform(page);
    if (shot.paper) ctx.drawImage(shot.paper, (vw * (1 - Z)) / 2, (vh * (1 - Z)) / 2, vw * Z, vh * Z); // Z times wider, about the centre
    // the frame, faded at its edges (the world's canvas gets the same fade at the hand-off)
    const { frame } = shot;
    const fx = (0.05 * L.Dh / L.k) * (frame.width / vw);
    const g = frame.getContext("2d");
    g.globalCompositeOperation = "destination-in";
    const ramp = (x0, y0, x1, y1, len) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      const t = Math.min(0.49, fx / len);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(t, "#000");
      gr.addColorStop(1 - t, "#000");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, frame.width, frame.height);
    };
    ramp(0, 0, frame.width, 0, frame.width);
    ramp(0, 0, 0, frame.height, frame.height);
    ctx.setTransform(page);
    ctx.drawImage(frame, 0, 0, vw, vh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return true;
  };

  // the scene goes on the page once the world is in (again if the window changes)
  useEffect(() => {
    if (phase === "written") handoff.current.painted = paintScene();
  }, [phase, size]);

  // the world's canvas goes back to normal once the cover is gone
  useEffect(() => {
    if (phase !== "gone") return;
    const el = handoff.current.el;
    if (!el) return;
    el.classList.remove("nb-handoff");
    el.style.transform = "";
    el.style.removeProperty("--f");
    handoff.current.el = null;
  }, [phase]);

  // dev: pose the opening by hand for screenshots, e.g. __nb({ A: 60, tilt: 0.7 })
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__nb = (vals) => {
      peek.current?.kill();
      if (!handoff.current.el) handoff.current.painted = paintScene();
      handoff.current.allowed = true;
      flat.current.style.visibility = "hidden";
      chain.current.style.visibility = "visible";
      Object.assign(anim.current, vals);
      apply();
    };
  });

  // written: the pen is lifted away, then the cover's edge springs up now and then
  useEffect(() => {
    if (phase !== "written") return;
    const g = geo.current;
    const n = g.lens.length - 1;
    const end = pathRefs.current[n].getPointAtLength(g.lens[n]);
    const o = { u: 0 };
    const away = gsap.to(o, {
      u: 1,
      duration: 0.8,
      ease: "power2.in",
      onUpdate: () => placePen(end.x + o.u * 300, end.y + o.u * 230, Math.min(1, o.u * 3), 1 - smooth(0.45, 1, o.u)),
      onComplete: () => {
        flat.current.style.visibility = "hidden";
        chain.current.style.visibility = "visible";
        peek.current = gsap.to(anim.current, { A: 6, duration: 0.45, ease: "power2.out", yoyo: true, repeat: -1, repeatDelay: 1.4, onUpdate: apply });
      },
    });
    return () => away.kill();
  }, [phase]);

  // open on a scroll, a click, a key or a tap; keep them from the world behind meanwhile
  useEffect(() => {
    if (phase === "gone") return;
    const open = (e) => {
      e.stopImmediatePropagation();
      if (e.cancelable && e.type !== "keydown") e.preventDefault();
      setPhase((p) => (p === "written" ? "opening" : p));
    };
    const opts = { capture: true, passive: false };
    const types = ["wheel", "mousedown", "touchstart", "keydown"];
    types.forEach((t) => window.addEventListener(t, open, opts));
    return () => types.forEach((t) => window.removeEventListener(t, open, opts));
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening") return;
    peek.current?.kill();
    flat.current.style.visibility = "hidden";
    chain.current.style.visibility = "visible";
    const ho = handoff.current;
    ho.painted = paintScene(); // a fresh copy of the world, as it is right now
    ho.allowed = true;
    const a = anim.current;
    const tl = gsap.timeline({ onUpdate: apply, onComplete: () => setPhase("gone") });
    tl.to(a, { A: 92, duration: 0.62, ease: "power2.inOut" }, 0) // lifted
      .to(a, { A: 180, duration: 0.46, ease: "power2.in" }) // falls open
      .to(a, { A: 173, duration: 0.1, ease: "power1.out" }) // and bounces once on the desk
      .to(a, { A: 180, duration: 0.14, ease: "power1.in" })
      .to(a, { tilt: 0, duration: 1.05, ease: "power2.inOut" }, 0.3) // the camera comes round to look straight down
      .to(a, { cam: 1, duration: 1.7, ease: "none" }, 1.05); // turns to landscape and dives in
    if (!ho.painted) tl.to(a, { fade: 1, duration: 0.45, ease: "power1.in" }, 2.3);
    return () => tl.kill();
  }, [phase]);

  if (phase === "gone") return <div className="hint">{site.hint}</div>;
  const { w, h } = size;
  const T = Math.max(5, Math.round(w * 0.022));
  const L = sceneLayout(w, h);
  const diag = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight)) + 40;
  return (
    <div ref={root} className={`nb ${phase}`} role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(loaded.current * 100)}>
      <svg className="nb-defs" aria-hidden="true">
        <defs>
          <filter id="nb-ink" x="-5%" y="-15%" width="110%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" />
          </filter>
          <filter id="nb-soft" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <linearGradient id="nb-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a8f98" /><stop offset="0.35" stopColor="#f4f5f7" /><stop offset="0.6" stopColor="#b9bdc5" /><stop offset="1" stopColor="#5f646d" />
          </linearGradient>
          <linearGradient id="nb-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#173a8e" /><stop offset="0.3" stopColor="#5d8ef0" /><stop offset="0.6" stopColor="#2c5ccc" /><stop offset="1" stopColor="#11296a" />
          </linearGradient>
          <linearGradient id="nb-barrel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9bfca" /><stop offset="0.3" stopColor="#ffffff" /><stop offset="0.62" stopColor="#e8ebf0" /><stop offset="1" stopColor="#9097a4" />
          </linearGradient>
        </defs>
      </svg>
      <div ref={zoom} className="nb-zoom" style={{ perspective: `${Math.round(h * 2.7)}px` }}>
        <div className="nb-desk" style={{ width: diag, height: diag, backgroundImage: `url(${art("intro/desk_wood")})` }} />
        <div ref={book} className="nb-book" style={{ width: w, height: h, marginTop: -h / 2, "--t": `${T}px`, "--sq": `${(WALL_SQ * window.innerHeight * L.k).toFixed(3)}px` }}>
          <div className="nb-shadow" />
          <div className="nb-shadow contact" />
          <div ref={deskShade} className="nb-desk-shade" />
          <div className="nb-edge nb-edge-b" />
          <div className="nb-edge nb-edge-s" />
          <div className="nb-edge nb-edge-r" />
          <div className="nb-page">
            <canvas ref={sceneCanvas} className="nb-scene" />
            <div ref={pageShade} className="nb-page-shade" />
          </div>
          <div ref={coverRef} className="nb-cover">
            <div ref={flat} className="nb-cover-flat">
              <CoverArt pathRefs={pathRefs} pen={pen} />
            </div>
            <div ref={chain} className="nb-chain">
              <StripChain i={0} w={w} faces={faces} />
            </div>
          </div>
        </div>
      </div>
      <div ref={light} className="nb-light" />
      <div className={`nb-scroll ${phase === "written" ? "show" : ""}`} aria-hidden="true">
        <div className="nb-mouse"><span /></div>
        <div className="nb-chev"><i /><i /></div>
      </div>
    </div>
  );
}
