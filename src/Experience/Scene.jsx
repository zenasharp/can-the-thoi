// Scroll-driven camera + looping world, ported from Mr. Panda's Scene.jsx
// (Andrew Woan, MIT). The scenes come from content/site.js instead of one
// hand-written component per Blender export.
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { seam } from "../content/site";
import { cameraCurve, initialCameraPoints, rotationTargets, sceneRanges, SEAM_WIDTH, SHIFT_X_AMOUNT, TRIGGERS, WORLD_END_X, WORLD_START_X } from "./layout";
import { useScrollCurve } from "./hooks/useScrollCurve";
import { PaperScene, PaperWall, WallText } from "./components/World";
import PaperCutout from "./components/PaperCutout";
import Hero from "./components/Hero";
import { CRYPTO_EVENTS } from "./components/CryptoEvents";
import { scrollPilot } from "./scrollPilot";

const { worldForward: WORLD_FORWARD_TRIGGER, worldBack: WORLD_BACK_TRIGGER, seamForward: SEAM_FORWARD_TRIGGER, seamBack: SEAM_BACK_TRIGGER } = TRIGGERS;

// Mounted only once everything inside the Suspense boundary has loaded.
function Loaded({ onLoaded }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onLoaded?.());
    return () => cancelAnimationFrame(id);
  }, [onLoaded]);
  return null;
}

