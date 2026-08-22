import { createModuleFederationConfig } from "@module-federation/vite";

export default createModuleFederationConfig({
  name: "progress_mfe",

  manifest: true,

  exposes: {
    "./App": "./src/App.tsx",
  },

  shared: {
    react: {
      singleton: true,
    },
    "react-dom": {
      singleton: true,
    },
  },
});