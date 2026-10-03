import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH: where the site is served from, e.g. "/can-the-thoi/" on GitHub
// Pages (set by .github/workflows/deploy.yml). Locally it is "/".
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
});
