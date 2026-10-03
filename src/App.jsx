import { useState } from "react";
import Experience from "./Experience/Experience";
import NotebookIntro from "./components/NotebookIntro";

export default function App() {
  const [ready, setReady] = useState(false);
  return (
    <>
      <NotebookIntro ready={ready} />
      <Experience onReady={() => setReady(true)} />
    </>
  );
}
