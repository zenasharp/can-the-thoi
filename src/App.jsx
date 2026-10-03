import { useState } from "react";
import Experience from "./Experience/Experience";
import IntroScreen from "./components/IntroScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  return (
    <>
      <IntroScreen ready={ready} />
      <Experience onReady={() => setReady(true)} />
    </>
  );
}
