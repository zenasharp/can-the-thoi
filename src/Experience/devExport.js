// Dev only: export the whole paper world as one .glb for Blender.
//
//   window.__exportGLB()                 // downloads can-the-thoi.glb
//   window.__exportGLB({ download: false }) // keeps it in window.__glbB64 (for scripts)
//
// What goes in is what is on screen right now, frozen: every card (its traced
// silhouette extruded, drawing on both faces, bare paper on the sides), the
// ground, the wall, the wall writing, the wires, my current ride, the camera.
// Animation does not (it is all code driven by the scroll), and neither do the
// shadow-catcher overlays, the lights or hidden things (frames of a flip-book
// that are not showing, set pieces that have not been triggered yet).
// Meshes are named after their drawing (childhood/totoro_body, ...) so they
// are easy to find in Blender's outliner.
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const artName = (mesh) => {
  for (const m of [].concat(mesh.material)) {
    const src = m?.map?.image?.src;
    if (src) {
      const k = src.match(/\/art\/(.+)\.webp/);
      if (k) return k[1];
    }
    if (m?.map?.image instanceof HTMLCanvasElement) return "paper";
  }
  return null;
};

export function installExport(scene) {
  window.__exportGLB = async ({ download = true, filename = "can-the-thoi.glb" } = {}) => {
    const hidden = [];
    const renamed = [];
    const counts = {};
    scene.traverse((o) => {
      const shadowOnly = o.isMesh && [].concat(o.material).every((m) => m?.type === "ShadowMaterial");
      if ((shadowOnly || o.isLight) && o.visible) {
        o.visible = false;
        hidden.push(o);
      }
      if (o.isMesh && !o.name) {
        const base = artName(o) || o.geometry?.type?.replace("Geometry", "").toLowerCase() || "mesh";
        counts[base] = (counts[base] || 0) + 1;
        renamed.push(o);
        o.name = counts[base] > 1 ? `${base}.${counts[base]}` : base;
      }
    });
    try {
      const glb = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
      const blob = new Blob([glb], { type: "model/gltf-binary" });
      if (download) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      } else {
        const bytes = new Uint8Array(glb);
        let s = "";
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        window.__glbB64 = btoa(s);
      }
      return glb.byteLength;
    } finally {
      hidden.forEach((o) => (o.visible = true));
      renamed.forEach((o) => (o.name = ""));
    }
  };
}
