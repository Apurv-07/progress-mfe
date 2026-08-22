import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";
import mfConfig from "./module-federation.config.ts";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation(mfConfig),
  ],
});