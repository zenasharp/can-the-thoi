// Generate missing art from scripts/art-prompts.json through the local imagegen-lb
// skill (OpenAI gpt-image via codex-lb). Each item is an *edit* call with the
// artist's own Krita drawings attached as style references (scripts/style.txt
// explains how to use them). Writes raw_art/<group>/<id>.png and skips files that
// already exist, so it can be re-run safely; then run prep_art.mjs.
//
//   node scripts/gen_art.mjs [--only childhood/perry,...] [--quality medium] [--jobs 4]
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const SKILL = "C:/Users/Admin/.claude/skills/imagegen-lb/scripts/imagegen-lb.mjs";
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const only = opt("only", "").split(",").filter(Boolean);
const quality = opt("quality", "medium");
const jobs = Number(opt("jobs", "4"));

const style = fs.readFileSync("scripts/style.txt", "utf8").trim();
const { refs, items } = JSON.parse(fs.readFileSync("scripts/art-prompts.json", "utf8"));
const todo = Object.entries(items).filter(([key]) => {
  if (only.length && !only.includes(key)) return false;
  return !fs.existsSync(path.join("raw_art", `${key}.png`));
});

const run = ([key, spec]) =>
  new Promise((resolve) => {
    const out = path.join("raw_art", `${key}.png`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // spec.subjectRef: an image showing WHAT to draw, attached first; spec.refs / refs:
    // the artist's drawings showing HOW to draw it; spec.prompt replaces everything.
    const subjectNote = spec.subjectRef ? " The FIRST attached image only shows WHAT the subject looks like (shape, colours, key features): do NOT copy its rendering, shading or detail. The other attached images are the artist's own drawings and show HOW to draw it." : "";
    const prompt = spec.prompt || `${style}${subjectNote} Subject: ${spec.subject}.${spec.text ? ` Text (verbatim, hand-lettered): "${spec.text}".` : ""}`;
    const refArgs = [...(spec.subjectRef ? [spec.subjectRef] : []), ...(spec.refs || refs)].flatMap((r) => ["--image", r]);
    const p = spawn("node", [SKILL, "edit", "--prompt", prompt, ...refArgs, "--size", spec.size || "1024x1024", "--quality", quality, "--out", out]);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => {
      console.log(code === 0 ? `OK   ${key}` : `FAIL ${key}: ${err.trim().split("\n").pop()}`);
      resolve();
    });
  });

console.log(`${todo.length} to generate (quality ${quality}, ${jobs} at a time)`);
const queue = [...todo];
await Promise.all(Array.from({ length: jobs }, async () => {
  while (queue.length) await run(queue.shift());
}));
