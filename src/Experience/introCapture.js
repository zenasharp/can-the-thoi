// What the loading cover needs from the world to draw it on the notebook's first
// page (src/components/NotebookIntro.jsx): a copy of the current frame, and the
// wall's paper alone (its grid and margin lines, nothing standing in front),
// seen by the same camera but Z times wider, to cover the rest of the page. Both
// are renders from the same eye, so the page's grid runs on from the scene's,
// perspective and all.

const PAPER_LAYER = 7; // the wall's meshes also live here, for the paper-only render

/**
 * Renders the world now and returns { frame, paper, Z } (paper may be null).
 * The paper is rendered in tiles (a view offset per tile), so it is at least
 * `paperWidth` pixels across.
 */
export function captureWorld(gl, scene, camera, Z, paperWidth = 0) {
  const copy = () => {
    const c = document.createElement("canvas");
    c.width = gl.domElement.width;
    c.height = gl.domElement.height;
    c.getContext("2d").drawImage(gl.domElement, 0, 0); // now, before the drawing buffer is cleared
    return c;
  };
  const walls = [];
  scene.traverse((o) => {
    if (o.name === "paperWall" || o.name === "paperMargin") walls.push(o);
  });
  let paper = null;
  if (walls.length) {
    walls.forEach((m) => m.layers.enable(PAPER_LAYER));
    const { zoom } = camera;
    const mask = camera.layers.mask;
    const W = gl.domElement.width, H = gl.domElement.height;
    const n = Math.min(3, Math.max(1, Math.ceil(paperWidth / W)));
    paper = document.createElement("canvas");
    paper.width = W * n;
    paper.height = H * n;
    const ctx = paper.getContext("2d");
    camera.zoom = zoom / Z;
    camera.layers.set(PAPER_LAYER);
    for (let ty = 0; ty < n; ty++) {
      for (let tx = 0; tx < n; tx++) {
        camera.setViewOffset(W * n, H * n, tx * W, ty * H, W, H);
        camera.updateProjectionMatrix();
        gl.render(scene, camera);
        ctx.drawImage(gl.domElement, tx * W, ty * H);
      }
    }
    camera.clearViewOffset();
    camera.zoom = zoom;
    camera.layers.mask = mask;
    camera.updateProjectionMatrix();
  }
  gl.render(scene, camera);
  return { frame: copy(), paper, Z };
}
