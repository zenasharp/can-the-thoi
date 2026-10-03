// Lets a set piece take the scroll for a moment, like a cutscene: the camera (and
// my vehicle with it) glides `dx` world units over `duration` seconds while wheel,
// drag, touch and keys are ignored. Blitzcrank uses it so the camera follows me as
// I am hooked and punched into the next world. It is a gsap tween, so it keeps
// time with the set piece's own timeline. Scene.jsx shifts from/to when the
// world loops.
import gsap from "gsap";
import { WORLD_LENGTH } from "./layout";
import { heroState } from "./heroState";

// target / progress: the scroll refs from Experience.jsx
export const scrollPilot = { active: false, from: 0, to: 0, v: 0, target: null, progress: null, tween: null };

/**
 * Glide until I (the scroll target, not where my lagging vehicle is drawn right
 * now) am at world x `x`; never backwards.
 */
export function pilotTo(x, duration) {
  const p = scrollPilot;
  if (!p.target || !p.progress) return;
  const targetX = heroState.curveX + (p.target.current - p.progress.current) * WORLD_LENGTH;
  pilotBy(Math.max(0, x - targetX), duration);
}

/** Glide the scroll target by `dx` world units over `duration` seconds. */
export function pilotBy(dx, duration) {
  const p = scrollPilot;
  if (!p.target) return;
  p.tween?.kill();
  Object.assign(p, { active: true, from: p.target.current, to: p.target.current + dx / WORLD_LENGTH, v: 0 });
  p.tween = gsap.to(p, {
    v: 1,
    duration,
    ease: "power2.inOut",
    onUpdate: () => (p.target.current = p.from + (p.to - p.from) * p.v),
    onComplete: () => (p.active = false),
  });
}