export default function Scene({ cameraGroup, camera, scrollProgress, targetScrollProgress, lerpFactor, mousePositionOffset, mouseRotationOffset, scrollSpeedMultiplier, onLoaded }) {
  const cameraScrollCurve = useScrollCurve(cameraCurve, initialCameraPoints, SHIFT_X_AMOUNT);
  // dev only: window.__exportGLB() saves the whole world as a .glb for Blender
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    if (import.meta.env.DEV) import("./devExport").then((m) => m.installExport(scene));
  }, [scene]);
  const worldGroup = useRef();
  const sun = useRef();
  const seamGroup = useRef();

  const shiftGroup = (group, direction) => {
    if (!group.current) return;
    const loops = direction === "forward" ? cameraScrollCurve.loopCounter.current : cameraScrollCurve.loopCounter.current - 1;
    group.current.position.x = SHIFT_X_AMOUNT * loops;
  };

  const [rotationBuffer] = useState(() => new THREE.Quaternion().setFromEuler(rotationTargets[0].rotation));

  const getLerpedRotation = (progress) => {
    const q = new THREE.Quaternion();
    if (cameraScrollCurve.transitionCurveActive.current) {
      return q.slerpQuaternions(
        new THREE.Quaternion().setFromEuler(rotationTargets[rotationTargets.length - 1].rotation),
        new THREE.Quaternion().setFromEuler(rotationTargets[0].rotation),
        progress,
      );
    }
    for (let i = 0; i < rotationTargets.length - 1; i++) {
      const a = rotationTargets[i];
      const b = rotationTargets[i + 1];
      if (progress >= a.progress && progress <= b.progress) {
        const f = (progress - a.progress) / (b.progress - a.progress);
        return q.slerpQuaternions(new THREE.Quaternion().setFromEuler(a.rotation), new THREE.Quaternion().setFromEuler(b.rotation), f);
      }
    }
    return q.setFromEuler(rotationTargets[rotationTargets.length - 1].rotation);
  };

  useFrame(() => {
    // a set piece may be steering the scroll (scrollPilot); follow it a bit tighter
    let p = THREE.MathUtils.lerp(scrollProgress.current, targetScrollProgress.current, scrollPilot.active ? lerpFactor * 2 : lerpFactor);

    // Past either end of the curve: switch between the main and transition curves.
    if (p >= 1) {
      if (cameraScrollCurve.transitionCurveActive.current) {
        cameraScrollCurve.transitionCurveActive.current = false;
        cameraScrollCurve.shiftCurvePoints("forward");
        cameraScrollCurve.loopCounter.current++;
      } else {
        cameraScrollCurve.transitionCurveActive.current = true;
        cameraScrollCurve.initiateTransitionCurve();
      }
      scrollProgress.current -= 1;
      targetScrollProgress.current -= 1;
      scrollPilot.from -= 1;
      scrollPilot.to -= 1;
      p -= 1;
    } else if (p < 0) {
      if (cameraScrollCurve.transitionCurveActive.current) {
        cameraScrollCurve.transitionCurveActive.current = false;
        cameraScrollCurve.shiftCurvePoints("backward");
      } else {
        cameraScrollCurve.loopCounter.current--;
        cameraScrollCurve.transitionCurveActive.current = true;
        cameraScrollCurve.initiateTransitionCurve();
      }
      scrollProgress.current += 1;
      targetScrollProgress.current += 1;
      scrollPilot.from += 1;
      scrollPilot.to += 1;
      p += 1;
    }
    scrollProgress.current = p;

    const onMain = !cameraScrollCurve.transitionCurveActive.current;
    scrollSpeedMultiplier.current = onMain ? 1 : p <= 0.95 ? 6 : 1;

    // Jump the world one loop ahead while only the seam is in view, and move the
    // seam sheets between "before the start" and "after the end".
    if (onMain && p > WORLD_FORWARD_TRIGGER) shiftGroup(worldGroup, "forward");
    if (onMain && p <= WORLD_BACK_TRIGGER) shiftGroup(worldGroup, "backward");
    if (onMain && p >= SEAM_FORWARD_TRIGGER) shiftGroup(seamGroup, "forward");
    if (onMain && p <= SEAM_BACK_TRIGGER) shiftGroup(seamGroup, "backward");

    const base = cameraScrollCurve.getCurrentPoint(p);
    const cg = cameraGroup.current;
    cg.position.lerp(base, 0.1);
    camera.current.position.x = THREE.MathUtils.lerp(camera.current.position.x, mousePositionOffset.current.x, 0.1);
    camera.current.position.y = THREE.MathUtils.lerp(camera.current.position.y, -mousePositionOffset.current.y, 0.1);
    camera.current.position.z = 0;

    // The "sun" follows the camera so its shadow map stays small and sharp.
    const L = sun.current;
    if (L) {
      L.target.position.set(cg.position.x, cg.position.y - 2, -1.2);
      L.position.set(cg.position.x - 5, cg.position.y + 7, 8);
      L.target.updateMatrixWorld();
    }

    rotationBuffer.slerp(getLerpedRotation(p), 0.05);
    cg.quaternion.copy(rotationBuffer);
    camera.current.rotation.x = THREE.MathUtils.lerp(camera.current.rotation.x, -mouseRotationOffset.current.x, 0.1);
    camera.current.rotation.y = THREE.MathUtils.lerp(camera.current.rotation.y, -mouseRotationOffset.current.y, 0.1);
  });

  // Seam content is authored in "after the end" coordinates, then pulled back one
  // loop so the group offset (loop - 1 or loop) places it before or after.
  const seamX0 = WORLD_END_X - SHIFT_X_AMOUNT;
  const seamLength = SHIFT_X_AMOUNT - (WORLD_END_X - WORLD_START_X) + 2;

  return (
    <Suspense fallback={null}>
      <Loaded onLoaded={onLoaded} />
      {/* One soft top-left light: only its shadows are used (materials are unlit). */}
      <directionalLight
        ref={sun}
        castShadow
        intensity={1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={9}
        shadow-camera-bottom={-7}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
        shadow-radius={7}
        shadow-blurSamples={16}
      />
      <group ref={worldGroup}>
        <PaperWall x0={WORLD_START_X} x1={WORLD_END_X} margins={sceneRanges.map((s) => s.x0 + 0.12)} />
        {sceneRanges.map((s) => (
          <PaperScene key={s.id} scene={s} />
        ))}
      </group>

      <group ref={seamGroup}>
        <PaperWall x0={seamX0} x1={seamX0 + seamLength} />
        {seam.items.map((item, i) => (
          <PaperCutout key={i} item={item} base={[seamX0 + (SEAM_WIDTH - 12) / 2, sceneRanges.at(-1).ground + 1.5]} />
        ))}
        {(seam.structures || []).map((s, i) => {
          const Piece = CRYPTO_EVENTS[s.type];
          return <Piece key={i} {...s} position={[seamX0 + (SEAM_WIDTH - 12) / 2 + s.x, sceneRanges.at(-1).ground + 1.5]} />;
        })}
        {seam.wall?.text && (
          <WallText {...seam.wall.text} x={seamX0 + seam.wall.text.x} y={sceneRanges.at(-1).ground + 1.5 + seam.wall.text.y} />
        )}
      </group>

      <Hero scrollProgress={scrollProgress} cameraScrollCurve={cameraScrollCurve} />
    </Suspense>
  );
}
