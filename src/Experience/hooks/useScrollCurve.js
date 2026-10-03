// From Mr. Panda's Psychologically Safe Portfolio (Andrew Woan, MIT).
// Keeps a looping curve: after the last point a short transition curve leads to
// the first point shifted one loop ahead, then the whole curve is shifted.
import { useRef } from "react";
import * as THREE from "three";

export const useScrollCurve = (initialCurve, initialPoints, shiftAmount) => {
  const curveRef = useRef(initialCurve.clone());
  const initialCurvePointsRef = useRef(initialPoints.map((v) => v.clone()));

  const loopCounter = useRef(1);
  const transitionCurveActive = useRef(false);

  const initiateTransitionCurve = () => {
    const targetLoopIndex = loopCounter.current;
    const pts = initialCurvePointsRef.current;
    curveRef.current.points = [
      pts[pts.length - 1].clone().add(new THREE.Vector3(shiftAmount * (targetLoopIndex - 1), 0, 0)),
      pts[0].clone().add(new THREE.Vector3(shiftAmount * targetLoopIndex, 0, 0)),
    ];
    curveRef.current.needsUpdate = true;
  };

  const shiftCurvePoints = (direction = "forward") => {
    const loops = direction === "forward" ? loopCounter.current : loopCounter.current - 1;
    curveRef.current.points = initialCurvePointsRef.current.map((p) =>
      p.clone().add(new THREE.Vector3(shiftAmount * loops, 0, 0)),
    );
    curveRef.current.needsUpdate = true;
  };

  return {
    curveRef,
    loopCounter,
    transitionCurveActive,
    initiateTransitionCurve,
    shiftCurvePoints,
    getCurrentPoint: (progress) => curveRef.current.getPoint(progress),
  };
};
