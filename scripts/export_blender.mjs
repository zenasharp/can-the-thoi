// Export the whole paper world to Blender in one go:
//   1. loads the running dev site in headless Chrome and calls
//      window.__exportGLB({ download: false }) (src/Experience/devExport.js),
//   2. saves blender/can-the-thoi.glb and blender/scenes.json,
//   3. runs Blender (scripts/blender_import.py) to build blender/can-the-thoi.blend,
//      with cameras, and renders previews into blender/preview/.
//
//   npm run dev                        (in another terminal; port 5175)
//   node scripts/export_blender.mjs    [--url http://localhost:5175/] [--no-preview]
//
// Paths: CHROME and BLENDER env vars override the defaults below.
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { scenes } from "../src/content/site.js";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BLENDER = process.env.BLENDER || "E:/Program/blender.exe";
const args = process.argv.slice(2);
const url = args.includes("--url") ? args[args.indexOf("--url") + 1] : "http://localhost:5175/";
const outDir = path.resolve("blender");
const glbPath = path.join(outDir, "can-the-thoi.glb");
fs.mkdirSync(outDir, { recursive: true });

// --- 1. the .glb, from the site itself -------------------------------------------------
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ctt-export-"));
const PORT = 9335;
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1280,720", `--user-data-dir=${profile}`, "about:blank"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let targets;
  for (let i = 0; i < 200 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(200); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = {};
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  await send("Page.navigate", { url });
  // wait until the exporter is installed and every drawing has loaded
  for (let i = 0; i < 120; i++) {
    await sleep(1000);
    if (await evaluate("typeof window.__exportGLB === 'function' && !!window.__hero")) break;
  }
  await sleep(8000);
  const bytes = await evaluate("window.__exportGLB({ download: false })");
  const len = await evaluate("window.__glbB64.length");
  let b64 = "";
  for (let i = 0; i < len; i += 4_000_000) b64 += await evaluate(`window.__glbB64.slice(${i}, ${i + 4_000_000})`);
  fs.writeFileSync(glbPath, Buffer.from(b64, "base64"));
  console.log(`glb: ${glbPath} (${(bytes / 1e6).toFixed(1)} MB)`);
} finally {
  chrome.kill();
}

// --- 2. where each world is, for the cameras ----------------------------------------------
let x = -21; // layout.js WORLD_START_X
const ranges = scenes.map((s) => { const r = { id: s.id, x0: x, x1: x + (s.width || 12), ground: s.ground }; x = r.x1; return r; });
const scenesPath = path.join(outDir, "scenes.json");
fs.writeFileSync(scenesPath, JSON.stringify(ranges, null, 1));

// --- 3. the .blend ------------------------------------------------------------------------------
const blendArgs = ["-b", "--python", path.resolve("scripts/blender_import.py"), "--", glbPath, path.join(outDir, "can-the-thoi.blend"), scenesPath];
if (!args.includes("--no-preview")) blendArgs.push(path.join(outDir, "preview"));
const r = spawnSync(BLENDER, blendArgs, { encoding: "utf8" });
console.log((r.stdout || "").split("\n").filter((l) => /saved|rendered|engine|Error/.test(l)).join("\n"));
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
