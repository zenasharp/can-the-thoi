import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { site } from "../content/site";

// Loading cover. Unlike the original (which waited for progress === 100 and
// could hang when nothing was loading), it fades once the canvas is ready and
// no loader is active.
export default function IntroScreen({ ready }) {
  const { active, progress } = useProgress();
  const [phase, setPhase] = useState("loading"); // loading -> fading -> gone

  useEffect(() => {
    if (phase !== "loading" || !ready || active) return;
    const t1 = setTimeout(() => setPhase("fading"), 900);
    return () => clearTimeout(t1);
  }, [ready, active, phase]);

  useEffect(() => {
    if (phase !== "fading") return;
    const t = setTimeout(() => setPhase("gone"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return <div className="hint">{site.hint}</div>;

  const shown = ready && !active ? 100 : Math.min(progress, 95);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        textAlign: "center",
        background: "var(--paper-cream)",
        backgroundImage: "repeating-linear-gradient(transparent 0 31px, var(--notebook-line) 31px 33px)",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.9s ease-out",
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <h1 style={{ fontSize: "clamp(44px, 9vw, 96px)", fontWeight: 400, lineHeight: 1 }}>{site.title}</h1>
      <p style={{ fontSize: 22, color: "var(--pencil-shadow)" }}>{site.tagline}</p>
      <div style={{ width: 220, height: 10, border: "2px solid var(--outline-ink)", borderRadius: 6, overflow: "hidden", background: "#fff" }}>
        <div style={{ width: `${shown}%`, height: "100%", background: "var(--outline-ink)", transition: "width 0.3s" }} />
      </div>
      <p style={{ fontSize: 18 }}>{site.hint}</p>
    </div>
  );
}
