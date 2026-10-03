import * as THREE from "three";

// Where I am right now (world coordinates), written by Hero every frame and read
// by structures that react to me passing (doors and gates opening).
//
// rider.rest:   where my seat is right now (world), whatever I am riding
// rider.hidden: true while a set piece shows me somewhere else (Blitzcrank hooks
//               me off Skaarl and punches me into the next world)
// jolt: clock time of the last bump under me (a Teemo mushroom going off)
// land: clock time a set piece dropped me back onto my ride (Hero squashes)
export const heroState = {
  x: -Infinity,
  y: 0,
  curveX: 0, // where the scroll puts me this frame (x is that, smoothed)
  rider: { rest: new THREE.Vector3(), hidden: false },
  hideRide: null, // a ride key: that whole ride is hidden (a set piece shows it elsewhere)
  jolt: -10,
  land: -10,
  sink: 0, // 0 .. 1: how far a set piece has pushed me (and my ride) underground (Hero SINK_DEPTH)
};
