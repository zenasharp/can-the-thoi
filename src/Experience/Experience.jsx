// Canvas + input, ported from Mr. Panda's Experience.jsx (Andrew Woan, MIT).
// Changes: plain WebGLRenderer, the mouse-drag handler uses baseScrollSpeed
// (the original referenced an undefined `scrollSpeed`) and mousedown is wired up,
// plus arrow keys.
import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import normalizeWheel from "normalize-wheel";
import Scene from "./Scene";
import { WORLD_LENGTH } from "./layout";
import { scrollPilot } from "./scrollPilot";
import gsap from "gsap";

// ~0.5 world units per wheel notch, whatever the world length
const BASE_SCROLL_SPEED = 0.0085 * (59.2 / WORLD_LENGTH);
const LERP_FACTOR = 0.1;

export default function Experience({ onReady }) {
  const camera = useRef();
  const cameraGroup = useRef();
  const scrollProgress = useRef(0);
  const targetScrollProgress = useRef(0);
  const scrollSpeedMultiplier = useRef(1);
  const isDragging = useRef(false);
  const lastTouchY = useRef(null);
  const mousePositionOffset = useRef(new THREE.Vector3());
  const mouseRotationOffset = useRef(new THREE.Euler());

  useEffect(() => {
    scrollPilot.target = targetScrollProgress;
    scrollPilot.progress = scrollProgress;
    const nudge = (amount) => {
      if (scrollPilot.active) return; // a set piece is steering (scrollPilot.js)
      targetScrollProgress.current += amount * BASE_SCROLL_SPEED * scrollSpeedMultiplier.current;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const n = normalizeWheel(e);
      nudge(Math.sign(n.pixelY) * Math.min(Math.abs(n.pixelY) / 100, 1));
    };
    const onMouseMove = (e) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = (e.clientY / window.innerHeight) * 2 - 1;
      mousePositionOffset.current.set(mx * 0.05, my * 0.05, 0);
      mouseRotationOffset.current.set(my * 0.05, mx * 0.05, 0);
      if (isDragging.current && e.movementY) nudge(-Math.sign(e.movementY) * 0.2);
    };
    const onMouseDown = (e) => { if (e.button === 0) isDragging.current = true; };
    const onMouseUp = () => { isDragging.current = false; };
    const onTouchStart = (e) => { lastTouchY.current = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      if (lastTouchY.current !== null) nudge(-Math.sign(y - lastTouchY.current) * 0.3);
      lastTouchY.current = y;
    };
    const onTouchEnd = () => { lastTouchY.current = null; };
    const onKey = (e) => {
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) nudge(3);
      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) nudge(-3);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);

    // Dev-only hook for screenshot checks: window.__setProgress(0.4)
    if (import.meta.env.DEV) {
      window.__gsap = gsap; // e.g. __gsap.globalTimeline.timeScale(0.25) to watch a set piece slowly
      window.__setProgress = (p) => {
        targetScrollProgress.current = p;
        scrollProgress.current = p;
      };
    }

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <Canvas
      flat
      shadows="soft"
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ width: "100vw", height: "100vh", background: "#F4EDE0" }}
    >
      <Scene
        cameraGroup={cameraGroup}
        camera={camera}
        scrollProgress={scrollProgress}
        targetScrollProgress={targetScrollProgress}
        lerpFactor={LERP_FACTOR}
        mousePositionOffset={mousePositionOffset}
        mouseRotationOffset={mouseRotationOffset}
        scrollSpeedMultiplier={scrollSpeedMultiplier}
        onLoaded={onReady}
      />
      <group ref={cameraGroup}>
        <PerspectiveCamera ref={camera} makeDefault fov={35} near={0.1} far={200} />
      </group>
    </Canvas>
  );
}
