// A speech bubble drawn like the rest of the notebook: a lumpy hand-drawn
// outline (a jittered rounded box with a tail), traced twice so it looks
// sketched, wobbled by an SVG displacement filter, around handwritten text.
// The outline is drawn to fit the text once it has been laid out.
import { useLayoutEffect, useMemo, useRef, useState } from "react";

const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** A closed wobbly outline around a w x h box, with a tail at the bottom left. */
function outline(w, h, rand, jitter = 2.2) {
  const r = Math.min(18, h / 2);
  const pts = [];
  const side = (x0, y0, x1, y1, n) => {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t + (rand() - 0.5) * jitter, y0 + (y1 - y0) * t + (rand() - 0.5) * jitter]);
    }
  };
  const corner = (cx, cy, a0) => {
    for (let i = 0; i < 4; i++) {
      const a = a0 + (i / 4) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r + (rand() - 0.5) * jitter, cy + Math.sin(a) * r + (rand() - 0.5) * jitter]);
    }
  };
  const nx = Math.max(3, Math.round(w / 34)), ny = Math.max(2, Math.round(h / 34));
  // top edge, right side, bottom with the tail, left side (clockwise from top left)
  side(r, 0, w - r, 0, nx);
  corner(w - r, r, -Math.PI / 2);
  side(w, r, w, h - r, ny);
  corner(w - r, h - r, 0);
  side(w - r, h, 52, h, nx - 1);
  pts.push([46, h], [18 + (rand() - 0.5) * 4, h + 20], [30, h]); // the tail
  side(30, h, r, h, 1);
  corner(r, h - r, Math.PI / 2);
  side(0, h - r, 0, r, ny);
  corner(r, r, Math.PI);
  // smooth it through the midpoints
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)}` : ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const [x0, y0] = pts[0], [x1, y1] = pts[1];
  return d + ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)} Z`;
}

export default function ScribbleBubble({ children }) {
  const box = useRef();
  const [size, setSize] = useState(null);
  const seed = useMemo(() => 1 + Math.floor(Math.random() * 100000), [children]);
  useLayoutEffect(() => {
    if (box.current) setSize([box.current.offsetWidth, box.current.offsetHeight]);
  }, [children]);
  const P = 8; // room around the box for the wobble and the tail
  const paths = useMemo(() => {
    if (!size) return null;
    const rand = rng(seed);
    return [outline(size[0], size[1], rand), outline(size[0], size[1], rand, 3.2)];
  }, [size, seed]);
  const id = `bubble-wob-${seed}`;
  return (
    <div ref={box} className="bubble">
      {paths && (
        <svg className="bubble-ink" width={size[0] + P * 2} height={size[1] + P * 2 + 24} viewBox={`${-P} ${-P} ${size[0] + P * 2} ${size[1] + P * 2 + 24}`} aria-hidden="true">
          <defs>
            <filter id={id} x="-10%" y="-10%" width="120%" height="130%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed % 97} />
              <feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <g filter={`url(#${id})`} strokeLinejoin="round" strokeLinecap="round">
            <path d={paths[0]} fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="3.4" />
            <path d={paths[1]} fill="none" stroke="#1A1A1A" strokeWidth="1.4" opacity="0.75" />
          </g>
        </svg>
      )}
      <span className="bubble-text">{children}</span>
    </div>
  );
}
